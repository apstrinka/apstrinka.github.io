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
	}
	
	return {
		floatsEqual: floatsEqual,
		normalizeAngle: normalizeAngle
	}
}();

function Point(x, y){
	this.x = x;
	this.y = y;
}

Point.prototype.dist = function(otherPoint){
	return Math.hypot(this.x - otherPoint.x, this.y - otherPoint.y);
}

Point.prototype.angle = function(otherPoint){
	var ang = Math.atan2(otherPoint.y - this.y, otherPoint.x - this.x);
	ang = UTIL.normalizeAngle(ang);
	return ang;
}

Point.prototype.rotateAroundOrigin = function(angle)
{
	var x = Math.cos(angle) * this.x - Math.sin(angle) * this.y;
	var y = Math.sin(angle) * this.x + Math.cos(angle) * this.y;
	return new Point(x, y);
}

Point.prototype.draw = function(context, converter){
	var q = converter.abstractToScreenCoord(this)
	var style = context.fillStyle;
	context.fillStyle = "#00aa00";
	context.beginPath();
	context.arc(q.x, q.y, 6, 0, 2*Math.PI);
	context.fill();
	context.fillStyle = "#00ff00";
	context.beginPath();
	context.arc(q.x, q.y, 3, 0, 2*Math.PI);
	context.fill();
	context.fillStyle = style;
}

function Circle(center, radius){
	this.center = center;
	this.radius = radius;
}

Circle.prototype.draw = function(context, converter){
	var p = converter.abstractToScreenCoord(this.center);
	var screenRadius = converter.abstractToScreenDist(this.radius);
	context.beginPath();
	context.arc(p.x, p.y, screenRadius, 0, 2*Math.PI);
	context.stroke();
}

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
}

CoordinateConverter.prototype.zoomOut = function(x, y){
	var a = this.screenToAbstractCoord(new Point(x, y));
	var angle = new Point(this.cX, this.cY).angle(a);
	var d = new Point(this.cX, this.cY).dist(a);
	this.cX -= (this.zoomAmt - 1) * d * Math.cos(angle);
	this.cY -= (this.zoomAmt - 1) * d * Math.sin(angle);
	this.conversionRatio = this.conversionRatio / this.zoomAmt;
}

CoordinateConverter.prototype.abstractToScreenDist = function(d){
	return d * this.conversionRatio;
}

CoordinateConverter.prototype.screenToAbstractDist = function(d){
	return d / this.conversionRatio;
}

CoordinateConverter.prototype.abstractToScreenCoord = function(a){
	var x1 = (a.x - this.cX) * this.conversionRatio;
	var y1 = (a.y - this.cY) * this.conversionRatio;
	var s = new Point(x1, y1);
	s = s.rotateAroundOrigin(this.angle);
	s.x = s.x + this.width / 2;
	s.y = s.y + this.height / 2;
	return s;
}

CoordinateConverter.prototype.screenToAbstractCoord = function(s){
	var x1 = (s.x - this.width / 2);
	var y1 = (s.y - this.height / 2);
	var a = new Point(x1, y1);
	a = a.rotateAroundOrigin(-this.angle);
	a.x = a.x / this.conversionRatio + this.cX;
	a.y = a.y / this.conversionRatio + this.cY;
	return a;
}

function AlDrawState(){
	this.circles = [];
	this.points = [];
}

AlDrawState.prototype.start = function(){
	var i, initRad = 1;
	this.circles.push(new Circle(new Point(0, 0), 1));
	this.points.push(new Point(0, 0));
	for (i = 0; i < 6; i++)
	{
		this.points.push(new Point(initRad * Math.cos(i * Math.PI / 3), initRad * Math.sin(i * Math.PI / 3)));
	}
}

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
}

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

function updateView(context, converter){
	context.clearRect(0, 0, context.canvas.width, context.canvas.height);
	currentState.draw(context, converter);
}

$(document).ready(function(){
	var canvas = document.getElementById("myCanvas");
	resizeCanvas();
	converter.conversionRatio = Math.min(converter.width, converter.height)/2;
	var ctx = canvas.getContext("2d");
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
	
	$("#myCanvas").click(function(ev){
		var ctx = document.getElementById("myCanvas").getContext("2d");
		ctx.beginPath();
		ctx.arc(ev.offsetX, ev.offsetY, 5, 0, 2*Math.PI);
		ctx.fill();
	});
});