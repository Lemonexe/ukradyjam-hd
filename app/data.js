//generic constants
const consts = {
	dt: 1e4,  //duration of one game cycle [ms]
	dtw: 1e3, //duration of one battle stroke [ms]
	surAliases: ['zlato', 'drevo', 'kamen', 'syra', 'pivo'], //aliases for resources
	baseRateWP: 4, //základní rychlost výzkumu, škola posiluje
	tax: 3, //base money gain per taxpayer
	wage: 3, //base money loss per worker
	goldValue: 6, //exchange rate of resources to gold
	baseSklad: 2000,
	trainingDiscount: 0.04, //% unit price discount per level of building

	mirCountdown: 8, //duration of miracle
	mirCooldown: 16, //base value of waiting time for new miracle
	mirPrice: {pop: 13, zlato: 666}, //price of a dark ritual
	mir: { //miracle effects to be used in game.eff() and miracle description functions
		faust1: 0.15,  //+power
		faust2: 0.10,  //-dranc
		delfin: 0.05,  //+obchod
		obr:    0.125, //+all suroviny
		antena: 0.50,  //+skola
		dmnt1:  0.20,  //+happy
		dmnt2:  0.20, //-skola
		apollo: 0.125, //-prachy
		had:    0.125, //-all suroviny
		helma:  0.20   //-happy
	},
	rel: { //relic effects to be used in game.eff()
		helmet:   0.1,  //-cena
		necro:    2,    //+mir effect
		eanasir:  0.1,  //+obchod
		AoE2:     0.2,  //+prachy
		LotR:     0.1,  //-plat
		hitler:   0.2,  //+power
		venus:  400,    //+happy (abs)
		blackhole: 0.1, //-udrzba
		mirror:    0.3  //+skola
	},

	nukeCooldown: 16, //base value of waiting time for new nuke
	nukePrice: [5e3, 0, 0, 5e3, 0], //as sur

	oktoberfest: {
		base: 1e4, //base beer costs
		max: 2e5, //max beer costs
		pop: 100, //mean population bonus
		increase: 1.2, //factor of cost amplification per use
		decrease: 0.9 //factor of cost attenuation per tick
	},

	//odysseia
	odys: {
		rateWP: 100, //WP reward per score
		rateDranc: 350, //sur reward per score
		rateRelic: 6e-3, //probability modifier for relic drop
		scoreWave: 1.15, //score modifier per wave
		sizeFun: [10, 150, 500], //function players size -> odys size as [min, max, delay]
		rowsFun: [1, 0.37], //function odys wave size -> ground rows as [proportion, power]
		retreatWave: 10, //from this island onwards it is possible to honorably return
		retreatribute: 0.2, //percentage tribute to the great Dolphin, ruler of ponds
	},

	//misc
	maxMessages: 20,
	maxReports: 10,
	backAchieve: 24*3600e3,
	dogePower: 6
};

