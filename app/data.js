// generické kostnaty
const consts = {
	dt: 1e4, //duration of one cycle [ms]
	dtw: 1e3, //duration of one battle stroke [ms]
	//aliases for resources
	surAliases: ['zlato', 'drevo', 'kamen', 'syra', 'pivo'],
	surFullDescription: [{id: 'drevo', name: 'Dřevo'}, {id: 'kamen', name: 'Kamení'}, {id: 'syra', name: 'Sýra'}, {id: 'pivo', name: 'Pivo'}],
	baseRateWP: 4, //základní rychlost výzkumu, škola posiluje
	tax: 3, //base money gain per taxpayer
	wage: 3, //base money loss per worker
	baseSklad: 1e3,

	mirCountdown: 8, //duration of miracle
	mirCooldown: 16, //base value of waiting time for new miracle
	mirPrice: {pop: 13, zlato: 666},

	nukeCooldown: 16, //base value of waiting time for new nuke
	nukePrice: [1e4, 0, 0, 1e4, 0], //as sur

	//which units are aerial / terrestrial. In this order they will be rendered on battlefield
	skyUnits: ['bal', 'gyr'],
	groundUnits: ['kop', 'hop', 'luk', 'baz', 'sln', 'trj', 'obr'],

	//misc
	carnageAchieve: 100
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
		f: l => expF(l,677.0845,1.6), //storage capacity
		flavor: 'Tyhle ohyzdné šedé krabice jsou podle expertů důležité pro ekonomiku, takže se s tím lidé budou muset nějak smířit.'
	},
	hospoda: {
		name: 'Hospoda', img: 'hospoda.png',
		maxLvl: 16, price: l => [0, expF(l,50,1.85,-21), expF(l,20,1.9,-39), 0, 0],
		f: l => expF(l,1.328,1.5,8), //max pivní výdej
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
	'bonus': {kop: 0.6} means 60% attack bonus against 'kop'
	*/
	kop: {class:'infantry', img: 'kopinik.png', train: 'kasarna',
		name: 'Kopiník', flavor: 'Tupý branec z venkova ozbrojený klackem, vhodný jako kanonenfutr',
		price: [5, 10, 0, 0, 0], pop: 1,
		group: 50, att: 2, hp: 10,
		bonus: {}
	},
	luk: {class: 'ranged', img: 'archys.png', train: 'kasarna',
		name: 'Lučištník', flavor: 'Pidlooký branec z venkova, který se občas i trefí do nepřátelské armády',
		price: [10, 15, 0, 0, 0], pop: 1,
		group: 30, att: 3, hp: 8,
		bonus: {trj: -0.3, obr: -0.2, hop: 0.2}
	},
	hop: {class: 'infantry', img: 'hoplit.png', train: 'kasarna',
		name: 'Hoplit', flavor: 'Disciplinovaný voják v naleštěné uniformě je chloubou přehlídek',
		price: [40, 30, 0, 10, 0], pop: 1,
		group: 50, att: 5, hp: 18,
		bonus: {}
	},
	sln: {class: 'infantry', img: 'slon.png', train: 'kasarna',
		name: 'Slon', flavor: 'Tato obluda se sice nevrhá do bitevní vřavy, funguje však jako živý štít',
		price: [450, 180, 0, 100, 0], pop: 3,
		group: 10, att: 8, hp: 120,
		bonus: {}
	},
	trj: {class: 'infantry', img: 'trojan.png', train: 'dilna',
		name: 'Trojský kůň', flavor: 'Navenek vkusné umělecké dílo, uvnitř však číhají ozbrojení záškodníci',
		price: [600, 240, 0, 120, 0], pop: 4,
		group: 10, att: 16, hp: 70,
		bonus: {hop: 0.3}
	},
	obr: {class: 'infantry', img: 'steam.png', train: 'dilna',
		name: 'Parní kolos', flavor: 'Hromada pístů, pružin a čepelí s řachotem rozdupe všechno před sebou',
		price: [1250, 500, 0, 250, 0], pop: 5,
		group: 10, att: 20, hp: 100,
		bonus: {}
	},
	baz: {class: 'ranged', img: 'ohnostrojcik.png', train: 'zkusebna',
		name: 'Ohňostrojčík', flavor: 'Šílený vědec, co se vydal experimentovat s výbušninami přímo do bitvy',
		price: [200, 10, 0, 70, 0], pop: 1,
		group: 10, att: 19, hp: 7,
		bonus: {sln: -0.2, trj: 0.3, obr: 0.4}
	},
	bal: {class: 'bomber', img: 'balon.png', train: 'dilna',
		name: 'Balón', flavor: 'Plně naložen naplněnými nočníky, které neváhá vylít na hlavy nepřátel',
		price: [750, 40, 5, 120, 0], pop: 2,
		group: 10, att: 5, hp: 15,
		bonus: {kop: 3, luk: 3, hop: 5, sln: 2, trj: 5, obr: 5, baz: 0.2, bal: 0.5}
	},
	gyr: {class: 'antibomber', img: 'gyrokoptera.png', train: 'dilna',
		name: 'Gyrosář', flavor: 'Létající stánek s gyrosem je hrozivý vzdušný stroj obsypaný ostrými noži',
		price: [400, 60, 0, 90, 0], pop: 1,
		group: 10, att: 20, hp: 30,
		bonus: {}
	}
};

