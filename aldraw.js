"use strict";

if (!String.prototype.endsWith) {
  String.prototype.endsWith = function(searchString, position) {
      var subjectString = this.toString();
      if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
        position = subjectString.length;
      }
      position -= searchString.length;
      var lastIndex = subjectString.lastIndexOf(searchString, position);
      return lastIndex !== -1 && lastIndex === position;
  };
}

var AlDrawModule = (function(){
	var Utils = {
		defaultTolerance: 0.00001,
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
		round: function(num, order){
			var factor = Math.pow(10, -order);
			return Math.round(num*factor) / factor;
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
		toRadians: function(d){
			return d*Math.PI/180;
		},
		toDegrees: function(r){
			return r*180/Math.PI;
		},
		arrayContains: function(arr, x){
			var length = arr.length;
			for (var i = 0; i < length; i++){
				if (x.equals(arr[i])){
					return true;
				}
			}
			return false;
		},
		arrayIndexOf: function(arr, x, startIndex){
			if (startIndex === undefined){
				startIndex = 0;
			}
			var length = arr.length;
			for (var i = startIndex; i < length; i++){
				if (x.equals(arr[i])){
					return i;
				}
			}
			return -1;
		},
		arrayLastIndexOf: function(arr, x){
			for (var i = arr.length-1; i >= 0; i--){
				if (x.equals(arr[i])){
					return i;
				}
			}
			return -1;
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
	
	Point.fromObject = function(obj){
		return new Point(obj.x, obj.y);
	};

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
	
	function comparePathables(axis, side, arg0, arg1){
		var c0, c1;
		var s0 = axis.comparePathableTo(arg0);
		var s1 = axis.comparePathableTo(arg1);
		if (s0 === side && s1 !== side){
			return -1;
		}
		if (s1 === side && s0 !== side){
			return 1;
		}
		var d0 = axis.distanceAlong(arg0);
		var d1 = axis.distanceAlong(arg1);
		var a0 = axis.angleDifference(arg0);
		if (s0 === -1 && Utils.floatsEqual(a0, 0)){
			a0 = 2*Math.PI;
		}
		var a1 = axis.angleDifference(arg1);
		if (s1 === -1 && Utils.floatsEqual(a1, 0)){
			a1 = 2*Math.PI;
		}
		if (s0 === side){
			if (Utils.floatsEqual(d0, d1)){
				if (Utils.floatsEqual(a0, a1)){
					c0 = arg0.curvature();
					c1 = arg1.curvature();
					if (Utils.floatsEqual(c0, c1)){
						return 0;
					} else if (c0 > c1){
						return -side;
					} else {
						return side;
					}
				} else if (a0 > a1){
					return -side;
				} else {
					return side;
				}
			} else if (d0 < d1){
				return -1;
			} else {
				return 1;
			}
		} else {
			if (Utils.floatsEqual(d0, d1)){
				if (Utils.floatsEqual(a0, a1)){
					c0 = arg0.curvature();
					c1 = arg1.curvature();
					if (Utils.floatsEqual(c0, c1)){
						return 0;
					} else if (c0 > c1){
						return -side;
					} else {
						return side;
					}
				} else if (a0 > a1){
					return -side;
				} else {
					return side;
				}
			} else if (d0 < d1){
				return 1;
			} else {
				return -1;
			}
		}
	};
	
	var pathableBase = {
		intersect: function(pathable){
			if (pathable.isA("AbstractLine")){
				return this.intersectLine(pathable);
			} else if (pathable.isA("Circle")){
				return this.intersectCircle(pathable);
			} else {
				console.log("This should never happen");
			}
		},
		angleDifference: function(pathable){
			var a = this.angleAtPoint(pathable.startPoint());
			var b = pathable.angleAtStart();
			return Utils.angleDifference(b, a);
		},
		comparePathableTo: function(pathable){
			var angle = this.angleDifference(pathable);
			if (Utils.floatsEqual(angle, 0)){
				if (Utils.floatsEqual(pathable.curvature(), this.curvature())){
					return 0;
				} else if (pathable.curvature() < this.curvature()){
					return -1;
				} else {
					return 1;
				}
			} else if (Utils.floatsEqual(angle, Math.PI)){
				if (Utils.floatsEqual(pathable.curvature(), -this.curvature())){
					return 0;
				} else if (pathable.curvature() < -this.curvature()){
					return 1;
				} else {
					return -1;
				}
			} else if (angle < Math.PI){
				return 1;
			} else {
				return -1;
			}
		},
		comparePointTo: function(point){
			var closest = this.closestPoint(point);
			var seg = new Segment(closest, point);
			return this.comparePathableTo(seg);
		},
		getIntersectionsInOrder: function(side, state){
				var ret = [];
				var pathables = state.getPathables();
				var length = pathables.length;
				for (var i = 0; i < length; i++){
					var s = pathables[i];
					var intersections = this.intersect(s);
					for (var j = 0; j < intersections.length; j++){
						if (intersections[j] !== null && !intersections[j].equals(this.startPoint())){
							var t = s.divide(intersections[j]);
							for (var k = 0; k < t.length; k++){
								if (this.canSwitchSides() || this.comparePathableTo(t[k]) === side){
									ret.push(t[k]);
								}
							}
						}
					}
				}
				var axis = this;
				ret.sort(function(a, b){
					return comparePathables(axis, side, a, b);
				});
				
				if (this.isA("arc") && Utils.floatsEqual(this.sweep, 2*Math.PI)){
					var atStart = [];
					var pathables = state.getPathables();
					for (var i = 0; i < pathables.length; i++){
						var s = pathables[i];
						var intersections = this.intersect(s);
						for (var j = 0; j < intersections.length; j++){
							if (intersections[j] !== null && intersections[j].equals(this.startPoint())){
								var t = s.divide(intersections[j]);
								for (var k = 0; k < t.length; k++){
									if (this.comparePathableTo(t[k]) === side){
										atStart.push(t[k]);
									}
								}
							}
						}
					}
					atStart.sort(function(a, b){
						return comparePathables(axis, side, a, b);
					});
					ret = ret.concat(atStart);
					ret.push(new Arc(this.center, this.radius, this.start, this.sweep, this.inverse));
				}
				
				return ret;
			}
	};
	
	var abstractLine = Object.create(pathableBase);
	abstractLine.getSlope = function(){
		console.log("getSlope() hasn't been implemented");
		console.trace();
	};
	abstractLine.getIntercept = function(){
		console.log("getIntercept() hasn't been implemented");
		console.trace();
	};
	abstractLine.contains = function(){
		console.log("contains() hasn't been implemented");
		console.trace();
	};
	abstractLine.distance = function(p){
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
	};
	abstractLine.curvature = function(){
		return 0;
	};
	abstractLine.intersectLine = function(otherLine){
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
	};
	abstractLine.intersectCircle = function(otherCircle){
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
	};
	abstractLine.parallel = function(otherLine){
		return Utils.floatsEqual(this.getSlope(), otherLine.getSlope());
	};
	abstractLine.same = function(otherLine){
		return Utils.floatsEqual(this.getSlope(), otherLine.getSlope()) && Utils.floatsEqual(this.getIntercept(), otherLine.getIntercept());
	};

	function Line(slope, intercept){
		this.slope = slope;
		this.intercept = intercept; //This is the y-intercept, unless the line is vertical
	}
	
	Line.fromObject = function(obj){
		return new Line(obj.slope, obj.intercept);
	};
	
	Line.fromTwoPoints = function(p1, p2){
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
	};
	
	Line.fromPointSlope = function(p, slope){
		var intercept;
		if (!Number.isFinite(slope)){
			intercept = p.x;
		} else {
			intercept = p.y - slope * p.x;
		}
		return new Line(slope, intercept);
	};
	
	Line.prototype = Object.create(abstractLine);
	
	Line.prototype.isA = function(name){
		return name === "Line" || name === "AbstractLine";
	};
	
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
		var otherLine = Line.fromPointSlope(p, slope);
		var intersection = this.intersectLine(otherLine);
		return intersection[0];
	};
	
	Line.prototype.canSwitchSides = function(){
		return false;
	};
	
	Line.prototype.divide = function(point){
		if (!this.contains(point)){
			point = this.closestPoint(point);
		}
		var angle = Utils.slopeToAngle(this.slope);
		return [new Ray(point, angle), new Ray(point, Utils.oppositeAngle(angle))];
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
	
	Line.prototype.equals = function(otherLine){
		if (this === otherLine){
			return true;
		}
		if (otherLine === null || otherLine === undefined){
			return false
		}
		if (!otherLine.isA("Line")){
			return false;
		}
		return Utils.floatsEqual(this.intercept, other.intercept) && Utils.floatsEqual(this.slope, other.slope);
	};
	
	function Ray(start, angle){
		this.start = start;
		this.angle = angle;
	}
	
	Ray.fromObject = function(obj){
		return new Ray(Point.fromObject(obj.start), obj.angle);
	};
	
	Ray.fromTwoPoints = function(p1, p2){
		var angle = p1.angle(p2);
		return new Ray(p1, angle);
	};
	
	Ray.prototype = Object.create(abstractLine);
	
	Ray.prototype.isA = function(name){
		return name === "Ray" || name === "AbstractLine";
	};
	
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
		var otherLine = Line.fromPointSlope(p, slope);
		var intersection = this.intersectLine(otherLine);
		if (intersection.length > 0){
			return intersection[0];
		} else {
			return this.start;
		}
	};
	
	Ray.prototype.startPoint = function(){
		return this.start;
	};
	
	Ray.prototype.angleAtStart = function(){
		return this.angle;
	};
	
	Ray.prototype.angleAtPoint = function(point){
		return this.angle;
	};
	
	Ray.prototype.canSwitchSides = function(){
		return false;
	};
	
	Ray.prototype.distance = function(point){
		var closest = this.closestPoint(point);
		return closest.dist(point);
	};
	
	Ray.prototype.distanceAlong = function(pathable){
		var point = pathable.startPoint();
		return this.start.dist(point);
	};
	
	Ray.prototype.divide = function(point){
		if (!this.contains(point)){
			point = this.closestPoint(point);
		}
		if (this.start.equals(point)){
			return [new Ray(point, this.angle)];
		}
		return [new Segment(point, this.start), new Ray(point, this.angle)];
	};
	
	Ray.prototype.shortened = function(pathable){
		return new Segment(this.startPoint(), pathable.startPoint());
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
	
	Ray.prototype.sameDirection = function(pathable){
		return this.equals(pathable);
	};
	
	Ray.prototype.draw = function(context, converter){
		var bounds = converter.getAbstractBoundaries();
		var drawSegment = this.getPortionInsideRectangle(bounds);
		if (drawSegment != null){
			drawSegment.draw(context, converter);
		}
	};
	
	Ray.prototype.equals = function(otherRay){
		if (this === otherRay){
			return true;
		}
		if (otherRay === null || otherRay === undefined){
			return false;
		}
		if (!otherRay.isA("Ray")){
			return false;
		}
		return this.start.equals(otherRay.start) && Utils.floatsEqual(this.angle, otherRay.angle);
	};
		
	function Segment(p1, p2){
		this.p1 = p1;
		this.p2 = p2;
	}
	
	Segment.fromObject = function(obj){
		return new Segment(Point.fromObject(obj.p1), Point.fromObject(obj.p2));
	};
	
	Segment.prototype = Object.create(abstractLine);
	
	Segment.prototype.isA = function(name){
		return name === "Segment" || name === "AbstractLine";
	};

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
		var otherLine = Line.fromPointSlope(p, slope);
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
	
	Segment.prototype.startPoint = function(){
		return this.p1;
	};
	
	Segment.prototype.angleAtStart = function(){
		return this.p1.angle(this.p2);
	};
	
	Segment.prototype.angleAtPoint = function(point){
		return this.angleAtStart();
	};
	
	Segment.prototype.canSwitchSides = function(){
		return true;
	};
	
	Segment.prototype.distance = function(point){
		var closest = this.closestPoint(point);
		return closest.dist(point);
	};
	
	Segment.prototype.distanceAlong = function(pathable){
		var point = pathable.startPoint();
		return this.p1.dist(point);
	};
	
	Segment.prototype.divide = function(point){
		if (!this.contains(point)){
			point = this.closestPoint(point);
		}
		if (this.p1.equals(point)){
			return [new Segment(point, this.p2)];
		}
		if (this.p2.equals(point)){
			return [new Segment(point, this.p1)];
		}
		return [new Segment(point, this.p1), new Segment(point, this.p2)];
	};
	
	Segment.prototype.shortened = function(pathable){
		return new Segment(this.startPoint(), pathable.startPoint());
	};
	
	Segment.prototype.sameDirection = function(pathable){
		if (!pathable.isA("Segment")){
			return false;
		}
		return this.p1.equals(pathable.p1) && this.p2.equals(pathable.p2);
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
		if (this === otherSegment){
			return true;
		}
		if (otherSegment === null || otherSegment === undefined){
			return false;
		}
		if (!otherSegment.isA("Segment")){
			return false;
		}
		return (this.p1.equals(otherSegment.p1) && this.p2.equals(otherSegment.p2)) || (this.p1.equals(otherSegment.p2) && this.p2.equals(otherSegment.p1));
	};

	function Circle(center, radius){
		this.center = center;
		this.radius = radius;
	}
	
	Circle.fromObject = function(obj){
		return new Circle(Point.fromObject(obj.center), obj.radius);
	};
	
	Circle.prototype = Object.create(pathableBase);
	
	Circle.prototype.isA = function(name){
		return name === "Circle";
	};

	Circle.prototype.contains = function(point){
		return Utils.floatsEqual(point.dist(this.center), this.radius);
	};
	
	Circle.prototype.getPointAtAngle = function(angle){
		var x = this.center.x + this.radius * Math.cos(angle);
		var y = this.center.y + this.radius * Math.sin(angle);
		return new Point(x, y);
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
	
	Circle.prototype.canSwitchSides = function(){
		return false;
	};
	
	Circle.prototype.distance = function(point){
		return Math.abs(this.center.dist(point) - this.radius);
	};
	
	Circle.prototype.curvature = function(){
		return 1/this.radius;
	};
	
	Circle.prototype.closestPoint = function(point){
		var angle = this.center.angle(point);
		return this.getPointAtAngle(angle);
	};
	
	Circle.prototype.divide = function(point){
		if (!this.contains(point)){
			point = this.closestPoint(point);
		}
		var angle = this.center.angle(point);
		var ret = [];
		ret.push(new Arc(this.center, this.radius, angle, 2*Math.PI, false));
		ret.push(new Arc(this.center, this.radius, angle, 2*Math.PI, true));
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
	
	Circle.prototype.equals = function(otherCircle){
		if (this === otherCircle){
			return true;
		}
		if (otherCircle === null || otherCircle === undefined){
			return false;
		}
		if (!otherCircle.isA("Circle") || otherCircle.isA("Arc")){
			return false;
		};
		return this.same(otherCircle);
	};
	
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
	
	Arc.fromObject = function(obj){
		return new Arc(Point.fromObject(obj.center), obj.radius, obj.start, obj.sweep, obj.inverse);
	};
	
	Arc.fromThreePoints = function(p1, p2, p3){
		var center = p1;
		var radius = p1.dist(p2);
		var start = p1.angle(p2);
		var sweep = Utils.angleDifference(p1.angle(p3), start);
		return new Arc(center, radius, start, sweep);
	}
	
	Arc.prototype = Object.create(Circle.prototype);
	
	Arc.prototype.isA = function(name){
		return name === "Arc" || name === "Circle";
	};
	
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
	
	Arc.prototype.angleAtPoint = function(point){
		if (this.inverse){
			return Utils.angleDifference(this.center.angle(point), Math.PI/2);
		} else {
			return Utils.angleSum(this.center.angle(point), Math.PI/2);
		}
	};
	
	Arc.prototype.startPoint = function(){
		if (this.inverse){
			return this.getPointAtAngle(this.getEnd());
		} else {
			return this.getPointAtAngle(this.start);
		}
	};
	
	Arc.prototype.angleAtStart = function(){
		return this.angleAtPoint(this.startPoint());
	};
	
	Arc.prototype.curvature = function(){
		var ret = 1/this.radius;
		if (this.inverse){
			ret = -1*ret;
		}
		return ret;
	};
	
	Arc.prototype.canSwitchSides = function(){
		return !Utils.floatsEqual(this.sweep, 2*Math.PI);
	};
	
	Arc.prototype.distance = function(point){
		var closest = this.closestPoint(point);
		return closest.dist(point);
	};
	
	Arc.prototype.closestPoint = function(point){
		var angle = this.center.angle(point);
		var closest = this.getPointAtAngle(angle);
		if (this.contains(closest)){
			return closest;
		}
		var startPoint = this.getPointAtAngle(this.start);
		var endPoint = this.getPointAtAngle(this.getEnd());
		if (point.dist(startPoint) < point.dist(endPoint)){
			return startPoint;
		} else {
			return endPoint;
		}
	};
	
	Arc.prototype.distanceAlong = function(pathable){
		var point = pathable.startPoint();
		var a0 = this.center.angle(point);
		var a1 = Utils.angleDifference(a0, this.start);
		if (this.inverse){
			a1 = Utils.angleDifference(this.getEnd(), a0);
		}
		return a1;
	};
	
	Arc.prototype.divide = function(point){
		if (!this.contains(point)){
			point = this.closestPoint(point);
		}
		var angle = this.center.angle(point);
		if (Utils.floatsEqual(angle, this.start)){
			return [new Arc(this.center, this.radius, this.start, this.sweep, false)];
		}
		if (Utils.floatsEqual(angle, this.getEnd())){
			return [new Arc(this.center, this.radius, this.start, this.sweep, true)];
		}
		var ret = [];
		ret.push(new Arc(this.center, this.radius, angle, Utils.angleDifference(this.getEnd(), angle), false));
		ret.push(new Arc(this.center, this.radius, this.start, Utils.angleDifference(angle, this.start), true));
		return ret;
	};
	
	Arc.prototype.shortened = function(pathable){
		var startAngle = this.start;
		var endAngle = this.center.angle(pathable.startPoint());
		if (this.inverse){
			startAngle = this.center.angle(pathable.startPoint());
			endAngle = this.getEnd();
		}
		var sweep = Utils.angleDifference(endAngle, startAngle);
		if (Utils.floatsEqual(sweep, 0)){
			sweep = 2*Math.PI;
		}
		return new Arc(this.center, this.radius, startAngle, sweep, this.inverse);
	};
	
	Arc.prototype.sameDirection = function(pathable){
		if (!pathable.isA("Arc")){
			return false;
		}
		return this.equals(pathable) && this.inverse === pathable.inverse;
	};
	
	Arc.prototype.isIn = function(otherArc){
		var startIsIn = Utils.angleDifference(this.start, otherArc.start) <= otherArc.sweep;
		var theRestIsIn = this.sweep < Utils.angleDifference(otherArc.getEnd(), this.start);
		return startIsIn && theRestIsIn;
	};
	
	Arc.prototype.draw = function(context, converter){
		var p = converter.abstractToScreenCoord(this.center);
		var screenRadius = converter.abstractToScreenDist(this.radius);
		var start = Utils.angleSum(this.start, converter.angle);
		var end = Utils.angleSum(this.getEnd(), converter.angle);
		context.beginPath();
		context.arc(p.x, p.y, screenRadius, start, end);
		context.stroke();
	};
	
	Arc.prototype.equals = function(otherArc){
		if (this === otherArc){
			return true;
		}
		if (otherArc === null || otherArc === undefined){
			return false;
		}
		if (!otherArc.isA("Arc")){
			return false;
		}
		return (this.center.equals(otherArc.center) && Utils.floatsEqual(this.radius, otherArc.radius) && Utils.floatsEqual(this.start, otherArc.start) && Utils.floatsEqual(this.sweep, otherArc.sweep));
	};
	
	function Enclosure(path, color){
		this.path = path;
		this.color = color;
	}
	
	Enclosure.fromObject = function(obj){
		var path = [];
		var length = obj.path.length;
		for (var i = 0; i < length; i++){
			var pathable = obj.path[i];
			if (pathable.p1 !== undefined){
				path.push(Segment.fromObject(pathable));
			} else if (pathable.sweep !== undefined){
				path.push(Arc.fromObject(pathable));
			} else {
				console.log("This should never happen (Enclosure.fromObject)");
			}
		}
		return new Enclosure(path, obj.color);
	};
	
	Enclosure.findEnclosure = function(selPoint, state){
		var i, j, length, length2;
		var ret = null;
		var closestPaths = state.getPathables();
		closestPaths.sort(function(a, b){
			var da = a.distance(selPoint);
			var db = b.distance(selPoint);
			if (Utils.floatsEqual(da, db)){
				if (a.isA("Circle") && b.isA("Circle")){
					var ea = a.center.dist(selPoint);
					var eb = b.center.dist(selPoint);
					if (Utils.floatsEqual(ea, eb)){
						return 0;
					} else if (ea < eb){
						return -1;
					} else {
						return 1;
					}
				} else {
					return 0;
				}
			} else if (da < db){
				return -1;
			} else {
				return 1;
			}
		});
		length = closestPaths.length;
		for (i = 0; i < length; i++){
			var s = closestPaths[i];
			var ss = s.divide(s.closestPoint(selPoint));
			length2 = ss.length;
			for (j = 0; j < length2; j++){
				var side = ss[j].comparePointTo(selPoint);
				ret = Enclosure.findEnclosureRecurse(selPoint, [], ss[j], side, state);
				if (ret !== null && ret.contains(selPoint)){
					return ret;
				}
			}
		}
		return null;
	};
	
	Enclosure.findEnclosureRecurse = function(selPoint, oldPath, pathable, side, state){
		var i, length;
		var newPath = null
		var l = pathable.getIntersectionsInOrder(side, state);
		length = l.length;
		for (i = 0; i < length; i++){
			newPath = oldPath.slice(0);
			var s = l[i];
			var t = pathable.shortened(s);
			var index = Utils.arrayIndexOf(newPath, t);
			if ((index !== Utils.arrayLastIndexOf(newPath, t)) || (Utils.arrayContains(newPath, t) && t.sameDirection(newPath[index]))){
				newPath = newPath.slice(index);
				return new Enclosure(newPath);
			}
			newPath.push(t);
			var ret = Enclosure.findEnclosureRecurse(selPoint, newPath, s, side, state);
			if (ret !== null){
				return ret;
			}
		}
		return null;
	};
	
	Enclosure.prototype.contains = function(point){
		var ray1 = new Ray(point, 0);
		var ray2 = new Ray(point, Math.PI);
		var num1 = 0;
		var num2 = 0;
		for (var i = 0; i < this.path.length; i++){
			var cur = this.path[i];
			var intersections = ray1.intersect(cur);
			num1 = num1 + intersections.length;
			intersections = ray2.intersect(cur);
			num2 = num2 + intersections.length;
		}
		if (num1 % 2 !== num2 % 2 || num1 % 2 === 0){
			return false;
		}
		return true;
	};
	
	Enclosure.prototype.draw = function(context, converter){
		context.fillStyle = this.color;
		context.beginPath();
		var point = converter.abstractToScreenCoord(this.path[0].startPoint());
		context.moveTo(point.x, point.y);
		for (var i = 0; i < this.path.length; i++){
			var pathable = this.path[i];
			if (pathable.isA("Segment")){
				point = converter.abstractToScreenCoord(pathable.p2);
				context.lineTo(point.x, point.y);
			} else if (pathable.isA("Arc")){
				point = converter.abstractToScreenCoord(pathable.center);
				var radius = converter.abstractToScreenDist(pathable.radius);
				var start = Utils.angleSum(pathable.start, converter.angle);
				var end = Utils.angleSum(pathable.getEnd(), converter.angle);
				if (Utils.floatsEqual(pathable.sweep, 2*Math.PI)){
					end = pathable.start + 2*Math.PI;
				}
				if (pathable.inverse){
					context.arc(point.x, point.y, radius, end, start, true);
				} else {
					context.arc(point.x, point.y, radius, start, end, false);
				}
			} else {
				console.log("Enclosure.draw invalid enclosure");
				console.log(this.path);
				console.log(pathable);
			}
		}
		context.closePath();
		context.fill();
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
	
	CoordinateConverter.prototype.setValues = function(obj){
		if (obj.cX !== undefined){
			this.cX = obj.cX;
		}
		if (obj.cY !== undefined){
			this.cY = obj.cY;
		}
		if (obj.conversionRatio !== undefined){
			this.conversionRatio = obj.conversionRatio;
		}
		if (obj.angle !== undefined){
			this.angle = obj.angle;
		}
	};
	
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

	CoordinateConverter.prototype.translate = function(abstractPoint, screenPoint){
		var diff = this.screenToAbstractCoord(firstScreen);
		var dx = diff.x - firstAbstract.x;
		var dy = diff.y - firstAbstract.y;
		this.cX = this.cX - dx;
		this.cY = this.cY - dy;
	}

	CoordinateConverter.prototype.zoom = function(firstAbstract, secondAbstract, firstScreen, secondScreen, lockAngle){
		var abstractDist = firstAbstract.dist(secondAbstract);
		var screenDist = firstScreen.dist(secondScreen);
		if (!lockAngle){
			var abstractAngle = firstAbstract.angle(secondAbstract);
			var screenAngle = firstScreen.angle(secondScreen);
			this.angle = Utils.angleDifference(screenAngle, abstractAngle);
		}
		this.conversionRatio = screenDist/abstractDist;
		this.translate(firstAbstract, firstScreen);
	}

	CoordinateConverter.prototype.autoZoom = function(state){
		var minX, maxX, minY, maxY, i, length, point, q, c, arc, circle;
		function updateMinMax(p){
			if (p.x < minX){
				minX = p.x;
			}
			if (p.x > maxX){
				maxX = p.x;
			}
			if (p.y < minY){
				minY = p.y;
			}
			if (p.y > maxY){
				maxY = p.y;
			}
		}
		point = state.points[0].rotateAroundOrigin(this.angle);
		minX = maxX = point.x;
		minY = maxY = point.y;
		length = state.points.length;
		for (i = 1; i < length; i++){
			point = state.points[i].rotateAroundOrigin(this.angle);
			updateMinMax(point);
		}
		length = state.arcs.length;
		for (i = 0; i < length; i++){
			arc = state.arcs[i];
			c = arc.center.rotateAroundOrigin(this.angle);
			point = c.translate(-arc.radius, 0);
			q = point.rotateAroundOrigin(-this.angle);
			if (arc.contains(q)){
				updateMinMax(point);
			}
			point = c.translate(arc.radius, 0);
			q = point.rotateAroundOrigin(-this.angle);
			if (arc.contains(q)){
				updateMinMax(point);
			}
			point = c.translate(0, -arc.radius);
			q = point.rotateAroundOrigin(-this.angle);
			if (arc.contains(q)){
				updateMinMax(point);
			}
			point = c.translate(0, arc.radius);
			q = point.rotateAroundOrigin(-this.angle);
			if (arc.contains(q)){
				updateMinMax(point);
			}
		}
		length = state.circles.length;
		for (i = 0; i < length; i++){
			circle = state.circles[i];
			c = circle.center.rotateAroundOrigin(this.angle);
			point = c.translate(-circle.radius, 0);
			updateMinMax(point);
			point = c.translate(circle.radius, 0);
			updateMinMax(point);
			point = c.translate(0, -circle.radius);
			updateMinMax(point);
			point = c.translate(0, circle.radius);
			updateMinMax(point);
		}
		this.conversionRatio = Math.min((this.width-2) / (maxX - minX), (this.height-2) / (maxY - minY));
		point = new Point((maxX + minX)/2, (maxY + minY)/2);
		point = point.rotateAroundOrigin(-this.angle);
		this.cX = point.x;
		this.cY = point.y;
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
	
	CoordinateConverter.prototype.copy = function(){
		var ret = new CoordinateConverter();
		ret.cX = this.cX;
		ret.cY = this.cY;
		ret.conversionRatio = this.conversionRatio;
		ret.anlge = this.angle;
		ret.height = this.height;
		ret.width = this.width;
		return ret;
	};
	
	CoordinateConverter.prototype.toJSON = function(){
		return {cX: this.cX, cY: this.cY, conversionRatio: this.conversionRatio, angle: this.angle, height: this.height, width: this.width};
	};

	function AlDrawState(){
		this.enclosures = [];
		this.segments = [];
		this.rays = [];
		this.lines = [];
		this.arcs = [];
		this.circles = [];
		this.points = [];
		this.next = null;
		this.previous = null;
	}
	
	AlDrawState.fromObject = function(obj){
		var ret = new AlDrawState();
		var i, length;
		length = obj.enclosures.length;
		for (i = 0; i < length; i++){
			ret.enclosures.push(Enclosure.fromObject(obj.enclosures[i]));
		}
		length = obj.segments.length;
		for (i = 0; i < length; i++){
			ret.segments.push(Segment.fromObject(obj.segments[i]));
		}
		length = obj.rays.length;
		for (i = 0; i < length; i++){
			ret.rays.push(Ray.fromObject(obj.rays[i]));
		}
		length = obj.lines.length;
		for (i = 0; i < length; i++){
			ret.lines.push(Line.fromObject(obj.lines[i]));
		}
		length = obj.arcs.length;
		for (i = 0; i < length; i++){
			ret.arcs.push(Arc.fromObject(obj.arcs[i]));
		}
		length = obj.circles.length;
		for (i = 0; i < length; i++){
			ret.circles.push(Circle.fromObject(obj.circles[i]));
		}
		length = obj.points.length;
		for (i = 0; i < length; i++){
			ret.points.push(Point.fromObject(obj.points[i]));
		}
		return ret;
	};

	AlDrawState.prototype.start = function(){
		var i, initRad = 1;
		this.circles.push(new Circle(new Point(0, 0), 1));
		this.points.push(new Point(0, 0));
		for (i = 0; i < 6; i++){
			this.points.push(new Point(initRad * Math.cos(i * Math.PI / 3), initRad * Math.sin(i * Math.PI / 3)));
		}
	};
	
	AlDrawState.prototype.getTopEnclosure = function(point){
		for (var i = this.enclosures.length - 1; i >= 0; i--){
			if (this.enclosures[i].contains(point)){
				return this.enclosures[i];
			}
		}
		return null;
	};
	
	AlDrawState.prototype.getPathables = function(){
		var pathables = this.segments.concat(this.rays);
		pathables = pathables.concat(this.lines);
		pathables = pathables.concat(this.arcs);
		pathables = pathables.concat(this.circles);
		return pathables;
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
	
	AlDrawState.prototype.addEnclosure = function(enclosure){
		this.enclosures.push(enclosure);
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
	
	AlDrawState.prototype.addPoint = function(point){
		this.points.push(point);
	};
	
	AlDrawState.prototype.addPoints = function(newPoints){
		var length = newPoints.length;
		for (var i = 0; i < length; i++){
			if (!Utils.arrayContains(this.points, newPoints[i])){
				this.points.push(newPoints[i]);
			}
		}
	};
	
	AlDrawState.prototype.removeEnclosure = function(point){
		var i, length;
		length = this.enclosures.length;
		for (i = 0; i < length; i++){
			if (this.enclosures[i].contains(point)){
				this.enclosures.splice(i,1);
				i--;
				length--;
			}
		}
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
					this.arcs.splice(i, 1);
					i--;
					length--;
				} else if (arc.isIn(a)){
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
					this.arcs.splice(i, 1);
					this.addArcWithoutIntersections(new Arc(arc.center, arc.radius, arc.getEnd(), Utils.angleDifference(arc.start, arc.getEnd())));
					i--;
					length--;
				} else if (Utils.angleDifference(arc.start, a.start) < a.sweep){
					this.arcs.splice(i, 1);
					this.addArcWithoutIntersections(new Arc(arc.center, arc.radius, a.start, Utils.angleDifference(arc.start, a.start)));
					i--;
					length--;
				} else if (Utils.angleDifference(arc.getEnd(), a.start) < a.sweep){
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
		newState.enclosures = this.enclosures.slice(0);
		newState.segments = this.segments.slice(0);//Copies the array
		newState.rays = this.rays.slice(0);
		newState.lines = this.lines.slice(0);
		newState.arcs = this.arcs.slice(0);
		newState.circles = this.circles.slice(0); 
		newState.points = this.points.slice(0);
		return newState;
	};

	AlDrawState.prototype.draw = function(context, converter, showLines, showPoints){
		var i, length;
		length = this.enclosures.length;
		for (i = 0; i < length; i++){
			this.enclosures[i].draw(context, converter);
		}
		if (showLines){
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
		}
		if (showPoints){
			length = this.points.length;
			for (i = 0; i < length; i++){
				this.points[i].draw(context, converter);
			}
		}
	};
	
	AlDrawState.prototype.toJSON = function(){
		return {
			enclosures: this.enclosures,
			segments: this.segments,
			rays: this.rays,
			lines: this.lines,
			arcs: this.arcs,
			circles: this.circles,
			points: this.points
		};
	};

	var inputStrategies = [];
	
	function InputStrategy(name, pointsNeeded){
		this.name = name;
		this.pointsNeeded = pointsNeeded;
	}

	InputStrategy.prototype.shadowHook1 = function(p1){
		return []
	};
	
	InputStrategy.prototype.shadowHook2 = function(p1, p2){
		return this.shadowHook1(p1);
	};
	
	InputStrategy.prototype.shadowHook3 = function(p1, p2, p3){
		return this.shadowHook2(p1, p2);
	};

	InputStrategy.prototype.press = function(x, y){
		selectNearestPoint(new Point(x, y));
		if (selectedPoints.length === this.pointsNeeded){
			shadows = [];
			this.endHook();
			selectedPoints = [];
		}	
	};

	InputStrategy.prototype.release = function(x, y){
		if (selectedPoints.length === 1){
			this.press(x,  y);
		}
	};

	InputStrategy.prototype.click = function(x, y){
		this.release(x, y);
	};

	InputStrategy.prototype.drag = function(x, y){
		var point = stickPoint(new Point(x, y));
		if (selectedPoints.length === 0){
			shadows = this.shadowHook1(point);
		} else if (selectedPoints.length === 1){
			shadows = this.shadowHook2(selectedPoints[0], point);
		} else if (selectedPoints.length === 2){
			shadows = this.shadowHook3(selectedPoints[0], selectedPoints[1], point);
		}
		updateView();
	};
	
	var drawSegmentInputStrategy = new InputStrategy("Draw Segment", 2);
	drawSegmentInputStrategy.shadowHook2 = function(p1, p2){
		return [new Segment(p1, p2)];
	};
	drawSegmentInputStrategy.endHook = function(){
		addNewState(function(state){
			state.addSegmentWithIntersections(new Segment(selectedPoints[0], selectedPoints[1]));
		});
	};
	inputStrategies.push(drawSegmentInputStrategy);
	
	var drawRayInputStrategy = new InputStrategy("Draw Ray", 2);
	drawRayInputStrategy.shadowHook2 = function(p1, p2){
		return [Ray.fromTwoPoints(p1, p2)];
	};
	drawRayInputStrategy.endHook = function(){
		addNewState(function(state){
			state.addRayWithIntersections(Ray.fromTwoPoints(selectedPoints[0], selectedPoints[1]));
		});
	};
	inputStrategies.push(drawRayInputStrategy);
	
	var drawLineInputStrategy = new InputStrategy("Draw Line", 2);
	drawLineInputStrategy.shadowHook2 = function(p1, p2){
		return [Line.fromTwoPoints(p1, p2)];
	};
	drawLineInputStrategy.endHook = function(){
		addNewState(function(state){
			state.addLineWithIntersections(Line.fromTwoPoints(selectedPoints[0], selectedPoints[1]));
		});
	};
	inputStrategies.push(drawLineInputStrategy);
	
	var drawArcInputStrategy = new InputStrategy("Draw Arc", 3);
	drawArcInputStrategy.shadowHook2 = function(p1, p2){
		return [new Circle(p1, p1.dist(p2))];
	};
	drawArcInputStrategy.shadowHook3 = function(p1, p2, p3){
		return [Arc.fromThreePoints(p1, p2, p3)];
	};
	drawArcInputStrategy.endHook = function(){
		addNewState(function(state){
			state.addArcWithIntersections(Arc.fromThreePoints(selectedPoints[0], selectedPoints[1], selectedPoints[2]));
		});
	};
	inputStrategies.push(drawArcInputStrategy);

	var drawCircleInputStrategy = new InputStrategy("Draw Circle", 2);
	drawCircleInputStrategy.shadowHook2 = function(p1, p2){
		return [new Circle(p1, p1.dist(p2))];
	};
	drawCircleInputStrategy.endHook = function(){
		addNewState(function(state){
			state.addCircleWithIntersections(new Circle(selectedPoints[0], selectedPoints[0].dist(selectedPoints[1])));
		});
	};
	inputStrategies.push(drawCircleInputStrategy);
	
	var eraseSegmentInputStrategy = new InputStrategy("Erase Segment", 2);
	eraseSegmentInputStrategy.shadowHook2 = drawSegmentInputStrategy.shadowHook2;
	eraseSegmentInputStrategy.endHook = function(){
		addNewState(function(state){
			state.removeSegment(new Segment(selectedPoints[0], selectedPoints[1]));
		});
	};
	inputStrategies.push(eraseSegmentInputStrategy);
	
	var eraseRayInputStrategy = new InputStrategy("Erase Ray", 2);
	eraseRayInputStrategy.shadowHook2 = drawRayInputStrategy.shadowHook2;
	eraseRayInputStrategy.endHook = function(){
		addNewState(function(state){
			state.removeRay(Ray.fromTwoPoints(selectedPoints[0], selectedPoints[1]));
		});
	};
	inputStrategies.push(eraseRayInputStrategy);
	
	var eraseLineInputStrategy = new InputStrategy("Erase Line", 2);
	eraseLineInputStrategy.shadowHook2 = drawLineInputStrategy.shadowHook2;
	eraseLineInputStrategy.endHook = function(){
		addNewState(function(state){
			state.removeLine(Line.fromTwoPoints(selectedPoints[0], selectedPoints[1]));
		});
	};
	inputStrategies.push(eraseLineInputStrategy);
	
	var eraseArcInputStrategy = new InputStrategy("Erase Arc", 3);
	eraseArcInputStrategy.shadowHook2 = drawArcInputStrategy.shadowHook2;
	eraseArcInputStrategy.shadowHook3 = drawArcInputStrategy.shadowHook3;
	eraseArcInputStrategy.endHook = function(){
		addNewState(function(state){
			state.removeArc(Arc.fromThreePoints(selectedPoints[0], selectedPoints[1], selectedPoints[2]));
		});
	};
	inputStrategies.push(eraseArcInputStrategy);
	
	var eraseCircleInputStrategy = new InputStrategy("Erase Circle", 2);
	eraseCircleInputStrategy.shadowHook2 = drawCircleInputStrategy.shadowHook2;
	eraseCircleInputStrategy.endHook = function(){
		addNewState(function(state){
			state.removeCircle(new Circle(selectedPoints[0], selectedPoints[0].dist(selectedPoints[1])));
		});
	};
	inputStrategies.push(eraseCircleInputStrategy);
	
	var erasePointInputStrategy = new InputStrategy("Erase Point", 1);
	erasePointInputStrategy.shadowHook1 = function(p1){
		return [p1];
	};
	erasePointInputStrategy.endHook = function(){
		addNewState(function(state){
			state.removePoint(selectedPoints[0]);
		});
	};
	inputStrategies.push(erasePointInputStrategy);
	
	var midpointInputStrategy = new InputStrategy("Midpoint", 2);
	midpointInputStrategy.shadowHook2 = function(p1, p2){
		return [Utils.midPoint(p1, p2)];
	};
	midpointInputStrategy.endHook = function(){
		addNewState(function(state){
			state.addPoint(Utils.midPoint(selectedPoints[0], selectedPoints[1]));
		});
	};
	inputStrategies.push(midpointInputStrategy);
	
	var trisectInputStrategy = new InputStrategy("Trisect", 2);
	trisectInputStrategy.calculatePoints = function(p1, p2){
		var dx = p2.x - p1.x;
		var dy = p2.y - p1.y;
		var x1 = p1.x + dx/3;
		var y1 = p1.y + dy/3;
		var x2 = p1.x + dx*2/3;
		var y2 = p1.y + dy*2/3;
		return [new Point(x1,  y1), new Point(x2, y2)];
	};
	trisectInputStrategy.shadowHook2 = function(p1, p2){
		return this.calculatePoints(p1, p2);
	};
	trisectInputStrategy.endHook = function(){
		var points = this.calculatePoints(selectedPoints[0], selectedPoints[1]);
		addNewState(function(state){
			state.addPoints(points);
		});
	};
	inputStrategies.push(trisectInputStrategy);
	
	var perpendicularBisectorInputStrategy = new InputStrategy("Perpendicular Bisector", 2);
	perpendicularBisectorInputStrategy.calculateLine = function(p1, p2){
		var midpoint = Utils.midPoint(p1, p2);
		var temp = Line.fromTwoPoints(p1, p2);
		var slope = temp.getSlope();
		return Line.fromPointSlope(midpoint, Utils.perpendicularSlope(slope));
	};
	perpendicularBisectorInputStrategy.shadowHook2 = function(p1, p2){
		var line = this.calculateLine(p1, p2);
		var point = Utils.midPoint(p1, p2);
		return [line, point];
	};
	perpendicularBisectorInputStrategy.endHook = function(){
		var line = this.calculateLine(selectedPoints[0], selectedPoints[1]);
		addNewState(function(state){
			state.addPoint(Utils.midPoint(selectedPoints[0], selectedPoints[1]));
			state.addLineWithIntersections(line);
		});
	};
	inputStrategies.push(perpendicularBisectorInputStrategy);
	
	var angleBisectorInputStrategy = new InputStrategy("Angle Bisector", 3);
	angleBisectorInputStrategy.calculateLine = function(p1, p2, p3){
		var angle1 = p2.angle(p1);
		var angle2 = p2.angle(p3);
		var angle3 = (angle1 + angle2)/2;
		var slope = Utils.angleToSlope(angle3);
		return Line.fromPointSlope(p2, slope);
	};
	angleBisectorInputStrategy.shadowHook2 = function(p1, p2){
		return [Line.fromTwoPoints(p1, p2)];
	};
	angleBisectorInputStrategy.shadowHook3 = function(p1, p2, p3){
		return [this.calculateLine(p1, p2, p3)];
	};
	angleBisectorInputStrategy.endHook = function(){
		var line = this.calculateLine(selectedPoints[0], selectedPoints[1], selectedPoints[2]);
		addNewState(function(state){
			state.addLineWithIntersections(line);
		});
	};
	inputStrategies.push(angleBisectorInputStrategy);
	
	var tangentInputStrategy = new InputStrategy("Tangent Line", 2);
	tangentInputStrategy.calculateLine = function(p1, p2){
		var temp = Line.fromTwoPoints(p1, p2);
		var slope = temp.getSlope();
		return Line.fromPointSlope(p2, Utils.perpendicularSlope(slope));
	};
	tangentInputStrategy.shadowHook2 = function(p1, p2){
		return [this.calculateLine(p1, p2)];
	};
	tangentInputStrategy.endHook = function(){
		var line = this.calculateLine(selectedPoints[0], selectedPoints[1]);
		addNewState(function(state){
			state.addLineWithIntersections(line);
		});
	};
	inputStrategies.push(tangentInputStrategy);
	
	var parallelInputStrategy = new InputStrategy("Parallel Line", 3);
	parallelInputStrategy.calculateLine = function(p1, p2, p3){
		var temp = Line.fromTwoPoints(p1, p2);
		var slope = temp.getSlope();
		return Line.fromPointSlope(p3, slope);
	};
	parallelInputStrategy.shadowHook2 = function(p1, p2){
		return [Line.fromTwoPoints(p1, p2)];
	};
	parallelInputStrategy.shadowHook3 = function(p1, p2, p3){
		return [this.calculateLine(p1, p2, p3)];
	};
	parallelInputStrategy.endHook = function(){
		var line = this.calculateLine(selectedPoints[0], selectedPoints[1], selectedPoints[2]);
		addNewState(function(state){
			state.addLineWithIntersections(line);
		});
	};
	inputStrategies.push(parallelInputStrategy);
	
	var circumscribeInputStrategy = new InputStrategy("Circumscribe Triangle", 3);
	circumscribeInputStrategy.calculateCenter = function(p1, p2, p3){
		var l1 = Line.fromTwoPoints(p1, p2);
		l1 = Line.fromPointSlope(Utils.midPoint(p1, p2), Utils.perpendicularSlope(l1.getSlope()));
		var l2 = Line.fromTwoPoints(p2, p3);
		l2 = Line.fromPointSlope(Utils.midPoint(p2, p3), Utils.perpendicularSlope(l2.getSlope()));
		var intersection = l1.intersectLine(l2);
		if (intersection.length > 0){
			return intersection[0];
		} else {
			return null;
		}
	};
	circumscribeInputStrategy.shadowHook2 = function(p1, p2){
		var center = Utils.midPoint(p1, p2);
		var circle = new Circle(center, center.dist(p1));
		return [center, circle];
	};
	circumscribeInputStrategy.shadowHook3 = function(p1, p2, p3){
		var center = this.calculateCenter(p1, p2, p3);
		if (center === null){
			return [];
		} else {
			var circle = new Circle(center, center.dist(p1));
			return [center, circle];
		}
	};
	circumscribeInputStrategy.calculateCircle = function(p1, p2, p3){
		var center = this.calculateCenter(p1, p2, p3);
		if (center === null){
			return null;
		} else {
			return new Circle(center, center.dist(p1));
		}
	};
	circumscribeInputStrategy.endHook = function(){
		var center = this.calculateCenter(selectedPoints[0], selectedPoints[1], selectedPoints[2]);
		if (center !== null){
			var circle = this.calculateCircle(selectedPoints[0], selectedPoints[1], selectedPoints[2]);
			addNewState(function(state){
				state.addPoint(center);
				state.addCircleWithIntersections(circle);
			});
		}
	};
	inputStrategies.push(circumscribeInputStrategy);
	
	var compassInputStrategy = new InputStrategy("Compass", 3);
	compassInputStrategy.shadowHook2 = function(p1, p2){
		return [new Circle(p1, p1.dist(p2))];
	};
	compassInputStrategy.shadowHook3 = function(p1, p2, p3){
		return [new Circle(p3, p1.dist(p2))];
	};
	compassInputStrategy.endHook = function(){
		addNewState(function(state){
			state.addCircleWithIntersections(new Circle(selectedPoints[2], selectedPoints[0].dist(selectedPoints[1])));
		});
	};
	inputStrategies.push(compassInputStrategy);
	
	var fillColorInputStrategy = new InputStrategy("Fill Color", 0);
	fillColorInputStrategy.press = function(){};//Do nothing
	fillColorInputStrategy.release = function(x, y){
		var selPoint = converter.screenToAbstractCoord(new Point(x, y));
		var enclosure = Enclosure.findEnclosure(selPoint, currentState);
		if (enclosure !== null){
			enclosure.color = fillColor;
			addNewState(function(state){
				state.addEnclosure(enclosure);
			});
		}
	};
	fillColorInputStrategy.click = function(){};
	fillColorInputStrategy.drag = function(){};
	inputStrategies.push(fillColorInputStrategy);
	
	var eraseColorInputStrategy = new InputStrategy("Erase Color", 0);
	eraseColorInputStrategy.press = function(){};
	eraseColorInputStrategy.release = function(x, y){
		var selPoint = converter.screenToAbstractCoord(new Point(x, y));
		addNewState(function(state){
			state.removeEnclosure(selPoint);
		});
	};
	eraseColorInputStrategy.click = function(){};
	eraseColorInputStrategy.drag = function(){};
	inputStrategies.push(eraseColorInputStrategy);
	
	var pickColorInputStrategy = new InputStrategy("Pick Color", 0);
	pickColorInputStrategy.press = function(){};
	pickColorInputStrategy.release = function(x, y){
		var selPoint = converter.screenToAbstractCoord(new Point(x, y));
		var enclosure = currentState.getTopEnclosure(selPoint);
		if (enclosure !== null){
			fillColor = enclosure.color;
			$("#chooseColor").val(enclosure.color);
		}
	};
	pickColorInputStrategy.click = function(){};
	pickColorInputStrategy.drag = function(){};
	inputStrategies.push(pickColorInputStrategy);
	
	var panInputStrategy = new InputStrategy("Pan", 0);
	panInputStrategy.oldPoint = null;
	panInputStrategy.press = function(x, y){
		this.oldPoint = converter.screenToAbstractCoord(new Point(x, y));
	};
	panInputStrategy.release = function(x, y){
		this.oldPoint = null;
	};
	panInputStrategy.click = function(){};
	panInputStrategy.drag = function(x, y){
		if (this.oldPoint !== null){
			var diff = converter.screenToAbstractCoord(new Point(x, y));
			var xDiff = diff.x - this.oldPoint.x;
			var yDiff = diff.y - this.oldPoint.y;
			converter.cX = converter.cX - xDiff;
			converter.cY = converter.cY - yDiff;
			updateView();
		}
	};
	inputStrategies.push(panInputStrategy);
	
	var rotateInputStrategy = new InputStrategy("Rotate", 0);
	rotateInputStrategy.oldAngle = null;
	rotateInputStrategy.press = function(x, y){
		var center = new Point(converter.cX, converter.cY);
		this.oldAngle = center.angle(converter.screenToAbstractCoord(new Point(x, y)));
	};
	rotateInputStrategy.release = function(x, y){
		this.oldAngle = null;
	};
	rotateInputStrategy.click = function(){};
	rotateInputStrategy.drag = function(x, y){
		if (this.oldAngle !== null){
			var center = new Point(converter.cX, converter.cY);
			var newAngle = center.angle(converter.screenToAbstractCoord(new Point(x, y)));
			var diff = newAngle - this.oldAngle;
			converter.angle = Utils.angleSum(converter.angle, diff);
			updateView();
		}
	};
	inputStrategies.push(rotateInputStrategy);
	
	var multiTouchHandler = {
		multiTouchMode: false,
		abstractPoints: [],
		touchStart: function(touches){
			if (!this.multiTouchMode){
				selectedPoints = [];
				shadows = [];
				this.multiTouchMode = true;
			}
			this.abstractPoints = [];
			for (var i = 0; i < touches.length; i++){
				var point = new Point(touches[i].x, touches[i].y);
				this.abstractPoints.push(converter.screenToAbstractCoord(point));
			}
		},
		touchMove: function(touches){
			var screenPoints = [];
			for (var i = 0; i < touches.length; i++){
				var point = new Point(touches[i].x, touches[i].y);
				screenPoints.push(point);
			}
			if (this.abstractPoints.length > 1 && screenPoints.length > 1){
				converter.zoom(this.abstractPoints[0], this.abstractPoints[1], screenPoints[0], screenPoints[1], false);
			} else {
				converter.translate(this.abstractPoints[0], screenPoints[0]);
			}
		},
		touchEnd: function(touches){
			this.abstractPoints = [];
			for (var i = 0; i < touches.length; i++){
				var point = new Point(touches[i].x, touches[i].y);
				this.abstractPoints.push(converter.screenToAbstractCoord(point));
			}
			if (touches.length === 0){
				this.multiTouchMode = false;
			}
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
	var inputStrategy = drawCircleInputStrategy;
	var selectedPoints = [];
	var shadows = [];
	var fillColor = "#ff0000";
	var showLines = true;
	var showPoints = true;
	var ctx;
	var saves = {};
	if (localStorage.getItem('saves') !== null){
		saves = JSON.parse(localStorage.getItem('saves'));
	}
	
	function setColor(color){
		fillColor = color;
	}
	
	function setContext(context){
		ctx = context;
	}
	
	function getContext(){
		return ctx;
	}
	
	function initContext(){
		ctx.lineWidth = 2;
	};
	
	function stickPoint(p){
		var fromScreenClick = converter.screenToAbstractCoord(p);
		var nearest = currentState.nearestPoint(fromScreenClick);
		if (converter.abstractToScreenDist(fromScreenClick.dist(nearest)) < 20)
			return nearest;
		else
			return fromScreenClick;
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
	
	function addNewState(fun){
		var newState = currentState.copy();
		fun(newState);
		addState(newState);
		selectedPoints = [];
		updateView();
	};

	function addState(newState){
		currentState.next = newState;
		newState.previous = currentState;
		currentState = newState;
		save('autosave', false);
	}

	function updateView(){
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		ctx.fillStyle = '#fafafa';
		ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		ctx.strokeStyle = 'black';
		currentState.draw(ctx, converter, showLines, showPoints);
		var length = selectedPoints.length;
		for (var i = 0; i < length; i++){
			selectedPoints[i].draw(ctx, converter, new Color(255, 0, 0));
		}
		ctx.strokeStyle = 'lightgray';
		length = shadows.length;
		for (i = 0; i < length; i++){
			shadows[i].draw(ctx, converter, new Color(190, 190, 190));
		}
		$('#angle').val(Utils.round(Utils.toDegrees(converter.angle), -6));
	}
	
	function getInputStrategy(){
		return inputStrategy;
	}
	
	function setInputStrategy(name){
		selectedPoints = [];
		shadows = [];
		var length = inputStrategies.length;
		for (var i = 0; i < length; i++){
			if (inputStrategies[i].name === name){
				inputStrategy = inputStrategies[i];
			}
		}
		updateView();
	}
	
	function getCurrentState(){
		return currentState;
	}
	
	function clear(){
		var newState = new AlDrawState();
		newState.start();
		addState(newState);
		selectedPoints = [];
		setDefaultView();
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
	
	function autoZoom(){
		converter.autoZoom(currentState);
		updateView();
	}
	
	function setDefaultView(){
		converter.conversionRatio = Math.min(converter.width, converter.height)/2-1;
		converter.cX = 0;
		converter.cY = 0;
		converter.angle = 0;
		updateView();
	}
	
	function zoomIn(){
		converter.conversionRatio = converter.conversionRatio * converter.zoomAmt;
		updateView();
	}
	
	function zoomOut(){
		converter.conversionRatio = converter.conversionRatio / converter.zoomAmt;
		updateView();
	}
	
	function setAngle(value){
		var angle = Number(value);
		if (angle !== NaN){
			converter.angle = Utils.toRadians(angle);
		}
		updateView();
	}
	
	function setShowLines(show){
		showLines = show;
		updateView();
	}
	
	function setShowPoints(show){
		showPoints = show;
		updateView();
	}
	
	var hasSaveDialogBeenGenerated = false;
	
	function generateSaveDialog(){
		if (!hasSaveDialogBeenGenerated){
			var saveDialog = document.getElementById('saveDialogContents');
			for (var prop in saves){
				var save = saves[prop];
				var input = document.createElement('input');
				input.id = 'saveDialogInput' + prop;
				input.value = prop;
				input.className = 'saveDialogRadio';
				input.setAttribute('type', 'radio');
				input.setAttribute('name', 'saveDialogRadio');
				input.onclick = function(){
					document.getElementById('saveFilename').value = this.value;
				};
				var label = document.createElement('label');
				label.setAttribute('for', 'saveDialogInput' + prop);
				var labelText = document.createElement('div');
				labelText.innerHTML = prop;
				var newCanvas = document.createElement('canvas');
				var size = 100;
				newCanvas.height = size;
				newCanvas.width = size;
				var newContext = newCanvas.getContext("2d");
				//newContext.lineWidth = 2;
				var newConverter = new CoordinateConverter();
				newConverter.height = size;
				newConverter.width = size;
				newConverter.setValues(save.converter);
				newConverter.conversionRatio = newConverter.conversionRatio * size / Math.min(save.converter.height, save.converter.width);
				var newState = AlDrawState.fromObject(save.state);
				newState.draw(newContext, newConverter, true, false);
				label.appendChild(labelText);
				label.appendChild(newCanvas);
				saveDialog.appendChild(input);
				saveDialog.appendChild(label);
			}
			$('.saveDialogRadio').checkboxradio({icon: false});
			hasSaveDialogBeenGenerated = true;
		}
	}
	
	function clearSaveDialog(){
		hasSaveDialogBeenGenerated = false;
		var saveDialog = document.getElementById('saveDialogContents');
		var clone = saveDialog.cloneNode(false);
		saveDialog.parentNode.replaceChild(clone, saveDialog);
	}
	
	function save(name, conf){
		var save = {state: currentState, converter: converter.copy()};
		if (!conf || (saves[name] === undefined || confirm('Are you sure you want to overwrite ' + name + '?'))){
			saves[name] = save;
			localStorage.setItem("saves", JSON.stringify(saves));
			$('#saveDialog').dialog('close');
			clearSaveDialog();
		}
	}
	
	function load(name){
		var save = saves[name];
		if (save === undefined){
			alert('There is no save named ' + name + '.');
		} else {
			converter.setValues(save.converter);
			var newState = AlDrawState.fromObject(save.state);
			addState(newState);
			updateView();
			$('#saveDialog').dialog('close');
		}
	}
	
	function deleteSave(name){
		if (confirm('Are you sure you want to delete ' + name + '?')){
			delete saves[name];
			localStorage.setItem("saves", JSON.stringify(saves));
			clearSaveDialog();
			generateSaveDialog();
		}
	}
	
	function saveAsPNG(name){
		var canvas = document.getElementById("myCanvas");
		var newCanvas = document.createElement("canvas");
		newCanvas.width = canvas.width;
		newCanvas.height = canvas.height;
		var newContext = newCanvas.getContext("2d");
		newContext.lineWidth = 2;
		currentState.draw(newContext, converter, showLines, false);
		var url = newCanvas.toDataURL("image/png");
		var link = document.createElement("a");
		if (name === ''){
			name = 'aldraw.png';
		} else if (!name.endsWith('.png')){
			name += '.png';
		}
		link.download = name;
		link.href = url;
		link.click();
	}
	
	function saveAsSVG(name){
		function writeSegment(segment){
			var p1 = converter.abstractToScreenCoord(segment.p1);
			var p2 = converter.abstractToScreenCoord(segment.p2);
			return '<line x1="' + p1.x + '" y1="' + p1.y + '" x2="' + p2.x + '" y2="' + p2.y + '" style="stroke:#000000;"/>';
		}
		var radius, end, largearc, sweepflag;
		var str = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="' + converter.width + 'px" height="' + converter.height + 'px">'
		var length = currentState.enclosures.length;
		for (var i = 0; i < length; i++){
			var e = currentState.enclosures[i];
			var p = converter.abstractToScreenCoord(e.path[0].startPoint());
			str += '<path d="M ' + p.x + ' ' + p.y;
			for (var j = 0; j < e.path.length; j++){
				var pathable = e.path[j];
				if (pathable.isA("Segment")){
					p = converter.abstractToScreenCoord(pathable.p2);
					str += ' L ' + p.x + ' ' + p.y;
				} else {
					if (Utils.floatsEqual(pathable.sweep, 2*Math.PI)){
						var mid = converter.abstractToScreenCoord(pathable.getPointAtAngle(Utils.angleSum(pathable.start, Math.PI)));
						end = converter.abstractToScreenCoord(pathable.getPointAtAngle(pathable.start));
						radius = converter.abstractToScreenDist(pathable.radius);
						sweepflag = 1;
						if (pathable.inverse){
							sweepflag = 0;
						}
						str += ' A ' + radius + ' ' + radius + ' 0 0 ' + sweepflag + ' ' + mid.x + ' ' + mid.y;
						str += ' A ' + radius + ' ' + radius + ' 0 1 ' + sweepflag + ' ' + end.x + ' ' + end.y;
					} else {
						end = converter.abstractToScreenCoord(pathable.getPointAtAngle(pathable.getEnd()));
						radius = converter.abstractToScreenDist(pathable.radius);
						largearc = 0;
						if (pathable.sweep > Math.PI)
							largearc = 1;
						sweepflag = 1;
						if (pathable.inverse)
						{
							end = converter.abstractToScreenCoord(pathable.getPointAtAngle(pathable.start));
							sweepflag = 0;
						}
						str += ' A ' + radius + ' ' + radius + ' 0 ' + largearc + ' ' + sweepflag + ' ' + end.x + ' ' + end.y;
					}
				}
			}
			str += '" fill="' + e.color + '" fill-rule="evenodd" stroke="none"/>';
		}
		length = currentState.segments.length;
		for (i = 0; i < length; i++){
			var s = currentState.segments[i];
			str += writeSegment(s);
		}
		length = currentState.rays.length;
		for (i = 0; i < length; i++){
			var r = currentState.rays[i];
			s = r.getPortionInsideRectangle(converter.getAbstractBoundaries());
			if (s !== null){
				str += writeSegment(s);
			}
		}
		length = currentState.lines.length;
		for (i = 0; i < length; i++){
			var l = currentState.lines[i];
			s = l.getPortionInsideRectangle(converter.getAbstractBoundaries());
			if (s !== null){
				str += writeSegment(s);
			}
		}
		length = currentState.arcs.length;
		for (i = 0; i < length; i++){
			var a = currentState.arcs[i];
			var start = converter.abstractToScreenCoord(a.getPointAtAngle(a.start));
			end = converter.abstractToScreenCoord(a.getPointAtAngle(a.getEnd()));
			radius = converter.abstractToScreenDist(a.radius);
			largearc = 0;
			if (a.sweep > Math.PI)
				largearc = 1;
			str += '<path d="M' + start.x + ' ' + start.y + ' A' + radius + ' ' + radius + ' 0 ' + largearc + ' 1 ' + end.x + ' ' + end.y + '" style="stroke:#000000; fill:none"/>';
		}
		length = currentState.circles.length;
		for (i = 0; i < length; i++){
			var c = currentState.circles[i];
			var center = converter.abstractToScreenCoord(c.center);
			radius = converter.abstractToScreenDist(c.radius);
			str += '<circle cx="' + center.x + '" cy="' + center.y + '" r="' + radius + '" style="stroke:#000000; fill:none"/>';
		}
		str += '</svg>';
		var blob = new Blob([str]);
		var url = window.URL.createObjectURL(blob);
		var link = document.createElement("a");
		if (name === ''){
			name = 'aldraw.svg';
		} else if (!name.endsWith('.svg')){
			name += '.svg';
		}
		link.download = name;
		link.href = url;
		link.click();
	}
	
	return {
		converter: converter,
		getCurrentState: getCurrentState,
		getInputStrategy: getInputStrategy,
		setInputStrategy: setInputStrategy,
		multiTouchHandler: multiTouchHandler,
		setColor: setColor,
		setContext: setContext,
		getContext: getContext,
		initContext: initContext,
		resizeCanvas: resizeCanvas,
		updateView: updateView,
		clear: clear,
		undo: undo,
		redo: redo,
		autoZoom: autoZoom,
		setDefaultView: setDefaultView,
		zoomIn: zoomIn,
		zoomOut: zoomOut,
		setAngle: setAngle,
		setShowLines: setShowLines,
		setShowPoints: setShowPoints,
		generateSaveDialog: generateSaveDialog,
		save: save,
		load: load,
		deleteSave: deleteSave,
		saveAsPNG: saveAsPNG,
		saveAsSVG: saveAsSVG
	};
})();

function clickModeGroup(val){
	$('.modeGroup').hide();
	$('.' + val).show();
	AlDrawModule.setInputStrategy($('[name="' + val + '"]:checked').val());
}

function markChecked(id){
	document.getElementById(id).checked = true;
	$('.relatedButtons').checkboxradio("refresh");
}

function nextHelpPage(){
	document.getElementById('helpContent').scrollTop = 0;
	var elem = $('.helpPage.visible');
	var next = elem.next();
	elem.removeClass('visible');
	elem.addClass('invisible');
	next.removeClass('invisible');
	next.addClass('visible');
	$('#prevHelpPage').button({disabled: false});
	if (next.next().length === 0){
		$('#nextHelpPage').button({disabled: true});
	}
}

function prevHelpPage(){
	document.getElementById('helpContent').scrollTop = 0;
	var elem = $('.helpPage.visible');
	var prev = elem.prev();
	elem.removeClass('visible');
	elem.addClass('invisible');
	prev.removeClass('invisible');
	prev.addClass('visible');
	$('#nextHelpPage').button({disabled: false});
	if (prev.prev().length === 0){
		$('#prevHelpPage').button({disabled: true});
	}
}

$(document).ready(function(){
	$(document).tooltip();
	$(".button").button();
	$("#chooseColor").button();
	$(".radioButton").checkboxradio({icon: false});
	$(".radioButtonGroup").controlgroup();
	$("#saveDialog").dialog({autoOpen: false, height: 400, width: 460});
	$("#downloadDialog").dialog({autoOpen: false});
	$("#helpDialog").dialog({autoOpen: false, height:400, width:500});
	
	var canvas = document.getElementById("myCanvas");
	AlDrawModule.resizeCanvas();
	AlDrawModule.setContext(canvas.getContext("2d"));
	AlDrawModule.initContext();
	AlDrawModule.setDefaultView();
	
	$(window).resize(function(){
		AlDrawModule.resizeCanvas();
		AlDrawModule.initContext();
		AlDrawModule.updateView();
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
	
	var extractTouchCoordinates = function(touch){
		var canvasBounds = canvas.getBoundingClientRect();
		var x = touch.clientX - canvasBounds.left;
		var y = touch.clientY - canvasBounds.top;
		return {x: x, y: y};
	};
	
	var extractTouchesCoordinates = function(touches){
		var coordinates = [];
		for(var i = 0; i < touches.length; i++){
			coordinates.push(extractTouchCoordinates(touches[i]));
		}
		return coordinates;
	}
	
	canvas.addEventListener("touchstart", function(ev){
		ev.preventDefault();
		ev.stopImmediatePropagation();
		if (ev.touches.length === 1){
			var coordinates = extractTouchCoordinates(ev.touches[0]);
			AlDrawModule.getInputStrategy().press(coordinates.x, coordinates.y);
		} else {
			AlDrawModule.multiTouchHandler.touchStart(extractTouchesCoordinates(ev.touches));
		}
	}, {passive: false});
	
	canvas.addEventListener("touchmove", function(ev){
		ev.preventDefault();
		ev.stopImmediatePropagation();
		if (!AlDrawModule.multiTouchHandler.multiTouchMode){
			var coordinates = extractTouchCoordinates(ev.touches[0]);
			AlDrawModule.getInputStrategy().drag(coordinates.x, coordinates.y);
		} else {
			AlDrawModule.multiTouchHandler.touchMove(extractTouchesCoordinates(ev.touches));
		}
	}, {passive: false});
	
	canvas.addEventListener("touchend", function(ev){
		ev.preventDefault();
		ev.stopImmediatePropagation();
		if (!AlDrawModule.multiTouchHandler.multiTouchMode){
			var coordinates = extractTouchCoordinates(ev.changedTouches[0]);
			AlDrawModule.getInputStrategy().release(coordinates.x, coordinates.y);
		} else {
			AlDrawModule.multiTouchHandler.touchEnd(extractTouchesCoordinates(ev.touches));
		}
	}, {passive: false});
	
	$(document).keydown(function(ev){
		//console.log(ev.which);
		//console.log(ev.shiftKey);
		if (ev.ctrlKey && ev.which === 32){ //Ctrl-Space
			AlDrawModule.clear();
		} else if (ev.ctrlKey && ev.which === 65){ //Ctrl-A?
			ev.preventDefault();
			AlDrawModule.autoZoom();
		} else if (ev.ctrlKey && (ev.which === 89 || (ev.shiftKey && ev.which === 90))){ //Ctrl-Y or Ctrl-Shift-Z
			AlDrawModule.redo();
		} else if (ev.ctrlKey && ev.which === 90){ //Ctrl-Z
			AlDrawModule.undo();
		}
	});
});