const buildings = {
	radnice: {
		name: 'Radnice', img: 'radnice.png',
		maxLvl: 16, price: l => [0, expF(l,40,1.9,-20), expF(l,26,1.96,-80), 0, 0],
		f: l => expF(l,19.988,1.4,12), //optional custom function, in this case it's population, max with techs = 5000
		flavor: 'V srdci každého řeckého polis leží radnice, jejíž veřejné záchody slouží k ubytování dělného lidu. Čisté a moderní záchody jsou stěžejním prvkem našeho státu!'
	},
	skola: {
		name: 'Škola', img: 'skola.png',
		maxLvl: 16, price: l => [0, expF(l,30,1.7,-20), expF(l,20,1.75,-85), 0, 0],
		f: l => expF(l,2.224,1.3,3), //WP per cycle, max 200, max with techs 500
		flavor: 'Vědecký pokrok postupuje mílovými kroky v této špičkové vzdělávací instituci, aby byla naše společnost dovedena do zářné technokratické budoucnosti.'
	},
	pristav: {
		name: 'Přístav', img: 'pristav.png',
		maxLvl: 8, price: l => [0, expF(l,14,3), 0, 0, expF(l,2,4,-25)],
		flavor: 'Rušné obchodní středisko, kterým kupci z celého světa přivážejí rozmanité zboží.'
	},
	kasarna: {
		name: 'Kasárna', img: 'kasarna.png',
		maxLvl: 8, price: l => [0, expF(l,6.4,3.9,26), expF(l,3.79,4.3,-104), 0, 0],
		flavor: 'Z války se dá udělat výnosný byznys a přebyteční občané se rádi obětují pro vidinu slávy a kořisti. Či spíše budou muset.'
	},
	sklad: {
		name: 'Sklad', img: 'sklad.png',
		maxLvl: 16, price: l => [0, expF(l,75,1.6), expF(l,40,1.65,-67), 0, 0],
		f: l => expF(l,665.6894,1.62), //storage capacity
		flavor: 'Tyhle ohyzdné šedé krabice jsou podle expertů důležité pro ekonomiku, takže se s tím lidé budou muset nějak smířit.'
	},
	hospoda: {
		name: 'Hospoda', img: 'hospoda.png',
		maxLvl: 16, price: l => [0, expF(l,50,1.85,-21), expF(l,20,1.9,-39), 0, 0],
		f: l => expF(l,1.328,1.5,8), //max beer handout
		flavor: 'V podstatě státní výdejna piva, tedy budova zcela stěžejní pro správné fungování občanů v našem demokratickém státě.'
	},
	dilna: {
		name: 'Dílna', img: 'dilna.png',
		maxLvl: 8, price: l => [0, expF(l,77,3.2), expF(l,20,3.5,-75), 0, 0],
		flavor: 'Ateliér pro tvorbu znamenitých uměleckých skulptur, například dřevěných koní. Rozhodně se nejedná o válečný průmysl.'
	},
	zkusebna: {
		name: 'Zkušebna ohňostrojů', img: 'zkusebna.png',
		maxLvl: 8, price: l => [0, expF(l,25,3.5,200), 0, expF(l,11,4), 0],
		flavor: 'Vojenský výzkumný ústav pro velmi vědecké experimenty v oboru exotermických reakcí. Snad zase nevyletí do povětří.'
	},
	palac: {
		name: 'Palác', img: 'palac.png',
		maxLvl: 4, price: l => [expF(l,1929.012,6), expF(l,2065.3001,4.96), expF(l,520.6163,7), expF(l,190.5197,9), expF(l,85.37666,11)],
		flavor: 'Politické vedení musí mít dostatečně reprezentativní sídlo, jakým je právě toto z dotací postavené Holubí Hnízdo.'
	},
	muzeum: {
		name: 'Muzeum', img: 'muzeum.png',
		maxLvl: 16, price: l => [0, expF(l,204,1.7,200), expF(l,41.4,1.9,-20), 0, 0],
		flavor: 'Tato pokladnice kulturního bohatství uvědomí občany o přednostech naší civilizace a podpoří jejich vlastenecký zápal.'
	},
	kostel: {
		name: 'Kostel', img: 'kostel.png',
		maxLvl: 8, price: l => [expF(l,714,2.1,-650), expF(l,211,2.4), expF(l,28,3,-130), 0, 0],
		flavor: 'Naše zkorumpovaná církev sice obyvatele nezajímá, ale lze zde provádět okultní rituály a vyvolávat různé duchy.'
	}
};

