/* Contains War object constructor, which contains all the functions related to warfare, which means:
	1) battle functions (mechanism of the battle itself)
	2) control functions (initiate/terminate battles, reinforce, get loot etc.)
	3) view functions (battlefield rendering, EXPORTED to warView.js)
*/
function War() {
	WarView.call(this); //inherit the view functions (canvas rendering)

	//make a list of all ground / sky units, will be useful
	this.groundUnits = Object.keys(units).filter(o => ['infantry', 'ranged'].indexOf(units[o].class) > -1);
	this.skyUnits  = Object.keys(units).filter(o => ['bomber', 'antibomber'].indexOf(units[o].class) > -1);

/* CONTROL FUNCTIONS */
	//initiate a battle by creating the battle object (state of battlefield)
	this.initBattle = function(type) { //type = 'polis' or 'odys'
		let army, armyE, ground, air;

		if(type === 'odys') {
			army  = s.odys.army;
			armyE = s.odys.armyE;
			ground = s.odys.rows; air = 1;
		}
		else {
			army  = s.army;
			armyE = s.armyE;
			ground = enemyArmies[s.enemyLevel].ground;
			air = enemyArmies[s.enemyLevel].air;
		}
		if(this.groundArmySum(army) === 0) {game.msg('Nemáme žádnou dostupnou pozemní armádu'); return;}

		//number of rows and their constraints
		ground = (ground <= 6) ? ground : 6;
		air = (air <= 2) ? air : 2;
		let rows = ground + air;

		//create the battlefield object, P = player related, E = enemy related
		s.battlefield = {
			type: type,
			stroke: 0,
			cycles: 0,
			//total army that has visited the battlefield
			logP: this.logArmyObj(army),
			logE: this.logArmyObj(armyE),
			//army objects with RESERVE units
			reserveP: this.migrateArmyObj(army),
			reserveE: this.migrateArmyObj(armyE),
			//"army object" with casualties
			deadP: this.newArmyObj(army),
			deadE: this.newArmyObj(armyE),

			/*MAP OF BATTLEFIELD as array of rows, first air rows, then ground rows
				each cell is a group of units on the field. Example:
				{key: 'kop', n: 42, hp: 4, own: true}
				n: remaining units in the group, hp: remaining hp, own: is owned by Player*/
			rows: rows, //total number of rows on battlefield
			ground: ground, //ground rows
			air: air, //air rows
			map: new Array(rows).fill(false).map((item) => new Array(6).fill(false)),
			//special graphical effects
			effects: [],
			//whether there is currently a nuclear detonation taking place (how many strokes left to display the effect)
			nukeDuration: 0, scheduledNuke: false,
			//is last enemy army?
			last: s.enemyLevel === enemyArmies.length-1
		};
		s.ctrl.tab = 'battle';
	};

	//move all units from town to battle reserves
	this.reinforceBattle = function() {
		if(s.battlefield.type === 'odys') {game.msg(['Naši hrdinové jsou příliš daleko kdesi v neznámých vodách.', 'Můžeme se za ně jen modlit.']); return;}
		if(this.armySum(s.army) === 0) {game.msg('Nemáme žádnou dostupnou armádu'); return;}
		if(!s.battlefield) {return;} //this shouldn't happen
		this.logArmyObj(s.army, s.battlefield.logP);
		this.migrateArmyObj(s.army, s.battlefield.reserveP);
		game.msg('Všechny jednotky ve městě se připojily do bitvy');
	};

	//terminate battle, either as a victory (true) or defeat (false)
	this.endBattle = function(victory) {
		const bf = s.battlefield;
		//withdraw all units from map to reserve
		for(let y = 0; y < bf.rows; y++) {for(let x = 0; x < 6; x++) {
			if(bf.map[y][x]) {
				bf[bf.map[y][x].own ? 'reserveP' : 'reserveE'][bf.map[y][x].key] += bf.map[y][x].n;
				bf.map[y][x] = false;
			}
		}}
		//withdraw all units from reserve to towns or ships or whatever (to the appropriate "parent" army)
		if(bf.type === 'odys') {parentP = s.odys.army; parentE = s.odys.armyE;}
		else {parentP = s.army; parentE = s.armyE;}
		for(let key in bf.reserveP) {parentP[key] += bf.reserveP[key].positify();}
		for(let key in bf.reserveE) {parentE[key] += bf.reserveE[key].positify();}

		//finish
		if(bf.type === 'polis') {
			bf.report = {victory: victory, name: s.name, lvl: s.enemyLevel+1, cycles: bf.cycles, deadP: this.filterArmyObj(bf.deadP), deadE: this.filterArmyObj(bf.deadE)};

			victory && game.achieve('GG');
			victory && (this.armySum(bf.logP) === bf.logP.trj + bf.logP.obr + bf.logP.bal + bf.logP.gyr) && game.achieve('blitz');
			!victory && (this.armySum(bf.logP) === bf.logP.hop) && game.achieve('sparta');

			victory ? this.winPolis() : game.msg(['PORÁŽKA!', `Polis lvl ${s.enemyLevel+1} zničil naši armádu za ${bf.cycles} kol`]);
		}
		else {
			victory ? this.winOdys() : this.loseOdys();
		}

		bf.report && this.addReport(bf.report);
		const autocontinueNow = bf.autocontinueNow;
		s.battlefield = false;
		if(autocontinueNow) {this.advanceOdys();}
	};

	//save remaining units by fleeing the fight
	this.surrender = function() {
		if(s.battlefield.type === 'odys') {game.msg(['Kéž bychom mohli naše hrdiny zachránit před jistou zkázou.', 'Nemůžeme k nim však zprávu doručit.']);}
		else {this.endBattle(false);}
	};

	//when Polis is defeated
	this.winPolis = function() {
		const bf = s.battlefield;
		//pillaged resources
		let d = enemyArmies[s.enemyLevel].dranc * game.eff().dranc;
		let dranc = new Array(5).fill(0).map(s => d * Math.rnd50());
		dranc[0] = dranc[0]*consts.goldValue; //more gold than other resources according to a fixed ratio
		game.msg(['VÍTĚZSTVÍ!', `Rozdrtili jsme armádu Polisu (úroveň ${s.enemyLevel+1}) za ${bf.cycles} kol`,
			`Vydrancováno ${dranc[0].toFixed(0)} zlata, ${dranc[1].toFixed(0)} dřeva, ${dranc[2].toFixed(0)} kamení, ${dranc[3].toFixed(0)} sýry a ${dranc[4].toFixed(0)} piva`]);
		s.sur = s.sur.map((s,i) => s + dranc[i]);
		bf.report.dranc = dranc;

		//increment or regenerate enemy
		if(!bf.last) {s.enemyLevel++;}
		else {game.achieve('carnage');}
		s.armyE = angular.copy(enemyArmies[s.enemyLevel].army);
	};

	//advance to next wave of odysseia (or start a new one)
	this.advanceOdys = function() {
		const so = s.odys;
		if(so.wave === 0) { //start a new Odysseia
			if(this.groundArmySum(s.army) === 0) {game.msg('Nemáme žádnou dostupnou pozemní armádu'); return;}
			if(!s.singleUse.startedOdysseia) {s.singleUse.startedOdysseia = true; game.msg(['Naši dobrodruhové se vylodili se na prvním ostrově, kde na ně čekají krvežíznivé mythologické potvory.',
				'Pokud zvládnou tento ostrov vyplundrovat, vypraví se na další ostrovy, dále a dále za hranice známého světa!']);}
			//deploy army
			so.army = this.migrateArmyObj(s.army);
			so.dead = this.newArmyObj();
			so.wave = 1;
			//calculate apx. enemy wave size
			let [min, max, delay] = consts.odys.sizeFun;
			let sizeP = this.armyGroupSum(so.army);
			so.size = min + max * sizeP / (sizeP + delay);
			this.createOdysArmy();
		}
		this.initBattle('odys');

		if(!s.p.unlockAutoodys && so.wave >= consts.odys.unlockAutoodys) {
			game.msg('Protože už jsou achajští rekové naučení na věčné skákání mezi ostrovy, mohou od nynějška pokračovat automaticky vpřed, pokud si přejete.');
			s.p.unlockAutoodys = true;
		}
	};

	//create an odyssey army consisting of unit sets defined in odyssets
	this.createOdysArmy = function() {
		const so = s.odys;
		let size = so.size * Math.rnd50(); //randomized size of current wave
		so.scoreToGet = Math.round(size * consts.odys.scoreWave**(so.wave-1)); //score to get for this wave
		let [a,b] = consts.odys.rowsFun; so.rows = Math.round(a*size**b); //get number of rows
		let us = odyssets[so.race].units; //unit set
		so.armyE = {};
		//determine compositions
		let usk = Object.keys(us);
		let wts = usk.map(o => us[o] * Math.rnd50());
		let wtSum = wts.reduce((s,o) => s+o, 0);
		wts = wts.map(w => (w/wtSum));
		//assign compositions
		wts.forEach((w,i) => {so.armyE[usk[i]] = Math.round(w * size) * units[usk[i]].group});
	};

	//when another odysseia wave has been overcome, prepare next onslaught
	this.winOdys = function() {
		const so = s.odys, os = odyssets;
		game.msg([`Naši dobrodruhové už dobyli ${so.wave}. ostrov, kde vymlátili další epické skóre ${so.scoreToGet}`, 'Dejte jim pokyn, a budou pokračovat! Zpět ni krok!']);
		so.wave++;
		so.wavesHistory.push(so.race);
		so.score += so.scoreToGet;
		this.logArmyObj(s.battlefield.deadP, so.dead); //accumulate player casualties from this battle

		//determine next race
		let osk = Object.keys(os);
		let wts = osk.map(o => os[o].wt);
		let wtSum = wts.reduce((s,o) => s+o, 0);
		let Psum = 0;
		let P = wts.map(w => (Psum += (w/wtSum)));
		let rnd = Math.random();
		let i = P.findIndex(w => w > rnd);
		so.race = osk[i];

		this.createOdysArmy();

		if(s.ctrl.autoodys) {s.battlefield.autocontinueNow = true;}
	};

	//when odysseia heroes are spent and depleted, or when they honorably retreat, you get the reward
	this.loseOdys = function(retreat, payTribute) {
		const so = s.odys;
		s.army = this.migrateArmyObj(so.army, s.army); //save air if there's some left, or whole army if exiting
		this.logArmyObj(s.battlefield.deadP, so.dead); //accumulate player casualties from this battle

		//extra score from enemy casualties in this battle, score penalization for retreat
		(so.wave > 1 && !retreat) && (so.score += Math.round(this.armyGroupSum(s.battlefield.deadE) * consts.odys.scoreWave**(so.wave-1)));
		let scoreTribute = Math.ceil(so.score * consts.odys.retreatribute);
 		retreat && payTribute && (so.score -= scoreTribute);

		//loot sur & WP
		let eff = game.eff().dranc;
		let drancWP = Math.round(so.score * consts.odys.rateWP * consts.odys.waveWP**so.wave * eff * Math.rnd50());
		let d = so.score * eff * consts.odys.rateDranc;
		let dranc = new Array(5).fill(0).map(s => d * Math.rnd50());
		dranc[0] = dranc[0]*consts.goldValue; //more gold than other resources according to a fixed ratio
		s.sur = s.sur.map((s,i) => s + dranc[i]);
		s.WP += drancWP;

		//loot relic
		let drancRel = false;
		//available relics for loot are those that player does not have && are not special, or are special but the special army has been overcome
		let lootable = Object.keys(relics).filter(r => so.relics.indexOf(r) === -1 && (!relics[r].hasOwnProperty('special') || so.wavesHistory.indexOf(relics[r].special) > -1 ));
		let P = 1 - (1 - consts.odys.rateRelic)**so.score; //probability to loot a relic
		if(Math.random() < P && lootable.length > 0) {drancRel = lootable[Math.floor(Math.random() * lootable.length)];}
		so.relics.length === 0 && so.wave > 1 && (drancRel = 'helmet'); //starter pack relic

		drancRel && so.relics.push(drancRel);
		drancRel && game.achieve('indiana'); //first relic
		so.relics.length === Object.keys(relics).length && game.achieve('relics'); //all relix

		//report
		let msgPart1 = retreat && payTribute ? `Hrdinové se stáhli z ${so.wave-1}. ostrova a celkem dosáhli epického skóre ${so.score}, dalších ${scoreTribute} bodů museli obětovat delfínům` :
			`Poslední hrdinové padli na ${so.wave}. ostrově a celkem dosáhli epického skóre ${so.score}`;
		let msgPart2 = retreat && payTribute ? 'Přitáhli s sebou' : 'Ze svého posledního tábora nám ještě stihli poslat';
		let msg = [msgPart1];
		if(so.score > 0) {
			msg.push(msgPart2+` ${dranc[0].toFixed(0)} zlata, ${dranc[1].toFixed(0)} dřeva, ${dranc[2].toFixed(0)} kamení, ${dranc[3].toFixed(0)} sýry a ${dranc[4].toFixed(0)} piva.`);
			msg.push(`Dozvěděli jsme se také nové poznatky o světě za obzorem v hodnotě ${drancWP.toFixed()} výzkumných bodů.`);
		}
		drancRel && msg.push('A dokonce jsme uloupili velice vzácnou relikvii zvanou ' + relics[drancRel].name + (relics[drancRel].special ? ', kterou u sebe měli '+odyssets[relics[drancRel].special].name : '') + '!');
		game.msg(msg);
		let report = {odys:true, name: s.name, lvl: so.wave, score: so.score, dranc: dranc, drancWP: drancWP, relic: drancRel, deadP: this.filterArmyObj(so.dead)};
		if(retreat) {this.addReport(report);} //add now (endBattle is not executed at all)
		else {s.battlefield.report = report;} //add l8r (when endBattle continues execution)
		
		//reset odysseia state variables
		so.wave = 0;
		so.score = 0;
		so.wavesHistory = [];
		so.race = 'myth';
	};

	//add a battle report object to battleReports
	this.addReport = function(report) {
		const sbr = s.battleReports;
		sbr.unshift(report);
		sbr.length > consts.maxReports && sbr.pop();
	};

/* BATTLE FUNCTIONS GENERIC */
	//generate an empty army object with same keys as the template
	this.newArmyObj = function(templ) {
		if(!templ) {return {kop: 0, luk: 0, hop: 0, sln: 0, trj: 0, obr: 0, baz: 0, bal: 0, gyr: 0};}
		let obj = {};
		Object.keys(templ).forEach(key => (obj[key] = 0));
		return obj;
	};

	//filter an army obj so only non-zero properties remain
	this.filterArmyObj = function(obj) {
		for(let i in obj) {
			if(obj.hasOwnProperty(i) && obj[i] <= 0) {delete obj[i];}
		}
		return obj;
	};

	//move all units from obj1 to obj2 (or a new obj if undefined)
	this.migrateArmyObj = function(obj1, obj2) {
		obj2 = obj2 || this.newArmyObj(obj1);
		for(let k in obj1) {
			obj2[k] += obj1[k] || 0;
			obj1[k] = 0;
		}
		return obj2;
	};

	//copy all units from obj1 to obj2 (or a new obj if undefined)
	this.logArmyObj = function(obj1, obj2) {
		obj2 = obj2 || this.newArmyObj(obj1);
		for(let k in obj1) {
			obj2[k] += obj1[k] || 0;
		}
		return obj2;
	};

	//sum of total army, total army groups
	this.armySum = obj => Object.keys(obj).reduce((sum, k) => sum + obj[k], 0);
	this.groundArmySum = obj => Object.keys(obj).reduce((sum, k) => sum + obj[k]*(units[k].class === 'infantry' || units[k].class === 'ranged'), 0);
	this.armyGroupSum = obj => Object.keys(obj).reduce((sum, k) => sum + obj[k] / units[k].group, 0);

/* BATTLE FUNCTIONS SPECIFIC */
	//choose a group from reserves to put on the battlefield
	this.createGroup = function(unitSet, own) {
		let res = own ? s.battlefield.reserveP : s.battlefield.reserveE;
		//calculate P, which is cumulative probability to spawn various unit types = fraction of number weighted by maximum group size
		let sumN = 0;
		let sumP = 0;
		let P = new Array(unitSet.length).fill(0)
			//calculate normalized number of units (divided by group size) and add it to sum of all units
			.map(function(o, i) {
				let x = (res.hasOwnProperty(unitSet[i]) ? res[unitSet[i]] : 0) / units[unitSet[i]].group;
				sumN += x;
				return x;});
		if(sumN <= 0) {return false;}
			//calculate probability
		P = P.map(o => o/sumN)
			//calculate cumulative probability
			.map(o => (sumP += o));
		//randomly decide which type will spawn, according to probabilites.
		let i = -1;
		while(i < 0) {//just to be sure. The maximum cumulative probabilty doesn't necessarily have to be 1 due to rounding error
			let rnd = Math.random();
			i = P.findIndex(item => item > rnd);
		}
		let key = unitSet[i];

		//create group
		let n = Math.min(res[key], units[key].group);
		res[key] -= n;
		return {key: key, n: n, hp: units[key].hp, own: own};
	};

	//get various sum of units
	this.getBFsum = function() {
		const bf = s.battlefield;

		//iterators for each side of the battlefield
		const L = [0,1,2]; R = [3,4,5];
		const reduceRow = (iterators, y) => iterators.reduce((sum, i) => sum + (bf.map[y][i] ? bf.map[y][i].n : 0), 0);
		const Lsums = new Array(bf.map.length).fill(0).map((row, y) => reduceRow(L, y));
		const Rsums = new Array(bf.map.length).fill(0).map((row, y) => reduceRow(R, y));

		const resAirCount = (obj) => Object.keys(obj).reduce((sum, i) => sum + obj[i] * (['bomber', 'antibomber'].indexOf(units[i].class) > -1), 0);
		const f = (sum, i) => sum + i;
		return {
			//sum of air units on field and in reserves
			airL: Lsums.slice(0, bf.air).reduce(f) + resAirCount(bf.reserveE),
			airR: Rsums.slice(0, bf.air).reduce(f) + resAirCount(bf.reserveP),
			//sum of ground units on field only
			groundL: Lsums.slice(bf.air).reduce(f),
			groundR: Rsums.slice(bf.air).reduce(f)
		};
	};

	//each stroke something different will be done. 3 strokes = full cycle
	this.stroke = function() {
		const bf = s.battlefield;
		if(!bf) {return;}
		
		if(bf.stroke % 3 === 0) {this.stroke1(); this.stroke1(true);}
		else if(bf.stroke % 3 === 1) {this.stroke2();}
		else {this.stroke3();}
		bf.stroke++;

		bf.cycles = Math.ceil(bf.stroke/3); //just an informative value
		
		bf.nukeDuration -= (bf.nukeDuration > 0) ? 1 : 0;
		if(bf.scheduledNuke) {this.nukeExec();}
	};

	//1st stroke: units advance on the map
	this.stroke1 = function(skyOnly) {//function is called for second time, this time only for sky units
		const bf = s.battlefield;
		const iterationOrder = [2, 3, 1, 4, 0, 5];
		//iterate every row
		for(let y = 0; y < bf.rows; y++) {
			if(skyOnly && y >= bf.air) {continue;}
			//iterate every column, but ordered by iterationOrder
			for(let i = 0; i < 6; i++) {
				let x = iterationOrder[i];
				let left = x < 3; //is on the left side of battlefield?
				let spawn = left ? 0 : 5; //x coordinate of spawn cells
				let dir = left ? 1 : -1; //x direction of travel
				let own = (y < bf.air) ? !left : left; //sky units spawn on the other side and move the other way

				//try to move inward (if not already on frontline cells)
				if((x < 2 || x > 3) && bf.map[y][x] && !bf.map[y][x+dir]) {
					bf.map[y][x+dir] = bf.map[y][x];
					bf.map[y][x] = false;
				}
				//try to merge group inward (if there are two adjacent groups of same unit type)
				else if((x < 2 || x > 3) && bf.map[y][x] && bf.map[y][x+dir] && bf.map[y][x].key === bf.map[y][x+dir].key) {
					let diff = units[bf.map[y][x+dir].key].group - bf.map[y][x+dir].n; //free space in the inner group
					//entirely consume the outer unit
					if(diff > 0 && diff >= bf.map[y][x].n) {
						bf.map[y][x+dir].n += bf.map[y][x].n;
						bf.map[y][x] = false;
					}
					//move units from outer unit to inner
					else if(diff > 0) {
						bf.map[y][x+dir].n += diff;
						bf.map[y][x].n -= diff;
					}
				}
				//try to move upward to 1st ground row (if not in 1st air row or 1st ground row)
				else if(
					y !== 0 && //first air row
					y !== bf.air && //first ground row
					bf.map[y][x] && !bf.map[y-1][x]
				) {
					bf.map[y-1][x] = bf.map[y][x];
					bf.map[y][x] = false;
				}

				const BFsum = this.getBFsum();
				let airDominance = BFsum.airL === 0 && own || BFsum.airR === 0 && !own; //whether the oponent's air space is empty

				//try to spawn a new group on outer cells
				if(!bf.map[y][x] && x === spawn) {
					//which units can be spawned on this cell
					let unitSet = (y < bf.air) ? this.skyUnits : this.groundUnits;
					//don't spawn antibombers if they wouldn't have anything to fight against
					airDominance && (unitSet = unitSet.filter(item => units[item].class !== 'antibomber'));
					
					bf.map[y][x] = this.createGroup(unitSet, own);
				}
				//replenish outer balloons, but only if antibombers are gone
				else if(bf.map[y][x] && x === spawn && y < bf.air && airDominance) {
					let cell = bf.map[y][x];
					let diff = units[cell.key].group - cell.n;
					let res = cell.own ? 'reserveP' : 'reserveE'; //reserve pointer
					if(diff > 0 && bf[res][cell.key] > diff) {
						bf.map[y][x].n += diff;
						bf[res][cell.key] -= diff;
					}
					else if(diff > 0 && bf[res][cell.key] > 0) {
						bf.map[y][x].n += bf[res][cell.key];
						bf[res][cell.key] = 0;
					}
				}
			}
		}

		if(skyOnly) {return;}
		//control for end - whoever loses all ground units is defeated
		const BFsum = this.getBFsum(); //has to be called again!
		//a draw is also a victory, that's why groundR (enemy) is checked first
		if(BFsum.groundR <= 0) {this.endBattle(true);}
		else if(BFsum.groundL <= 0) {this.endBattle(false);}
	};

	//2nd stroke: FIGHT!
	this.stroke2 = function() {
		const bf = s.battlefield;
		//determine whether the group is ranged
		const isRanged = (group) => units[group.key].class === 'ranged';
		//get bonus of 1 over 2
		function getBonus(x1,y1,x2,y2) {
			let bonus = units[bf.map[y1][x1].key].bonus || {};
			let u2 = units[bf.map[y2][x2].key];
			let key = u2.hasOwnProperty('actsAs') ? u2.actsAs : bf.map[y2][x2].key;
			return bonus.hasOwnProperty(key) ? 1+bonus[key] : 1;
		}
		//damage over distance - it is yet to be determined who will attack whom
		function damageDist(x1,y1,x2,y2) {
			if     ( isRanged(bf.map[y1][x1]) &&  isRanged(bf.map[y2][x2])) {damage2way(x1,y1,x2,y2);}
			else if( isRanged(bf.map[y1][x1]) && !isRanged(bf.map[y2][x2])) {damage1way(x1,y1,x2,y2);}
			else if(!isRanged(bf.map[y1][x1]) &&  isRanged(bf.map[y2][x2])) {damage1way(x2,y2,x1,y1);}
			//else do nothing
		}
		//both groups attack each other at the same time
		function damage2way(x1,y1,x2,y2) {
			//substitutions
			let g1 = bf.map[y1][x1]; let g2 = bf.map[y2][x2]; let k1 = g1.key; let k2 = g2.key;
			//efficiency of player's units. It will be assigned either to 1 or 2
			let p1 = g1.own ? game.eff(k1).power : 1;
			let p2 = g2.own ? game.eff(k2).power : 1;
			//total attacks and total hp
			let att1 = g1.n * units[k1].att * getBonus(x1,y1,x2,y2) * p1;
			let att2 = g2.n * units[k2].att * getBonus(x2,y2,x1,y1) * p2;
			let hp1 = g1.hp + (g1.n-1) * units[k1].hp;
			let hp2 = g2.hp + (g2.n-1) * units[k2].hp;
			//do the damage, calculate new n, log dead units and save new n
			hp1 -= att2; hp2 -= att1;
			g1.hp = (hp1 % units[k1].hp).positify();
			g2.hp = (hp2 % units[k2].hp).positify();
			let n1 = Math.ceil(hp1 / units[k1].hp).positify();
			let n2 = Math.ceil(hp2 / units[k2].hp).positify();
			bf[g1.own ? 'deadP' : 'deadE'][k1] += g1.n - n1;
			bf[g2.own ? 'deadP' : 'deadE'][k2] += g2.n - n2;
			g1.n = n1; g2.n = n2;
			//trample
			((s.miracle === 'faust' && g1.own) || units[k1].trample) && hp2 < 0 && damageSpecial(-hp2, x2 + (x2 < 3 ? -1 : 1), y2);
			((s.miracle === 'faust' && g2.own) || units[k2].trample) && hp1 < 0 && damageSpecial(-hp1, x1 + (x1 < 3 ? -1 : 1), y1);

			//default melee graphical effects, can't be modified
			bf.effects.push({type: 'grayLine', x1:x1,y1:y1,x2:x2,y2:y2});
			bf.effects.push({type: 'bloodSplatter', x:x1,y:y1});
			bf.effects.push({type: 'bloodSplatter', x:x2,y:y2});
		}
		//first group attacks the other (without retaliation)
		function damage1way(x1,y1,x2,y2) {
			//substitutions
			let g1 = bf.map[y1][x1]; let g2 = bf.map[y2][x2]; let k1 = g1.key; let k2 = g2.key;
			//power is calculated only if player is the attacker
			let p1 = g1.own ? game.eff(k1).power : 1;
			//total attacks and total hp
			let att1 = g1.n * units[k1].att * getBonus(x1,y1,x2,y2) * p1;
			let hp2 = g2.hp + (g2.n-1) * units[k2].hp;
			//do the damage, calculate new n, log dead units and save new n
			hp2 -= att1;
			g2.hp = (hp2 % units[k2].hp).positify();
			let n2 = Math.ceil(hp2 / units[k2].hp).positify();
			bf[g2.own ? 'deadP' : 'deadE'][k2] += g2.n - n2;
			g2.n = n2;
			//trample
			((s.miracle === 'faust' && g1.own) || units[k1].trample) && hp2 < 0 && damageSpecial(-hp2, x2 + (x2 < 3 ? -1 : 1), y2);

			//add default ranged graphical effects, or special effects (e.g. baloon, bazooka)
			let arc = 'grayArc', splat = 'bloodSplatter';
			if(units[k1].hasOwnProperty('effect')) {arc = units[k1].effect.arc; splat = units[k1].effect.splat;}

			bf.effects.push({type: arc, x1:x1,y1:y1,x2:x2,y2:y2});
			bf.effects.push({type: splat, x:x2,y:y2});
		}
		//special function to deal specified amount of damage to specified group (trample damage)
		function damageSpecial(dmg,x2,y2) {
			//substitutions
			let g2 = bf.map[y2][x2];
			if(!bf.map[y2][x2]) {return;}
			let k2 = g2.key;
			//total attacks and total hp
			let hp2 = g2.hp + (g2.n-1) * units[k2].hp;
			//do the damage, calculate new n, log dead units and save new n
			hp2 -= dmg;
			g2.hp = (hp2 % units[k2].hp).positify();
			let n2 = Math.ceil(hp2 / units[k2].hp).positify();
			bf[g2.own ? 'deadP' : 'deadE'][k2] += g2.n - n2;
			g2.n = n2;
			bf.effects.push({type: 'bloodSplatter', x:x2,y:y2});
		}

		//normal attacks (1 or 2 cells forwards)
		for(let y = 0; y < bf.rows; y++) {
			//rows 2 && 3 - either melee or ranged
			if     (bf.map[y][2] && bf.map[y][3]) {damage2way(2,y,3,y);}
			else if(bf.map[y][2] && bf.map[y][4]) {damageDist(2,y,4,y);}
			else if(bf.map[y][3] && bf.map[y][1]) {damageDist(3,y,1,y);}
			//row 1 && 4 - ranged
			if     (bf.map[y][1] && bf.map[y][3] && isRanged(bf.map[y][1])) {damage1way(1,y,3,y);}
			if     (bf.map[y][4] && bf.map[y][2] && isRanged(bf.map[y][4])) {damage1way(4,y,2,y);}
		}

		//balloons - iterate all x fields for each air row
		for(let x = 0; x < 6; x++) {
			for(let y = 0; y < bf.air; y++) {
				if(!bf.map[y][x] || //aircraft doesn't exist
					units[bf.map[y][x].key].class !== 'bomber' || //is not a balloon
					((x === 2 || x === 3) && bf.map[y][2] && bf.map[y][3]) //aircraft currently engaged with each other
				) {continue;}
				let targets = []; //viable targets to shit on
				for(let y2 = bf.air; y2 < bf.rows; y2++) {
					bf.map[y2][x] && targets.push(y2);
				}
				if(targets.length === 0) {continue;}
				let yTarget = targets[Math.floor(Math.random() * targets.length)];
				damage1way(x,y,x,yTarget);
			}
		}
	};

	//3rd stroke: cleanup
	this.stroke3 = function() {
		const bf = s.battlefield;
		bf.effects = [];
		//dead units
		for(let x = 0; x < 6; x++) {for(let y = 0; y < bf.rows; y++) {
				if(bf.map[y][x] && bf.map[y][x].n <= 0) {bf.map[y][x] = false;}
		}}

		//withdraw antibombers if they don't have anything to fight against
		const BFsum = this.getBFsum();
		for(let y = 0; y < bf.air; y++) {
			bf.map[y] = bf.map[y].map(function(cell, i) {
				if(cell && units[cell.key].class === 'antibomber' && (BFsum.airL === 0 && i >= 3 || BFsum.airR === 0 && i <= 2)) {
					bf[cell.own ? 'reserveP' : 'reserveE'][cell.key] += cell.n;
					return false;
				}
				return cell;
			});
		}
	};

	//schedule a nuke of all enemy ground units
	this.nukeInit = function() {
		const bf = s.battlefield;
		if(!bf) {return;}
		s.ownNuke = false; //deplete current fireworks supply
		s.nukeCooldown = consts.nukeCooldown - game.getBlvl('zkusebna'); //set countdown to buy another one
		s.ctrl.tab = 'battle'; //switch to battle
		bf.nukeDuration = 5; //draw whiteflash
		bf.scheduledNuke = true; //schedule the actual killing for next stroke
		game.achieve('nuke');
	};

	//execute a scheduled nuke
	this.nukeExec = function() {
		const bf = s.battlefield;
		bf.scheduledNuke = false;
		//burn them all. BURN THEM ALL!
		for(let x = 0; x < 6; x++) {for(let y = 0; y < bf.rows; y++) {
			if(bf.map[y][x] && !bf.map[y][x].own) {
				//destroy a group of units while logging casualties
				bf[bf.map[y][x].own ? 'deadP' : 'deadE'][bf.map[y][x].key] += bf.map[y][x].n;
				bf.map[y][x] = false;
			}
		}}
	};
}
