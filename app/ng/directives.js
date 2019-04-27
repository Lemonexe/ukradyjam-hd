//button to close a screen, and thus return to city or island
app.directive('escape',    () => ({restrict: 'E', template: '<div class="escape" ng-click="tab()" title="Esc">&times;</div>'}));
//same, but for window
app.directive('escapeWin', () => ({restrict: 'E', template: '<div class="escape" ng-click="window(\'game\')" title="Esc">&times;</div>'}));

//directive for battle management options
app.directive('battleManagement', () => ({restrict: 'E', templateUrl: 'app/ng/battleManagement.html'}));

//directive for generic (not type specific) content on a building detail page
app.directive('buildingDetails', function() {
	return {
		restrict: 'E',
		scope: {key: '='},
		templateUrl: 'app/ng/buildingDetails.html',
		controller: ['$scope', function($scope) {
			$scope.buildings = buildings;
			$scope.icons = consts.surAliases;

			function update() {
				$scope.level = game.getBlvl($scope.key);
				$scope.price = buildings[$scope.key].price($scope.level + 1);
			}
			update();

			$scope.upgrade = function(key) {
				game.upgradeBuilding(key);
				update();
			};
		}]
	};
});

//directive for a slider to distribute workers
app.directive('resourceSlider', function() {
	return {
		restrict: 'E',
		scope: {i: '='},
		templateUrl: 'app/ng/resourceSlider.html',
		controller: ['$scope', function($scope) {
			$scope.s = s;
			$scope.icons = consts.surAliases;

			//getter / setter function to distribute workers in s.pop
			//WARNING: if you read the following line, you might consequently need to bleach your eyes
			$scope.distributeWorker = (newPop) => (typeof newPop === 'number') ? (s.pop[0] += s.pop[$scope.i] - (s.pop[$scope.i] = newPop)) : s.pop[$scope.i];
		}]
	};
});

//directive for the whole trading interface
app.directive('tradeSlider', function() {
	return {
		restrict: 'E',
		scope: {},
		templateUrl: 'app/ng/tradeSlider.html',
		controller: ['$scope', function($scope) {
			$scope.status = '';
			$scope.suroviny = consts.surFullDescription;
			$scope.selected = 0;
			$scope.percent = 50;
			$scope.eff = game.eff().obchod;
			$scope.rate = consts.goldValue; //exchange rate of resources to gold

			//the key function, which converts percentage of slider to values of how much to sell/buy -> returns [gold, resource]
			$scope.calculate = function() {
				let p = $scope.percent;
				let i = $scope.selected + 1; //index of s.sur
				let e = game.eff().obchod;
				let r = $scope.rate;
				$scope.eff = e;
				let j = (p-50)/50; //multiplier between -1 and 1
				//maximum of 'i' that can be bought is limited either by available money, or by free storage capacity for 'i'
				let maxGold = s.sur[0].positify()*e/r;
				let freeStorage = game.storage() - s.sur[i];
				let maxBuy = Math.min(maxGold, freeStorage);
				//maximum that can be sold = what player has
				let maxSell = s.sur[i];

				$scope.status =
					(p > 50 && (maxGold     === 0) && 'Nemáme žádné zlato, takže nelze nic kupovat!') ||
					(p > 50 && (freeStorage === 0) && 'Této suroviny máme úplně plno, nelze kupovat více!') ||
					(p < 50 && (maxSell     === 0) && 'Tuto surovinu vůbec nemáme, takže ji nemůžeme prodat!') ||
					'';

				//(slider is on the right) ? BUY : SELL as [zlato, sur]
				return (p > 50) ?
					[-maxBuy /e*j*r, maxBuy *j] :
					[-maxSell*e*j*r, maxSell*j];
			};

			//perform trade
			$scope.trade = function() {
				let change = $scope.calculate();
				s.sur[0] += change[0];
				s.sur[$scope.selected + 1] += change[1];
				$scope.percent = 50;
				$scope.eff > 1 && game.achieve('ecozmrd');
			};
		}]
	};
});

//directive for generic training interface
app.directive('training', function() {
	return {
		restrict: 'E',
		scope: {building: '='},
		templateUrl: 'app/ng/training.html',
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

			$scope.atLeast1 = n => n > 0 ? n : 1;
			//how much population does unit 'id' cost in given quantity
			$scope.popPrice = (id, n) => units[id].pop * n;

			//how much resource 'i' does unit 'id' cost in given quantity
			$scope.surPrice = (id, i, n) => units[id].price[i] * n * $scope.eff();

			//find limiting reactant from (resources & population) and return how many units can be bought
			$scope.getBuyLimit = function(id) {
				let eff = $scope.eff();
				let price = units[id].price.map(item => item*eff).concat(units[id].pop);
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
				if($scope.getBuyLimit(id) <= 0) {
					s.messages.push(`Na stavbu jednotky ${units[id].name} není dost surovin.`);
					return;
				}
				let n = $scope.ranges[id];
				s.army[id] += n;
				s.pop[0] -= $scope.popPrice(id, n);
				s.sur = s.sur.map((s, i) => s - $scope.surPrice(id, i, n));
				id === 'trj' && n > 0 && game.achieve('trojan');
				$scope.ranges[id] = 0;
			};
		}]
	};
});

//directive for a detailed report of battle
app.directive('battleReports', () => ({
	restrict: 'E',
	scope: {},
	templateUrl: 'app/ng/battleReports.html',
	controller: ['$scope', function($scope) {
		$scope.battleReports = s.battleReports;
		$scope.icons = consts.surAliases;
		$scope.units = units;
		//which report should have details displayed
		$scope.detailView = -1;
		$scope.viewSwitch = (i) => ($scope.detailView = ($scope.detailView === i) ? -1 : i);
		//permanently remove a report
		$scope.deleteReport = function(i) {
			if(confirm('Opravdu smazat zprávu?')) {
				$scope.detailView = -1;
				s.battleReports.splice(i, 1)
			}
		};
	}]
}));