const units = {
	/*
	'class': infantry, ranged, bomber, antibomber
	'train': which building? Training GUI directive in all buildings automatically infers which units are trained there
	'pop': cost in people
	'bonus': {kop: 0.6} means +60% attack bonus against 'kop'
	'actsAs': 'kop' means that bonuses against this unit will be as if it was 'kop'
	OPTIONAL 'effect': {arc: 'grayArc', splat: 'bloodSpatter'} (defaults) specifies graphical effect for ranged attack
	*/
	kop: {class:'infantry', img: 'kopinik.png', train: 'kasarna',
		name: 'Kopiník', flavor: 'Tupý branec z venkova ozbrojený klackem, vhodný jako kanonenfutr',
		price: [10, 10, 0, 0, 0], pop: 1,
		group: 50, att: 2, hp: 11,
		bonus: {sln: 0.3}
	},
	luk: {class: 'ranged', img: 'archys.png', train: 'kasarna',
		name: 'Lučištník', flavor: 'Pidlooký branec z venkova, který se občas trefí do nepřátelské armády',
		price: [20, 15, 0, 0, 0], pop: 1,
		group: 30, att: 3, hp: 9,
		bonus: {kop: 0.5, luk: 0.2, hop: 0.7, sln: 0.3, trj: -0.2}
	},
	hop: {class: 'infantry', img: 'hoplit.png', train: 'kasarna',
		name: 'Hoplit', flavor: 'Disciplinovaný voják v naleštěné uniformě je chloubou přehlídek',
		price: [60, 25, 0, 10, 0], pop: 1,
		group: 50, att: 5, hp: 20,
		bonus: {sln: 0.3}
	},
	sln: {class: 'infantry', img: 'slon.png', train: 'kasarna',
		name: 'Slon', flavor: 'Ty potvory sice nemají správný bojový zápal, fungují však jako živý štít',
		price: [450, 120, 0, 80, 0], pop: 3,
		group: 10, att: 9, hp: 140,
		bonus: {sln: 0.7}
	},
	trj: {class: 'infantry', img: 'trojan.png', train: 'dilna',
		name: 'Trojský kůň', flavor: 'Navenek vkusné umělecké dílo, uvnitř však číhají ozbrojení záškodníci',
		price: [600, 200, 0, 130, 0], pop: 4,
		group: 10, att: 16, hp: 85,
		bonus: {hop: 0.8}
	},
	obr: {class: 'infantry', img: 'steam.png', train: 'dilna',
		name: 'Parní kolos', flavor: 'Hromada pístů, pružin a čepelí s řachotem rozdupe vše před sebou',
		price: [1200, 400, 0, 350, 0], pop: 5,
		group: 10, att: 25, hp: 120,
		bonus: {kop: 0.5, luk: 0.2}
	},
	baz: {class: 'ranged', img: 'ohnostrojcik.png', train: 'zkusebna', effect: {arc: 'yellowArc', splat: 'explosion'},
		name: 'Ohňostrojčík', flavor: 'Šílený vědec, co se vydal experimentovat s výbušninami přímo do bitvy',
		price: [250, 10, 0, 100, 0], pop: 1,
		group: 10, att: 22, hp: 9,
		bonus: {sln: -0.2, trj: 0.3, obr: 0.4}
	},
	bal: {class: 'bomber', img: 'balon.png', train: 'dilna', effect: {arc: 'shitLine', splat: 'shitSplatter'},
		name: 'Balón', flavor: 'Plně naložen naplněnými nočníky, které neváhá vylít na hlavy nepřátel',
		price: [900, 40, 5, 150, 0], pop: 2,
		group: 10, att: 5, hp: 15, apparentAtt: () => s.p.powerBal ? 40 : 25,
		bonus: {kop: 3, luk: 2.5, hop: 5, sln: 2, trj: 4, obr: 5, baz: 0.5, bal: 0.5}
	},
	gyr: {class: 'antibomber', img: 'gyrokoptera.png', train: 'dilna',
		name: 'Gyrosář', flavor: 'Létající stánek s gyrosem je hrozivý vzdušný stroj s mnoha ostrými noži',
		price: [400, 50, 0, 80, 0], pop: 1,
		group: 10, att: 15, hp: 30
	},
//ODYSSEIA UNITS
	myth_min:    {class: 'infantry', img: 'odys/myth_min.png', name: 'Minotaur', group: 20, att: 9, hp: 58, bonus: {sln: 0.5}},
	myth_med:    {class: 'ranged', img: 'odys/myth_med.png', name: 'Medúza', group: 20, att: 5, hp: 21, actsAs: 'luk', bonus: {hop: 0.4}},
	myth_ker:    {class: 'infantry', img: 'odys/myth_ker.png', name: 'Kerberos', group: 33, att: 10, hp: 20, actsAs: 'kop', bonus: {kop: 0.3, luk: 0.3}},
	myth_hyd:    {class: 'infantry', img: 'odys/myth_hyd.png', name: 'Hydra', group: 1, att: 130, hp: 1700, actsAs: 'sln'},
	myth_pegas:  {class: 'antibomber', img: 'odys/myth_pegas.png', name: 'Pegas', group: 10, att: 11, hp: 41},

	cave_club:   {class: 'infantry', img: 'odys/cave_club.png', name: 'Lovec mamutů', group: 50, att: 7, hp: 15, trample: true, actsAs: 'sln'},
	cave_prase:  {class: 'infantry', img: 'odys/cave_prase.png', name: 'Muž na praseti', group: 10, att: 17, hp: 95, trample: true, actsAs: 'sln'},

	nazi_wehr:   {class: 'ranged', img: 'odys/nazi_wehr.png', name: 'Wehrmacht', group: 20, att: 7, hp: 18, actsAs: 'baz', bonus: {kop: 1, luk: 0.7, hop: 0.5, sln: 0.5}},
	nazi_moto:   {class: 'infantry', img: 'odys/nazi_moto.png', name: 'Sajdkára', group: 10, att: 22, hp: 88, actsAs: 'trj', bonus: {kop: 0.5, luk: 0.5, hop: 0.3}},
	nazi_hitler: {class: 'infantry', img: 'odys/nazi_hitler.png', name: 'Klon Hitlera', group: 1, att: 180, hp: 1300},
	nazi_stuka:  {class: 'bomber', img: 'odys/nazi_air.png', name: 'Štuka', group: 1, att: 70, hp: 340, effect: {arc: 'grayLine', splat: 'explosion'}, bonus: {trj: 1.5, obr: 2, gyr: 1.5, bal: 1.5}},

	ufo_trash:   {class: 'infantry', img: 'odys/ufo_trash.png', name: 'Vetřelec', group: 10, att: 12, hp: 60, actsAs: 'kop'},
	ufo_tank:    {class: 'infantry', img: 'odys/ufo_tank.png', name: 'Predátor', group: 10, att: 10, hp: 120, actsAs: 'sln'},
	ufo_ranged:  {class: 'ranged', img: 'odys/ufo_ranged.png', name: 'Narušitel', group: 10, att: 9, hp: 46, effect: {arc: 'cyanArc', splat: 'cyanSplatter'}, actsAs: 'luk', bonus: {trj: 0.4, obr: 0.6}},
	ufo_air:     {class: 'bomber', img: 'odys/ufo_air.png', name: 'Mateřská loď', group: 1, att: 100, hp: 550, effect: {arc: 'cyanLine', splat: 'cyanSplatter'}, bonus: {sln: 2.5, trj: 2, obr: 3}},

	undefined:   {class: 'infantry', img: 'odys/undefined.png', name: '$undefined', group: 999, att: 0.12, hp: 0.37},
};

