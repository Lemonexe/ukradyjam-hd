//STATE object factory
let S = () => ({
	//for compatibility purposes
	version: [0, 0, 0],

	//last tick, tick count
	timestamp: 0,
	iteration: 0,

	//display name of town, purely cosmetic
	name: 'Polis',

	//current popups, displayed from last to first
	messages: [],

	// prachy, dřevo, kameny, sýra, pivo
	pop: [10, 0, 0, 0, 0],
	sur: [250, 250, 50, 50, 50],
	
	// kolekce budov
	build: [
		{
			id: 'radnice', //key in 'buildings' database
			lvl: 1,
			pos: [300, 250], //coordinates top left
			draggable: false //all buildings but this one are draggable
		}
	],

	hospoda: 0, //distribuce piva jakožto integer: 0 < s.hospoda < hospoda.lvl

	//parameters permanently modified by research
	p: {
		//základní vygebenost
		happy: 50,
	//MULTIPLIERS
		prachy: 1, //daňoví poplatníci
		drevo: 1, //těžba surovin
		kamen: 1,
		syra: 1,
		pivo: 1,

		skola: 1, //výzkumné body
		udrzba: 1, //údržba města
		plat: 1, //plat dělníků
		WC: 1, //násobí max. populační kapacitu
		obchod: 0.40, //počáteční efektivita obchodu
		cena: 1.04, //surovinové náklady na trénink jednotek
		power: 1, //atac jednotek
		dranc: 1, //množství drancovaných surovin
	//FEATURE UNLOCKS
		unlockLuxus: false,
		unlockBuild: ['skola', 'pristav', 'kasarna'],
		unlockUnit: ['kop'],
		unlockNuke: false
	},

	WP: 0, //výzkumné body
	research: [], // array of IDs of researched techs

	//id zázraku (např. 'delfin') a počet zbývajících cyklů zázraku, resp. do další možné aktivace
	miracle: false,
	mirCountdown: 0, 
	mirCooldown: 0,
	mirsReceived: [],//miracles that have been activated (-> achievement)


	//TODO
	army:      {kop: 0, luk: 0, hop: 0, sln: 0, trj: 0, obr: 0, baz: 0, bal: 0, gyr: 0},
	armyEnemy: {kop: 0, luk: 0, hop: 0, sln: 0, trj: 0, obr: 0, baz: 0, bal: 0, gyr: 0},
	battlefield: [],
	battleReports: [],
	nukeCooldown: 0,

	achievements: [],
	//'false' variables that are set to 'true' once, at some point during game as a warning / tutorial
	singleUse: {
		visitedPila: false, //visit islandPila for the 1st time. Until then it will blink to attract player's attention
		warnPopLimit: false, //population has reached limit
		warnOverflow: false, //storage capacity overflown
		warnUnhappy: false //negative happiness
	}
});

//initiate an instance of S
let s = S();

