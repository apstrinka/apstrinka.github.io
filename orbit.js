"use strict"

$(document).ready(function() {
	var scene, cam, renderer, ship, shipTheta, shipPhi, planet, orbit, orbitPath, clock, timeWarp, mouseX, mouseY, isDragging;
	var time = 0;
	var g = 6.67e-11;
	
	var UTIL = {
		newtonsMethod: function(f, df, x, maxStep){
			var epsilon = .0001;
			var maxIter = 10;
			var iter = 0;
			var y = f(x);
			while (Math.abs(y) > epsilon && iter < maxIter){
				iter = iter + 1;
				var step = y/df(x);
				if (maxStep > 0 && Math.abs(step) > maxStep){
					step = Math.sign(step)*maxStep;
				}
				x = x - step;
				y = f(x);
			}
			return x;
		},
		unsignedModulo: function(a, b){
			var x = a % b;
			if (x < 0)
				x = x + b;
			return x;
		},
		toDegrees: function(rad){
			return rad*180/Math.PI;
		},
		toRadians: function(deg){
			return deg*Math.PI/180;
		}
	};
	
	var Orbit = function(mass, eccentricity, semiMajorAxis, periapsisAngle, inclination, longAscNode){
		this.mass = mass;
		this.e = eccentricity;
		this.a = semiMajorAxis;
		this.periAng = periapsisAngle;
		this.i = inclination;
		this.longAscNode = longAscNode;
		this.M0 = 0;
	}

	Orbit.prototype.setInitMeanAnomaly = function(nu, t){
		var eccAnomaly, hypAnomaly, meanAnomaly;
		if (this.e < 1){ //Eccentric orbit
			eccAnomaly = Math.acos((this.e + Math.cos(nu))/(1 + this.e*Math.cos(nu)));
			if (UTIL.unsignedModulo(nu, 2*Math.PI) > Math.PI)
				eccAnomaly = 2*Math.PI - eccAnomaly;
			meanAnomaly = eccAnomaly - this.e*Math.sin(eccAnomaly);
			this.M0 = meanAnomaly - Math.sqrt(g*this.mass/Math.pow(this.a, 3)) * t;
		} else { //Hyperbolic orbit
			if (Math.abs(this.e + Math.cos(nu)) > Math.abs(1 + this.e*Math.cos(nu)))
				hypAnomaly = 0;
			else
				hypAnomaly = Math.acosh((this.e + Math.cos(nu))/(1 + this.e*Math.cos(nu)));
			if (nu < 0)
				hypAnomaly = -hypAnomaly;
			meanAnomaly = this.e*Math.sinh(hypAnomaly) - hypAnomaly;
			this.M0 = meanAnomaly - Math.sqrt(-g*this.mass/Math.pow(this.a, 3)) * t
		}
	}
	
	Orbit.prototype.calcEccentricAnomaly = function(meanAnomaly){
		var eccentricity = this.e;
		var f = function(x){
			return x - eccentricity*Math.sin(x) - meanAnomaly;
		}
		
		var df = function(x){
			return 1 - eccentricity*Math.cos(x);
		}
		
		return UTIL.newtonsMethod(f, df, meanAnomaly, Math.PI);
	}
	
	Orbit.prototype.calcHyperbolicAnomaly = function(meanAnomaly){
		var eccentricity = this.e;
		var f = function(x){
			return eccentricity*Math.sinh(x) - x - meanAnomaly;
		}
		
		var df = function(x){
			return eccentricity*Math.cosh(x) - 1;
		}
		
		var guess = meanAnomaly;
		if (meanAnomaly > 2)
			guess = Math.log(meanAnomaly);
		else if (meanAnomaly < -2)
			guess = -Math.log(-meanAnomaly);
		return UTIL.newtonsMethod(f, df, guess, 0);
	}
	
	Orbit.prototype.getTrueAnomaly = function(t){
		var meanAnomaly;
		var nu;
		if (this.e < 1){ //Elliptical orbit
			meanAnomaly = Math.sqrt(g*this.mass/Math.pow(this.a, 3)) * t + this.M0;
			if (this.e < 0.03){ //This is an approximation that only works when e is small, I chose 0.03 as an arbitrary threshold
				nu = meanAnomaly + 2*this.e*Math.sin(meanAnomaly) + 1.25*Math.pow(this.e, 2)*Math.sin(2*meanAnomaly);
			} else {
				var eccAnomaly = this.calcEccentricAnomaly(meanAnomaly);
				eccAnomaly = UTIL.unsignedModulo(eccAnomaly, 2*Math.PI);
				nu = Math.acos((Math.cos(eccAnomaly) - this.e) / (1 - this.e*Math.cos(eccAnomaly)));
				if (eccAnomaly > Math.PI)
					nu = 2*Math.PI - nu;
			}
		} else { //Hyperbolic orbit
			meanAnomaly = Math.sqrt(-g*this.mass/Math.pow(this.a, 3)) * t + this.M0;
			var hypAnomaly = this.calcHyperbolicAnomaly(meanAnomaly);
			if (Math.abs(Math.cosh(hypAnomaly) - this.e) > Math.abs(1 - this.e*Math.cosh(hypAnomaly))){
				console.log('Impossible true anomaly');
				nu = 0;
			} else {
				nu = Math.acos((Math.cosh(hypAnomaly) - this.e) / (1 - this.e*Math.cosh(hypAnomaly)));
			}
			if (hypAnomaly < 0)
				nu = -nu;
		}
		return nu;
	}
	
	Orbit.prototype.getPosition = function(nu){
		var dist = this.a*(1-Math.pow(this.e, 2)) / (1 + this.e*Math.cos(nu));
		var l = UTIL.unsignedModulo(nu + this.periAng, 2*Math.PI);
		var theta = Math.PI/2 - Math.asin(Math.sin(this.i)*Math.sin(l));
		var phi = this.longAscNode + Math.atan(Math.cos(this.i)*Math.tan(l));
		if (l > Math.PI/2 && l < 3*Math.PI/2)
			phi = Math.PI + phi;
		return {
			theta: theta,
			phi: phi,
			x: dist*Math.sin(theta)*Math.cos(phi),
			y: dist*Math.cos(theta),
			z: -dist*Math.sin(theta)*Math.sin(phi)
		};
	}
	
	var init = function(){
		scene = new THREE.Scene();
		cam = {
			camera: new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1e100 ),
			dist: 10485760,
			theta: .00001,
			phi: Math.PI/2,
			setCameraPosition: function(){
				this.camera.position.setX(this.dist*Math.sin(this.theta)*Math.cos(this.phi));
				this.camera.position.setZ(this.dist*Math.sin(this.theta)*Math.sin(this.phi));
				this.camera.position.setY(this.dist*Math.cos(this.theta));
				this.camera.lookAt(new THREE.Vector3(0, 0, 0))
			}
		};
		cam.setCameraPosition();
		renderer = new THREE.WebGLRenderer();
		renderer.setClearColor( 0x000000, 1 );
		renderer.setSize( window.innerWidth, window.innerHeight );
		$('#viewportFrame').append( renderer.domElement );
	
		THREE.ImageUtils.crossOrigin = '';
		var texture = THREE.ImageUtils.loadTexture('http://i.imgur.com/obYIPJR.jpg');
		texture.minFilter = THREE.LinearFilter;
		//Moon: http://i.imgur.com/jXVhHDJ.jpg 
		//Earth: http://i.imgur.com/obYIPJR.jpg
		var material = new THREE.MeshBasicMaterial( { map: texture });
		var geometry = new THREE.SphereGeometry( 5e6, 100, 100 );
		//var greenMaterial = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
		planet = new THREE.Mesh( geometry, material );
		scene.add( planet );
	
		geometry = new THREE.SphereGeometry(1e5);
		var redMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
		ship = new THREE.Mesh(geometry, redMaterial);
		ship.position.x = 1;
		scene.add(ship);
		
		renderer.render(scene, cam.camera);
		
		shipTheta = Math.PI/2;
		shipPhi = Math.PI/2;
	};
	
	var getHyperbolaPoints = function(a, e, cX, cY, theta){
		var numPoints = 100;
		var step = .1;
		var b = Math.sqrt(a*a*(e*e-1));
		var pts = [];
		var n, t, x, y;
		for (n = -numPoints/2; n <= numPoints/2; n++){
			t = n*step;
			x = cX + a*Math.cosh(t);
			y = cY + b*Math.sinh(t);
			if (theta !== 0){
				var cos = Math.cos( theta );
				var sin = Math.sin( theta );
				var tx = x, ty = y;
				x = (tx - cX)*cos - (ty - cY)*sin + cX;
				y = (tx - cX)*sin + (ty - cY)*cos + cY;
			}
			pts.push(new THREE.Vector2(x, y));
		}
		return pts;
	}
	
	var calcOrbit = function(mass, distance, speed, zenithAngle, azimuthAngle){
		var eccentricitySqrd, eccentricity, semiMajorAxis, nu, cosNu, periapsisAngle, inclination, longAscNode, lambda, l;
		eccentricitySqrd = Math.pow((distance*speed*speed/(g*mass) - 1)*Math.sin(zenithAngle), 2) + Math.pow(Math.cos(zenithAngle), 2);
		eccentricity = Math.sqrt(eccentricitySqrd);
		semiMajorAxis = 1 / (2/distance - speed*speed / (g*mass));
		if (eccentricitySqrd < 1){
			nu = Math.atan2(Math.sin(zenithAngle)*Math.cos(zenithAngle), Math.pow(Math.sin(zenithAngle), 2) - g*mass/(distance*speed*speed));
		} else {
			cosNu = (semiMajorAxis*(1-eccentricitySqrd) - distance)/(eccentricity*distance);
			if (cosNu > 1)
				cosNu = 1;
			if (cosNu < -1)
				cosNu = -1;
			nu = Math.acos(cosNu);
			if (zenithAngle > Math.PI/2 && zenithAngle < 3*Math.PI/2)
				nu = -nu;
		}
		inclination = Math.acos(Math.sin(shipTheta)*Math.sin(azimuthAngle));
		if (inclination === 0){
			longAscNode = 0;
			periapsisAngle = shipTheta - nu;
		} else {
			lambda = Math.atan(Math.cos(shipTheta)*Math.tan(azimuthAngle));
			if (azimuthAngle > Math.PI/2)
				lambda = lambda + Math.PI;
			longAscNode = shipTheta - lambda;
			l = Math.atan2(1/Math.tan(shipTheta), Math.cos(azimuthAngle));
			periapsisAngle = l - nu;
		}
		var orbit = new Orbit(mass, eccentricity, semiMajorAxis, periapsisAngle, inclination, longAscNode);
		orbit.setInitMeanAnomaly(nu, time);
		return orbit;
	}
	
	var drawOrbit = function(orbit){
		var curve, path, geometry, material;
		if (orbit.e < 1){
			var semiMinorAxis = orbit.a*Math.sqrt(1-orbit.e*orbit.e);
			var f = orbit.e*orbit.a;
			curve = new THREE.EllipseCurve(
				-f*Math.cos(orbit.longAscNode), -f*Math.sin(orbit.longAscNode),	// ax, aY
				orbit.a, semiMinorAxis,	// xRadius, yRadius
				0,  2 * Math.PI,	// aStartAngle, aEndAngle
				false,	// aClockwise
				orbit.longAscNode	// aRotation 
			);
			path = new THREE.Path( curve.getPoints( 50 ) );
			geometry = path.createPointsGeometry( 50 );
		} else {
			path = new THREE.Path(getHyperbolaPoints(orbit.a, orbit.e, -orbit.a*orbit.e*Math.cos(orbit.longAscNode), -orbit.a*orbit.e*Math.sin(orbit.longAscNode), orbit.longAscNode));
			geometry = path.createPointsGeometry( 100 );
		}
		material = new THREE.LineBasicMaterial( { color : 0xff0000 } );
		orbitPath = new THREE.Line( geometry, material );
		orbitPath.rotateOnAxis(new THREE.Vector3(1, 0, 0), -Math.PI/2);
		orbitPath.rotateOnAxis(new THREE.Vector3(Math.cos(orbit.longAscNode), Math.sin(orbit.longAscNode), 0), orbit.i);
		orbitPath.rotateOnAxis(new THREE.Vector3(0, 0, 1), orbit.periAng);
		scene.add(orbitPath);
		
		renderer.render(scene, cam.camera);
	}
	
	var calcAndDrawOrbit = function(){
		var mass = parseFloat($('#mass').val());
		var distance = parseFloat($('#distance').val());
		var speed = parseFloat($('#speed').val());
		var zenithAngle = parseFloat($('#zenithangle').val());
		var azimuthAngle = parseFloat($('#azimuthangle').val());
		if (!isNaN(mass) && !isNaN(distance) && !isNaN(speed) && !isNaN(zenithAngle) && !isNaN(azimuthAngle)){
			scene.remove(orbitPath);
			zenithAngle = UTIL.toRadians(zenithAngle);
			azimuthAngle = UTIL.toRadians(azimuthAngle);
			orbit = calcOrbit(mass, distance, speed, zenithAngle, azimuthAngle);
			updateShipPos();
			drawOrbit(orbit);
		}
		$('#eccentricity').val(orbit.e);
		$('#semimajoraxis').val(orbit.a);
		$('#periapsisangle').val(UTIL.toDegrees(orbit.periAng));
		$('#inclination').val(UTIL.toDegrees(orbit.i));
		$('#longascnode').val(UTIL.toDegrees(orbit.longAscNode));
	}
	
	var calcAndDrawOrbit2 = function(){
		var mass = parseFloat($('#mass').val());
		var eccentricity = parseFloat($('#eccentricity').val());
		var semiMajorAxis = parseFloat($('#semimajoraxis').val());
		var periAng = parseFloat($('#periapsisangle').val());
		var inclination = parseFloat($('#inclination').val());
		var longAscNode = parseFloat($('#longascnode').val());
		var trueAnomaly = parseFloat($('#trueanomaly').val());
		if (!isNaN(mass) && !isNaN(eccentricity) && !isNaN(semiMajorAxis) && !isNaN(periAng) && !isNaN(inclination) && !isNaN(longAscNode) && !isNaN(trueAnomaly)){
			if ((eccentricity < 1 && semiMajorAxis < 0) || (eccentricity > 1 && semiMajorAxis > 0))
				semiMajorAxis = -semiMajorAxis;
			periAng = UTIL.toRadians(periAng);
			inclination = UTIL.toRadians(inclination);
			longAscNode = UTIL.toRadians(longAscNode);
			trueAnomaly = UTIL.toRadians(trueAnomaly);
			scene.remove(orbitPath);
			orbit = new Orbit(mass, eccentricity, semiMajorAxis, periAng, inclination, longAscNode);
			orbit.setInitMeanAnomaly(trueAnomaly, time);
			updateShipPos();
			drawOrbit(orbit);
		}
	}
	
	var updateShipPos = function(){
		var mass = parseFloat($('#mass').val());
		var meanAnomaly;
		var nu = orbit.getTrueAnomaly(time);
		var dist = orbit.a*(1-Math.pow(orbit.e, 2)) / (1 + orbit.e*Math.cos(nu));
		var coords = orbit.getPosition(nu);
		shipTheta = coords.theta;
		shipPhi = coords.phi;
		ship.position.x = coords.x;
		ship.position.y = coords.y;
		ship.position.z = coords.z;
		var speed = Math.sqrt(g*mass*(2/dist - 1/orbit.a));
		var zenithAngle = UTIL.toDegrees(-Math.atan(orbit.e*Math.sin(nu)/(1 + orbit.e*Math.cos(nu))) + Math.PI/2);
		var lambda = shipPhi - orbit.longAscNode;
		var delta = Math.PI/2 - shipTheta;
		var azimuthAngle = UTIL.toDegrees(Math.atan(Math.tan(lambda)/Math.sin(delta)));
		if (lambda > Math.PI/2)
			azimuthAngle = azimuthAngle + 180;
		$('#distance').val(dist);
		$('#speed').val(speed);
		$('#zenithangle').val(zenithAngle);
		$('#azimuthangle').val(azimuthAngle);
		$('#trueanomaly').val(UTIL.toDegrees(nu));
	}
	
	var	animate = function(){
		if (timeWarp !== 0){
			requestAnimationFrame(animate);
			var delta = clock.getDelta();
			time = time + delta*timeWarp;
			$('#time').val(time);
			updateShipPos();
			planet.rotateOnAxis(new THREE.Vector3(0, 1, 0), delta*timeWarp*Math.PI/43200);
			renderer.render(scene, cam.camera);
		}
	}
	
	$('#time').change(function(){
		time = parseFloat($('#time').val());
		if (isNaN(time)){
			time = 0;
			$('#time').val(0);
		}
		updateShipPos();
		renderer.render(scene, cam.camera);
	});
	$('.parameter').change(calcAndDrawOrbit);
	$('.param2').change(calcAndDrawOrbit2);
	$('#zoomIn').click(function(){
		cam.dist = cam.dist/2;
		cam.setCameraPosition();
		//ship.scale = ship.scale.divideScalar(2);
		renderer.render(scene, cam.camera);
	});
	$('#zoomOut').click(function(){
		cam.dist = cam.dist*2;
		cam.setCameraPosition();
		//ship.scale = ship.scale.multiplyScalar(2);
		renderer.render(scene, cam.camera);
	});
	$('#start').click(function(){
		timeWarp = 100;
		clock = new THREE.Clock(true);
		$('.parameter').prop("disabled", true);
		$('.param2').prop("disabled", true);
		$('#start').hide();
		$('#stop').show();
		$('#fastback').show();
		$('#slowback').show();
		$('#slowforward').show();
		$('#fastforward').show();
		animate();
	});
	$('#stop').click(function() {
		timeWarp = 0;
		$('.parameter').prop("disabled", false);
		$('.param2').prop("disabled", false);
		$('#start').show();
		$('#stop').hide();
		$('#fastback').hide();
		$('#slowback').hide();
		$('#slowforward').hide();
		$('#fastforward').hide();
	});
	$('#fastback').click(function() {
		if (timeWarp > 0)
			timeWarp = -timeWarp;
		else
			timeWarp = timeWarp*2;
	});
	$('#slowback').click(function() {
		if (timeWarp > 0)
			timeWarp = -timeWarp;
		else
			timeWarp = timeWarp/2;
	});
	$('#slowforward').click(function() {
		if (timeWarp < 0)
			timeWarp = -timeWarp;
		else
			timeWarp = timeWarp/2;
	});
	$('#fastforward').click(function() {
		if (timeWarp < 0)
			timeWarp = -timeWarp;
		else
			timeWarp = timeWarp*2;
	});
	$('#viewportFrame').mousedown(function(event){
		mouseX = event.pageX;
		mouseY = event.pageY;
		isDragging = true;
	});
	$('#viewportFrame').on({'touchstart': function(event){
		event.preventDefault();
		mouseX = event.originalEvent.pageX;
		mouseY = event.originalEvent.pageY;
	}});
	$('#viewportFrame').on({'touchmove': function(event){
		event.preventDefault();
		var diffX = event.originalEvent.pageX - mouseX;
		var diffY = event.originalEvent.pageY - mouseY;
		cam.phi = cam.phi + .005*diffX;
		cam.theta = cam.theta - .005*diffY;
		if (cam.theta < .00001)
			cam.theta = .00001;
		if (cam.theta > Math.PI)
			cam.theta = Math.PI;
		cam.setCameraPosition();
		renderer.render(scene, cam.camera);
		mouseX = event.originalEvent.pageX;
		mouseY = event.originalEvent.pageY;
	}});
	$('#viewportFrame').mouseup(function(event){
		isDragging = false;
	});
	$('#viewportFrame').mousemove(function(event){
		if (isDragging){
			var diffX = event.pageX - mouseX;
			var diffY = event.pageY - mouseY;
			cam.phi = cam.phi + .005*diffX;
			cam.theta = cam.theta - .005*diffY;
			if (cam.theta < .00001)
				cam.theta = .00001;
			if (cam.theta > Math.PI)
				cam.theta = Math.PI;
			cam.setCameraPosition();
			renderer.render(scene, cam.camera);
			mouseX = event.pageX;
			mouseY = event.pageY;
		}
	});
	$('#viewportFrame').mousewheel(function(event){
		if(event.deltaY < 0){
			cam.dist = cam.dist*Math.SQRT2;
		} else if (event.deltaY > 0){
			cam.dist = cam.dist/Math.SQRT2;
		}
		cam.setCameraPosition();
		renderer.render(scene, cam.camera);
	});
	
	init();
	calcAndDrawOrbit();
});