//table of enemy armies - when you defeat enemy, you get resources multiplied by dranc and the next army is loaded
//the last army will simply get regenerated after defeat
//'ground' and 'air' means size of battlefield as number of rows for ground units and air units. MAX ground:6, air:2
const enemyArmies = [
	{ground: 1, air: 1, dranc: 20,   army: {kop: 1,    luk: 0,    hop: 0,    sln: 0,   trj: 0,   obr: 0,   baz: 0,   bal: 0,   gyr: 0}},
	{ground: 1, air: 1, dranc: 90,   army: {kop: 4,    luk: 1,    hop: 0,    sln: 0,   trj: 0,   obr: 0,   baz: 0,   bal: 0,   gyr: 0}},
	{ground: 1, air: 1, dranc: 200,  army: {kop: 12,   luk: 4,    hop: 2,    sln: 0,   trj: 0,   obr: 0,   baz: 0,   bal: 0,   gyr: 0}},
	{ground: 2, air: 1, dranc: 400,  army: {kop: 25,   luk: 15,   hop: 5,    sln: 1,   trj: 0,   obr: 0,   baz: 0,   bal: 0,   gyr: 0}},
	{ground: 2, air: 1, dranc: 800,  army: {kop: 50,   luk: 30,   hop: 10,   sln: 2,   trj: 0,   obr: 0,   baz: 0,   bal: 0,   gyr: 0}},
	{ground: 2, air: 1, dranc: 1500, army: {kop: 100,  luk: 60,   hop: 30,   sln: 5,   trj: 1,   obr: 0,   baz: 0,   bal: 0,   gyr: 0}},
	{ground: 3, air: 1, dranc: 2500, army: {kop: 150,  luk: 90,   hop: 50,   sln: 10,  trj: 3,   obr: 0,   baz: 0,   bal: 0,   gyr: 0}},
	{ground: 3, air: 1, dranc: 5000, army: {kop: 200,  luk: 150,  hop: 100,  sln: 15,  trj: 6,   obr: 0,   baz: 1,   bal: 0,   gyr: 0}},
	{ground: 3, air: 1, dranc: 1e4,  army: {kop: 300,  luk: 240,  hop: 200,  sln: 30,  trj: 10,  obr: 0,   baz: 5,   bal: 0,   gyr: 0}},
	{ground: 4, air: 1, dranc: 2e4,  army: {kop: 450,  luk: 360,  hop: 350,  sln: 60,  trj: 30,  obr: 1,   baz: 10,  bal: 0,   gyr: 0}},
	{ground: 4, air: 1, dranc: 4e4,  army: {kop: 650,  luk: 480,  hop: 600,  sln: 90,  trj: 60,  obr: 4,   baz: 30,  bal: 1,   gyr: 0}},
	{ground: 4, air: 1, dranc: 6e4,  army: {kop: 900,  luk: 720,  hop: 900,  sln: 120, trj: 100, obr: 10,  baz: 90,  bal: 10,  gyr: 1}},
	{ground: 5, air: 1, dranc: 12e4, army: {kop: 1200, luk: 900,  hop: 1200, sln: 160, trj: 140, obr: 30,  baz: 180, bal: 100, gyr: 30}},
	{ground: 5, air: 1, dranc: 25e4, army: {kop: 1500, luk: 1200, hop: 1600, sln: 300, trj: 250, obr: 100, baz: 400, bal: 300, gyr: 200}},
	{ground: 5, air: 2, dranc: 5e5,  army: {kop: 2000, luk: 2100, hop: 2500, sln: 600, trj: 550, obr: 200, baz: 800, bal: 700, gyr: 500}},
	{ground: 6, air: 2, dranc: 1e6,  army: {kop: 5000, luk: 3600, hop: 6000, sln: 1000,trj: 1000,obr: 500, baz: 1500,bal: 1500,gyr: 1200}}
];

