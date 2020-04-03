//STATE object factory
const S = () => ({
	//set to true when game is initialized
	running: false,
	//version of this save, for compatibility purposes
	version: game.version,

	//user settings - contains all state variables of view/controller (this object is shared between S and $scope)
	ctrl: {
		window: 'intro',
		tab: 'city',
		parentTab: 'city', //city or island
		zoom: 600,
		showBuildingList: false,
		drawBattleGrid: false
	},

	//current state of tooltip
	tooltip: {
		visible: false,
		style: {'top': '0px', 'left': '0px'}, //numeric values are just placeholders
		message: ''
	},


	timestampInit: Date.now(), //start of application
	timestamp: Date.now(),     //last game cycle
	warstamp: Date.now(),      //last war stroke
	iteration: 0,     //game cycle count
	timestampFounded: Date.now(), //when was the town founded

	//display name of town, purely cosmetic
	name: 'Polis',

	//current popups, displayed from last to first. Each message is an array of strings, with each string representing one line
	messages: [],

	//prachy, dřevo, kameny, sýra, pivo
	pop: [10, 0, 0, 0, 0],
	sur: [250, 250, 50, 50, 50],

	//kolekce budov
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
		unlockNuke: false,
		unlockDoge: false
	},

	WP: 0, //výzkumné body
	research: [], //array of IDs of researched techs

	//id zázraku (např. 'delfin') a počet zbývajících cyklů zázraku, resp. do další možné aktivace
	miracle: false,
	mirCountdown: 0,
	mirCooldown: 0,
	mirsReceived: [],//miracles that have been activated (-> achievement)


	//WAR RELATED STUFF
	army:  {kop: 0, luk: 0, hop: 0, sln: 0, trj: 0, obr: 0, baz: 0, bal: 0, gyr: 0},
	armyE: angular.copy(enemyArmies[0].army), //currently remaining enemy army
	enemyLevel: 0, //index of enemyArmies
	battlefield: false,
	battleReports: [],
	ownNuke: false,
	nukeCooldown: 0,

	achievements: [],
	//'false' variables that are set to 'true' once, at some point during game as a warning / tutorial
	singleUse: {
		visitedPila: false, //visit islandPila for the 1st time. Until then it will blink to attract player's attention
		visitedRadnice: false, //visit Radnice for the 1st time to display popup
		warnPopLimit: false, //population has reached limit
		warnOverflow: false, //storage capacity overflown
		warnUnhappy: false //negative happiness
	}
});

//initiate an instance of S
let s = S();
