//war object factory - all functions related to warfare
let War = () => ({
	//initiate a battle by creating the battle object (state of battlefield)
	initBattle: function() {
		if(this.armySum() == 0) {s.messages.push('Nemáme žádnou dostupnou armádu');return;}
	},

	//
	reinforceBattle: function() {
		if(this.armySum() == 0) {s.messages.push('Nemáme žádnou dostupnou armádu');return;}
	},

	//sum of total army
	armySum: () => Object.keys(s.army).reduce((sum, i) => sum + s.army[i], 0)
});
