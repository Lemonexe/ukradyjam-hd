//force an angular digest cycle. Pls don't lynch me.
function forceDigest() {
	angular.element(document).scope().$apply();
}

//because there is no ngOnResize directive, I have to trigger it from outside, from a normal event listener, and then force a digest cycle
window.onresize = function() {
	angular.element(document).scope().resize();
	forceDigest();
};

//save game before leaving
window.onbeforeunload = function() {
	saveService.save();
};

//object with functions concerning dragging buildings around
let drag = {
	clientX: 0,
	clientY: 0,
	allowDrop: function(event) {event.preventDefault();},
	dragStart: function(event) {
		this.clientX = event.clientX;
		this.clientY = event.clientY;
		event.dataTransfer.setData('text', event.target.getAttribute('index'));
	},
	drop: function(event) {
		event.preventDefault();
		let i = event.dataTransfer.getData('text');
		let dx = event.clientX - this.clientX;
		let dy = event.clientY - this.clientY;
		angular.element(document).scope().moveBuilding(i, dx, dy);
		forceDigest();
	},
};

//just an exponential (+ optional linear) function
function expF(x, a, b, c) {
	c = c ? c : 0;
	return a*b**x + c*x;
}

//define new methods in number prototype
//return number as a percentage with 'd' digits after decimal point
Number.prototype.toPercent = function(d) {return (this.valueOf()*100).toFixed(d ? d : 0) + '%'};
//return number only when > 0, otherwise return 0
Number.prototype.positify = function() {return this.valueOf() > 0 ? this.valueOf() : 0;};
//return number as fixed(0) with sign always displayed if not (rounded to) zero
Number.prototype.withSign = function() {
	let n = Math.round(this.valueOf());
	let s = n.toFixed(0)
	return n > 0 ? ('+' + s) : s;
};

const saveService = {
	//save game to local storage
	save: () => s.running && localStorage.setItem('savegame', JSON.stringify(s)),

	//load game from local storage and perform iterations. Return true or false = whether there was a savegame a successfully loaded
	load: function() {
		let data = localStorage.getItem('savegame');
		if(data) {
			data = JSON.parse(data);

			//check version of the game against version of save, and if save is no longer supported, ignore & delete it mercilessly
			let ver2num = ver => ver[0]*1e4 + ver[1]*1e2 + ver[2];
			if(ver2num(data.version) < ver2num(game.support)) {
				s.messages.push('Bohužel, vaše uložená data byla ztracena, protože novější verze hry už neposkytuje zpětnou kompatibilitu.');
				localStorage.removeItem('savegame');
				return false;
			}

			//actually load the data
			s = data;

			//and retrospectively perform ticks
			let diff = Date.now() - data.timestamp;
			let cycles = Math.floor(diff / consts.dt);
			if(cycles <= 0) {return true;}

			for(let i = 0; i < cycles; i++) {
				game.tick();
			}

			s.messages.push([`Zatímco byl vládce na dovolené, proběhlo ${cycles} cyklů.`,
				`Raději zkontrolujte, zda-li je ${s.name} v pořádku.`,
				'Řím možná nebyl postaven za den, ale naši občané by ho za den zvládli zcela vybydlet.']);
			return true;
		}
		return false;
	},

	//delete local save
	purge: function() {
		if(confirm('Opravdu chcete smazat veškerá vaše data v této hře?')) {
			window.onbeforeunload = null;
			localStorage.removeItem('savegame');
			location.reload();
		}
	}
};