//table of possible odyssey army sets, with planned composition of unit groups (number is weight), which will however be slightly randomized
const odyssets = {
	myth: {name: 'mythologické nestvůry', wt: 40, units: {'myth_min': 25, 'myth_med': 25, 'myth_ker': 30, 'myth_hyd': 8, 'myth_pegas': 12}},
	cavemen: {name: 'jeskynní muži', wt: 17, units: {'cave_club': 70, 'cave_prase': 30}},
	nazi: {name: 'náckové se strojem času', wt: 14, units: {'nazi_wehr': 45, 'nazi_moto': 32, 'nazi_hitler': 8, 'nazi_stuka': 15}},
	ufo: {name: 'vetřelci z hvězdných sfér', wt: 12, units: {'ufo_trash': 35, 'ufo_tank': 30, 'ufo_ranged': 25, 'ufo_air': 10}},
	mirror: {name: 'zrcadloví lidé', wt: 10, units: {kop: 10, luk: 12, hop: 12, sln: 10, trj: 10, obr: 5, baz: 15, bal: 9, gyr: 8}},
	undefined: {name: '{{$undefined}}', wt: 7, units: {'undefined': 1}}
};

//description is a function of kostel lvl
const miracles = {
	faust: {name: 'Faust, bůh kovárny',
		flavor: 'Olympský ocelář nám naostří zbraně, ačkoliv si za to nárokuje trochu kořisti.',
		description: l => `síla jednotek +${(l*consts.mir.faust1).toPercent()}, účinnost drancování -${(l*consts.mir.faust2).toPercent()}`
	},
	delfin: {name: 'Delfín, bůh koupání',
		flavor: 'Vládce všech rybníků pomáhá námořníkům v nesnázích a usnadňuje tak logistiku.',
		description: l => `účinnost obchodu +${(l*consts.mir.delfin).toPercent()}`
	},
	obr: {name: 'Obr, kolosální gigant',
		flavor: 'Tenhle velkej hoch celý dny jenom maká, nikdo neudělá tolik práce jako on.',
		description: l => `těžba všech surovin +${(l*consts.mir.obr).toPercent()}`
	},
	antena: {name: 'Palác Anténa, bohyně radiokomunikace',
		flavor: 'Moudrá ajťačka olympská má vždy skvělé vynálezy pro naše vědecké bádání.',
		description: l => `účinnost školství +${(l*consts.mir.antena).toPercent()}`
	},
	dmnt: {name: 'Dementér, bohyně hlupáků',
		flavor: 'Tato bohyně nadá naše obyvatele otupující demencí, takže jsou o něco blaženější.',
		description: l => `základ vygebenosti +${(l*consts.mir.dmnt1).toPercent()}, učinnost školství -${(l*consts.mir.dmnt2).toPercent()}`
	},
	apollo: {name: 'Apollo 11, bůh astrálních poutníků',
		flavor: 'Hvězdné putování je sice na nic, ale státní rozpočet dokáže vyluxovat až do dna.',
		description: l => `daňový výběr -${(l*consts.mir.apollo).toPercent()}`
	},
	had: {name: 'Had, bůh funebráků',
		flavor: 'Dělníci se flákají a vymlouvají se, že musí pořád chodit na různé pohřby.',
		description: l => `těžba všech surovin -${(l*consts.mir.had).toPercent()}`
	},
	helma: {name: 'pan Helma, bůh bez portfeje',
		flavor: 'Zcela neužitečný bůh, který svou naprostou zbytečností obyvatele akorát naštve.',
		description: l => `základ vygebenosti -${(l*consts.mir.helma).toPercent()}`
	}
};

