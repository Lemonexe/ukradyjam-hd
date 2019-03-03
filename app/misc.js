//force an angular digest cycle. Pls don't lynch me.
function forceDigest() {
	angular.element(document).scope().$apply();
}

//because there is no ngOnResize directive, I have to trigger it from outside, from a normal event listener, and then force a digest cycle
window.onresize = function() {
	angular.element(document).scope().resize();
	forceDigest();
};

function purgeSave() {
	if(confirm('Opravdu chcete smazat veškerá vaše data v této hře?')) {
		//s = S();//TODO save the reseted save and RELOAD (because angular is still linked to the old object)
	}
}

//this is ONLY for spontaneous popups (triggered by certain time event)
//do NOT use for popups generated inside Angular controller or by functions called from there - just use s.messages.push(text)
function message(text) {
	s.messages.push(text);
	forceDigest();
}

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
