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
		midPoint: function(p1, p2){
			var x = (p1.x + p2.x)/2;
			var y = (p1.y + p2.y)/2;
			return new Point(x, y);
		},
		perpendicularSlope: function(slope){
			var ret = Number.POSITIVE_INFINITY;
			if (!Utils.floatsEqual(slope, 0)){
				ret = -1/slope;
			}
			return ret;
		},
		// Returns 1 if the point is above the line, -1 if below, and 0 if on.
		// For vertical lines, a higher x coordinate is considered above.
		comparePointToLine: function(point, line){
			var slope = line.getSlope();
			var intercept = line.getIntercept();
			var ret = 0;
			if (!Number.isFinite(slope)){
				if (Utils.floatsEqual(point.x, intercept)){
					ret = 0;
				} else if (point.x > intercept){
					ret = 1;
				} else {
					ret = -1;
				}
			} else {
				var lY = slope * point.x + intercept;
				if (Utils.floatsEqual(point.y, lY)){
					ret = 0;
				} else if (point.y > lY){
					ret = 1;
				} else {
					ret = -1;
				}
			}
			return ret;
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
			return Utils.normalizeAngle(c);
		},
		angleDifference: function(a, b){
			var c = a - b;
			c = Utils.normalizeAngle(c);
			return c;
		},
		smallerAngleDifference: function(a, b){
			return Math.min(Utils.angleDifference(a, b), Utils.angleDifference(b, a));
		},
		oppositeAngle: function(a){
			return Utils.angleSum(a, Math.PI);
		},
		angleToSlope: function(a){
			var s = Math.tan(a);
			if (Utils.floatsEqual(a, Math.PI/2) || Utils.floatsEqual(a, 3*Math.PI/2)){
				s = Number.POSITIVE_INFINITY;
			}
			return s;
		},
		slopeToAngle: function(s){
			var a = Math.atan(s);
			a = Utils.normalizeAngle(a);
			return a;
		},
		arrayContains: function(arr, x){
			var length = arr.length;
			for (var i = 0; i < length; i++){
				if (x.equals(arr[i])){
					return true;
				}
			}
			return false;
		}
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
	
	var abstractLine = {
		getSlope: function(){
			console.log("getSlope() hasn't been implemented");
			console.trace();
		},
		getIntercept: function(){
			console.log("getIntercept() hasn't been implemented");
			console.trace();
		},
		contains: function(){
			console.log("contains() hasn't been implemented");
			console.trace();
		},
		distance: function(p){
			var m = this.getSlope();
			var b = this.getIntercept();
			var x = p.x;
			var y = p.y;
			var dist = 0;
			if (!Number.isFinite(m)){
				dist = Math.abs(x - b);
			} else {
				dist = Math.abs(y - m * x - b) / Math.hypot(m, 1);
			}
			return dist;
		},
		curvature: function(){
			return 0;
		},
		intersectLine: function(otherLine){
			var m1 = this.getSlope();
			var b1 = this.getIntercept();
			var m2 = otherLine.getSlope();
			var b2 = otherLine.getIntercept();
			if (Utils.floatsEqual(m1, m2)){
				return [];
			}
			var x, y;
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
			var ret = new Point(x, y);
			if (this.contains(ret) && otherLine.contains(ret))
				return [ret];
			else
				return [];
		},
		intersectCircle: function(otherCircle){
			var xc = otherCircle.center.x;
			var yc = otherCircle.center.y;
			var r = otherCircle.radius;
			var m = this.getSlope();
			var intercept = this.getIntercept();
			var temp = [];
			var ret = [];
			if (Utils.floatsEqual(this.distance(otherCircle.center), r)){
				var tan = this.closestPoint(otherCircle.center);
				if (otherCircle.contains(tan)){
					return [tan];
				} else {
					return [];
				}
			}
			if (!Number.isFinite(m)){
				if (intercept < xc - r || intercept > xc + r){
					return [];
				}
				temp.push(new Point(intercept, yc + Math.sqrt(Math.pow(r, 2) - Math.pow(intercept - xc, 2))));
				temp.push(new Point(intercept, yc - Math.sqrt(Math.pow(r, 2) - Math.pow(intercept - xc, 2))));
			} else {
				var a = 1 + Math.pow(m, 2);
				var b = 2 * (m * intercept - xc - m * yc);
				var c = Math.pow(xc, 2) + Math.pow(intercept, 2) - 2 * intercept * yc + Math.pow(yc, 2) - Math.pow(r, 2);
				var d = Math.pow(b, 2) - 4 * a * c;
				if (d < 0)
					return [];
				var x = (-b + Math.sqrt(d)) / (2 * a);
				temp.push(new Point(x, m * x + intercept));
				x = (-b - Math.sqrt(d)) / (2 * a);
				temp.push(new Point(x, m * x + intercept));
			}
			var i, length = temp.length;
			for (i = 0; i < length; i++){
				if (this.contains(temp[i]) && otherCircle.contains(temp[i])){
					ret.push(temp[i]);
				}
			}
			return ret;
		},
		parallel: function(otherLine){
			return Utils.floatsEqual(this.getSlope(), otherLine.getSlope());
		},
		same: function(otherLine){
			return Utils.floatsEqual(this.getSlope(), otherLine.getSlope()) && Utils.floatsEqual(this.getIntercept(), otherLine.getIntercept());
		}
	};
	
	function newLineFromTwoPoints(p1, p2){
		var slope, intercept;
		if (Utils.floatsEqual(p1.x, p2.x)){
			slope = Number.POSITIVE_INFINITY;
		} else {
			slope = (p2.y - p1.y) / (p2.x - p1.x);
		}
		
		if (!Number.isFinite(slope)){
			intercept = p1.x;
		} else {
			intercept = p1.y - slope * p1.x;
		}
		
		return new Line(slope, intercept);
	}
	
	function newLineFromPointSlope(p, slope){
		var intercept;
		if (!Number.isFinite(slope)){
			intercept = p.x;
		} else {
			intercept = p.y - slope * p.x;
		}
		return new Line(slope, intercept);
	}

	function Line(slope, intercept){
		this.slope = slope;
		this.intercept = intercept; //This is the y-intercept, unless the line is vertical
	}
	
	Line.prototype = Object.create(abstractLine);
	
	Line.prototype.getSlope = function(){
		return this.slope;
	};
	
	Line.prototype.getIntercept = function(){
		return this.intercept;
	};
	
	Line.prototype.closestPoint = function(p){
		var slope = 0;
		if (Utils.floatsEqual(this.getSlope(), 0)){
			slope = Number.POSITIVE_INFINITY;
		} else if (Number.isFinite(this.getSlope())){
			slope = -1/this.getSlope();
		}
		var otherLine = newLineFromPointSlope(p, slope);
		var intersection = this.intersectLine(otherLine);
		return intersection[0];
	};
	
	Line.prototype.contains = function(p){
		if(!Number.isFinite(this.slope)){
			return Utils.floatsEqual(this.intercept, p.x);
		} else {
			return Utils.floatsEqual(p.y, this.slope*p.x + this.intercept);
		}
	};
	
	Line.prototype.getPortionInsideRectangle = function(bounds){
		var points = [];
		var length = bounds.length;
		for (var i = 0; i < length; i++){
			var intersections = this.intersectLine(bounds[i]);
			var length2 = intersections.length;
			for (var j = 0; j < length2; j++){
				if (!Utils.arrayContains(points, intersections[j])){
					points.push(intersections[j]);
				}
			}
		}
		if (points.length >= 2){
			return new Segment(points[0], points[1]);
		} else {
			return null;
		}
	};
	
	Line.prototype.draw = function(context, converter){
		var bounds = converter.getAbstractBoundaries();
		var drawSegment = this.getPortionInsideRectangle(bounds);
		if (drawSegment != null){
			drawSegment.draw(context, converter);
		}
	};
	
	function newRayFromTwoPoints(p1, p2){
		var angle = p1.angle(p2);
		return new Ray(p1, angle);
	}
	
	function Ray(start, angle){
		this.start = start;
		this.angle = angle;
	}
	
	Ray.prototype = Object.create(abstractLine);
	
	Ray.prototype.getSlope = function(){
		var ret = 0;
		if (Utils.floatsEqual(this.angle, Math.PI/2)){
			ret = Number.POSITIVE_INFINITY;
		} else if (Utils.floatsEqual(this.angle, 3*Math.PI/2)){
			ret = Number.NEGATIVE_INFINITY;
		} else {
			ret = Math.tan(this.angle);
		}
		return ret;
	};
	
	Ray.prototype.getIntercept = function(){
		var slope = this.getSlope();
		if (!Number.isFinite(slope)){
			return this.start.x;
		} else {
			return this.start.y - slope*this.start.x;
		}
	};
	
	Ray.prototype.closestPoint = function(p){
		var slope = 0;
		if (Utils.floatsEqual(this.getSlope(), 0)){
			slope = Number.POSITIVE_INFINITY;
		} else if (Number.isFinite(this.getSlope())){
			slope = -1/this.getSlope();
		}
		var otherLine = newLineFromPointSlope(p, slope);
		var intersection = this.intersectLine(otherLine);
		if (intersection.length > 0){
			return intersection[0];
		} else {
			return this.start;
		}
	};
		
	Ray.prototype.contains = function(p){
		var pAng = this.start.angle(p);
		return Utils.floatsEqual(pAng, this.angle) || p.equals(this.start);
	};
		
	Ray.prototype.getPortionInsideRectangle = function(bounds){
		var points = [this.start];
		var length = bounds.length;
		for (var i = 0; i < length; i++){
			var intersections = this.intersectLine(bounds[i]);
			var length2 = intersections.length;
			for (var j = 0; j < length2; j++){
				if (!Utils.arrayContains(points, intersections[j])){
					points.push(intersections[j]);
				}
			}
		}
		if (points.length === 2){
			return new Segment(points[0], points[1]);
		} else if (points.length > 2){
			return new Segment(points[1], points[2]);
		} else {
			return null;
		}
	};
	
	Ray.prototype.draw = function(context, converter){
		var bounds = converter.getAbstractBoundaries();
		var drawSegment = this.getPortionInsideRectangle(bounds);
		if (drawSegment != null){
			drawSegment.draw(context, converter);
		}
	};
		
	function Segment(p1, p2){
		this.p1 = p1;
		this.p2 = p2;
	}
	
	Segment.prototype = Object.create(abstractLine);

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
	
	Segment.prototype.closestPoint = function(p){
		var slope = 0;
		if (Utils.floatsEqual(this.getSlope(), 0)){
			slope = Number.POSITIVE_INFINITY;
		} else if (Number.isFinite(this.getSlope())){
			slope = -1/this.getSlope();
		}
		var otherLine = newLineFromPointSlope(p, slope);
		var intersection = this.intersectLine(otherLine);
		if (intersection.length > 0){
			return intersection[0];
		} else if (p.dist(this.p1) > p.dist(this.p2)){
				return this.p2;
		} else {
			return this.p1;
		}
	};

	Segment.prototype.contains = function(point){
		var x1 = this.p1.x;
		var y1 = this.p1.y;
		var x2 = point.x;
		var y2 = point.y;
		var x3 = this.p2.x;
		var y3 = this.p2.y;
		var m = this.getSlope();
		var isOn = (!Number.isFinite(m) && Utils.floatsEqual(x2,x1)) || (Utils.floatsEqual(y2 - y1, m * (x2 - x1)));
		isOn = isOn && Utils.isBetween(x2, x1, x3) && Utils.isBetween(y2, y1, y3);
		return isOn;
	};
	
	Segment.prototype.isIn = function(otherSegment){
		return otherSegment.contains(this.p1) && otherSegment.contains(this.p2);
	};

	Segment.prototype.draw = function(context, converter){
		var p1 = converter.abstractToScreenCoord(this.p1);
		var p2 = converter.abstractToScreenCoord(this.p2);
		context.beginPath();
		context.moveTo(p1.x, p1.y);
		context.lineTo(p2.x, p2.y);
		context.stroke();
	};
	
	Segment.prototype.equals = function(otherSegment){
		return (this.p1.equals(otherSegment.p1) && this.p2.equals(otherSegment.p2)) || (this.p1.equals(otherSegment.p2) && this.p2.equals(otherSegment.p1));
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
	
	function newArcFromThreePoints(p1, p2, p3){
		var center = p1;
		var radius = p1.dist(p2);
		var start = p1.angle(p2);
		var sweep = Utils.angleDifference(p1.angle(p3), start);
		return new Arc(center, radius, start, sweep);
	}
	
	function Arc(center, radius, start, sweep, inverse){
		this.center = center;
		this.radius = radius;
		this.start = start;
		this.sweep = sweep;
		if (inverse === undefined){
			this.inverse = false;
		} else {
			this.inverse = inverse;
		}
	}
	
	Arc.prototype = Object.create(Circle.prototype);
	
	Arc.prototype.getEnd = function(){
		return Utils.angleSum(this.start, this.sweep);
	};
	
	Arc.prototype.contains = function(point){
		var d = this.center.dist(point);
		if (!Utils.floatsEqual(d, this.radius)){
			return false;
		}
		var ang = this.center.angle(point);
		return Utils.angleDifference(ang, this.start) < this.sweep || Utils.floatsEqual(ang, this.start) || Utils.floatsEqual(ang, this.getEnd());
	};
	
	Arc.prototype.isIn = function(otherArc){
		var startIsIn = Utils.angleDifference(this.start, otherArc.start) <= otherArc.sweep;
		var theRestIsIn = this.sweep < Utils.angleDifference(otherArc.getEnd(), this.start);
		return startIsIn && theRestIsIn;
	};
	
	Arc.prototype.draw = function(context, converter){
		var p = converter.abstractToScreenCoord(this.center);
		var screenRadius = converter.abstractToScreenDist(this.radius);
		context.beginPath();
		context.arc(p.x, p.y, screenRadius, this.start, this.getEnd());
		context.stroke();
	};
	
	Arc.prototype.equals = function(otherArc){
		return (this.center.equals(otherArc.center) && Utils.floatsEqual(this.radius, otherArc.radius) && Utils.floatsEqual(this.start, otherArc.start) && Utils.floatsEqual(this.sweep, otherArc.sweep));
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
	
	CoordinateConverter.prototype.getAbstractBoundaries = function(){
		var upperLeft = this.screenToAbstractCoord(new Point(0, 0));
		var upperRight = this.screenToAbstractCoord(new Point(this.width, 0));
		var lowerRight = this.screenToAbstractCoord(new Point(this.width, this.height));
		var lowerLeft = this.screenToAbstractCoord(new Point(0, this.height));
		var ret = [];
		ret.push(new Segment(upperLeft, upperRight));
		ret.push(new Segment(upperRight, lowerRight));
		ret.push(new Segment(lowerRight, lowerLeft));
		ret.push(new Segment(lowerLeft, upperLeft));
		return ret;
	};

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
		this.rays = [];
		this.lines = [];
		this.arcs = [];
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
	
	AlDrawState.prototype.addPoints = function(newPoints){
		var length = newPoints.length;
		for (var i = 0; i < length; i++){
			if (!Utils.arrayContains(this.points, newPoints[i])){
				this.points.push(newPoints[i]);
			}
		}
	};

	AlDrawState.prototype.addAllIntersections = function(intersectable){
		var i, length;
		length = this.segments.length;
		for (i = 0; i < length; i++){
			this.addPoints(intersectable.intersectLine(this.segments[i]));
		}
		length = this.rays.length;
		for (i = 0; i < length; i++){
			this.addPoints(intersectable.intersectLine(this.rays[i]));
		}
		length = this.lines.length;
		for (i = 0; i < length; i++){
			this.addPoints(intersectable.intersectLine(this.lines[i]));
		}
		length = this.arcs.length;
		for (i = 0; i < length; i++){
			this.addPoints(intersectable.intersectCircle(this.arcs[i]));
		}
		length = this.circles.length;
		for (i = 0; i < length; i++){
			this.addPoints(intersectable.intersectCircle(this.circles[i]));
		}
	};
	
	AlDrawState.prototype.addSegmentWithIntersections = function(segment){
		this.addAllIntersections(segment);
		this.addSegmentWithoutIntersections(segment);
	};
	
	AlDrawState.prototype.addSegmentWithoutIntersections = function(segment){
		var i, length;
		length = this.lines.length;
		for (i = 0; i < length; i++){
			if (segment.same(this.lines[i])){
				return;
			}
		}
		length = this.rays.length;
		for (i = 0; i < length; i++){
			var r = this.rays[i];
			if (segment.same(r)){
				if (r.contains(segment.p1) && r.contains(segment.p2)){
					return;
				} else if (r.contains(segment.p1)){
					this.rays.splice(i, 1);
					this.addRayWithoutIntersections(new Ray(segment.p2, r.angle));
					return;
				} else if (r.contains(segment.p2)){
					this.rays.splice(i, 1);
					this.addRayWithoutIntersections(new Ray(segment.p1, r.angle));
					return;
				}
			}
		}
		length = this.segments.length;
		for (i = 0; i < length; i++){
			var s = this.segments[i];
			if (segment.same(s)){
				if (segment.isIn(s)){
					return;
				} else if (s.isIn(segment)){
					this.segments.splice(i, 1);
					i--;
					length--;
				} else if (segment.contains(s.p1) && s.contains(segment.p1)){
					segment = new Segment(segment.p2, s.p2);
					this.segments.splice(i, 1);
					i--;
					length--;
				} else if (segment.contains(s.p1) && s.contains(segment.p2)){
					segment = new Segment(segment.p1, s.p2);
					this.segments.splice(i, 1);
					i--;
					length--;
				} else if (segment.contains(s.p2) && s.contains(segment.p1)){
					segment = new Segment(segment.p2, s.p1);
					this.segments.splice(i, 1);
					i--;
					length--;
				} else if (segment.contains(s.p2) && s.contains(segment.p2)){
					segment = new Segment(segment.p1, s.p1);
					this.segments.splice(i, 1);
					i--;
					length--;
				}
			}
		}
		this.segments.push(segment);
	};
	
	AlDrawState.prototype.addRayWithIntersections = function(ray){
		this.addAllIntersections(ray);
		this.addRayWithoutIntersections(ray);
	};
	
	AlDrawState.prototype.addRayWithoutIntersections = function(ray){
		var i, length;
		length = this.lines.length;
		for (i = 0; i < length; i++){
			if (ray.same(this.lines[i])){
				return;
			}
		}
		length = this.rays.length;
		for (i = 0; i < length; i++){
			var r = this.rays[i];
			if (ray.same(r)){
				if (Utils.floatsEqual(ray.angle, r.angle)){
					if (ray.contains(r.start)){
						this.rays.splice(i, 1); //Remove the ith element
						i--;
						length--;
					} else {
						return;
					}
				} else {
					if (ray.contains(r.start)){
						this.rays.splice(i, 1);
						this.addLineWithoutIntersections(new Line(ray.getSlope(), ray.getIntercept()));
						return;
					}
				}
			}
		}
		length = this.segments.length;
		for (i = 0; i < length; i++){
			var s = this.segments[i];
			if (ray.same(s)){
				if (ray.contains(s.p1) && ray.contains(s.p2)){
					this.segments.splice(i, 1);
					i--;
					length--;
				} else if (ray.contains(s.p1)){
					ray = new Ray(s.p2, ray.angle);
					this.segments.splice(i, 1);
					i--;
					length--;
				} else if (ray.contains(s.p2)){
					ray = new Ray(s.p1, ray.angle);
					this.segments.splice(i, 1);
					i--;
					length--;
				}
			}
		}
		this.rays.push(ray);
	};
	
	AlDrawState.prototype.addLineWithIntersections = function(line){
		this.addAllIntersections(line);
		this.addLineWithoutIntersections(line);
	};
	
	AlDrawState.prototype.addLineWithoutIntersections = function(line){
		var i, length;
		length = this.lines.length;
		for (i = 0; i < length; i++){
			if (line.same(this.lines[i])){
				return;
			}
		}
		function notSame(el){
			return !line.same(el);
		}
		this.segments = this.segments.filter(notSame);
		this.rays = this.rays.filter(notSame);
		this.lines.push(line);
	};
	
	AlDrawState.prototype.addArcWithIntersections = function(arc){
		this.addAllIntersections(arc);
		this.addArcWithoutIntersections(arc);
	};
	
	AlDrawState.prototype.addArcWithoutIntersections = function(arc){
		var i, length;
		length = this.circles.length;
		for (i = 0; i < length; i++){
			if (arc.same(this.circles[i])){
				return;
			}
		}
		length = this.arcs.length;
		for (i = 0; i < length; i++){
			var a = this.arcs[i];
			if (arc.same(a)){
				if (arc.isIn(a)){
					return;
				} else if (a.isIn(arc)){
					this.arcs.splice(i, 1); //Remove the ith element
					i--;
					length--;
				} else if (Utils.floatsEqual(arc.start, a.getEnd()) && Utils.floatsEqual(arc.getEnd(), a.start)){
					this.arcs.splice(i, 1);
					this.addCircleWithoutIntersections(new Circle(arc.center, arc.radius));
					return;
				} else if (Utils.floatsEqual(arc.start, a.getEnd()) && Utils.angleDifference(arc.getEnd(), a.start) < a.sweep) {
					this.arcs.splice(i, 1);
					this.addCircleWithoutIntersections(new Circle(arc.center, arc.radius));
					return;
				} else if (Utils.angleDifference(arc.start, a.start) < a.sweep && Utils.angleDifference(arc.getEnd(), a.start) < a.sweep) {
					this.arcs.splice(i, 1);
					this.addCircleWithoutIntersections(new Circle(arc.center, arc.radius));
					return;
				} else if (Utils.angleDifference(arc.start, a.start) < a.sweep) {
					this.arcs.splice(i, 1);
					i--;
					length--;
					arc = new Arc(arc.center, arc.radius, a.start, Utils.angleDifference(arc.getEnd(), a.start));
				} else if (Utils.angleDifference(arc.getEnd(), a.start) < a.sweep) {
					this.arcs.splice(i, 1);
					i--;
					length--;
					arc = new Arc(arc.center, arc.radius, arc.start, Utils.angleDifference(a.getEnd(), arc.start));
				}
			}
		}
		this.arcs.push(arc);
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
		function notSame(el){
			return !circle.same(el);
		}
		this.arcs = this.arcs.filter(notSame);
		this.circles.push(circle);
	};
	
	AlDrawState.prototype.removeSegment = function(segment){
		var i, length;
		length = this.segments.length;
		for (i = 0; i < length; i++){
			var s = this.segments[i];
			if (segment.same(s)){
				if (segment.equals(s) || s.isIn(segment)){
					this.segments.splice(i,1);
					i--;
					length--;
				} else if (segment.isIn(s)){
					var sp1 = s.p1;
					var sp2 = s.p2;
					var tp1 = segment.p1;
					var tp2 = segment.p2;
					if (Utils.floatsEqual(sp1.x, sp2.x)){
						if (sp2.y < sp1.y){
							sp1 = s.p2;
							sp2 = s.p1;
						}
						if (tp2.y < tp1.y){
							tp1 = segment.p2;
							tp2 = segment.p1;
						}
					} else {
						if (sp2.x < sp1.x){
							sp1 = s.p2;
							sp2 = s.p1;
						}
						if (tp2.x < tp1.x){
							tp1 = segment.p2;
							tp2 = segment.p1;
						}
					}
					this.segments.splice(i, 1);
					this.addSegmentWithoutIntersections(new Segment(sp1, tp1));
					this.addSegmentWithoutIntersections(new Segment(tp2, sp2));
					i--;
					length--;
				} else if (segment.contains(s.p1)){
					this.segments.splice(i, 1);
					if (s.contains(segment.p1)){
						this.addSegmentWithoutIntersections(new Segment(segment.p1, s.p2));
					} else {
						this.addSegmentWithoutIntersections(new Segment(segment.p2, s.p2));
					}
					i--;
					length--;
				} else if (segment.contains(s.p2)){
					this.segments.splice(i, 1);
					if (s.contains(segment.p1)){
						this.addSegmentWithoutIntersections(new Segment(segment.p1, s.p1));
					} else {
						this.addSegmentWithoutIntersections(new Segment(segment.p2, s.p1));
					}
					i--;
					length--;
				}
			}
		}
		length = this.rays.length;
		for (i = 0; i < length; i++){
			var r = this.rays[i];
			if (segment.same(r)){
				if (r.contains(segment.p1) && r.contains(segment.p2)){
					var t = new Segment(r.start, segment.p1);
					var start = segment.p2;
					if (t.contains(segment.p2)){
						t = new Segment(r.start, segment.p2);
						start = segment.p1;
					}
					this.rays.splice(i, 1);
					this.addRayWithoutIntersections(new Ray(start, r.angle));
					if (!t.p1.equals(t.p2)){
						this.addSegmentWithoutIntersections(t);
					}
					i--;
					length--;
				} else if (r.contains(segment.p1) && !r.start.equals(segment.p1)){
					this.rays.splice(i, 1);
					this.addRayWithoutIntersections(new Ray(segment.p1, r.angle));
					i--;
					length--;
				} else if (r.contains(segment.p2) && !r.start.equals(segment.p2)){
					this.rays.splice(i, 1);
					this.addRayWithoutIntersections(new Ray(segment.p2, r.angle));
					i--;
					length--;
				}
			}
		}
		length = this.lines.length;
		for (i = 0; i < length; i++){
			var l = this.lines[i];
			if (segment.same(l)){
				var ang1 = Utils.slopeToAngle(l.slope);
				var ang2 = Utils.oppositeAngle(ang1);
				var r1 = new Ray(segment.p1, ang1);
				var r2 = new Ray(segment.p2, ang2);
				if (r1.contains(segment.p2) || r2.contains(segment.p1)){
					r1 = new Ray(segment.p1, ang2);
					r2 = new Ray(segment.p2, ang1);
				}
				this.lines.splice(i, 1);
				this.addRayWithoutIntersections(r1);
				this.addRayWithoutIntersections(r2);
				i--;
				length--;
			}
		}
	}
	
	AlDrawState.prototype.removeRay = function(ray){
		var i, length;
		length = this.segments.length;
		for (i = 0; i < length; i++){
			var s = this.segments[i];
			if (ray.same(s)){
				if (ray.contains(s.p1) && ray.contains(s.p2)){
					this.segments.splice(i, 1);
					i--;
					length--;
				} else if (ray.contains(s.p1)){
					this.segments.splice(i, 1);
					this.addSegmentWithoutIntersections(new Segment(s.p2, ray.start));
					i--;
					length--;
				} else if (ray.contains(s.p2)){
					this.segments.splice(i, 1);
					this.addSegmentWithoutIntersections(new Segment(s.p1, ray.start));
					i--;
					length--;
				}
			}
		}
		length = this.rays.length;
		for (i = 0; i < length; i++){
			var r = this.rays[i];
			if (ray.same(r)){
				if (Utils.floatsEqual(ray.angle, r.angle)){
					if (ray.contains(r.start)){
						this.rays.splice(i, 1);
						i--;
						length--;
					} else {
						this.rays.splice(i, 1);
						this.addSegmentWithoutIntersections(new Segment(ray.start, r.start));
						i--;
						length--;
					}
				} else {
					if (ray.contains(r.start) && !ray.start.equals(r.start)){
						this.rays.splice(i, 1);
						this.addRayWithoutIntersections(new Ray(ray.start, r.angle));
						i--;
						length--;
					}
				}
			}
		}
		length = this.lines.length;
		for (i = 0; i < length; i++){
			var l = this.lines[i];
			if (ray.same(l)){
				this.lines.splice(i, 1);
				this.addRayWithoutIntersections(new Ray(ray.start, Utils.oppositeAngle(ray.angle)));
				i--;
				length--;
			}
		}
	};
	
	AlDrawState.prototype.removeLine = function(line){
		var i, length;
		length = this.segments.length;
		for (i = 0; i < length; i++){
			var s = this.segments[i];
			if (line.same(s)){
				this.segments.splice(i, 1);
				i--;
				length--;
			}
		}
		length = this.rays.length;
		for (i = 0; i < length; i++){
			var r = this.rays[i];
			if (line.same(r)){
				this.rays.splice(i, 1);
				i--;
				length--;
			}
		}
		length = this.lines.length;
		for (i = 0; i < length; i++){
			var l = this.lines[i];
			if (line.same(l)){
				this.lines.splice(i, 1);
				i--;
				length--;
			}
		}
	};
	
	AlDrawState.prototype.removeArc = function(arc){
		var i, length;
		length = this.arcs.length;
		for (i = 0; i < length; i++){
			var a = this.arcs[i];
			if (arc.same(a)){
				if (arc.equals(a) || a.isIn(arc)){
					console.log("1st if");
					this.arcs.splice(i, 1);
					i--;
					length--;
				} else if (arc.isIn(a)){
					console.log("2nd if");
					this.arcs.splice(i, 1);
					if (!Utils.floatsEqual(arc.start, a.start)){
						this.addArcWithoutIntersections(new Arc(arc.center, arc.radius, a.start, Utils.angleDifference(arc.start, a.start)));
					}
					if (!Utils.floatsEqual(a.getEnd(), arc.getEnd())){
						this.addArcWithoutIntersections(new Arc(arc.center, arc.radius, arc.getEnd(), Utils.angleDifference(a.getEnd(), arc.getEnd())));
					}
					i--;
					length--;
				} else if (Utils.angleDifference(arc.start, a.start) < a.sweep && Utils.angleDifference(arc.getEnd(), a.start) < a.sweep){
					console.log("3rd if");
					this.arcs.splice(i, 1);
					this.addArcWithoutIntersections(new Arc(arc.center, arc.radius, arc.getEnd(), Utils.angleDifference(arc.start, arc.getEnd())));
					i--;
					length--;
				} else if (Utils.angleDifference(arc.start, a.start) < a.sweep){
					console.log("4th if");
					this.arcs.splice(i, 1);
					this.addArcWithoutIntersections(new Arc(arc.center, arc.radius, a.start, Utils.angleDifference(arc.start, a.start)));
					i--;
					length--;
				} else if (Utils.angleDifference(arc.getEnd(), a.start) < a.sweep){
					console.log("5th if");
					this.arcs.splice(i, 1);
					this.addArcWithoutIntersections(new Arc(arc.center, arc.radius, arc.getEnd(), Utils.angleDifference(a.getEnd(), arc.getEnd())));
					i--;
					length--;
				}
			}
		}
		length = this.circles.length;
		for (i = 0; i < length; i++){
			var c = this.circles[i];
			if (arc.same(c)){
				this.circles.splice(i, 1);
				this.addArcWithoutIntersections(new Arc(arc.center, arc.radius, arc.getEnd(), Utils.angleDifference(2*Math.PI, arc.sweep)));
				i--;
				length--;
			}
		}
	};
	
	AlDrawState.prototype.removeCircle = function(circle){
		var i, length;
		length = this.arcs.length;
		for (i = 0; i < length; i++){
			var a = this.arcs[i];
			if (circle.same(a)){
				this.arcs.splice(i, 1);
				i--;
				length--;
			}
		}
		length = this.circles.length;
		for (i = 0; i < length; i++){
			var c = this.circles[i];
			if (circle.same(c)){
				this.circles.splice(i, 1);
				i--;
				length--;
			}
		}
	};
	
	AlDrawState.prototype.removePoint = function(point){
		var i, length;
		length = this.points.length;
		for (i = 0; i < length; i++){
			if (point.equals(this.points[i])){
				this.points.splice(i, 1);
				i--;
				length--;
			}
		}
	};

	AlDrawState.prototype.copy = function(){
		var i, length;
		var newState = new AlDrawState();
		newState.segments = this.segments.slice(0);//Copies the array
		newState.rays = this.rays.slice(0);
		newState.lines = this.lines.slice(0);
		newState.arcs = this.arcs.slice(0);
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
		length = this.rays.length;
		for (i = 0; i < length; i++){
			this.rays[i].draw(context, converter);
		}
		length = this.lines.length;
		for (i = 0; i < length; i++){
			this.lines[i].draw(context, converter);
		}
		length = this.arcs.length;
		for (i = 0; i < length; i++){
			this.arcs[i].draw(context, converter);
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
	
	var drawSegmentInputStrategy = new InputStrategy("Draw Segment", 2);
	
	drawSegmentInputStrategy.endHook = function(){
		addSegment(new Segment(selectedPoints[0], selectedPoints[1]));
	};
	
	var drawRayInputStrategy = new InputStrategy("Draw Ray", 2);
	
	drawRayInputStrategy.endHook = function(){
		addRay(newRayFromTwoPoints(selectedPoints[0], selectedPoints[1]));
	};
	
	var drawLineInputStrategy = new InputStrategy("Draw Line", 2);
	
	drawLineInputStrategy.endHook = function(){
		addLine(newLineFromTwoPoints(selectedPoints[0], selectedPoints[1]));
	};
	
	var drawArcInputStrategy = new InputStrategy("Draw Arc", 3);
	
	drawArcInputStrategy.endHook = function(){
		addArc(newArcFromThreePoints(selectedPoints[0], selectedPoints[1], selectedPoints[2]));
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
	
	var eraseSegmentInputStrategy = new InputStrategy("Erase Segment", 2);
	
	eraseSegmentInputStrategy.endHook = function(){
		removeSegment(new Segment(selectedPoints[0], selectedPoints[1]));
	};
	
	var eraseRayInputStrategy = new InputStrategy("Erase Ray", 2);
	
	eraseRayInputStrategy.endHook = function(){
		removeRay(newRayFromTwoPoints(selectedPoints[0], selectedPoints[1]));
	};
	
	var eraseLineInputStrategy = new InputStrategy("Erase Line", 2);
	
	eraseLineInputStrategy.endHook = function(){
		removeLine(newLineFromTwoPoints(selectedPoints[0], selectedPoints[1]));
	};
	
	var eraseArcInputStrategy = new InputStrategy("Erase Arc", 3);
	
	eraseArcInputStrategy.endHook = function(){
		removeArc(newArcFromThreePoints(selectedPoints[0], selectedPoints[1], selectedPoints[2]));
	};
	
	var eraseCircleInputStrategy = new InputStrategy("Erase Circle", 2);
	
	eraseCircleInputStrategy.endHook = function(){
		removeCircle(new Circle(selectedPoints[0], selectedPoints[0].dist(selectedPoints[1])));
	};
	
	var erasePointInputStrategy = new InputStrategy("Erase Point", 1);
	
	erasePointInputStrategy.endHook = function(){
		removePoint(selectedPoints[0]);
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
		updateView();
	}
	
	function addSegment(segment){
		selectedPoints = [];
		var newState = currentState.copy();
		newState.addSegmentWithIntersections(segment);
		addState(newState);
		updateView();
	}
	
	function addRay(ray){
		selectedPoints = [];
		var newState = currentState.copy();
		newState.addRayWithIntersections(ray);
		addState(newState);
		updateView();
	}
	
	function addLine(line){
		selectedPoints = [];
		var newState = currentState.copy();
		newState.addLineWithIntersections(line);
		addState(newState);
		updateView();
	}
	
	function addArc(arc){
		selectedPoints = [];
		var newState = currentState.copy();
		newState.addArcWithIntersections(arc);
		addState(newState);
		updateView();
	}

	function addCircle(circle){
		selectedPoints = [];
		var newState = currentState.copy();
		newState.addCircleWithIntersections(circle);
		addState(newState);
		updateView();
	}
	
	function removeSegment(segment){
		selectedPoints = [];
		var newState = currentState.copy();
		newState.removeSegment(segment);
		addState(newState);
		updateView();
	}
	
	function removeRay(ray){
		selectedPoints = [];
		var newState = currentState.copy();
		newState.removeRay(ray);
		addState(newState);
		updateView();
	}
	
	function removeLine(line){
		selectedPoints = [];
		var newState = currentState.copy();
		newState.removeLine(line);
		addState(newState);
		updateView();
	}
	
	function removeArc(arc){
		selectedPoints = [];
		var newState = currentState.copy();
		newState.removeArc(arc);
		addState(newState);
		updateView();
	}
	
	function removeCircle(circle){
		selectedPoints = [];
		var newState = currentState.copy();
		newState.removeCircle(circle);
		addState(newState);
		updateView();
	}
	
	function removePoint(point){
		selectedPoints = [];
		var newState = currentState.copy();
		newState.removePoint(point);
		addState(newState);
		updateView();
	}

	function addState(newState){
		currentState.next = newState;
		newState.previous = currentState;
		currentState = newState;
	}

	function updateView(){
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		currentState.draw(ctx, converter);
		var length = selectedPoints.length;
		for (var i = 0; i < length; i++){
			selectedPoints[i].draw(ctx, converter, new Color(255, 0, 0));
		}
	}
	
	function getInputStrategy(){
		return inputStrategy;
	}
	
	function setDrawSegmentInputStrategy(){
		inputStrategy = drawSegmentInputStrategy;
		selectedPoints = [];
		updateView();
	}
	
	function setDrawRayInputStrategy(){
		inputStrategy = drawRayInputStrategy;
		selectedPoints = [];
		updateView();
	}
	
	function setDrawLineInputStrategy(){
		inputStrategy = drawLineInputStrategy;
		selectedPoints = [];
		updateView();
	}
	
	function setDrawArcInputStrategy(){
		inputStrategy = drawArcInputStrategy;
		selectedPoints = [];
		updateView();
	}
	
	function setDrawCircleInputStrategy(){
		inputStrategy = drawCircleInputStrategy;
		selectedPoints = [];
		updateView();
	}
	
	function setEraseSegmentInputStrategy(){
		inputStrategy = eraseSegmentInputStrategy;
		selectedPoints = [];
		updateView();
	}
	
	function setEraseRayInputStrategy(){
		inputStrategy = eraseRayInputStrategy;
		selectedPoints = [];
		updateView();
	}
	
	function setEraseLineInputStrategy(){
		inputStrategy = eraseLineInputStrategy;
		selectedPoints = [];
		updateView();
	}
	
	function setEraseArcInputStrategy(){
		inputStrategy = eraseArcInputStrategy;
		selectedPoints = [];
		updateView();
	}
	
	function setEraseCircleInputStrategy(){
		inputStrategy = eraseCircleInputStrategy;
		selectedPoints = [];
		updateView();
	}
	
	function setErasePointInputStrategy(){
		inputStrategy = erasePointInputStrategy;
		selectedPoints = [];
		updateView();
	}
	
	function getCurrentState(){
		return currentState;
	}
	
	function undo(){
		selectedPoints = [];
		if (currentState.previous !== null){
			currentState = currentState.previous;
			updateView();
		}
	}
	
	function redo(){
		selectedPoints = [];
		if (currentState.next !== null){
			currentState = currentState.next;
			updateView();
		}
	}
	
	return {
		converter: converter,
		getCurrentState: getCurrentState,
		getInputStrategy: getInputStrategy,
		setDrawSegmentInputStrategy: setDrawSegmentInputStrategy,
		setDrawRayInputStrategy: setDrawRayInputStrategy,
		setDrawLineInputStrategy: setDrawLineInputStrategy,
		setDrawArcInputStrategy: setDrawArcInputStrategy,
		setDrawCircleInputStrategy: setDrawCircleInputStrategy,
		setEraseSegmentInputStrategy: setEraseSegmentInputStrategy,
		setEraseRayInputStrategy: setEraseRayInputStrategy,
		setEraseLineInputStrategy: setEraseLineInputStrategy,
		setEraseArcInputStrategy: setEraseArcInputStrategy,
		setEraseCircleInputStrategy: setEraseCircleInputStrategy,
		setErasePointInputStrategy: setErasePointInputStrategy,
		setContext: setContext,
		getContext: getContext,
		resizeCanvas: resizeCanvas,
		updateView: updateView,
		undo: undo,
		redo: redo
	};
})();

$(document).ready(function(){
	$(".button").button();
	$(".radioButton").checkboxradio({icon: false});
	$(".radioButtonGroup").controlgroup();
	
	var canvas = document.getElementById("myCanvas");
	AlDrawModule.resizeCanvas();
	AlDrawModule.converter.conversionRatio = Math.min(AlDrawModule.converter.width, AlDrawModule.converter.height)/2;
	AlDrawModule.setContext(canvas.getContext("2d"));
	AlDrawModule.getContext().linewidth = 2;
	AlDrawModule.getCurrentState().draw(AlDrawModule.getContext(), AlDrawModule.converter);
	
	$(window).resize(function(){
		AlDrawModule.resizeCanvas();
		AlDrawModule.getCurrentState().draw(AlDrawModule.getContext(), AlDrawModule.converter);
	});
	
	$("#myCanvas").mousewheel(function(ev){
		if (ev.deltaY > 0){
			AlDrawModule.converter.zoomIn(ev.offsetX, ev.offsetY);
		} else {
			AlDrawModule.converter.zoomOut(ev.offsetX, ev.offsetY);
		}
		AlDrawModule.updateView();
	});
	
	$("#myCanvas").mousedown(function(ev){
		AlDrawModule.getInputStrategy().press(ev.offsetX, ev.offsetY);
	});
	
	$("#myCanvas").mouseup(function(ev){
		AlDrawModule.getInputStrategy().release(ev.offsetX, ev.offsetY);
	});
	
	$("#myCanvas").click(function(ev){
		AlDrawModule.getInputStrategy().click(ev.offsetX, ev.offsetY);
	});
	
	$("#myCanvas").mousemove(function(ev){
		AlDrawModule.getInputStrategy().drag(ev.offsetX, ev.offsetY);
	});
});