//reward from odysseia
const relics = {
	helmet: {name: 'Přilba krále Leónida', img: 'spartahelmet.png', effect: 'cena jednotek -'+consts.rel.helmet.toPercent(),
		flavor: 'Odkaz tříset hrdinných reků spartských naplňuje naše ovčany vlasteneckou inspirací, aby se taky šli někde nechat povraždit.'},
	necro: {name: 'Necrocomicon', img: 'necrocomicon.png', effect: 'chrám o '+consts.rel.necro+' úrovně účinnější',
		flavor: 'Prokletá kniha pradávných bytostí chaosu, která obsahuje především dost podivný černý humor. To nám velice pomůže při našich zvrácených rituálech.'},
	eanasir: {name: 'Stížnost na Ea-Nasira', img: 'ea-nasir.png', effect: 'účinnost obchodu +'+consts.rel.eanasir.toPercent(),
		flavor: 'Do kamene tesaná reklamace má fakt odstrašující účinek na šejdíře prodávající nekvalitní měď. Nikdo nechce mít navždy zničenou reputaci jako Ea-Nasir!'},
	AoE2: {name: 'Relikvie z Doby Císařství', img: 'AoE2.png', effect: 'daňový výběr +'+consts.rel.AoE2.toPercent(),
		flavor: 'Na první pohled jenom zdobená skříňka, ale jak jsme ji přinesli dovnitř – zázrak! Začaly se z ní prostě odsypávat zlaťáky! Nyní veřejnosti nepřístupná...'},
	LotR: {name: 'Prsten Pána', img: 'LotR.png', effect: 'platy dělníků -'+consts.rel.LotR.toPercent(),
		flavor: 'Ultimátní artefakt moci, je na něm vyryto: "Jeden pán vládne všem, jeden jim makat káže, jeden všechny přivede, k lopatě je přiváže"'},
	hitler: {name: 'Hitlerův mozek v lahvi', img: 'brain.png', special: 'nazi', effect: 'síla jednotek +'+consts.rel.hitler.toPercent(),
		flavor: 'Válečníkům z budoucnosti propůjčilo jejich božstvo tento mozek, který neustále jen vztekle chrlí rozkazy a plamenné projevy. Parádní věcička na dobývání světa!'},
	venus: {name: 'Věstonická afrodita', img: 'venus.png', special: 'cavemen', effect: 'vygebenost +'+consts.rel.venus,
		flavor: 'Nezvratný důkaz, že ještě před neolitickou revolucí mělo lidstvo kozy.'},
	blackhole: {name: 'Černá díra', img: 'blackhole.png', special: 'ufo', effect: 'údržba města -'+consts.rel.blackhole.toPercent(),
		flavor: 'Velice atraktivní exponát. Je to taková zvláštní tma, která všechno vcucává a je přitom tak nenasytná, že může sežrat všechen náš komunální odpad!'},
	undefined: {name: 'undefined_$relic', img: 'undefinedRelic.png', special: 'undefined', effect: 'Please download at least 5 GB of RAM to fix this!',
		flavor: 'Error: undefined_$relic.effect is not a function'},
	mirror: {name: 'Dimenzionální zrcadlo', img: 'mirror.png', special: 'mirror', effect: 'účinnost školství +'+consts.rel.mirror.toPercent(),
		flavor: 'Kouzelné zrcátko umí překrucovat ksicht do pitoreskních podob, což je klíč k poznání reflexe duality hmotného jsoucna a stínu lidského ega. Poučné!'}
};

