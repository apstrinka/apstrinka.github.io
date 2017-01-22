"use strict";

var UTIL = function(){
	var defaultTolerance = 0.001;
	
	var floatsEqual = function(a, b){
		if (!Number.isFinite(a) && !Number.isFinite(b)){
			return true
		}
		if (Math.abs(a-b) < defaultTolerance){
			return true;
		}
		return false;
	};
	
	var normalizeAngle = function(a){
		var b = a % (2 * Math.PI);
		if (b < 0)
			b = b + 2 * Math.PI;
		if (floatsEqual(b, 2 * Math.PI))
			b = 0;
		return b;
	};
	
	var angleSum = function(a, b){
		var c = a + b;
		return normalizeAngle(c);
	};
	
	var oppositeAngle = function(a){
		return angleSum(a, Math.PI);
	};
	
	return {
		floatsEqual: floatsEqual,
		normalizeAngle: normalizeAngle
	}
}();

function Color(red, green, blue){
	this.red = red;
	this.green = green;
	this.blue = blue;
}

Color.prototype.toString = function(){
	return 'rgb(' + this.red + ',' + this.green + ',' + this.blue + ')';
};

Color.prototype.darker = function(){
	return new Color(this.red*4/5, this.green*4/5, this.blue*4/5);
};

function Point(x, y){
	this.x = x;
	this.y = y;
}

Point.prototype.dist = function(otherPoint){
	return Math.hypot(this.x - otherPoint.x, this.y - otherPoint.y);
};

Point.prototype.angle = function(otherPoint){
	var ang = Math.atan2(otherPoint.y - this.y, otherPoint.x - this.x);
	ang = UTIL.normalizeAngle(ang);
	return ang;
};

Point.prototype.translate = function(x, y){
	return new Point(this.x + x, this.y + y);
};

Point.prototype.rotateAroundOrigin = function(angle){
	var x = Math.cos(angle) * this.x - Math.sin(angle) * this.y;
	var y = Math.sin(angle) * this.x + Math.cos(angle) * this.y;
	return new Point(x, y);
};

Point.prototype.equals = function(otherPoint){
	return UTIL.floatsEqual(this.x, otherPoint.x) && UTIL.floatsEqual(this.y, otherPoint.y);
}

Point.prototype.draw = function(context, converter, color){
	if (typeof color === 'undefined'){
		color = new Color(0, 255, 0);
	}
	var q = converter.abstractToScreenCoord(this)
	var style = context.fillStyle;
	context.fillStyle = color.darker().toString();
	context.beginPath();
	context.arc(q.x, q.y, 6, 0, 2*Math.PI);
	context.fill();
	context.fillStyle = color.toString();
	context.beginPath();
	context.arc(q.x, q.y, 3, 0, 2*Math.PI);
	context.fill();
	context.fillStyle = style;
};

function Circle(center, radius){
	this.center = center;
	this.radius = radius;
}

Circle.prototype.contains = function(point){
	return UTIL.floatsEqual(point.dist(this.center), this.radius);
};

Circle.prototype.intersection = function(otherCircle){
	var p;
	var r1 = this.radius;
	var r2 = otherCircle.radius;
	var dist = this.center.dist(otherCircle.center);
	var ang = this.center.angle(otherCircle.center);
	if (this.center.equals(otherCircle.center)){
		return [];
	}
	if (UTIL.floatsEqual(dist, r1 + r2)){
		p = this.center.translate(r1 * Math.cos(ang), r1 * Math.sin(ang));
		if (!this.contains(p) || !otherCircle.contains(p)){
			return [];
		} else {
			return [p];
		}
	}
	if (UTIL.floatsEqual(dist, Math.abs(r1 - r2))){
		p = this.center.translate(r1 * Math.cos(ang), r1 * Math.sin(ang));
		if (r1 < r2){
			p = this.center.translate(r1 * Math.cos(UTIL.oppositeAngle(ang)), r1 * Math.sin(UTIL.oppositeAngle(ang)));
		}
		if (!this.contains(p) || !other.contains(p)){
			return [];
		} else {
			return [p];
		}
	}
	if (dist > r1 + r2 || dist < Math.abs(r1 - r2)){
		return [];
	}
	var ret = [];
	var sepAng = Math.acos((Math.pow(r1, 2) + Math.pow(dist, 2) - Math.pow(r2, 2)) / (2 * r1 * dist));
	p = this.center.translate(r1 * Math.cos(ang + sepAng), r1 * Math.sin(ang + sepAng));
	if (this.contains(p) && otherCircle.contains(p)){
		ret.push(p);
	}
	p = this.center.translate(r1 * Math.cos(ang - sepAng), r1 * Math.sin(ang - sepAng));
	if (this.contains(p) && otherCircle.contains(p)){
		ret.push(p);
	}
	return ret;
};