//table of enemy armies - when you defeat enemy, you get resources multiplied by dranc and the next army. Rows means size of battlefield = [1,3,5,7]
//the last army will get continuous reinforcements - numbers will reset after every turn
let enemyArmies = [		
	{rows: 1, dranc: 20,  army: {kop: 1,    luk: 0,    hop: 0,    sln: 0,   trj: 0,   obr: 0,   baz: 0,   bal: 0,   gyr: 0}},
	{rows: 1, dranc: 50,  army: {kop: 5,    luk: 1,    hop: 0,    sln: 0,   trj: 0,   obr: 0,   baz: 0,   bal: 0,   gyr: 0}},
	{rows: 1, dranc: 150, army: {kop: 20,   luk: 5,    hop: 3,    sln: 0,   trj: 0,   obr: 0,   baz: 0,   bal: 0,   gyr: 0}},
	{rows: 2, dranc: 500, army: {kop: 50,   luk: 30,   hop: 10,   sln: 1,   trj: 0,   obr: 0,   baz: 0,   bal: 0,   gyr: 0}},
	{rows: 2, dranc: 1e3, army: {kop: 100,  luk: 60,   hop: 50,   sln: 4,   trj: 1,   obr: 0,   baz: 0,   bal: 0,   gyr: 0}},
	{rows: 3, dranc: 2e3, army: {kop: 200,  luk: 120,  hop: 100,  sln: 10,  trj: 3,   obr: 0,   baz: 10,  bal: 0,   gyr: 0}},
	{rows: 3, dranc: 5e3, army: {kop: 350,  luk: 240,  hop: 200,  sln: 30,  trj: 10,  obr: 0,   baz: 50,  bal: 5,   gyr: 0}},
	{rows: 4, dranc: 1e4, army: {kop: 500,  luk: 420,  hop: 400,  sln: 60,  trj: 50,  obr: 0,   baz: 100, bal: 50,  gyr: 10}},
	{rows: 4, dranc: 2e4, army: {kop: 1000, luk: 750,  hop: 800,  sln: 120, trj: 100, obr: 10,  baz: 200, bal: 80,  gyr: 60}},
	{rows: 5, dranc: 5e4, army: {kop: 1500, luk: 1050, hop: 1500, sln: 250, trj: 200, obr: 100, baz: 400, bal: 150, gyr: 150}},
	{rows: 5, dranc: 5e4, army: {kop: 1500, luk: 1050, hop: 1500, sln: 250, trj: 200, obr: 100, baz: 400, bal: 150, gyr: 150}}
	//max rows = 5
];

