let app = angular.module('UK', []);

app.controller('middle', function($scope, $interval) {
/* VIEW / CONTROLLER RELATED CODE */
	//current version of this build & last supported version (savegame compatibility)
	$scope.version = game.version;

	//USER SETTINGS - contains all state variables of view/controller
	$scope.ctrl = s.ctrl; //this object is shared between S and $scope, the settings is saved
	$scope.ctrl2 = {}; //this object exist only in $scope and is not saved. Properties will be populated on the go

	//zoom factor
	function zf() {return $scope.ctrl.zoom / 600;}
	$scope.zoomOptions = [600, 900, 1200];

	$scope.s = s;
	$scope.buildings = buildings;
	$scope.consts = consts;
	$scope.game = game;
	$scope.achs = achievements;
	$scope.units = units;
	$scope.miracles = miracles;
	$scope.relics = relics;
	$scope.odyssets = odyssets;

	//switch window, switch tab
	$scope.window = function(arg) {
		if($scope.ctrl.window === 'intro') {
			game.msg('Nejprve si přečtěte tutoriál a klikněte na tlačítko pokračovat.');return;
		}
		$scope.ctrl.window = arg;
		$scope.tab();
	};
	$scope.tab = function(arg) {
		const parentTab = ($scope.ctrl.tab === 'battle') ? (s.odys.wave > 0 ? 'islandOdysseia' : 'islandPolis') : $scope.ctrl.parentTab;
		if(!arg) {$scope.ctrl.tab = parentTab; return;}
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
		pilaBlink: {'animation': 'blinker 0.8s linear 2'}
	};

	//resource icons
	$scope.icons = consts.surAliases;

	//research stuff
	$scope.WPgroups = ['Eco', 'Pol', 'Wis', 'Arm'];
	$scope.WPgroupNames = ['Ekonomika', 'Politika', 'Vzdělávání', 'Armáda'];

	//tab addresses to be opened when you click on resources in top bar and their tooltips
	$scope.mineNames = ['advisorEco', 'islandPila', 'islandKamen', 'islandSyra', 'islandPivo'];
	$scope.surNames = ['zlato', 'dřevo', 'kamení', 'sýra', 'pivo'];

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
	}

	//resize and move the elements
	$scope.resize = function() {
		let dim = getWindowDimensions();

		//game width = game height
		let gw = $scope.ctrl.zoom; let gh = gw;

		//move the gameContainer div to center and specify container height
		let left = Math.floor(dim.width/2 - gw/2);
		$scope.style['containerLeft']['left'] = (left > 0 ? left : 0) + 'px';
		$scope.style['containerHeight']['height'] = (gh + 68) + 'px';

		//move footer
		$scope.style['footer']['top'] = (110 + gh) + 'px';

		//width & height of screen. These values are used in many places elsewhere!
		$scope.style['gameWidth']['width'] = gw + 'px';
		$scope.style['gameHeight']['height'] = gh + 'px';

		$scope.style['buildingList']['max-height'] = (gh - 160) + 'px';
		$scope.style['suroviny']['max-width'] = (gw - 210) + 'px';
	};

	//this is only triggered on game initiation, not on resize, that'd be annoying
	function autoresize() {
		let dim = getWindowDimensions();
		$scope.zoomOptions.forEach(function(item) {
			if(
				item + 8  < dim.width &&
				item + 76 < dim.height &&
				item > $scope.ctrl.zoom
			) {$scope.ctrl.zoom = item;}
		});
		$scope.resize();
	}
	autoresize();

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

	//return array of buildings sorted ascending by their y position
	$scope.sortBuildings = function() {
		return s.build.sort(function(a, b) {
			//non-draggable buildings are always on top
			if(!a.draggable) {return -1;}
			if(!b.draggable) {return 1;}
			return a.pos[0] - b.pos[0];
		});
	};

	//current state of dragging: pixel coordinates, building coordinates, building reference
	let drag = {startX: 0, startY: 0, startPosX: 0, startPosY: 0, b: false};

	//event listener for move mouse on the entire body. Acts only when a building is dragged
	$scope.mouseMove = function(event) {
		if(!drag.b || !drag.b.draggable) {return;}
		//calculate total movement vector in pixels
		let dx = event.clientX - drag.startX;
		let dy = event.clientY - drag.startY;
		//transform pixel vector to building coordinates
		drag.b.pos[0] = drag.startPosY + dy/zf();
		drag.b.pos[1] = drag.startPosX + dx/zf();
		//apply coordinate constraints
		let min = 32; //TODO other draggable objects?
		let max = 468;
		drag.b.pos = drag.b.pos.map(a => (a > max ? max : (a < min ? min : a)));
	}

	//event listener for move mouse on the entire body - finishes dragging and can click on the building
	$scope.mouseUp = function(event) {
		if(!drag.b) {return;}
		//evaluate whether the dragging was short enough to qualify as a click
		//if click lasted less than 300 ms and less than 10 pixels was traveled, then open the building tab
		let comp = (a,b) => Math.abs(a-b) < 10;
		if(Date.now() - drag.clickStart < 300 &&
			comp(drag.startX, event.clientX) && comp(drag.startY, event.clientY)
		) {
			$scope.tab(drag.b.id);
			s.hasOwnProperty('tooltip') && (s.tooltip.visible = false);
			if(drag.b.id === 'radnice' && !s.singleUse.visitedRadnice) {
				s.singleUse.visitedRadnice = true;
				let msg = ['Toto je vaše první budova!', 'Radnice určuje maximální populaci města, jejím vylepšením populační limit zvýšíte.'];
				(s.build.length === 1) && msg.push('Ve městě pak můžete pomocí tlačítka BUDOVAT postavit další budovy s rozličnými funkcemi.');
				game.msg(msg);
			}
		}
		//finish dragging
		drag.b = false;
		game.checkAchievement.multi();
	}

	//event listener for mouse down on building element - starts dragging
	$scope.buildingMouseDown = function(event, b) {
		event.preventDefault();
		drag.b = b;
		drag.startX = event.clientX;
		drag.startY = event.clientY;
		drag.startPosY = b.pos[0];
		drag.startPosX = b.pos[1];
		drag.clickStart = Date.now();
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
			myPolisName: [240, 370, 0, 220],
			enemyPolis: [460, 150, 64, 64],
			enemyPolisName: [460, 150, 0, 100],
			odysseia: [0, 0, 80, 200]
		};
		let pos = objectPositions[arg];
		return {'position': 'absolute',
			'transform': (s.name.toLowerCase() === 'dinnerbone' && arg === 'myPolis') ? 'rotate(180deg)' : 'none',
			'top':    Math.round(pos[0]*zf()) + 'px',
			'left':   Math.round(pos[1]*zf()) + 'px',
			'height': Math.round(pos[2]*zf()) + 'px',
			'width':  Math.round(pos[3]*zf()) + 'px'
		};
	};

	//number of icon for player's polis on island view
	$scope.polisIcon = () => Math.ceil(game.getBlvl('radnice')/4);

	//specific style - blink islandPila if it hasn't been visited yet
	$scope.styleislandPila = () => s.singleUse.visitedPila ? $scope.islandPos('pila') : angular.extend($scope.islandPos('pila'), $scope.style.pilaBlink);

	//demonstrate a multiplication
	$scope.demMulti = function(fixd, perc) {
		let fixdStr = fixd.map(item => item.toFixed(0));
		let percStr = perc.map(item => item.toPercent());
		return fixdStr.concat(percStr).join(' · ') + ' = ' +  fixd.concat(perc).reduce((prod, i) => prod*i).withSign();
	};

	//event listener for 'Esc' key press on the entire body
	$scope.listen4Esc = function(event) {
		if(event.keyCode === 27 || event.key === 'Escape') {
			//close popup
			if(s.messages.length > 0) {
				s.messages.pop();
				s.hasOwnProperty('tooltip') && (s.tooltip.visible = false);
				return;
			}
			//prevent if still in first intro
			if($scope.ctrl.window === 'intro') {return;}
			//switch window if in another window
			if($scope.ctrl.window !== 'game') {$scope.ctrl.window = 'game'; return;}
			//default behavior - switch tab
			$scope.tab();
			$scope.ctrl2.showBuildingList = false;
		}
		//well yeh it's also for delete. Sue me!
		if(event.keyCode === 46 || event.key === 'Delete') {
			s.messages = [];
			s.hasOwnProperty('tooltip') && (s.tooltip.visible = false);
		}
	};





