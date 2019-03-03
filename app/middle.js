let app = angular.module('UK', []);

app.controller('middle', function($scope, $interval) {
/* VIEW / CONTROLLER RELATED CODE */
	$scope.version = [0, 0, 0];
	$scope.support = [0, 0, 0];

	//USER SETTINGS - this whole object can be saved and loaded, contains all state variables of view/controller
	$scope.ctrl = {
		window: 'intro',
		tab: 'city',
		parentTab: 'city', //city or island
		zoom: 600
	};
	//zoom factor
	function zf() {return $scope.ctrl.zoom / 600};
	$scope.zoomOptions = [600, 900, 1200];

	//these won't be saved
	$scope.ctrl2 = {
		showBuildingList: false,
		generalView: true, //true = list of units, false = battle history
		beer: s.hospoda,
	};

	//s každou změnou bude potřeba provést digest, ale to by mělo jít celkem samo
	$scope.s = s;
	$scope.buildings = buildings;
	$scope.consts = consts;
	$scope.game = game;
	$scope.achs = achievements;
	$scope.units = units;
	$scope.miracles = miracles;

	//switch window, switch tab
	$scope.window = function(arg) {
		if($scope.ctrl.window === 'intro') {
			s.messages.push('Nejprve si přečtěte tutoriál a klikněte na tlačítko pokračovat.');return;
		}
		$scope.ctrl.window = arg;
	};
	$scope.tab = function(arg) {
		if(!arg) {$scope.ctrl.tab = $scope.ctrl.parentTab;return;}
		$scope.ctrl.tab = arg;
		$scope.ctrl2.showBuildingList = false;
		if(arg === 'city' || arg === 'island') {$scope.ctrl.parentTab = arg;}
	};

	//Angular ng-style definitions. The numeric values are just placeholders, they are overwritten by resize()
	$scope.style = {
		containerLeft: {'left': '100px'},
		containerHeight: {'height': '668px'},
		footer: {'top': '710px'},
		gameWidth: {'width': '600px'},
		gameHeight: {'height': '600px'},
		buildingList: {'max-height': '485px'},
		suroviny: {'max-width': '390px'},
		city:   {'background-image': 'url("res/env/CITY.png")'},
		island: {'background-image': 'url("res/env/ISLAND.png")'},
		battle: {'background-image': 'url("res/env/BATTLE.png")'},
		pilaBlink: {'animation': 'blinker 0.8s linear 2'}
	};

	//resource icons
	$scope.icons = consts.surAliases;

	//research stuff
	$scope.WPgroups = ['Eco', 'Pol', 'Wis', 'Arm'];
	$scope.WPgroupNames = ['Ekonomika', 'Politika', 'Vzdělávání', 'Armáda'];
	$scope.mineNames = ['', 'islandPila', 'islandKamen', 'islandSyra', 'islandPivo'];

	//merge multiple styles objects ('styles' array) in ng-style
	$scope.mergeStyles = function(styles) {
		let finalStyle = {};
		styles.forEach(function(s) {
			angular.extend(finalStyle, $scope.style[s]);
		});
		return finalStyle;
	};
	//shortcut to an often used combination of styles - screen & ALL its children have this (to manage overflow)
	$scope.screenStyle = () => $scope.mergeStyles(['gameWidth', 'gameHeight']);

	function getWindowDimensions() {
		return {
			height: window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight,
			width: window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth
		};
	};

	//resize and move the elements
	$scope.resize = function() {
		let dim = getWindowDimensions();
		
		//game width = game height
		let gw = $scope.ctrl.zoom; let gh = gw;
		
		//move the gameContainer div to center and specify container height
		let left = Math.floor(dim.width/2 - gw/2)
		$scope.style['containerLeft']['left'] = (left > 0 ? left : 0) + 'px';
		$scope.style['containerHeight']['height'] = (gh + 68) + 'px';

		//move footer
		$scope.style['footer']['top'] = (110 + gh) + 'px';

		//width & height of screen. These values are used in many places elsewhere!
		$scope.style['gameWidth']['width'] = gw + 'px';
		$scope.style['gameHeight']['height'] = gh + 'px';

		$scope.style['buildingList']['max-height'] = (gh - 120) + 'px';
		$scope.style['suroviny']['max-width'] = (gw - 210) + 'px';
	};

	//this is only triggered on game initiation, not on resize, that'd be annoying
	$scope.autoresize = function() {
		let dim = getWindowDimensions();
		$scope.zoomOptions.forEach(function(item) {
			if(
				item + 8  < dim.width && 
				item + 76 < dim.height &&
				item > $scope.ctrl.zoom
			) {$scope.ctrl.zoom = item;}
		});
		$scope.resize();
	};
	$scope.autoresize();

	//'i' is just an integer in this function
	$scope.getPopupStyle = function(i) {
		let dim = getWindowDimensions();
		let top = 200 + 7*i;
		let left = Math.floor(dim.width/2) - 230 + 7*i;
		return {'top': top + 'px', 'left': left + 'px'};
	};

	//generate ng-style for city buildings, 'b' is the building instance
	$scope.getBuildingStyle = function(b) {
		let t = Math.floor((50 + b.pos[0] - 32) * zf());
		let l = Math.floor((50 + b.pos[1] - 32) * zf());
		let w = Math.floor(64 * zf());
		return {'position': 'absolute', 'top': t + 'px', 'left': l + 'px', 'width': w + 'px', 'height': w + 'px'};
	};

	$scope.sortBuildings = function() {
		return s.build.sort(function(a, b) {
			if(!a.draggable) {return 1;}
			if(!b.draggable) {return 1;}
			return a.pos[0] - b.pos[0];
		});
	};

	//generate ng-style for island images, which are all static images, 'arg' specifies which one
	$scope.islandPos = function(arg) {
		//top, left, height, width
		const objectPositions = {
			plaz: [470, 292, 90, 180],
			pila: [365, 130, 64, 64],
			syra: [160, 180, 64, 64],
			pivo: [0, 500, 128, 96],
			myPolis: [150, 320, 200, 100],
			myPolisName: [240, 370, 0, 0],
			enemyPolis: [460, 140, 64, 64],
			enemyPolisName: [460, 150, 0, 0]
		};
		let pos = objectPositions[arg];
		return {'position': 'absolute',
			'top':    Math.round(pos[0]*zf()) + 'px',
			'left':   Math.round(pos[1]*zf()) + 'px',
			'height': Math.round(pos[2]*zf()) + 'px',
			'width':  Math.round(pos[3]*zf()) + 'px'
		};
	};

	//specific style - blink islandPila if it hasn't been visited yet
	$scope.styleislandPila = () => s.singleUse.visitedPila ? $scope.islandPos('pila') : angular.extend($scope.islandPos('pila'), $scope.style.pilaBlink);

	//demonstrate a multiplication
	$scope.demMulti = function(fixd, perc) {
		let fixdStr = fixd.map(item => item.toFixed(0));
		let percStr = perc.map(item => item.toPercent());
		return fixdStr.concat(percStr).join(' · ') + ' = ' +  fixd.concat(perc).reduce((prod, i) => prod*i).withSign();
	}

	//allow multiline messages - a message is either a string, or an array, so parseMessage turns strings to arrays
	$scope.parseMessage = m => (typeof m === 'string' ? [m] : m);

	//listen for Esc key press
	$scope.listen4Esc = function(event) {
		if(event.keyCode === 27 || event.key === 'Escape') {
			if(s.messages.length > 0) {s.messages.pop();return;}
			if($scope.ctrl.window === 'intro') {return;}
			$scope.ctrl.window = 'game';
			$scope.ctrl.tab = $scope.ctrl.parentTab;
			$scope.ctrl2.showBuildingList = false;
		}
	};





/*GAME RELEATED CODE*/
	$scope.initGame = function() {
		$scope.ctrl.window = 'game';
		$scope.intervalHandle = $interval(function() {
			game.tick();
		}, consts.dt);
	};

	//try to access mines
	$scope.accessMine = function(arg) {
		if(arg === '') {}
		else if(arg === 'islandPila') {
			s.singleUse.visitedPila = true;
			$scope.tab(arg);
		}
		else if(s.p.unlockLuxus) {$scope.tab(arg);}
		else{s.messages.push('Nejprve bude nutné tyto prapodivné věci vědecky popsat, než je budeme moci využít!');}
	};

	//substract owned buildings from available = what can be built
	$scope.getAvailableBuild = function() {
		let available = [];
		let owned = s.build.map(item => item.id);
		let unlocked = s.p.unlockBuild;
		for(let item of unlocked) {
			if(owned.indexOf(item) === -1) {
				available.push(item);
			}
		}
		return available;
	};

	//'key' refers to a building data object
	$scope.buyBuilding = function(key) {
		$scope.ctrl2.showBuildingList = false;
		game.buyBuilding(key)
	};

	//executed from the outside - from drag object
	$scope.moveBuilding = function(i, dx, dy) {
		let b = s.build[i];
		if(!b) {return;}
		if(!b.draggable) {return;} //this shouldn't happen but sometimes it does. WTF?
		b.pos[0] += dy/zf();
		b.pos[1] += dx/zf();
		b.pos = b.pos.map(a => (a > 468 ? 468 : (a < 32 ? 32 : a)));//lol xD
	};

	//get available researches in a certain class (from Eco, Pol, Wis, Arm)
	$scope.getAvailableWis = function(c) {
		return research.filter(function(item) {
			//filter only the specific class
			if(item.class !== c) {return false;}
			//filter out the already researched
			if(s.research.indexOf(item.id) > -1) {return false;}
			//filter only those with all requirements met
			for(let req of item.reqs) {
				if(s.research.indexOf(req) === -1) {return false;}
			}
			return true;
		});
	};

	//listen to onchange for distribution slider
	$scope.distributeBeer = function() {
		s.hospoda = $scope.ctrl2.beer;
		game.achieve('pivo');
	};

	//choose a new name for city (with a predefined suggestion)
	$scope.renameCity = function() {
		let suggestion = (s.name === 'Polis') ? 'Prdelopolis' : s.name;
		let newName = prompt('Zadejte nový název:', suggestion);
		if(!newName || !newName.trim()) {return;}
		newName = newName.trim();
		if(newName.length > 16) {
			s.messages.push('Název nesmí být delší než 16 znaků, jinak bychom utratili majlant za nové cedule!');
			return;
		}
		s.name = newName;
	};

	//is s.sur[i] in overflow? -> display blinking warning. Gold is never in overflow (i = 1)
	$scope.isOverflow = function(i) {
		return (i !== 0) ? (s.sur[i] >= game.storage()) : false;
	};

	//how many achievements are there in total - but only: all non-secret + already unlocked secret
	$scope.getAchievementCount = function() {
		let keys = Object.keys(achievements);
		let secret = keys.filter(item => achievements[item].secret);
		let secretUnlocked = secret.filter(item => s.achievements.indexOf(item) > -1);
		return keys.length - secret.length + secretUnlocked.length;
	};

	//to do list: achievements that are non-secret and not yet unlocked
	$scope.getAchievementGoals = function() {
		return Object.keys(achievements)
			.filter(item => !achievements[item].secret)
			.filter(item => s.achievements.indexOf(item) === -1)
			.map(item => achievements[item].description);
	}
});
