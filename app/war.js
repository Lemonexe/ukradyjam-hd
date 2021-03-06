//Contains:
//1. War object factory, which contains all functions related to warfare, both model and view
//2. battleCanvas directive, which executes timeout and links the rendering functions with canvas element
const War = () => ({
	//initiate a battle by creating the battle object (state of battlefield)
	initBattle: function() {
		if(this.armySum(s.army) === 0) {game.msg('Nemáme žádnou dostupnou armádu');return;}
		
		//number of rows and their constraints
		let ground = enemyArmies[s.enemyLevel].ground
		ground = (ground <= 6) ? ground : 6;
		let air = enemyArmies[s.enemyLevel].air
		air = (air <= 2) ? air : 2;
		let rows = ground + air;

		//create the battlefield object, P = player related, E = enemy related
		s.battlefield = {
			stroke: 0,
			cycles: 0,
			//total army that has visited the battlefield
			logP: this.logArmyObj(s.army),
			logE: this.logArmyObj(s.armyE),
			//army objects with RESERVE units
			reserveP: this.migrateArmyObj(s.army),
			reserveE: this.migrateArmyObj(s.armyE),
			//"army object" with casualties
			deadP: this.newArmyObj(),
			deadE: this.newArmyObj(),

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
			//last enemy army (will get reinforcements if true)
			last: s.enemyLevel === enemyArmies.length-1
		};
		s.ctrl.tab = 'battle';
	},

	//move all units from town to battle reserves
	reinforceBattle: function() {
		if(this.armySum(s.army) === 0) {game.msg('Nemáme žádnou dostupnou armádu');return;}
		if(!s.battlefield) {return;} //this shouldn't happen
		this.logArmyObj(s.army, s.battlefield.logP);
		this.migrateArmyObj(s.army, s.battlefield.reserveP);
		game.msg('Všechny jednotky ve městě se připojily do bitvy');
	},

	//terminate battle, either as a victory (true) or defeat (false)
	endBattle: function(victory) {
		let bf = s.battlefield;
		//withdraw all units from map to reserve
		for(let y = 0; y < bf.rows; y++) {for(let x = 0; x < 6; x++) {
			if(bf.map[y][x]) {
				bf[bf.map[y][x].own ? 'reserveP' : 'reserveE'][bf.map[y][x].key] += bf.map[y][x].n;
				bf.map[y][x] = false;
			}
		}}
		//withdraw all units from reserve to towns
		for(let key in bf.reserveP) {
			s.army[key]  += bf.reserveP[key].positify();
			s.armyE[key] += bf.reserveE[key].positify();
		}

		//finish
		let report = {victory: victory, lvl: s.enemyLevel+1, cycles: bf.cycles, deadP: this.filterArmyObj(bf.deadP), deadE: this.filterArmyObj(bf.deadE)};
		if(victory) {
			game.achieve('GG');
			(this.armySum(bf.logP) === bf.logP.trj + bf.logP.obr + bf.logP.bal + bf.logP.gyr) && game.achieve('blitz');

			//pillaged resources
			let d = enemyArmies[s.enemyLevel].dranc * game.eff().dranc;
			let dranc = new Array(5).fill(0).map(s => d * (0.5 + 0.5*Math.random()));
			dranc[0] = dranc[0]*consts.goldValue; //more gold than other resources according to a fixed ratio
			game.msg(['VÍTĚZSTVÍ!', `Rozdrtili jsme armádu Polisu (úroveň ${s.enemyLevel+1}) za ${bf.cycles} kol`,
				`Vydrancováno ${dranc[0].toFixed(0)} zlata, ${dranc[1].toFixed(0)} dřeva, ${dranc[2].toFixed(0)} kamení, ${dranc[3].toFixed(0)} sýry a ${dranc[4].toFixed(0)} piva`]);
			s.sur = s.sur.map((s,i) => s + dranc[i]);
			report.dranc = dranc;

			//increment or regenerate enemy
			if(!bf.last) {s.enemyLevel++;}
			else {game.achieve('carnage');}
			s.armyE = angular.copy(enemyArmies[s.enemyLevel].army);
		}
		else {
			(this.armySum(bf.logP) === bf.logP.hop) && game.achieve('sparta');
			game.msg(['PORÁŽKA!', `Polis lvl ${s.enemyLevel+1} zničil naši armádu za ${bf.cycles} kol`]);
		}
		s.battlefield = false;
		s.battleReports.unshift(report);
	},

	//save remaining units by fleeing the fight
	surrender: function() {this.endBattle(false);},

	//generate an empty army object
	newArmyObj: () => ({kop: 0, luk: 0, hop: 0, sln: 0, trj: 0, obr: 0, baz: 0, bal: 0, gyr: 0}),

	//filter an army obj so only non-zero properties remain
	filterArmyObj: function(obj) {
		for(let i in obj) {
			if(obj.hasOwnProperty(i) && obj[i] <= 0) {delete obj[i];}
		}
		return obj;
	},

	//move all units from obj1 to obj2 (or a new obj if undefined)
	migrateArmyObj: function(obj1, obj2) {
		obj2 = obj2 || this.newArmyObj();
		for(let k in obj1) {
			obj2[k] += obj1[k];
			obj1[k] = 0;
		}
		return obj2;
	},

	//copy all units from obj1 to obj2 (or a new obj if undefined)
	logArmyObj: function(obj1, obj2) {
		obj2 = obj2 || this.newArmyObj();
		for(let k in obj1) {
			obj2[k] += obj1[k];
		}
		return obj2;
	},

	//sum of total army
	armySum: (obj) => Object.keys(obj).reduce((sum, i) => sum + obj[i], 0),

	//choose a group from reserves to put on the battlefield
	createGroup: function(unitSet, own) {
		let res = own ? s.battlefield.reserveP : s.battlefield.reserveE;

		//calculate P, which is cumulative probability to spawn various unit types = fraction of number weighted by maximum group size
		let sumN = 0;
		let sumP = 0;
		let P = new Array(unitSet.length).fill(0)
			//calculate normalized number of units (divided by group size) and add it to sum of all units
			.map(function(o, i) {
				let x = res[unitSet[i]] / units[unitSet[i]].group;
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
	},

	//get various sum of units
	getBFsum: function() {
		let bf = s.battlefield;

		//iterators for each side of the battlefield
		let L = [0,1,2]; R = [3,4,5];
		let reduceRow = (iterators, y) => iterators.reduce((sum, i) => sum + (bf.map[y][i] ? bf.map[y][i].n : 0), 0);
		let Lsums = new Array(bf.map.length).fill(0).map((row, y) => reduceRow(L, y));
		let Rsums = new Array(bf.map.length).fill(0).map((row, y) => reduceRow(R, y));

		let resAirCount = (obj) => Object.keys(obj).reduce((sum, i) => sum + obj[i] * (['bomber', 'antibomber'].indexOf(units[i].class) > -1), 0);
		let f = (sum, i) => sum + i;
		return {
			//sum of air units on field and in reserves
			airL: Lsums.slice(0, bf.air).reduce(f) + resAirCount(bf.reserveE),
			airR: Rsums.slice(0, bf.air).reduce(f) + resAirCount(bf.reserveP),
			//sum of ground units on field only
			groundL: Lsums.slice(bf.air).reduce(f),
			groundR: Rsums.slice(bf.air).reduce(f)
		};
	},

	//each stroke something different will be done. 3 strokes = full cycle
	stroke: function() {
		let bf = s.battlefield;
		if(!bf) {return;}
		
		if(bf.stroke % 3 === 0) {this.stroke1();}
		else if(bf.stroke % 3 === 1) {this.stroke2();}
		else {this.stroke3();}
		bf.stroke++;

		bf.cycles = Math.ceil(bf.stroke/3); //just an informative value
		
		bf.nukeDuration -= (bf.nukeDuration > 0) ? 1 : 0;
		if(bf.scheduledNuke) {this.nukeExec();}
	},

	//1st stroke: units advance on the map
	stroke1: function() {
		let bf = s.battlefield;
		//iterate every row
		for(let y = 0; y < bf.rows; y++) {
			let iterationOrder = [2, 3, 1, 4, 0, 5];
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

				let BFsum = this.getBFsum();
				let airDominance = BFsum.airL === 0 && own || BFsum.airR === 0 && !own; //whether the oponent's air space is empty

				//try to spawn a new group on outer cells
				if(!bf.map[y][x] && x === spawn) {
					//which units can be spawned on this cell
					let unitSet = (y < bf.air) ? consts.skyUnits : consts.groundUnits;
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

		//control for end - whoever loses all ground units is defeated
		let BFsum = this.getBFsum(); //has to be called again!
		//a draw is also a victory, that's why groundR (enemy) is checked first
		if(BFsum.groundR <= 0) {this.endBattle(true);}
		else if(BFsum.groundL <= 0) {this.endBattle(false);}
	},

	//2nd stroke: FIGHT!
	stroke2: function() {
		let bf = s.battlefield;
		//determine whether the group is ranged
		let isRanged = (group) => units[group.key].class === 'ranged';
		//get bonus of 1 over 2
		function getBonus(x1,y1,x2,y2) {
			let bonus = units[bf.map[y1][x1].key].bonus;
			let key = bf.map[y2][x2].key;
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
			let power = game.eff().power;
			let p1 = g1.own ? power : 1;
			let p2 = g2.own ? power : 1;
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
			(s.miracle === 'faust' && g1.own && hp2 < 0) && damageSpecial(-hp2, x2 + (x2 < 3 ? -1 : 1), y2);
			(s.miracle === 'faust' && g2.own && hp1 < 0) && damageSpecial(-hp1, x1 + (x1 < 3 ? -1 : 1), y1);

			//special graphical effects
			bf.effects.push({type: 'grayLine', x1:x1,y1:y1,x2:x2,y2:y2});
			bf.effects.push({type: 'bloodSplatter', x:x1,y:y1});
			bf.effects.push({type: 'bloodSplatter', x:x2,y:y2});
		}
		//first group attacks the other (without retaliation)
		function damage1way(x1,y1,x2,y2) {
			//substitutions
			let g1 = bf.map[y1][x1]; let g2 = bf.map[y2][x2]; let k1 = g1.key; let k2 = g2.key;
			//power is calculated only if player is the attacker
			let p1 = g1.own ? game.eff().power : 1;
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
			(s.miracle === 'faust' && g1.own && hp2 < 0) && damageSpecial(-hp2, x2 + (x2 < 3 ? -1 : 1), y2);

			//special graphical effects for balloon, bazooka and other ranged units
			if(k1 === 'bal') {
				bf.effects.push({type: 'shitLine', x1:x1,y1:y1,x2:x2,y2:y2});
				bf.effects.push({type: 'shitSplatter', x:x2,y:y2});
			}
			else if(k1 === 'baz') {
				bf.effects.push({type: 'yellowArc', x1:x1,y1:y1,x2:x2,y2:y2});
				bf.effects.push({type: 'explosion', x:x2,y:y2});
			}
			else {
				bf.effects.push({type: 'grayArc', x1:x1,y1:y1,x2:x2,y2:y2});
				bf.effects.push({type: 'bloodSplatter', x:x2,y:y2});
			}
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
	},

	//3rd stroke: cleanup
	stroke3: function() {
		let bf = s.battlefield;
		bf.effects = [];
		//dead units
		for(let x = 0; x < 6; x++) {for(let y = 0; y < bf.rows; y++) {
				if(bf.map[y][x] && bf.map[y][x].n <= 0) {bf.map[y][x] = false;}
		}}

		//withdraw antibombers if they don't have anything to fight against
		let BFsum = this.getBFsum();
		for(let y = 0; y < bf.air; y++) {
			bf.map[y] = bf.map[y].map(function(cell, i) {
				if(cell && units[cell.key].class === 'antibomber' && (BFsum.airL === 0 && i >= 3 || BFsum.airR === 0 && i <= 2)) {
					bf[cell.own ? 'reserveP' : 'reserveE'][cell.key] += cell.n;
					return false;
				}
				return cell;
			});
		}
	},

	//schedule a nuke of all enemy ground units
	nukeInit: function() {
		let bf = s.battlefield;
		if(!bf) {return;}
		s.ownNuke = false; //deplete current fireworks supply
		s.nukeCooldown = consts.nukeCooldown - game.getBlvl('zkusebna'); //set countdown to buy another one
		s.ctrl.tab = 'battle'; //switch to battle
		bf.nukeDuration = 5; //draw effect
		bf.scheduledNuke = true; //schedule the actual killing for next stroke
		game.achieve('nuke');
	},

	//execute a scheduled nuke
	nukeExec: function() {
		let bf = s.battlefield;
		bf.scheduledNuke = false;
		//burn them all. BURN THEM ALL!
		for(let x = 0; x < 6; x++) {for(let y = 0; y < bf.rows; y++) {
			if(!bf.map[y][x].own) {
				//destroy a group of units while logging casualties
				bf[bf.map[y][x].own ? 'deadP' : 'deadE'][bf.map[y][x].key] += bf.map[y][x].n;
				bf.map[y][x] = false;
			}
		}}
	},





/*CANVAS RENDERING (executed from directive)*/
	//constants for rendering (in pixels)
	positionConsts: {
		X0: 108,
		airY0: 20,
		gndY0: 208,
		sideXP: 0,
		sideXE: 536
	},

	//central function to draw the battlefield
	render: function(ctx) {
		//clear & draw background image
		ctx.clearRect(0, 0, 600, 600);
		ctx.drawImage(imgs.battle, 0, 0);

		//cycle number
		ctx.textAlign = 'center'; ctx.fillStyle = 'black'; ctx.font = 'bold 16px Arial';
		ctx.fillText('kolo ' + s.battlefield.cycles.toFixed(0), 300, 16);

		s.ctrl.drawBattleGrid && this.drawGrid(ctx);
		this.drawSide(ctx);
		this.drawMap(ctx);
		this.drawEffects(ctx);
	},

	//draw the battlefield grid
	drawGrid: function(ctx) {
		const pc = this.positionConsts;
		let bf = s.battlefield;
		ctx.lineWidth = 1; ctx.strokeStyle = '#998855';
		for(let x = 0; x < 6; x++) {
			for(let y = 0; y < bf.rows; y++) {
				//if sky, else ground
				if(y < bf.air) {ctx.beginPath(); ctx.rect(pc.X0+64*x, pc.airY0+64*y, 64, 64); ctx.stroke();}
				else {ctx.beginPath(); ctx.rect(pc.X0+64*x, pc.gndY0+64*(y-bf.air), 64, 64); ctx.stroke();}
			}
		}
	},

	//draw side panels for player and enemy
	drawSide: function(ctx) {
		const pc = this.positionConsts;
		let bf = s.battlefield;
		s.tooltipField = [];
		//define which units are rendered where
		let sky = consts.skyUnits;
		let ground = consts.groundUnits;
		//e, p = count of unit types (for rendering) for enemy and player, k = unit key
		let e, p, k;
		e = p = 0;
		//draw sky units on sides
		for(let i = 0; i < sky.length; i++) {
			k = sky[i];
			if(bf.reserveP[k] > 0 || bf.logP[k] > 0 || bf.deadP[k] > 0) {this.drawSideUnit(ctx, k, bf.reserveP[k], bf.deadP[k], true,  pc.sideXP, p*64); p++;}
			if(bf.reserveE[k] > 0 || bf.logE[k] > 0 || bf.deadE[k] > 0) {this.drawSideUnit(ctx, k, bf.reserveE[k], bf.deadE[k], false, pc.sideXE, e*64); e++;}
		}
		//reset counters and draw ground units on sides
		e = p = 0;
		for(let i = 0; i < ground.length; i++) {
			k = ground[i];
			if(bf.reserveP[k] > 0 || bf.logP[k] > 0 || bf.deadP[k] > 0) {this.drawSideUnit(ctx, k, bf.reserveP[k], bf.deadP[k], true,  pc.sideXP, 152+p*64); p++;}
			if(bf.reserveE[k] > 0 || bf.logE[k] > 0 || bf.deadE[k] > 0) {this.drawSideUnit(ctx, k, bf.reserveE[k], bf.deadE[k], false, pc.sideXE, 152+e*64); e++;}
		}
	},

	//draw a side unit(context, unit ID, number of reserves & dead, whether the label shall be on the right, coords)
	drawSideUnit: function(ctx, key, reserve, dead, right, x, y) {
		//image of the unit
		if(right) {
			ctx.drawImage(imgs[key], x, y, 64, 64);
		}
		else {
			ctx.save(); ctx.scale(-1, 1);
			ctx.drawImage(imgs[key], -x, y, -64, 64);
			ctx.restore();
		}
		//draw rectangular textbox
		ctx.beginPath();
		let w = 42; //width of textbox
		let x0 = right ? x+64-5 : x-w+5; //base position of textbox
		ctx.rect(x0, y+12, w, 40);
		ctx.fillStyle = right ? '#aaaceebf' : '#eeaaaabf'; ctx.fill();
		//write numbers
		ctx.textAlign = 'center'; ctx.fillStyle = 'black';
			ctx.font = 'normal 20px Arial'; ctx.fillText(reserve.addk(),  x0+w/2, y+31, w-2);
		if(dead > 0) {
			ctx.font = 'italic 16px Arial'; ctx.fillText('-'+dead.addk(), x0+w/2, y+48, w-2);
		}

		//[top,left,height,width,text]
		const zoom = s.ctrl.zoom/600;
		s.tooltipField.push([y*zoom, x*zoom, 64*zoom, 64*zoom, units[key].name]);
	},

	//draw the battlefield itself
	drawMap: function(ctx) {
		const pc = this.positionConsts;
		let bf = s.battlefield;
		for(let x = 0; x < 6; x++) {
			for(let y = 0; y < bf.rows; y++) {
				//sky
				(y <  bf.air) && bf.map[y][x] && this.drawMapUnit(ctx, bf.map[y][x].key, bf.map[y][x].n, x<3, bf.map[y][x].own, pc.X0+64*x, pc.airY0+64*y);
				//ground
				(y >= bf.air) && bf.map[y][x] && this.drawMapUnit(ctx, bf.map[y][x].key, bf.map[y][x].n, x<3, bf.map[y][x].own, pc.X0+64*x, pc.gndY0+64*(y-bf.air));
			}
		}
	},

	//draw a group on the battlefield(context, unit ID, number, whether it's facing right, whether it's owned by player, coords)
	drawMapUnit: function(ctx, key, n, right, own, x, y) {
		//image of the unit
		if(right) {
			ctx.drawImage(imgs[key], x, y, 64, 64);
		}
		else {
			ctx.save(); ctx.scale(-1, 1);
			ctx.drawImage(imgs[key], -x, y, -64, 64);
			ctx.restore();
		}
		//draw rectangular textbox
		ctx.beginPath();
		let w = ctx.measureText(n.toFixed(0)).width + 2;
		ctx.rect(x+64-w, y, w, 20);
		ctx.fillStyle = own ? '#c3c4f5aa' : '#f4c4c4aa';
		ctx.fill();
		//write number
		ctx.fillStyle = own ? '#0000bb' : '#bb0000';
		ctx.textAlign = 'right';
		ctx.font = 'normal 20px Arial';
		ctx.fillText(n.toFixed(0), x+63, y+17, 62);
	},


	//draw special graphical effects
	drawEffects: function(ctx) {
		const pc = this.positionConsts;
		let bf = s.battlefield;
		//get coordinates from map indices
		let coordX = x => pc.X0+32+64*x;
		let coordY = y => y < bf.air ? pc.airY0+32+64*y : pc.gndY0+32+64*(y-bf.air);

		//functions for effect rendering
		let effectF = {
			//splatter (dots randomly placed in circular area)
			splatter: function(e, color, drops, radius, size) {
				for(let i = 0; i < drops; i++) {
					let x = coordX(e.x) + Math.sin(Math.random()*Math.PI*2) * radius * Math.random();
					let y = coordY(e.y) + Math.cos(Math.random()*Math.PI*2) * radius * Math.random();
					ctx.beginPath();
					ctx.arc(x, y, size, 0, 2*Math.PI);
					ctx.fillStyle = color;
					ctx.fill();
				}
			},

			//straight line
			line: function(e, color, dash) {
				ctx.beginPath();
				ctx.moveTo(coordX(e.x1), coordY(e.y1));
				ctx.lineTo(coordX(e.x2), coordY(e.y2));
				ctx.strokeStyle = color;
				ctx.setLineDash(dash);
				ctx.lineWidth = 3;
				ctx.stroke();
				ctx.setLineDash([]);
			},

			//balistic arc. It is assumed that y1 = y2
			arc: function(e, color) {
				ctx.beginPath();
				ctx.arc(coordX(0.5*(e.x1+e.x2)), coordY(e.y1)+64, Math.SQRT2*64, 1.25*Math.PI, 1.75*Math.PI);
				ctx.strokeStyle = color;
				ctx.setLineDash([]);
				ctx.lineWidth = 2;
				ctx.stroke();
			}
		};

		//effectF calling sequences for each effect type
		let effectCalls = {
			bloodSplatter: e => effectF.splatter(e, '#c00000', 50 , 18, 1.5),
			shitSplatter:  e => effectF.splatter(e, '#c05f00', 100, 22, 2),
			explosion:     e => effectF.splatter(e, '#e2e41c', 80 , 25, 1.5),
			grayLine:      e => effectF.line    (e, '#808080', []),
			shitLine:      e => effectF.line    (e, '#c05f00', [5, 10]),
			yellowArc:     e => effectF.arc     (e, '#e2e41c'),
			grayArc:       e => effectF.arc     (e, '#c0c0c0')
		};

		//iterate through all effects to draw them
		bf.effects.forEach(e => effectCalls[e.type](e));
	}
});


//this directive links the rendering functions with canvas element
app.directive('battleCanvas', () => ({
	restrict: 'A',
	link: function(scope, element) {
		//render battlefield
		function render() {
			if(!s.battlefield) {return;}
			let ctx = element[0].getContext('2d');
			game.war.render(ctx);
		}

		//set listener, which will be called via a $broadcast by an $interval from main controller
		scope.$on('renderWar', render);

		//first-time render upon opening battle tab
		render();
	}
}));