Circle.prototype.draw = function(context, converter){
	var p = converter.abstractToScreenCoord(this.center);
	var screenRadius = converter.abstractToScreenDist(this.radius);
	context.beginPath();
	context.arc(p.x, p.y, screenRadius, 0, 2*Math.PI);
	context.stroke();
};

Circle.prototype.same = function(otherCircle){
	return (this.center.equals(otherCircle.center) && UTIL.floatsEqual(this.radius, otherCircle.radius));
};

function CoordinateConverter(){
	/*
	 * There are two coordinate systems used for AlDraw. The abstract coordinate
	 * system is how points are represented internally. The screen coordinate
	 * system is how those points are displayed on the screen. This class is
	 * used for converting one into the other.
	 */
	this.width = 1500; //This is the width of the screen in screen coordinates
	this.height = 500; //This is the height of the screen in screen coordinates
	this.cX = 0; //This is the abstract x coordinate that is displayed at the center of the screen
	this.cY = 0; //This is the abstract y coordinate that is displayed at the center of the screen
	this.conversionRatio = 250;
	this.angle = 0;
	this.zoomAmt = 1.2;
}

CoordinateConverter.prototype.zoomIn = function(x, y){
	this.conversionRatio = this.conversionRatio * this.zoomAmt;
	var a = this.screenToAbstractCoord(new Point(x, y));
	var angle = new Point(this.cX, this.cY).angle(a);
	var d = new Point(this.cX, this.cY).dist(a);
	this.cX += (this.zoomAmt - 1) * d * Math.cos(angle);
	this.cY += (this.zoomAmt - 1) * d * Math.sin(angle);
};

CoordinateConverter.prototype.zoomOut = function(x, y){
	var a = this.screenToAbstractCoord(new Point(x, y));
	var angle = new Point(this.cX, this.cY).angle(a);
	var d = new Point(this.cX, this.cY).dist(a);
	this.cX -= (this.zoomAmt - 1) * d * Math.cos(angle);
	this.cY -= (this.zoomAmt - 1) * d * Math.sin(angle);
	this.conversionRatio = this.conversionRatio / this.zoomAmt;
};

CoordinateConverter.prototype.abstractToScreenDist = function(d){
	return d * this.conversionRatio;
};

CoordinateConverter.prototype.screenToAbstractDist = function(d){
	return d / this.conversionRatio;
};

CoordinateConverter.prototype.abstractToScreenCoord = function(a){
	var x1 = (a.x - this.cX) * this.conversionRatio;
	var y1 = (a.y - this.cY) * this.conversionRatio;
	var s = new Point(x1, y1);
	s = s.rotateAroundOrigin(this.angle);
	s.x = s.x + this.width / 2;
	s.y = s.y + this.height / 2;
	return s;
};

CoordinateConverter.prototype.screenToAbstractCoord = function(s){
	var x1 = (s.x - this.width / 2);
	var y1 = (s.y - this.height / 2);
	var a = new Point(x1, y1);
	a = a.rotateAroundOrigin(-this.angle);
	a.x = a.x / this.conversionRatio + this.cX;
	a.y = a.y / this.conversionRatio + this.cY;
	return a;
};

function AlDrawState(){
	this.circles = [];
	this.points = [];
	this.next = null;
	this.previous = null;
}

AlDrawState.prototype.start = function(){
	var i, initRad = 1;
	this.circles.push(new Circle(new Point(0, 0), 1));
	this.points.push(new Point(0, 0));
	for (i = 0; i < 6; i++){
		this.points.push(new Point(initRad * Math.cos(i * Math.PI / 3), initRad * Math.sin(i * Math.PI / 3)));
	}
};

AlDrawState.prototype.nearestPoint = function(click){
	var ret = this.points[0];
	var minDist = click.dist(ret);
	var length = this.points.length;
	for (var i = 1; i < length; i++){
		var p = this.points[i];
		if (click.dist(p) < minDist){
			ret = p;
			minDist = click.dist(ret);
		}
	}
	return ret;
};

AlDrawState.prototype.addAllIntersections = function(intersectable){
	var i, length;
	length = this.circles.length;
	for (i = 0; i < length; i++){
		this.points = this.points.concat(intersectable.intersection(this.circles[i]));
	}
};

AlDrawState.prototype.addCircleWithIntersections = function(circle){
	this.addAllIntersections(circle);
	this.addCircleWithoutIntersections(circle);
};

