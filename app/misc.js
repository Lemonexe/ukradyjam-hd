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

window.onerror = function(err) {alert('Došlo k neočekávané chybě aplikace:\n' + err);}

//preload images
window.onload = imgPreload;

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

let saveService = {
	//save game to local storage
	save: function() {
		if(!s.running) {return;}
		//check if the last save is from the a different application instance = if initial timestamps clash (they're basically instance ID)
		//emit a warning if this is the 2nd time it clashed (thus ignore clash from loading a save)
		let data = localStorage.getItem('savegame');
		data && JSON.parse(data).timestampInit !== s.timestampInit && (saveService.clash++) &&
			(saveService.clash >= 2) && s.messages.push(['Ukradyjam:HD je otevřen ve více než jednom panelu.',
				'To vám rozhodně nezvýší těžbu surovin, proto raději zavřete všechny kromě toho, který plánujete hrát ;-)']);
		localStorage.setItem('savegame', JSON.stringify(s));
	},

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
			cycles >= consts.backAchieve/consts.dt && game.achieve('back');

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
		s = S();
		window.onbeforeunload = null;
		localStorage.removeItem('savegame');
		location.reload();
	},

	//read uploaded file, save it to LocalStorage and reload the window. Cumbersome, but reliable!
	manualLoad: function(file) {
		if(!file) {return;}
		let reader = new FileReader();
		reader.onload = function() {
			window.onbeforeunload = null;
			localStorage.setItem('savegame', reader.result);
			location.reload();
		};
		reader.readAsText(file);
	},

	//generate a save file for download
	manualSave: function() {
		let blob = new Blob([JSON.stringify(s)], { type : 'application/json' });
		let url = (window.URL || window.webkitURL).createObjectURL(blob);
		let elem = document.createElement('a');
		elem.setAttribute('href', url);
		elem.setAttribute('download', 'Ukradyjam.json');
		elem.style.display = 'none';
		document.body.appendChild(elem);
		elem.click();
		document.body.removeChild(elem);
	},

	//number of application instance ID clashes, see save
	clash: 0,
};

//these images will be used in canvas, and therefore need to be preloaded
let imgs = {battle: 'res/env/BATTLE.png'};
function imgPreload() {
	for(let k in units) {
		imgs[k] = 'res/unit/' + units[k].img;
	}
	for(let k in imgs) {
		let newImage = new Image()
		newImage.src = imgs[k];
		imgs[k] = newImage;
	}
}
