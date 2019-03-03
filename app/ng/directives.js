//button to close a screen, and thus return to city or island
app.directive('escape',    function() {return {restrict: 'E', template: '<div class="escape" ng-click="tab()" title="Esc">&times;</div>'};});
//same, but for window
app.directive('escapeWin', function() {return {restrict: 'E', template: '<div class="escape" ng-click="window(\'game\')" title="Esc">&times;</div>'};});

//directive for generic (not type specific) content on a building detail page
app.directive('buildingDetails', function() {
	return {
		controller: ['$scope', function($scope) {
			$scope.buildings = buildings;
			$scope.icons = consts.surAliases;

			function update() {
				$scope.level = game.getBlvl($scope.key);
				$scope.price = buildings[$scope.key].price($scope.level + 1);
			};
			update();
			
			$scope.upgrade = function(key) {
				game.upgradeBuilding(key);
				update();
			};
		}],
		restrict: 'E',
		scope: {
			key: '='
		},
		templateUrl: 'app/ng/buildingDetails.html'
	};
});

//directive for a slider to distribute workers
app.directive('resourceSlider', function() {
	return {
		controller: ['$scope', function($scope) {
			$scope.s = s;
			$scope.icons = consts.surAliases;
			$scope.pop = s.pop[$scope.i];//workers of mine 'i'

			//distribute workers in s.pop according to the changed ng-model 'pop'
			$scope.distributeWorker = function(i) {
				s.pop[0] = s.pop[0] + s.pop[i] - $scope.pop;//set taxpayers
				s.pop[i] = $scope.pop;//set miners
			};
		}],
		restrict: 'E',
		scope: {
			i: '='
		},
		templateUrl: 'app/ng/resourceSlider.html'
	};
});

//directive for the whole trading interface
app.directive('tradeSlider', function() {
	return {
		controller: ['$scope', function($scope) {
			$scope.suroviny = consts.surFullDescription;
			$scope.selected = 0;
			$scope.percent = 50;
			$scope.eff = game.eff().obchod;

			//the key function, which converts percentage of slider to values of how much to sell/buy -> returns [gold, resource]
			$scope.calculate = function() {
				let p = $scope.percent;
				let i = $scope.selected + 1; //index of s.sur
				let e =  game.eff().obchod;
				$scope.eff = e;
				let j = (p-50)/50; //multiplier
				//maximum of 'i' that can be bought is limited either by money, or by storage capacity for 'i'
				let maxBuy = Math.min(s.sur[0].positify()*e, game.storage() - s.sur[i]);
				
				//(slider is on the right) ? BUY : SELL
				return (p > 50) ?
					[-maxBuy/e*j, maxBuy*j] :
					[s.sur[i]*e*j*-1, -s.sur[i]*j*-1];
			};

			//perform trade
			$scope.trade = function() {
				let change = $scope.calculate();
				s.sur[0] += change[0];
				s.sur[$scope.selected + 1] += change[1];
				$scope.percent = 50;
				if($scope.eff > 1) {game.achieve('ecozmrd');}
			};
		}],
		restrict: 'E',
		scope: {},
		templateUrl: 'app/ng/tradeSlider.html'
	};
});

//directive for generic training interface
app.directive('training', function() {
	return {
		controller: ['$scope', function($scope) {
			$scope.icons = consts.surAliases;
			$scope.units = {};
			$scope.ranges = {};//control for all sliders
			$scope.eff = () => game.getUnitCost($scope.building);

			//units that are unlocked and trained in the currently viewed building
			function getAvailableUnits() {
				let o = {};
				for(let i in units) {
					if(units.hasOwnProperty(i) && s.p.unlockUnit.indexOf(i) > -1 && units[i].train === $scope.building) {
						$scope.units[i] = units[i];
						$scope.ranges[i] = 0;
					}
				}
			}
			getAvailableUnits();

			//how much population does unit 'id' cost in given quantity
			$scope.popPrice = id => units[id].pop * $scope.ranges[id];

			//how much resource 'i' does unit 'id' cost in given quantity
			$scope.surPrice = (id, i) => units[id].price[i] * $scope.ranges[id] * $scope.eff();

			//find limiting reactant from (resources & population) and return how many units can be bought
			$scope.getBuyLimit = function(id) {
				let price = units[id].price.concat(units[id].pop);
				let avail = s.sur.concat(s.pop[0]);

				//relative prices - available resource over cost
				let rel = price.map(function(o, i) {
					if(o > 0 && avail[i] <= 0) {return 0;} //required resource is exactly zero - can't buy anything
					else if(o > 0) {return avail[i]/o;} //required resoruce isn't zero and therefore can be divided with
					else {return Infinity;} //the resource isn't required for this unit, therefore Infinity units can be bought
				});

				//return the minimal of relative prices
				return Math.floor(Math.min.apply(null, rel));
			};

			//buy the unit 'id' and reset slider
			$scope.buy = function(id) {
				s.army[id] += $scope.ranges[id];
				s.pop[0] -= $scope.popPrice(id);
				s.sur = s.sur.map((s, i) => s - $scope.surPrice(id, i));
				id === 'trj' && $scope.ranges[id] > 0 && game.achieve('trojan');
				$scope.ranges[id] = 0;
			};
		}],
		restrict: 'E',
		scope: {
			building: '='
		},
		templateUrl: 'app/ng/training.html'
	};
});
