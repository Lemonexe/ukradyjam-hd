/* Contains:
	1) WarView object constructor, which contains all the functions related to warfare view and War() will inherit it
	2) battleCanvas directive, which executes timeout and links the rendering functions with canvas element
*/
function WarView () {
	//constants for rendering (in pixels)
	this.positionConsts = {
		X0: 108,
		airY0: 20,
		gndY0: 208,
		sideXP: 0,
		sideXE: 536
	};

	//central function to draw the battlefield
	this.render = function(ctx) {
		//clear & draw background image
		ctx.clearRect(0, 0, 600, 600);
		ctx.drawImage(imgs.battle, 0, 0);

		//cycle number
		ctx.textAlign = 'center'; ctx.fillStyle = 'black'; ctx.font = 'bold 16px Arial';
		ctx.fillText('kolo ' + s.battlefield.cycles.toFixed(0), 300, 16);

		s.ctrl.drawBattleGrid && this.drawGrid(ctx);
		this.drawSide(ctx);
		this.drawMap(ctx);
		this.drawEffects(ctx);
	};

	//draw the battlefield grid
	this.drawGrid = function(ctx) {
		const pc = this.positionConsts;
		const bf = s.battlefield;
		ctx.lineWidth = 1; ctx.strokeStyle = '#998855';
		for(let x = 0; x < 6; x++) {
			for(let y = 0; y < bf.rows; y++) {
				//if sky, else ground
				if(y < bf.air) {ctx.beginPath(); ctx.rect(pc.X0+64*x, pc.airY0+64*y, 64, 64); ctx.stroke();}
				else {ctx.beginPath(); ctx.rect(pc.X0+64*x, pc.gndY0+64*(y-bf.air), 64, 64); ctx.stroke();}
			}
		}
	};

	//draw side panels for player and enemy
	this.drawSide = function(ctx) {
		const pc = this.positionConsts;
		const bf = s.battlefield;
		s.tooltipField = [];
		//define which units are rendered where
		const sky = this.skyUnits, ground = this.groundUnits;
		//e, p = count of unit types (for rendering) for enemy and player, k = unit key
		let e, p, k;
		e = p = 0;
		//draw sky units on sides
		for(let i = 0; i < sky.length; i++) {
			k = sky[i];
			if(bf.reserveP[k] > 0 || bf.logP[k] > 0 || bf.deadP[k] > 0) {this.drawSideUnit(ctx, k, bf.reserveP[k], bf.deadP[k], true,  pc.sideXP, p*64); p++;}
			if(bf.reserveE[k] > 0 || bf.logE[k] > 0 || bf.deadE[k] > 0) {this.drawSideUnit(ctx, k, bf.reserveE[k], bf.deadE[k], false, pc.sideXE, e*64); e++;}
		}
		//reset counters and draw ground units on sides
		e = p = 0;
		for(let i = 0; i < ground.length; i++) {
			k = ground[i];
			if(bf.reserveP[k] > 0 || bf.logP[k] > 0 || bf.deadP[k] > 0) {this.drawSideUnit(ctx, k, bf.reserveP[k], bf.deadP[k], true,  pc.sideXP, 152+p*64); p++;}
			if(bf.reserveE[k] > 0 || bf.logE[k] > 0 || bf.deadE[k] > 0) {this.drawSideUnit(ctx, k, bf.reserveE[k], bf.deadE[k], false, pc.sideXE, 152+e*64); e++;}
		}
	};

	//draw a side unit(context, unit ID, number of reserves & dead, whether the label shall be on the right, coords)
	this.drawSideUnit = function(ctx, key, reserve, dead, right, x, y) {
		//image of the unit, with effects applied
		ctx.save();
		let xs = 1, ys = 1; //x scale, y scale
		if(!right) {xs = -1;}
		if(!right && s.odys.wave > 0 && s.odys.race === 'mirror') {ys = -1; ctx.filter = 'invert(1)';}
		ctx.scale(xs, ys);
		ctx.drawImage(imgs[key], x*xs, y*ys, 64*xs, 64*ys);
		ctx.restore();
		//draw rectangular textbox
		ctx.beginPath();
		const w = 42; //width of textbox
		const x0 = right ? x+64-5 : x-w+5; //base position of textbox
		ctx.rect(x0, y+12, w, 40);
		ctx.fillStyle = right ? '#aaaceebf' : '#eeaaaabf'; ctx.fill();
		//write numbers
		ctx.textAlign = 'center'; ctx.fillStyle = 'black';
			ctx.font = 'normal 20px Arial'; ctx.fillText(reserve.addk(),  x0+w/2, y+31, w-2);
		if(dead > 0) {
			ctx.font = 'italic 16px Arial'; ctx.fillText('-'+dead.addk(), x0+w/2, y+48, w-2);
		}

		//[top,left,height,width,text]
		const zoom = s.ctrl.zoom/600;
		s.tooltipField.push([y*zoom, x*zoom, 64*zoom, 64*zoom, units[key].name]);
	};

	//draw the battlefield itself
	this.drawMap = function(ctx) {
		const pc = this.positionConsts;
		const bf = s.battlefield;
		for(let x = 0; x < 6; x++) {
			for(let y = 0; y < bf.rows; y++) {
				//sky
				(y <  bf.air) && bf.map[y][x] && this.drawMapUnit(ctx, bf.map[y][x].key, bf.map[y][x].n, x<3, bf.map[y][x].own, pc.X0+64*x, pc.airY0+64*y);
				//ground
				(y >= bf.air) && bf.map[y][x] && this.drawMapUnit(ctx, bf.map[y][x].key, bf.map[y][x].n, x<3, bf.map[y][x].own, pc.X0+64*x, pc.gndY0+64*(y-bf.air));
			}
		}
	};

	//draw a group on the battlefield(context, unit ID, number, whether it's facing right, whether it's owned by player, coords)
	this.drawMapUnit = function(ctx, key, n, right, own, x, y) {
		//image of the unit, with effects applied
		ctx.save();
		let xs = 1, ys = 1; //x scale, y scale
		if(!right) {xs = -1;}
		if(!own && s.odys.wave > 0 && s.odys.race === 'mirror') {ys = -1; ctx.filter = 'invert(1)';}
		ctx.scale(xs, ys);
		ctx.drawImage(imgs[key], x*xs, y*ys, 64*xs, 64*ys);
		ctx.restore();
		//draw rectangular textbox
		ctx.beginPath();
		let w = ctx.measureText(n.toFixed(0)).width + 2;
		ctx.rect(x+64-w, y, w, 20);
		ctx.fillStyle = own ? '#c3c4f5aa' : '#f4c4c4aa';
		ctx.fill();
		//write number
		ctx.fillStyle = own ? '#0000bb' : '#bb0000';
		ctx.textAlign = 'right';
		ctx.font = 'normal 20px Arial';
		ctx.fillText(n.toFixed(0), x+63, y+17, 62);
	};


	//draw special graphical effects
	this.drawEffects = function(ctx) {
		const pc = this.positionConsts;
		const bf = s.battlefield;
		//get coordinates from map indices
		const coordX = x => pc.X0+32+64*x;
		const coordY = y => y < bf.air ? pc.airY0+32+64*y : pc.gndY0+32+64*(y-bf.air);

		//functions for effect rendering
		const effectF = {
			//splatter (dots randomly placed in circular area)
			splatter: function(e, color, drops, radius, size) {
				for(let i = 0; i < drops; i++) {
					let x = coordX(e.x) + Math.sin(Math.random()*Math.PI*2) * radius * Math.random();
					let y = coordY(e.y) + Math.cos(Math.random()*Math.PI*2) * radius * Math.random();
					ctx.beginPath();
					ctx.arc(x, y, size, 0, 2*Math.PI);
					ctx.fillStyle = color;
					ctx.fill();
				}
			},

			//straight line
			line: function(e, color, dash) {
				ctx.beginPath();
				ctx.moveTo(coordX(e.x1), coordY(e.y1));
				ctx.lineTo(coordX(e.x2), coordY(e.y2));
				ctx.strokeStyle = color;
				ctx.setLineDash(dash);
				ctx.lineWidth = 3;
				ctx.stroke();
				ctx.setLineDash([]);
			},

			//balistic arc. It is assumed that y1 = y2
			arc: function(e, color) {
				ctx.beginPath();
				ctx.arc(coordX(0.5*(e.x1+e.x2)), coordY(e.y1)+64, Math.SQRT2*64, 1.25*Math.PI, 1.75*Math.PI);
				ctx.strokeStyle = color;
				ctx.setLineDash([]);
				ctx.lineWidth = 2;
				ctx.stroke();
			}
		};

		//effectF calling sequences for each effect type
		const effectCalls = {
			bloodSplatter: e => effectF.splatter(e, '#c00000', 50 , 18, 1.5),
			shitSplatter:  e => effectF.splatter(e, '#c05f00', 100, 22, 2),
			explosion:     e => effectF.splatter(e, '#e2e41c', 80 , 25, 1.5),
			cyanSplatter:  e => effectF.splatter(e, '#00eedd', 70 , 20, 2.5),
			grayLine:      e => effectF.line    (e, '#808080', []),
			shitLine:      e => effectF.line    (e, '#c05f00', [5, 10]),
			cyanLine:      e => effectF.line    (e, '#00eedd', []),
			yellowArc:     e => effectF.arc     (e, '#e2e41c'),
			cyanArc:       e => effectF.arc     (e, '#00eedd'),
			grayArc:       e => effectF.arc     (e, '#c0c0c0')
		};

		//iterate through all effects to draw them
		bf.effects.forEach(e => effectCalls[e.type](e));
	};
}



//this directive links the rendering functions with canvas element
app.directive('battleCanvas', () => ({
	restrict: 'A',
	link: function(scope, element) {
		//render battlefield
		function render() {
			if(!s.battlefield) {return;}
			const ctx = element[0].getContext('2d');
			game.war.render(ctx);
		}

		//set listener, which will be called via a $broadcast by an $interval from main controller
		scope.$on('renderWar', render);

		//first-time render upon opening battle tab
		render();
	}
}));