//game object
let game = {
	tick: function() {
	//GENERIC
		s.timestamp = Date.now();
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

		['drevo', 'kamen', 'syra', 'pivo'].forEach(function(o, i) {
			let j = i+1;
			s.sur[j] += s.pop[j] * eff[o];
			if(s.sur[j] >= storage) {
				s.sur[j] = storage;
				overflow[j] = true;
			}
		});

		//warnings and achievements
		(!!overflow.find(item => item)) && (this.singleUseWarn('warnOverflow'));
		(overflow.filter(item => item).length === 4) && this.achieve('stack');

	//BEER
		if(s.sur[4] > this.pridelHospoda()) {
			s.sur[4] -= this.pridelHospoda();
		}
		else {
			s.hospoda = 0;
			s.messages.push(['Pivo došlo a štamgasti museli hospodu opustit!', 'To se jim nebude líbit...']);
		}

	//POP
		this.population();

	//MIRACLE
		s.mirCountdown -= (s.mirCountdown > 0) ? 1 : 0;
		s.mirCooldown -= (s.mirCooldown > 0) ? 1 : 0;
		s.miracle = (s.mirCountdown > 0) ? s.miracle : false;
	},

	//gain or drain population properly
	population: function() {
		let diff = this.popGrowth();
		let poplim = this.popLimit();
		let poptotal = this.popTotal();

		//population gain, check pop limit
		if(diff > 0) {
			s.pop[0] += diff;
			if(poptotal + diff >= poplim) {
				s.pop[0] -= (poptotal + diff) - poplim;
				this.singleUseWarn('warnPopLimit');
			}
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
			warnOverflow: ['Skladovací kapacita je naplněna, je třeba dostavět sklad!', 'Toto varování už nebude znovu zobrazeno.'],
			warnPopLimit: ['Populační limit naplněn, je třeba vylepšit radnici!', 'Toto varování už nebude znovu zobrazeno.'],
			warnUnhappy: ['Vygebenost je nulová, takže populace nebude růst, a při velmi nízké hodnotě bude i klesat!', 'Toto varování už nebude znovu zobrazeno.'],
		};
		if(!s.singleUse[which]) {
			s.singleUse[which] = true;
			s.messages.push(warnings[which]);
		}
	},

	//TEMPORARY
	achieve: function(id) {
		if(s.achievements.indexOf(id) > -1) {return;}
		s.achievements.push(id);
		s.messages.push(['Achievement unlocked:', achievements[id].name]);
		//Achievement whore
		if(s.achievements.length === Object.keys(achievements).length - 1) {this.achieve('ALL');}
	},

	//all efficiency values, calculated by base value + building bonus
	//note: s.p.cena is not here, since it's more complicated - see getUnitCost()
	eff: function() {
		let palac = this.getBlvl('palac');
		let docks = this.getBlvl('pristav');
		let surMiracle = this.mir('obr', 0.10) + this.mir('had', -0.10);
		return {
			skola:  s.p.skola  + this.mir('antena', 0.20) + this.mir('dmnt', -0.10),
			prachy: s.p.prachy + 0.10*palac + this.mir('apollo', -0.10),
			drevo:  s.p.drevo  + 0.10*palac + surMiracle,
			kamen:  s.p.kamen  + 0.05*palac + surMiracle,
			syra:   s.p.syra   + 0.05*palac + surMiracle,
			pivo:   s.p.pivo   + 0.05*palac + surMiracle,
			udrzba: s.p.udrzba - 0.05*palac,
			plat:   s.p.plat   - 0.05*palac,
			obchod: s.p.obchod + 0.05*docks + this.mir('delfin', 0.05),
			power:  s.p.power               + this.mir('faust', 0.10),
			dranc:  s.p.dranc               - this.mir('faust', -0.05),
			WC:     s.p.WC
		}; 
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
		} else {
			s.messages.push(`Na stavbu budovy ${buildings[key].name} není dostatek surovin.`);
		}
	},

	//upgrade existing building
	upgradeBuilding: function(key) {
		let existing = game.getBuilding(key);
		if(existing.lvl === buildings[key].maxLvl) {return;}

		let price = buildings[key].price(existing.lvl + 1);
		if(this.spend(price)) {
			existing.lvl++;
			this.checkAchievement.maxed();
		} else{
			s.messages.push(`Na vylepšení budovy ${buildings[key].name} na úroveň ${(existing.lvl + 1)} bohužel není dostatek surovin.`);
		}
	},

	//buy research object 'r'
	buyResearch: function(r) {
		if(s.WP >= r.cost) {
			s.WP -= r.cost;
			s.research.push(r.id)
			r.f();
			this.checkAchievement.researches();
			s.messages.push([r.name + ':', r.result , '→ ' + r.effect]);
		} else {
			s.messages.push(`Na provedení výzkumu ${r.name} bohužel není dostatek výzkumných bodů.`)
		}
	},

	//calculate current happiness, which is a sum of multiple factors
	//maximal value: base 3200, palác -400, sklad -800, hospoda +2400, muzeum +1600 = 6000
	realHappiness: function() {
		return Math.round(this.happyBase() - this.popTotal() + this.happyHospoda() + this.happyMuzeum() + this.happySklad() + this.happyPalac());
	},
	happyBase: function() {return s.p.happy * (1 + this.mir('dmnt', 0.10) + this.mir('helma', -0.20));},
	happyHospoda: function() {return s.hospoda * 150;},
	pridelHospoda: function() {return s.hospoda > 0 ? Math.round(buildings.hospoda.f(s.hospoda)) : 0;},
	happyMuzeum: function() {return this.getBlvl('muzeum') * 100;},
	happySklad: function() {return -this.getBlvl('sklad') * 50;},
	happyPalac: function() {return -this.getBlvl('palac') * 100;},

	popGrowth: function() {return Math.ceil(this.realHappiness() / 50)},
	popTotal: function() {return s.pop.reduce((sum, i) => sum + i)},
	popLimit: function() {return Math.round(buildings.radnice.f(this.getBlvl('radnice')) * this.eff().WC)},

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
		cap += sklad ? buildings.sklad.f(sklad.lvl) : 0;
		return Math.round(cap);
	},

	//cost of a unit is dependent on building 'key' where it's trained
	getUnitCost: function(key)  {
		let lvl = this.getBlvl(key);
		return s.p.cena - 0.04*lvl;
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
		else {
			s.messages.push('Nemáme dostatek surovin na obětování, a olympští bohové jsou velmi hákliví na objem oběti.');
		}
	},

	//achievement control functions - those that are too long and would make their callers difficult to read
	checkAchievement: {
		researches: function() {
			if(s.research.length === 1) {game.achieve('IFLS');}
			else if(s.research.length === Object.keys(research).length) {game.achieve('budoucnost');}
		},
		buildings: function(key) {
			if(s.build.length === 2) {game.achieve('budovani');}
			if(key === 'palac') {game.achieve('palac');}
			else if(key === 'muzeum') {game.achieve('muzeum');}
		},
		maxed: function() {//there are all buildings && all of them have lvl === maxLvl
			if(s.build.length === Object.keys(buildings).length &&
				s.build.reduce((and, item) => (and && (item.lvl === buildings[item.id].maxLvl)), true)
				) {
				game.achieve('maxed');
			}
		}
	},

	//xD
	asdf: 'lol'
};