/*GAME RELEATED CODE*/
	//this will be executed every cycle
	function tick() {
		//increment timestamp and do tick
		s.timestamp += consts.dt;
		game.tick();

		//account for lags
		let n  = Math.floor((Date.now() - s.timestamp) / consts.dt);
		for(let i = 0; i < n; i++) {
			s.timestamp += consts.dt;
			game.tick();
		}

		//finish
		saveService.save();
	}

	//this will be executed every war stroke - calls link function in war directive
	function tickWar() {
		//increment timestamp and do tick
		s.warstamp += consts.dtw;
		s.battlefield && game.war.stroke();

		//account for lags
		let nw = Math.floor((Date.now() - s.warstamp) / consts.dtw);
		for(let i = 0; i < nw; i++) {
			s.warstamp += consts.dtw;
			s.battlefield && game.war.stroke();
		}

		//finish
		s.battlefield && $scope.$broadcast('renderWar');
	}

	//the game will start after pressing a button in intro screen or when a savegame is loaded
	$scope.initGame = function() {
		s.running = true;
		s.timestampInit = s.timestamp = s.warstamp = Date.now();
		$scope.ctrl.window = 'game';
		$scope.ctrl.tab === 'battle' && $scope.tab();

		$scope.intervalHandle = $interval(tick, consts.dt);
		$scope.intervalHandleWar = $interval(tickWar, consts.dtw);
	};

	//this function will be fired at the end of controller - try to load a local save and initialize game
	$scope.autoLoad = function() {
		try {
			//run loading function, and depending on it's success finish it with controller-related actions
			if(saveService.load()) {
				$scope.s = s;
				$scope.ctrl = s.ctrl;
				$scope.initGame();
				autoresize();
				dinnerbone();
			}
		}
		catch(err) {confirm('FATÁLNÍ CHYBA APLIKACE!\nNejspíše je způsobená nekompatibilním savem. Přejete si save smazat?') && saveService.purge();}
	};

	//try to access mines
	$scope.accessMine = function(arg) {
		if(arg === 'advisorEco') {$scope.tab(arg);} //is money
		else if(arg === 'islandPila') { //is wood
			s.singleUse.visitedPila = true;
			$scope.tab(arg);
		}
		else if(s.p.unlockLuxus) {$scope.tab(arg);} //is other resources. if unlocked, else not yet
		else{game.msg('Nejprve bude nutné tyto prapodivné věci vědecky popsat, než je budeme moci využít!');}
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
	//is all research complete
	$scope.isAllWis = () => s.research.length >= research.length;

	//getter / setter function for beer
	$scope.getSetBeer = function(newBeer) {
		newBeer && game.achieve('pivo');
		return (typeof newBeer === 'number') ? (s.hospoda = newBeer) : s.hospoda;
	};

	//choose a new name for city (with a predefined suggestion)
	$scope.renameCity = function() {
		let suggestion = (s.name === 'Polis') ? 'Prdelopolis' : s.name;
		let newName = prompt('Zadejte nový název:', suggestion);
		if(!newName || !newName.trim()) {return;}
		newName = newName.trim();
		if(newName.length > 16) {
			game.msg('Název nesmí být delší než 16 znaků, jinak bychom utratili majlant za nové cedule!');
			newName = newName.slice(0, 16);
		}
		s.name = newName;
		dinnerbone();
	};
	//lol xD velikonoční vajíčko lmao
	function dinnerbone() {$scope.style.city.transform = (s.name.toLowerCase() === 'dinnerbone') ? 'rotate(180deg)' : 'none';}

	//is s.sur[i] in overflow? -> display blinking warning. Gold is never in overflow (only i >= 1)
	$scope.isOverflow = function(i) {
		return (i !== 0) ? (s.sur[i] >= game.storage()) : false;
	};

	$scope.relicClick = (r) => r === 'undefined' ? alert() : game.msg(relics[r].tooltip); // ng-click for relic icon in museum

	//how many achievements are there in total - but only: all non-secret + already unlocked secret
	$scope.getAchievementCount = function() {
		let keys = Object.keys(achievements);
		if(s.p.unlockDoge >= consts.dogePower) {return keys.length} //xD
		let secret = keys.filter(item => achievements[item].secret);
		let secretUnlocked = secret.filter(item => s.achievements.indexOf(item) > -1);
		return keys.length - secret.length + secretUnlocked.length;
	};

	//to do list: achievements that are non-secret and not yet unlocked
	$scope.getAchievementGoals = function() {
		return Object.keys(achievements)
			.filter(item => !achievements[item].secret || s.p.unlockDoge >= consts.dogePower) //xD
			.filter(item => s.achievements.indexOf(item) === -1)
			.map(item => achievements[item].description);
	}

	//date of initation of current state
	$scope.getFoundationDate = function() {
		let d = new Date(s.timestampFounded);

		//add leading zero to the number
		function f(num) {
			let str = String(num);
			return str.length < 2 ? '0' + str : str;
		}

		return f(d.getDate()) + '.' + f(d.getMonth()+1) + '.' + f(d.getFullYear());
	};

	$scope.dogeSRC = () => s.p.unlockDoge ? 'res/GUI/doge.jpg' : ''; //poor smol doge must be well hidden from evil robots!
	$scope.dogeClic = () => { //it's something.
		s.p.unlockDoge++;
		(s.p.unlockDoge === consts.dogePower) && game.msg([
			'Tak přeci to nebylo k ničemu. Zdá se, že tento prastarý meme z dávných dob má kouzelnou moc odhalit všechny skryté achievementy!',
			'I\'m gonna do what\'s called a PRO GAMER MOVE']);
	};

	$scope.armySum = game.war.armySum;
	$scope.extraFlavor = key => (key === 'bal' && s.p.powerBal) ? '. Aby to nebylo málo, nově má ve výzbroji i skleněný Paprsek Smrti™' : '';
	$scope.odysDraw = () => s.odys.wave > 1 && s.odys.army && game.war.groundArmySum(s.odys.army) === 0; //for extremely rare event that odys ends up as a draw





	//try to start the game from a savegame
	$scope.autoLoad();
});
