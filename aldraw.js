"use strict";

var AlDrawModule = (function(){
	var Utils = {
		defaultTolerance: 0.001,
		isBetween: function(middle, a, b){
			return (middle <= a + this.defaultTolerance && middle >= b - this.defaultTolerance) || (middle >= a - this.defaultTolerance && middle <= b + this.defaultTolerance);
		},
		floatsEqual: function(a, b){
			if (!Number.isFinite(a) && !Number.isFinite(b)){
				return true
			}
			if (Math.abs(a-b) < this.defaultTolerance){
				return true;
			}
			return false;
		},
		normalizeAngle: function(a){
			var b = a % (2 * Math.PI);
			if (b < 0)
				b = b + 2 * Math.PI;
			if (this.floatsEqual(b, 2 * Math.PI))
				b = 0;
			return b;
		},
		angleSum: function(a, b){
			var c = a + b;
			return normalizeAngle(c);
		},
		oppositeAngle: function(a){
			return angleSum(a, Math.PI);
		},
	};

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
		ang = Utils.normalizeAngle(ang);
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
		return Utils.floatsEqual(this.x, otherPoint.x) && Utils.floatsEqual(this.y, otherPoint.y);
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

	function Line(slope, intercept){
		this.slope = slope;
		this.intercept = intercept; //This is the y-intercept, unless the line is vertical
	}

	function Segment(p1, p2){
		this.p1 = p1;
		this.p2 = p2;
	}

	Segment.prototype.getSlope = function(){
		if (Utils.floatsEqual(this.p1.x, this.p2.x)){
			return Infinity;
		}
		return (this.p2.y - this.p1.y)/(this.p2.x - this.p1.x);
	};

	Segment.prototype.getIntercept = function(){ //returns y-intercept, unless vertical
		var m = this.getSlope();
		if (!Number.isFinite(m)){
			return this.p1.x;
		}
		return this.p1.y - m * this.p1.x;
	};

	Segment.prototype.contains = function(point){
		var x1 = p1.x;
		var y1 = p1.y;
		var x2 = p.x;
		var y2 = p.y;
		var x3 = p2.x;
		var y3 = p2.y;
		var m = this.getSlope();
		var isOn = (!Number.isFinite(m) && Utils.floatsEqual(x2,x1)) || (Utils.floatsEqual(y2 - y1, m * (x2 - x1)));
		isOn = isOn && Utils.isBetween(x2, x1, x3) && Utils.isBetween(y2, y1, y3);
		return isOn;
	};

	Segment.prototype.intersectLine = function(otherLine){
		var m1 = this.getSlope();
		var b1 = this.getIntercept();
		var m2 = otherLine.getSlope();
		var b2 = otherLine.getSlope();
		var x, y;
		if (Utils.floatsEqual(m1, m2)){
			return [];
		}
		if (!Number.isFinite(m1)){
			x = b1;
			y = m2 * x + b2;
		} else if (!Number.isFinite(m2)){
			x = b2;
			y = m1 * x + b1;
		} else {
			x = (b2 - b1) / (m1 - m2);
				y = m1 * x + b1;
		}
		var p = new Point(x, y);
		if (this.contains(p) && otherLine.contains(p)){
			return [p];
		} else {
			return [];
		}
	};

	Segment.prototype.intersectCircle = function(otherCircle){
	};

	Segment.prototype.draw = function(context, converter){
		var p1 = converter.abstractToScreenCoord(this.p1);
		var p2 = converter.abstractToScreenCoord(this.p2);
		context.beginPath();
		context.moveTo(p1.x, p1.y);
		context.lineTo(p2.x, p2.y);
		context.stroke();
	};

	function Circle(center, radius){
		this.center = center;
		this.radius = radius;
	}

	Circle.prototype.contains = function(point){
		return Utils.floatsEqual(point.dist(this.center), this.radius);
	};

	Circle.prototype.intersectLine = function(otherLine){
		return otherLine.intersectCircle(this);
	};

	Circle.prototype.intersectCircle = function(otherCircle){
		var p;
		var r1 = this.radius;
		var r2 = otherCircle.radius;
		var dist = this.center.dist(otherCircle.center);
		var ang = this.center.angle(otherCircle.center);
		if (this.center.equals(otherCircle.center)){
			return [];
		}
		if (Utils.floatsEqual(dist, r1 + r2)){
			p = this.center.translate(r1 * Math.cos(ang), r1 * Math.sin(ang));
			if (!this.contains(p) || !otherCircle.contains(p)){
				return [];
			} else {
				return [p];
			}
		}
		if (Utils.floatsEqual(dist, Math.abs(r1 - r2))){
			p = this.center.translate(r1 * Math.cos(ang), r1 * Math.sin(ang));
			if (r1 < r2){
				p = this.center.translate(r1 * Math.cos(Utils.oppositeAngle(ang)), r1 * Math.sin(Utils.oppositeAngle(ang)));
			}
			if (!this.contains(p) || !otherCircle.contains(p)){
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
		return (this.center.equals(otherCircle.center) && Utils.floatsEqual(this.radius, otherCircle.radius));
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
		this.segments = [];
		this.circles = [];
		this.points = [];
		this.next = null;
		this.previous = null;
	}

	AlDrawState.prototype.start = function(){
		var i, initRad = 1;
		this.segments.push(new Segment(new Point(0, 1), new Point(1, 0)));
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
			this.points = this.points.concat(intersectable.intersectCircle(this.circles[i]));
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
		newState.segments = this.segments.slice(0);//Copies the array
		newState.circles = this.circles.slice(0); 
		newState.points = this.points.slice(0);
		return newState;
	};

	AlDrawState.prototype.draw = function(context, converter){
		var i, length;
		length = this.segments.length;
		for (i = 0; i < length; i++){
			this.segments[i].draw(context, converter);
		}
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
	
	function setContext(context){
		ctx = context;
	}
	
	function getContext(){
		return ctx;
	}

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
		selectedPoints = [];
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
	
	return {
		converter: converter,
		currentState: currentState,
		inputStrategy: inputStrategy,
		setContext: setContext,
		getContext: getContext,
		resizeCanvas: resizeCanvas,
		updateView: updateView
	};
})();

$(document).ready(function(){
	var canvas = document.getElementById("myCanvas");
	AlDrawModule.resizeCanvas();
	AlDrawModule.converter.conversionRatio = Math.min(AlDrawModule.converter.width, AlDrawModule.converter.height)/2;
	AlDrawModule.setContext(canvas.getContext("2d"));
	AlDrawModule.getContext().linewidth = 2;
	AlDrawModule.currentState.draw(AlDrawModule.getContext(), AlDrawModule.converter);
	
	$(window).resize(function(){
		AlDrawModule.resizeCanvas();
		AlDrawModule.currentState.draw(AlDrawModule.getContext(), AlDrawModule.converter);
	});
	
	$("#myCanvas").mousewheel(function(ev){
		if (ev.deltaY > 0){
			AlDrawModule.converter.zoomIn(ev.offsetX, ev.offsetY);
		} else {
			AlDrawModule.converter.zoomOut(ev.offsetX, ev.offsetY);
		}
		AlDrawModule.updateView(ctx, converter);
	});
	
	$("#myCanvas").mousedown(function(ev){
		AlDrawModule.inputStrategy.press(ev.offsetX, ev.offsetY);
	});
	
	$("#myCanvas").mouseup(function(ev){
		AlDrawModule.inputStrategy.release(ev.offsetX, ev.offsetY);
	});
	
	$("#myCanvas").click(function(ev){
		AlDrawModule.inputStrategy.click(ev.offsetX, ev.offsetY);
	});
	
	$("#myCanvas").mousemove(function(ev){
		AlDrawModule.inputStrategy.drag(ev.offsetX, ev.offsetY);
	});
});