//description is a function of kostel lvl
const miracles = {
	faust: {name: 'Faust, bůh kovárny',
		flavor: 'Olympský ocelář nám naostří zbraně, ačkoliv si za to nárokuje trochu kořisti',
		description: l => `síla jednotek +${(l*0.10).toPercent()}, účinnost drancování -${(l*0.05).toPercent()}`
	},
	delfin: {name: 'Delfín, bůh koupání',
		flavor: 'Vládce všech rybníků pomáhá námořníkům v nesnázích a usnadňuje tak logistiku',
		description: l => `účinnost obchodu +${(l*0.05).toPercent()}`
	},
	obr: {name: 'Obr, kolosální gigant',
		flavor: 'Tenhle velkej hoch celý dny jenom maká, nikdo neudělá tolik práce jako on',
		description: l => `těžba všech surovin +${(l*0.10).toPercent()}`
	},
	antena: {name: 'Palác Anténa, bohyně radiokomunikace',
		flavor: 'Moudrá ajťačka olympská má vždy skvělé vynálezy pro naše vědecké bádání',
		description: l => `účinnost školství +${(l*0.20).toPercent()}`
	},
	dmnt: {name: 'Dementér, bohyně hlupáků',
		flavor: 'Tato bohyně nadá naše obyvatele otupující demencí, takže jsou o něco blaženější',
		description: l => `základ vygebenosti +${(l*0.10).toPercent()}, učinnost školství -${(l*0.10).toPercent()}`
	},
	apollo: {name: 'Apollo 11, bůh astrálních poutníků',
		flavor: 'Hvězdné putování je sice k ničemu, ale státní rozpočet dokáže vyluxovat až do dna',
		description: l => `daňový výběr -${(l*0.10).toPercent()}`
	},
	had: {name: 'Had, bůh hrobníků',
		flavor: 'Dělníci se flákají a vymlouvají se, že musí pořád chodit na různé pohřby',
		description: l => `těžba všech surovin -${(l*0.10).toPercent()}`
	},
	helma: {name: 'pan Helma, bůh bez portfeje',
		flavor: 'Zcela neužitečný bůh, který svou naprostou zbytečností obyvatele akorát naštve',
		description: l => `základ vygebenosti -${(l*0.20).toPercent()}`
	}
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
	trojan: {name: 'Inspirováno Odysseem', description: 'postavit trojského koně',
		flavor: 'Bohyně jiskrnooká, ctná Pallas, moudře poradila chrabrým synům achajským z žírných lánů Ithaky.'},
	palac: {name: 'Řekněte čapíčapíčapíčapíčapí hnízdo', description: 'postavit palác',
		flavor: 'Je to jen kampaň a účelovka. Nic jsem nezpronevěřil a ta částka taky nesouhlasí.'},
	zazrak: {name: 'Řecký panthenol', description: 'aktivovat zázrak',
		flavor: 'Který z nevyzpytatelných olympských bohů nás bude obtěžovat dnes?'},
	muzeum: {name: 'Ukončete výstup a nástup, dveře se zavírají', description: 'postavit muzeum',
		flavor: 'Příští stanice Můstek, přestup na linku B.'},
//ENDGAME
	carnage: {name: 'Blood for the Blood God', description: 'vést bitvu ' + consts.carnageAchieve + ' kol v kuse',
		flavor: 'Půda je nyní promáčená krví synů Řecka, kteří zcela zbytečně položili životy na poli válečném. Historie nikdy nezapomene na tato jatka.'},
nuke: {name: 'Now we are all sons of bitches', description: 'použít zbraň hromadného ničení',
		flavor: 'Novoroční ohňostroje mění svět v kouřící ruiny. A taky plaší domácí mazlíčky!!!'},
	budoucnost: {name: 'My žijeme v roce 3019', description: 'vynalézt všechny výzkumy',
		flavor: 'Tak dlouho jsme se snažili dosáhnout utopických vizí zářných zítřků, a teď v té neuskutečnitelné budoucnosti konečně žijeme!'},
	maxed: {name: 'Nepodceňujte online závislost', description: 'vylepšit všechny budovy na maximum',
		flavor: 'Tohle není normální.'},
//SECRET - nezobrazují se vůbec, než je hráč odemkne
sparta: {secret: true, name: 'This is SPARTAAAAA!', description: 'prohrát bitvu pouze s hoplity',
		flavor: '300 naolejovaných svalnatců statečně čelí všem armádám světa a třeba i oslizlým ufonům z jiné dimenze - již bry i ve vašich amfiteátrech.'},
blitz: {secret: true, name: 'Blitzkrieg', description: 'vyhrát bitvu pouze se stroji', //(trj, obr, bal, gyr)
		flavor: 'Válečný stroj naolejovaný olivovým olejem za sebou zanechá jen ruiny a mrtvoly!'},
	stack: {secret: true, name: 'Stack Overflow', description: 'naplnit sklad k prasknutí', //(všechny 4 suroviny)
		flavor: 'runtime error: out of memory'},
	exodus: {secret: true, name: 'Půlnoční království', description: 'vyvolat exodus obyvatel', //(obyvatelstvo <=0, vygebenost <= 0)
		flavor: 'Asociální politika dokázala z naší říše vystrnadit i ty nejservilnější občany.'},
multi: {secret: true, name: 'Multifunkční středisko', description: 'nacpat všechny budovy na jedno místo', //(všechny budovy, co mám (ale alespoň 3), dát na radnici, aby ji překryly)
		flavor: 'Kdo vyhraje: pečlivě promyšlený urbanistický plán, nebo drag & drop?'},
	exec: {secret: true, name: 'Exekučně zabaveno', description: 'přivést stát ke krachu',
		flavor: 'Národní rozpočet je úplně rozkradený a ubozí občané jsou utiskováni exekuční mafií. Zlatý komunisti ciwe, tohle tenkrát nebylo!'},
	gambler: {secret: true, name: 'Gambler', description: 'aktivovat všechny bohy',
		flavor: 'Kámo vole puč mi love na bedny! Jenom jednu otočku - tentokrát to určitě klapne!'},
	hacker: {secret: true, name: 'H A C K E R M A N', description: 'get_HACKER_achievement()',
		flavor: 'We are an anonymous function. We do not forgive invalid arguments. We do forget our scope. Expect our return value!'},
	ecozmrd: {secret: true, name: 'Ekonomičtí zmrdi', description: 'obchodovat při účinnosti větší než 100%',
		flavor: 'Poctivě se zbohatnout nedá, lepší je zneužít porouchanou herní mechaniku.'},
	ALL: {secret: true, name: 'Achievement whore', description: 'získat všechny achievementy',
		flavor: 'Gratuluji! Nyní už snad můžete hru v klidu opustit. Už se tu fakt nedá nic dělat.'}
};