AlDrawState.prototype.addCircleWithoutIntersections = function(circle){
	var i, length;
	length = this.circles.length;
	for (i = 0; i < length; i++){
		if (circle.same(this.circles[i])){
			return;
		}
	}
	this.circles.push(circle);
};

AlDrawState.prototype.copy = function(){
	var i, length;
	var newState = new AlDrawState();
	newState.circles = this.circles.slice(0); //Copies the array
	newState.points = this.points.slice(0);
	return newState;
};

AlDrawState.prototype.draw = function(context, converter){
	var i, length;
	length = this.circles.length;
	for (i = 0; i < length; i++){
		this.circles[i].draw(context, converter);
	}
	length = this.points.length;
	for (i = 0; i < length; i++){
		this.points[i].draw(context, converter);
	}
};

function InputStrategy(name, pointsNeeded){
	this.name = name;
	this.pointsNeeded = pointsNeeded;
}

InputStrategy.prototype.shadowHook = function(p1, p2, p3){
	return []
};

InputStrategy.prototype.press = function(x, y){
	selectNearestPoint(new Point(x, y));
	if (selectedPoints.length === this.pointsNeeded){
		this.endHook();
		selectedPoints = [];
	}	
};

InputStrategy.prototype.release = function(x, y){
	//If # of selected points === 1
	//this.press(x,  y);
};

InputStrategy.prototype.click = function(x, y){
	this.release(x, y);
};

InputStrategy.prototype.drag = function(x, y){
	//TODO...
};

var drawCircleInputStrategy = new InputStrategy("Draw Circle", 2);

drawCircleInputStrategy.calculateCircle = function(p1, p2){
	return new Circle(p1, p1.dist(p2));
};

drawCircleInputStrategy.endHook = function(){
	addCircle(this.calculateCircle(selectedPoints[0], selectedPoints[1]));
};

drawCircleInputStrategy.shadowHook = function(p1, p2){
	//TODO This will require a little more thought
};

function resizeCanvas(){
	var canvas = document.getElementById("myCanvas");
	canvas.width = 0;
	canvas.height = 0;
	canvas.width = $("#viewport").width();
	canvas.height = $("#viewport").height();
	converter.width = canvas.width;
	converter.height = canvas.height;
}

var currentState = new AlDrawState();
var converter = new CoordinateConverter();
currentState.start();
var inputStrategy = drawCircleInputStrategy;
var selectedPoints = [];
var ctx;

function selectNearestPoint(p){
	selectPoint(currentState.nearestPoint(converter.screenToAbstractCoord(p)));
}

function selectPoint(p){
	var isNew = true;
	var length = selectedPoints.length;
	for (var i = 0; i < length; i++){
		if (p.equals(selectedPoints[i])){
			isNew = false;
			break;
		}
	}
	if (isNew){
		selectedPoints.push(p);
	}
	updateView(ctx, converter);
}

function addCircle(circle){
	var newState = currentState.copy();
	newState.addCircleWithIntersections(circle);
	addState(newState);
	updateView(ctx, converter);
}

function addState(newState){
	currentState.next = newState;
	newState.previous = currentState;
	currentState = newState;
}

function updateView(context, converter){
	context.clearRect(0, 0, context.canvas.width, context.canvas.height);
	currentState.draw(context, converter);
	var length = selectedPoints.length;
	for (var i = 0; i < length; i++){
		selectedPoints[i].draw(context, converter, new Color(255, 0, 0));
	}
}

$(document).ready(function(){
	var canvas = document.getElementById("myCanvas");
	resizeCanvas();
	converter.conversionRatio = Math.min(converter.width, converter.height)/2;
	ctx = canvas.getContext("2d");
	ctx.linewidth = 2;
	currentState.draw(ctx, converter);
	
	$(window).resize(function(){
		resizeCanvas();
		currentState.draw(ctx, converter);
	});
	
	$("#myCanvas").mousewheel(function(ev){
		if (ev.deltaY > 0){
			converter.zoomIn(ev.offsetX, ev.offsetY);
		} else {
			converter.zoomOut(ev.offsetX, ev.offsetY);
		}
		updateView(ctx, converter);
	});
	
	$("#myCanvas").mousedown(function(ev){
		inputStrategy.press(ev.offsetX, ev.offsetY);
	});
	
	$("#myCanvas").mouseup(function(ev){
		inputStrategy.release(ev.offsetX, ev.offsetY);
	});
	
	$("#myCanvas").click(function(ev){
		inputStrategy.click(ev.offsetX, ev.offsetY);
	});
	
	$("#myCanvas").mousemove(function(ev){
		inputStrategy.drag(ev.offsetX, ev.offsetY);
	});
});