const achievements = {
//EARLY GAME
	budovani: {name: 'Budovatelské nadšení', description: 'postavit první budovu',
		flavor: 'Nejen radnicí je polis živ, a my nyní slavnostně otevíráme první novou budovu!'},
	IFLS: {name: 'I fucking love science', description: 'provést první výzkum',
		flavor: 'Heuréka! Naše badatelské snahy jsou korunovány prvním vědeckým úspěchem!'},
	GG: {name: 'GG', description: 'vyhrát první bitvu',
		flavor: 'Pwned & #rekt, n00b. Git gud, get a life and kill urself!'},
	pivo: {name: 'Orosená dvanáctka', description: 'narazit pívo na pípu',
		flavor: 'Zlatavé dědictví řeckých těžařů je nejlepší si vychutnat na prosluněné pláži.'},
//MIDGAME
	muzeum: {name: 'Ukončete výstup a nástup, dveře se zavírají', description: 'postavit muzeum',
		flavor: 'Příští stanice Můstek, přestup na linku B.'},
	trojan: {name: 'Inspirováno Odysseem', description: 'postavit trojského koně',
		flavor: 'Bohyně jiskrnooká, ctná Pallas, moudře poradila chrabrým synům achajským z žírných lánů Ithaky.'},
	zazrak: {name: 'Řecký panthenol', description: 'aktivovat zázrak',
		flavor: 'Který z nevyzpytatelných olympských bohů nás bude obtěžovat dnes?'},
	palac: {name: 'Řekněte čapíčapíčapíčapíčapí hnízdo', description: 'postavit palác',
		flavor: 'Je to kampaň a účelovka. Nic jsem nezpronevěřil, a ta částka taky nesouhlasí.'},
	indiana: {name: 'Indiana Jones', description: 'ukrást svatou relikvii',
		flavor: 'Archeologie bývala větší sranda, když to znamenalo vraždit hromady příšer.'},
//ENDGAME
	nuke: {name: 'Now we are all sons of bitches', description: 'použít zbraň hromadného ničení',
		flavor: 'Novoroční ohňostroje mění svět v kouřící ruiny. A taky plaší domácí mazlíčky!!!'},
	budoucnost: {name: 'My žijeme v roce ' + (new Date().getFullYear() + 1000).toFixed(0), description: 'vynalézt všechny výzkumy budoucnosti',
		flavor: 'Tak dlouho jsme se snažili dosáhnout utopických vizí zářných zítřků, a teď v té neuskutečnitelné budoucnosti konečně žijeme!'},
	carnage: {name: 'Blood for the Blood God', description: 'porazit Polis úrovně 16',
		flavor: 'Půda je nyní promáčená krví synů Řecka, kteří zcela zbytečně položili životy na poli válečném. Historie nikdy nezapomene na tato jatka.'},
	maxed: {name: 'Nepodceňujte online závislost', description: 'vylepšit všechny budovy na maximum',
		flavor: 'Tohle není normální.'},
//SECRET - nezobrazují se vůbec, než je hráč odemkne
	back: {secret: true, name: 'I\'LL BE BACK', description: 'vrátit se po 24 hodinách neaktivity',
		flavor: 'Ano, váš účet stále ještě existuje, ačkoliv v některých jiných hrách by již dávno mohl být smazán za neaktivitu!'},
	sparta: {secret: true, name: 'This is SPARTAAAAA!', description: 'prohrát bitvu pouze s hoplity',
		flavor: '300 naolejovaných svalnatců statečně čelí všem armádám světa a třeba i oslizlým ufonům z jiné dimenze - již bry i ve vašich amfiteátrech.'},
	blitz: {secret: true, name: 'Blitzkrieg', description: 'vyhrát bitvu pouze se stroji', //(trj, obr, bal, gyr)
		flavor: 'Válečný stroj naolejovaný olivovým olejem za sebou zanechá jen ruiny a mrtvoly!'},
	stack: {secret: true, name: 'Stack Overflow', description: 'naplnit sklad k prasknutí', //(všechny 4 suroviny)
		flavor: 'runtime error: out of memory'},
	exodus: {secret: true, name: 'Půlnoční království', description: 'vyvolat exodus obyvatel', //(obyvatelstvo <=0, vygebenost <= 0)
		flavor: 'Asociální politika dokázala z naší říše vystrnadit i ty nejservilnější občany.'},
	multi: {secret: true, name: 'Multifunkční středisko', description: 'nacpat čtyři budovy na jedno místo', //(na radnici dát tři ostatní budovy, aby ji překryly)
		flavor: 'Kdo vyhraje: pečlivě promyšlený urbanistický plán, nebo drag & drop?'},
	exec: {secret: true, name: 'Exekučně zabaveno', description: 'přivést stát ke krachu',
		flavor: 'Národní rozpočet je úplně rozkradený a ubozí občané jsou utiskováni exekuční mafií. Zlatý komunisti ciwe, tohle tenkrát nebylo!'},
	gambler: {secret: true, name: 'Gambler', description: 'aktivovat všechny bohy',
		flavor: 'Kámo vole puč mi love na bedny! Jenom jednu otočku, tentokrát to určitě klapne!'},
	relics: {secret: true, name: 'Gotta Catch \'Em All!', description: 'ukrást všechny relikvie',
		flavor: 'All relics have been captured. Hold them for 200 years to win!'},
	hacker: {secret: true, name: 'H A C K E R M A N', description: 'get_HACKER_achievement()',
		flavor: 'We are an anonymous function. We do not forgive invalid arguments. We do forget our scope. Expect our return value!'},
	ecozmrd: {secret: true, name: 'Ekonomičtí zmrdi', description: 'obchodovat při účinnosti větší než 100%',
		flavor: 'Poctivě se zbohatnout nedá, lepší je zneužít porouchanou herní mechaniku.'},
	ALL: {secret: true, name: 'Achievement whore', description: 'získat všechny achievementy',
		flavor: 'Gratuluji! Nyní už snad můžete hru v klidu opustit. Už se tu fakt nedá nic dělat.'}
};
