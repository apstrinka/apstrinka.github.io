"use strict";

var UTIL = function(){
	var floatsEqual = function(a, b){
		var defaultTolerance = 0.001;
		if (!Number.isFinite(a) && !Number.isFinite(b)){
			return true
		}
		if ((a-b) < defaultTolerance){
			return true;
		}
		return false;
	};
	
	return {
		floatsEqual: floatsEqual
	}
}();

function Point(x, y){
	this.x = x;
	this.y = y;
}

Point.prototype.dist = function(otherPoint){
	return Math.hypot(this.x - otherPoint.x, this.y - otherPoint.y);
}

Point.prototype.rotateAroundOrigin = function(angle)
{
	var x = Math.cos(angle) * this.x - Math.sin(angle) * this.y;
	var y = Math.sin(angle) * this.x + Math.cos(angle) * this.y;
	return new Point(x, y);
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
}

CoordinateConverter.prototype.abstractToScreenDist = function(d)
{
	return d * this.conversionRatio;
}

CoordinateConverter.prototype.screenToAbstractDist = function(d)
{
	return d / this.conversionRatio;
}

CoordinateConverter.prototype.abstractToScreenCoord = function(a)
{
	var x1 = (a.x - this.cX) * this.conversionRatio;
	var y1 = (a.y - this.cY) * this.conversionRatio;
	var s = new Point(x1, y1);
	s = s.rotateAroundOrigin(this.angle);
	s.x = s.x + this.width / 2;
	s.y = s.y + this.height / 2;
	return s;
}

CoordinateConverter.prototype.screenToAbstractCoord = function(s)
{
	var x1 = (s.x - this.width / 2);
	var y1 = (s.y - this.height / 2);
	var a = new Point(x1, y1);
	a = a.rotateAroundOrigin(-this.angle);
	a.x = a.x / this.conversionRatio + this.cX;
	a.y = a.y / this.conversionRatio + this.cY;
	return a;
}

function AlDrawState(){
	this.points = [];
}

AlDrawState.prototype.start = function(){
	var i, initRad = 1;
	this.points.push(new Point(0, 0));
	for (i = 0; i < 6; i++)
	{
		this.points.push(new Point(initRad * Math.cos(i * Math.PI / 3), initRad * Math.sin(i * Math.PI / 3)));
	}
}

function drawState(state, context, converter){
	var i, length;
	length = state.points.length;
	for (i = 0; i < length; i++){
		drawPoint(state.points[i], context, converter);
	}
}

function drawPoint(point, context, converter){
	console.log(point);
	var q = converter.abstractToScreenCoord(point)
	context.fillStyle = "#00aa00";
	context.beginPath();
	context.arc(q.x, q.y, 6, 0, 2*Math.PI);
	context.fill();
	context.fillStyle = "#00ff00";
	context.beginPath();
	context.arc(q.x, q.y, 3, 0, 2*Math.PI);
	context.fill();
}

var currentState = new AlDrawState();
var converter = new CoordinateConverter();
currentState.start();

$(document).ready(function(){
	var ctx = document.getElementById("myCanvas").getContext("2d");
	drawState(currentState, ctx, converter);
	
	$("#myCanvas").click(function(ev){
		var ctx = document.getElementById("myCanvas").getContext("2d");
		ctx.beginPath();
		ctx.arc(ev.offsetX, ev.offsetY, 5, 0, 2*Math.PI);
		ctx.fill();
	});
});