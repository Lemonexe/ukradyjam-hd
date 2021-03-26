//game object
const game = {
	//current version of this build & last supported version (savegame compatibility)
	version: [1, 2, 0],
	support: [0, 2, 0],

	//all warfare related functions are outsourced to a constructor
	war: new War(),

	//add a new alert-style message
	//multi-line message is an array of strings; one-line message is a string (but will be converted to array anyway)
	msg: function(m) {
		m = (typeof m === 'string') ? [m] : m;
		m = m.filter(item => item.trim());
		(m.length > 0) && s.messages.push(m);
	},

	//create and fill in the tooltip object (remove it: s.tooltip.visible = false)
	createTooltip: function (top, left, msg) {
		s.tooltip.visible = true; s.tooltip.message = msg;
		s.tooltip.style = {
			'top': (top + 25) + 'px',
			'left': left + 'px'
		};
	},

	//perform ticks retrospectively while loading a game
	retrospecticks: function() {
		//number of cycles to do: n = game cycle, nw = war stroke
		let n  = Math.floor((Date.now() - s.timestamp) / consts.dt);
		let nw = Math.floor((Date.now() - s.warstamp) / consts.dtw);
		(n >= consts.backAchieve / consts.dt) && game.achieve('back');

		//variables for shortcut calculation
		let n2 = false;
		let ctrl2, ctrl = s.sur.slice(1).concat(s.pop);
		const callback = (sum,o,i) => sum && (Math.round(ctrl[i]-ctrl2[i]) === 0);

		//retrospectively do all the game cycles and strokes
		for(let i = 0; i < n; i++) {
			game.tick();

			//control for shortcut calculation
			ctrl2 = s.sur.slice(1).concat(s.pop);
			if(ctrl.reduce(callback,true) &&
				s.nukeCooldown <= 0 && s.mirCooldown <= 0 && s.oktoberfest <= 1
			) {n2 = n - i; break;}
			ctrl = ctrl2;
		}

		if(n2) {
			s.WP += this.rateWP() * n2;
			s.sur[0] += this.moneyTotal() * n2;
		}

		for(let i = 0; i < nw; i++) {
			if(!s.battlefield) {break;}
			game.war.stroke();
		}

		return n;
	},

	//the central function of this discrete model
	tick: function() {
		while(s.messages.length > consts.maxMessages) {s.messages.shift();}
		s.iteration++;
	//WP
		s.WP += this.rateWP();

	//MONEY
		s.sur[0] += this.moneyTotal();
		(s.sur[0] <= 0) && this.achieve('exec');

	//SUR
		let eff = this.eff();
		let storage = this.storage();
		let overflow = new Array(5).fill(false);
		let beerConsumption = this.pridelHospoda();

		['drevo', 'kamen', 'syra', 'pivo'].forEach(function(o, i) {
			let j = i+1;
			s.sur[j] += s.pop[j] * eff[o];
			//if storage is full
			let diff = s.sur[j] - storage;
			if(diff >= 0) {
				s.sur[0] += diff*eff.obchod*consts.goldValue;
				s.sur[j] -= diff;
				overflow[j] = true;
				//relieve workers. In case of beer, keep as many workers as it takes to keep a constant supply of beer, otherwise relieve all workers
				let newWorkers = (o === 'pivo') ? Math.min(s.pop[4], Math.ceil(beerConsumption/eff[o])) : 0;
				s.pop[0] += s.pop[j] - newWorkers;
				s.pop[j] = newWorkers;
			}
		});

		//warnings and achievements
		(!!overflow.find(item => item)) && (this.singleUseWarn('warnOverflow'));
		(overflow.filter(item => item).length === 4) && this.achieve('stack');

	//BEER
		if(s.sur[4] >= beerConsumption) {
			s.sur[4] -= beerConsumption;
		}
		else {
			s.hospoda = 0;
			this.msg(['Pivo došlo a štamgasti museli hospodu opustit!', 'To se jim nebude líbit...']);
		}
		s.oktoberfest *= consts.oktoberfest.decrease;
		s.oktoberfest < 1 && (s.oktoberfest = 1);

	//POP
		this.population();

	//bailout in insolvency
		this.bailout();

	//MIRACLE & NUKE
		s.nukeCooldown = (--s.nukeCooldown).positify();
		s.mirCountdown = (--s.mirCountdown).positify();
		s.mirCooldown = (--s.mirCooldown).positify();
		s.miracle = (s.mirCountdown > 0) ? s.miracle : false;
	},

	//gain or drain population properly
	population: function() {
		let diff = this.popGrowth();
		let poplim = this.popLimit();
		let poptotal = this.popTotal();

		//population gain, check pop limit
		if(diff > 0) {
			if(poptotal + diff >= poplim) {
				diff = (poplim - poptotal).positify();
				this.singleUseWarn('warnPopLimit');
			}
			s.pop[0] += diff;
		}

		//population drain algorithm that avoids going into negative numbers
		else if(poptotal > 0) {
			diff *= -1;
			this.singleUseWarn('warnUnhappy');
			for(let i = 0; i <= 4; i++) {
				if(s.pop[i] > diff) {
					s.pop[i] -= diff;
					break;
				}
				else {
					diff -= s.pop[i]
					s.pop[i] = 0;
				}
			}
		}

		(this.realHappiness() <= 0 && this.popTotal() <= 0) && this.achieve('exodus');
	},

	//activate a one time warning
	singleUseWarn: function(which) {
		let warnings = {
			warnOverflow: ['Skladovací kapacita je naplněna, je třeba dostavět sklad (po vynálezu Logistiky v odvětví ekonomiky). Dělníci byli staženi.', 'Toto varování už nebude znovu zobrazeno.'],
			warnPopLimit: ['Populační limit naplněn, je třeba vylepšit radnici!', 'Toto varování už nebude znovu zobrazeno.'],
			warnUnhappy: ['Vygebenost je nulová, takže populace nebude růst, a při velmi nízké hodnotě bude i klesat!', 'Toto varování už nebude znovu zobrazeno.'],
		};
		if(!s.singleUse[which]) {
			s.singleUse[which] = true;
			this.msg(warnings[which]);
		}
	},

	//try to achieve an achievement (if player hasn't achieved to achieve that achievement so far)
	achieve: function(id) {
		if(s.achievements.indexOf(id) > -1) {return;}
		s.achievements.push(id);
		this.msg(['Achievement unlocked:', achievements[id].name]);
		//Achievement whore
		if(s.achievements.length === Object.keys(achievements).length - 1) {this.achieve('ALL');}
	},

	//all efficiency values, calculated by base value + building bonus + miracle bonus
	//efficiency values that are constant are referenced directly asd s.p.whatever
	eff: function(arg) {//argument optional
		const palac = this.getBlvl('palac');
		const docks = this.getBlvl('pristav');
		const surMiracle = this.mir('obr', consts.mir.obr) + this.mir('had', -consts.mir.had);
		const extraPower = (arg === 'bal' && s.p.powerBal) ? s.p.powerBal : 0; //extra power for a specific unit
		return {
			skola:  s.p.skola  + this.mir('antena', consts.mir.antena) + this.mir('dmnt', -consts.mir.dmnt2),
			prachy: s.p.prachy + 0.10*palac + this.mir('apollo', -consts.mir.apollo),
			drevo:  s.p.drevo  + 0.10*palac + surMiracle,
			kamen:  s.p.kamen  + 0.05*palac + surMiracle,
			syra:   s.p.syra   + 0.05*palac + surMiracle,
			pivo:   s.p.pivo   + 0.05*palac + surMiracle,
			udrzba: s.p.udrzba - 0.05*palac,
			plat:   s.p.plat   - 0.05*palac,
			obchod: s.p.obchod + 0.05*docks + this.mir('delfin', consts.mir.delfin),
			power:  s.p.power  + extraPower + this.mir('faust', consts.mir.faust1),
			dranc:  s.p.dranc               + this.mir('faust', -consts.mir.faust2)
		};
	},
	//cost of a unit is dependent on building 'key' where it's trained
	getUnitCost: function(key)  {
		const lvl = this.getBlvl(key);
		return s.p.cena - consts.trainingDiscount*lvl;
	},

	//get existing building object on its id
	getBuilding: id => s.build.find(item => item.id === id),
	//get building lvl or zero if it doesn't exist
	getBlvl: function(id) {
		let b = this.getBuilding(id);
		return b ? b.lvl : 0;
	},

	//try to spend 'cost' resources, returns true/false to indicate success
	spend: function(cost) {
		//check if there are enough resources to cover costs
		let check = function(res, cost) {
			for(let i = 0; i < res.length; i++) {
				if(cost[i] > 0 && Math.floor(cost[i]) > res[i]) {return false;}
			}
			return true;
		};

		if(check(s.sur, cost)) {
			s.sur = s.sur.map((s, i) => s - Math.floor(cost[i]).positify());
			return true;
		}
		else {return false;}
	},

	//try to buy building by its id and randomly place it on map
	buyBuilding: function(key) {
		let price = buildings[key].price(1);
		if(this.spend(price)) {
			//successfully spent
			let rnd = () => Math.round(Math.random()*436 + 32);
			s.build.push({
				id: key,
				lvl: 1,
				pos: [rnd(), rnd()],
				draggable: true
			});
			this.checkAchievement.buildings(key);
		}
		else {this.msg(`Na stavbu budovy ${buildings[key].name} není dostatek surovin.`);}
	},

	//upgrade existing building
	upgradeBuilding: function(key) {
		let existing = game.getBuilding(key);
		if(existing.lvl === buildings[key].maxLvl) {return;}

		let price = buildings[key].price(existing.lvl + 1);
		if(this.spend(price)) {
			existing.lvl++;
			this.checkAchievement.maxed();
		}
		else {this.msg(`Na vylepšení budovy ${buildings[key].name} na úroveň ${(existing.lvl + 1)} bohužel není dostatek surovin.`);}
	},

	//buy research object 'r'
	buyResearch: function(r) {
		if(s.WP >= r.cost) {
			s.WP -= r.cost;
			s.research.push(r.id)
			r.f();
			this.checkAchievement.researches();
			this.msg([r.name + ':', r.result , '→ ' + r.effect]);
		}
		else {this.msg(`Na provedení výzkumu ${r.name} bohužel není dostatek výzkumných bodů.`)}
	},

	//calculate current happiness, which is a sum of multiple factors
	//maximal value: base 3200, palác -400, sklad -800, hospoda +2400, muzeum +1600 = 6000
	realHappiness: function() {
		return Math.round(this.happyBase() - this.popTotal() + this.happyHospoda() + this.happyMuzeum() + this.happySklad() + this.happyPalac());
	},
	happyBase: function() {return s.p.happy * (1 + this.mir('dmnt', consts.mir.dmnt1) + this.mir('helma', -consts.mir.helma));},
	happyHospoda: function() {return s.hospoda * 150;},
	pridelHospoda: function() {return s.hospoda > 0 ? Math.round(buildings.hospoda.f(s.hospoda)) : 0;},
	happyMuzeum: function() {return this.getBlvl('muzeum') * 100;},
	happySklad: function() {return -this.getBlvl('sklad') * 50;},
	happyPalac: function() {return -this.getBlvl('palac') * 100;},

	popGrowth: function() {return Math.ceil(this.realHappiness() / 50)},
	popTotal: function() {return s.pop.reduce((sum, i) => sum + i)},
	popLimit: function() {return Math.round(buildings.radnice.f(this.getBlvl('radnice')) * s.p.WC)},

	//rate of research points per one cycle
	rateWP: function() {
		let WP = consts.baseRateWP;
		let skola = this.getBuilding('skola');
		WP += skola ? buildings.skola.f(skola.lvl) : 0;
		return Math.round(WP * this.eff().skola);
	},

	//functions for accountants
	moneyTotal: function() {
		let taxes = s.pop[0] * consts.tax * this.eff().prachy
		let wages = (this.popTotal() - s.pop[0]) * consts.wage * this.eff().plat;
		return Math.round(taxes - wages - this.moneyMaintenance());
	},
	//calculate relative level (to accomodate for different maxLvl) and sum cost of each building as expF()
	moneyMaintenance: function() {
		return this.eff().udrzba * s.build.reduce(function(sum, item) {
			let lvlR = item.lvl / buildings[item.id].maxLvl * 16;
			return sum + expF(lvlR,0.3909,1.5,1);
		}, 0);
	},

	//get storage capacity
	storage: function() {
		let cap = consts.baseSklad;
		let sklad = this.getBuilding('sklad');
		cap += sklad ? buildings.sklad.f(sklad.lvl) * s.p.sklad : 0;
		return Math.round(cap);
	},

	//get percent modifier of miracle
	mir: function(miracle, p) {
		return this.getBlvl('kostel') * p * (s.miracle === miracle);
	},

	//activate miracle
	darkRitual: function() {
		if(s.pop[0] >= consts.mirPrice.pop && s.sur[0] >= consts.mirPrice.zlato) {
			s.pop[0] -= consts.mirPrice.pop;
			s.sur[0] -= consts.mirPrice.zlato;
			let mirs = Object.keys(miracles);
			let i = Math.floor(Math.random() * mirs.length);
			s.miracle = mirs[i];
			s.mirCountdown = consts.mirCountdown;
			s.mirCooldown = consts.mirCooldown - this.getBlvl('kostel');
			(s.mirsReceived.indexOf(mirs[i]) === -1) && s.mirsReceived.push(mirs[i]) && this.achieve('zazrak');
			(s.mirsReceived.length === mirs.length) && this.achieve('gambler');
		}
		else {this.msg('Nemáme dostatek surovin na obětování, a olympští bohové jsou velmi hákliví na objem oběti.');}
	},

	//buy a nuclear warhead
	buyNuke: function() {
		if(this.spend(consts.nukePrice)) {
			s.ownNuke = true;
		}
		else {this.msg('Nemáme dostatek surovin, a taková velkolepá pyrotechnická sestava přijde hodně draho!');}
	},

	//beer overdrive
	oktoberfest: function() {
		const co = consts.oktoberfest;
		if(this.spend([0, 0, 0, 0, co.base * s.oktoberfest])) {
			s.oktoberfest *= co.increase;
			(co.base * s.oktoberfest > co.max) && (s.oktoberfest = co.max / co.base);
			const bonus = Math.ceil((0.5 + Math.random()) * consts.oktoberfest.pop);
			s.pop[0] += bonus;
			this.msg(`Díky oktoberfestu máme ${bonus} nově vygebených obyvatel!`);
		}
		else {this.msg('Nemáme dostatek piva na totální opití společnosti!');}
	},

	//check for insolvency and grant a bailout
	bailout: function() {
		if(this.popTotal() <= 0 && this.popGrowth() <= 0 && s.sur[4] <= 0 && s.sur[0] <= 0 && s.miracle !== 'helma') {
			s.sur[4] = 100; //give beer to enable population growth
			if(s.sur[1] <= 0 && this.getBlvl('hospoda') === 0) {s.sur[1] = 100;} //give wood for hospoda construction
			this.msg('Naše říše je v totálním krachu. Abychom se z krize vyhrabali, dala nám Helénská Unie půjčku s dlouhodobou splatností.');
		}
	},

	//achievement control functions - those that are too long and would make their callers difficult to read
	checkAchievement: {
		researches: function() {
			if(s.research.length === 1) {game.achieve('IFLS');}

			let grandTechs = ['EcoGrand', 'PolGrand', 'WisGrand', 'ArmGrand'];
			let callback = (sum,r) => sum && s.research.indexOf(r) > -1;
			if(grandTechs.reduce(callback, true)) {game.achieve('budoucnost');}
		},
		buildings: function(key) {
			if(s.build.length === 2) {game.achieve('budovani');}
			if(key === 'palac') {game.achieve('palac');}
			else if(key === 'muzeum') {game.achieve('muzeum');}
		},
		//there are all buildings && all of them have lvl === maxLvl
		maxed: function() {
			if(s.build.length === Object.keys(buildings).length &&
				s.build.reduce((sum, b) => (sum && (b.lvl === buildings[b.id].maxLvl)), true)
			) {game.achieve('maxed');}
		},
		//achieve if there are at least 4 buildings and all are stacked on one position
		multi: function() {
			let comp = (a,b) => Math.abs(a-b) <= 40; //whether coordinates  match
			for(let o of s.build) {
				if(
					s.build.reduce((sum, b) => (sum += comp(b.pos[0], o.pos[0]) && comp(b.pos[1], o.pos[1])), 0) >= 4
				) {game.achieve('multi');}
			}
		}
	},

	//a beautiful hackertype sequence
	hackTheSystem: function() {
		forceDigest();
		//What a nice piece of source code...
		let source = String(angular.module);
		//Would be a shame if someone...
		let lines = [];
		let c = 0;
		//Split it into lines of random length,
		while(c < source.length) {
			let c0 = c;
			c += Math.ceil(100*(0.1 + 0.9*Math.random()));
			lines.push(source.substring(c0, c));
		}
		//and gradually logged them into console!
		let tc = 500; //cumulative time in [ms]
		for(let i = 0; i < 200; i++) {
			if(i % 43 === 0 && Math.random() < 0.5) {tc += 500;}
			if(i % 19 === 0 && Math.random() < 0.5) {tc += 250;}
			tc += Math.ceil(40 * (0.1 + 0.9*Math.random()));
			window.setTimeout(() => console.log(lines[i%lines.length]), tc);
		}
		//MUHAHAHA!!!
		window.setTimeout(() => console.log('%cUKRADYJAM WAS HACKED !!!', 'color: #AA0000; font-size: 24px; font-weight: bold'), tc+1000);
	},

	//hidden function, never executed - writes a list of missing achievements to console
	revealAchievements: () => Object.keys(achievements).filter(item => s.achievements.indexOf(item) === -1).forEach(item => console.log(achievements[item].name + ': ' + achievements[item].description)),

	//xD
	asdf: 'lol'
};
