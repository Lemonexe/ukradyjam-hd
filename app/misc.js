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

window.onerror = function(err) {alert('Došlo k neočekávané chybě aplikace:\n' + err);};

//preload images
window.onload = imgPreload;

//just an exponential (+ optional linear) function
function expF(x, a, b, c) {
	c = c ? c : 0;
	return a*b**x + c*x;
}

//define new methods in number prototype
//return number as a percentage with 'd' digits after decimal point
Number.prototype.toPercent = function(d) {return (this.valueOf()*100).toFixed(d ? d : 0) + '%';};
//return number only when > 0, otherwise return 0
Number.prototype.positify = function() {return this.valueOf() > 0 ? this.valueOf() : 0;};
//write number using 'k' or 'M' to denote thousands or millions, but only if number exceeds threshold t or M
Number.prototype.addk = function(t, M) {
	let val = this.valueOf();
	if(val > (M ? M : 1e6)) {return Math.floor(val/1e6) + 'M';}
	if(val > (t ? t : 1e3)) {return Math.floor(val/1e3) + 'k';}
	return val.toFixed(0);
};
//return number as fixed(0) with sign always displayed if not (rounded to) zero
Number.prototype.withSign = function() {
	let n = Math.round(this.valueOf());
	let s = n.toFixed(0)
	return n > 0 ? ('+' + s) : s;
};

const saveService = {
	//save game to local storage
	save: function() {
		if(!s.running) {return;}
		//check if the last save is from the a different application instance = if initial timestamps clash (they're basically instance ID)
		//emit a warning if this is the 2nd time it clashed (thus ignore clash from loading a save)
		let data = localStorage.getItem('UKHDsavegame');
		data && JSON.parse(data).timestampInit !== s.timestampInit && (saveService.clash++) && (saveService.clash >= 2) &&
			game.msg(['Ukradyjam:HD je otevřen ve více než jednom panelu.', 'To vám rozhodně nezvýší těžbu surovin, proto raději zavřete všechny kromě toho, který plánujete hrát ;-)']);
		localStorage.setItem('UKHDsavegame', JSON.stringify(s));
	},

	//load game from local storage and perform iterations. Return true or false = whether there was a savegame a successfully loaded
	load: function() {
		let data = localStorage.getItem('UKHDsavegame');
		
		//try to load the old savegame location
		let dataOld = localStorage.getItem('savegame');
		if(dataOld) {
			data = dataOld;
			localStorage.setItem('UKHDsavegame', data);
			localStorage.removeItem('savegame');
		}

		if(data) {
			data = JSON.parse(data);

			//check version of the game against version of save, and if save is no longer supported, ignore & delete it mercilessly
			let ver2num = ver => ver[0]*1e4 + ver[1]*1e2 + ver[2];
			if(ver2num(data.version) < ver2num(game.support)) {
				game.msg('Bohužel, vaše uložená data byla ztracena, protože novější verze hry už neposkytuje zpětnou kompatibilitu.');
				localStorage.removeItem('UKHDsavegame');
				return false;
			}

			//however, there is a better approach than obliterating a thriving city in every new version of game

			//see definition of 'compatibility'
			//function 'f' is fired if save version is lower than 'v' version
			compatibility.forEach(c => (ver2num(data.version) < ver2num(c.v)) && c.f(data));
			data.version = game.version;

			//actually load the data
			s = data;

			//and retrospectively perform all ticks
			let cycles = game.retrospecticks();

			cycles > 0 && game.msg([`Zatímco byl vládce na dovolené, proběhlo ${cycles.addk()} cyklů.`,
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
		localStorage.removeItem('UKHDsavegame');
		location.reload();
	},

	//read uploaded file, save it to LocalStorage and reload the window. Cumbersome, but reliable!
	manualLoad: function(file) {
		if(!file) {return;}
		let reader = new FileReader();
		reader.onload = function() {
			window.onbeforeunload = null;

			//validate file - if it's even parsable as an object and randomly check some attributes
			try {
				let data = JSON.parse(reader.result);
				if(typeof data !== 'object' || !data.hasOwnProperty('sur') || !data.hasOwnProperty('WP')) {throw 'nope.';}
			}
			catch(err) {
				game.msg('Soubor není platný, není jej tedy možno načíst.'); return;
			}

			//set local save
			localStorage.setItem('UKHDsavegame', reader.result);
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
		let filename = s.name.replace(/[<>:"/\|?*]/g, '') + '.json';
		elem.setAttribute('download', filename);
		elem.style.display = 'none';
		document.body.appendChild(elem);
		elem.click();
		document.body.removeChild(elem);
	},

	//number of application instance ID clashes, see save
	clash: 0,
};

//functions to perform actions for compatibility purposes. v = version, f = function that takes state object as an argument and returns nothing
const compatibility = [
	//add missing property
	{v: [1, 0, 2], f: function(s) {
		if(!s.hasOwnProperty('tooltip')) {
			s.tooltip = S().tooltip;
		}
	}},
	//delete empty fields in battle casualty reports
	{v: [1, 1, 0], f: function(s) {
		for(let r of s.battleReports) {
			r.deadP = game.war.filterArmyObj(r.deadP);
			r.deadE = game.war.filterArmyObj(r.deadE);
		}
	}},
	//add warstamp and set it as timestamp, which should actually be close enough
	{v: [1, 1, 1], f: function(s) {
		s.warstamp = s.timestamp;
	}},
	//extrapolate the actual date of founding
	{v: [1, 1, 3], f: function(s) {
		s.timestampFounded = Date.now() - s.iteration*consts.dt;
	}},
	//add new variable
	{v: [1, 1, 6], f: function(s) {
		s.oktoberfest = 1;
	}}
];

//these images will be used in canvas, and therefore need to be preloaded
const imgs = {battle: 'res/env/BATTLE.png'};
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
