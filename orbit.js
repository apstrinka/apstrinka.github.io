"use strict"

$(document).ready(function() {
	var scene, cam, renderer, ship, shipAngle, planet, orbit, orbitPath, clock, timeWarp, mouseX, mouseY, isDragging;
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
		}
	};
	
	var Orbit = function(mass, eccentricity, semiMajorAxis, periapsisAngle, initMeanAnomaly){
		this.mass = mass;
		this.e = eccentricity;
		this.a = semiMajorAxis;
		this.periAng = periapsisAngle;
		this.M0 = initMeanAnomaly;
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
			meanAnomaly = Math.sqrt(-g*mass/Math.pow(this.a, 3)) * t + this.M0;
			var hypAnomaly = this.calcHyperbolicAnomaly(meanAnomaly);
			nu = Math.acos((Math.cosh(hypAnomaly) - this.e) / (1 - this.e*Math.cosh(hypAnomaly)));
			if (hypAnomaly < 0)
				nu = -nu;
		}
		return nu;
	}
	
	Orbit.prototype.getPosition = function(nu){
		var dist = this.a*(1-Math.pow(this.e, 2)) / (1 + this.e*Math.cos(nu));
		return {x: dist*Math.cos(shipAngle), y: dist*Math.sin(shipAngle)};
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
		
		shipAngle = 0;
	};
	
	var setInitMeanAnomaly = function(){
		var nu = shipAngle - periapsisAngle;
		nu = UTIL.unsignedModulo(nu, 2*Math.PI);
		if (eccentricity < 1){
			var eccAnomaly = Math.acos((eccentricity + Math.cos(nu))/(1+eccentricity*Math.cos(nu)));
			if (nu > Math.PI)
				eccAnomaly = - eccAnomaly;
			initMeanAnomaly = eccAnomaly - eccentricity*Math.sin(eccAnomaly);
		} else {
			var hypAnomaly = Math.acosh((eccentricity + Math.cos(nu))/(1+eccentricity*Math.cos(nu)));
			if (nu > Math.PI)
				hypAnomaly = -hypAnomaly;
			initMeanAnomaly = eccentricity*Math.sinh(hypAnomaly) - hypAnomaly;
		}
	}
	
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
	
	var calcOrbit = function(mass, distance, speed, angle){
		var eccentricitySqrd, eccentricity, semiMajorAxis, nu, cosNu, periapsisAngle, eccAnomaly, hypAnomaly, initMeanAnomaly;
		eccentricitySqrd = Math.pow((distance*speed*speed/(g*mass) - 1)*Math.sin(angle), 2) + Math.pow(Math.cos(angle), 2);
		eccentricity = Math.sqrt(eccentricitySqrd);
		semiMajorAxis = 1 / (2/distance - speed*speed / (g*mass));
		if (eccentricitySqrd < 1){
			nu = Math.atan2(Math.sin(angle)*Math.cos(angle), Math.pow(Math.sin(angle), 2) - g*mass/(distance*speed*speed));
			periapsisAngle = shipAngle-nu;
			eccAnomaly = Math.acos((eccentricity + Math.cos(nu))/(1+eccentricity*Math.cos(nu)));
			if (nu > Math.PI)
				eccAnomaly = - eccAnomaly;
			initMeanAnomaly = eccAnomaly - eccentricity*Math.sin(eccAnomaly);
		} else {
			cosNu = (semiMajorAxis*(1-eccentricitySqrd) - distance)/(eccentricity*distance);
			if (cosNu > 1)
				cosNu = 1;
			if (cosNu < -1)
				cosNu = -1;
			nu = Math.acos(cosNu);
			if (angle > Math.PI/2 && angle < 3*Math.PI/2)
				nu = -nu;
			periapsisAngle = shipAngle - nu;
			hypAnomaly = Math.acosh((eccentricity + Math.cos(nu))/(1+eccentricity*Math.cos(nu)));
			if (nu > Math.PI)
				hypAnomaly = -hypAnomaly;
			initMeanAnomaly = eccentricity*Math.sinh(hypAnomaly) - hypAnomaly;
		}
		return new Orbit(mass, eccentricity, semiMajorAxis, periapsisAngle, initMeanAnomaly);
	}
	
	var drawOrbit = function(orbit, distance){
		var curve, path, geometry, material;
		ship.position.x = distance*Math.cos(shipAngle);
		ship.position.y = distance*Math.sin(shipAngle);
		if (orbit.e < 1){
			var semiMinorAxis = orbit.a*Math.sqrt(1-orbit.e*orbit.e);
			var f = orbit.e*orbit.a;
			curve = new THREE.EllipseCurve(
				-f*Math.cos(orbit.periAng),  -f*Math.sin(orbit.periAng),            // ax, aY
				orbit.a, semiMinorAxis,           // xRadius, yRadius
				0,  2 * Math.PI,  // aStartAngle, aEndAngle
				false,            // aClockwise
				orbit.periAng                 // aRotation 
			);
			path = new THREE.Path( curve.getPoints( 50 ) );
			geometry = path.createPointsGeometry( 50 );
		} else {
			path = new THREE.Path(getHyperbolaPoints(orbit.a, orbit.e, -orbit.a*orbit.e*Math.cos(orbit.periAng), -orbit.a*orbit.e*Math.sin(orbit.periAng), orbit.periAng));
			geometry = path.createPointsGeometry( 100 );
		}
		material = new THREE.LineBasicMaterial( { color : 0xff0000 } );
		orbitPath = new THREE.Line( geometry, material );
		orbitPath.rotateOnAxis(new THREE.Vector3(1, 0, 0), -Math.PI/2);
		scene.add(orbitPath);
		
		$('#eccentricity').val(orbit.e);
		$('#semimajoraxis').val(orbit.a);
		$('#periapsisangle').val(orbit.periAng);
		
		renderer.render(scene, cam.camera);
	}
	
	var calcAndDrawOrbit = function(){
	  var mass = parseFloat($('#mass').val());
	  var distance = parseFloat($('#distance').val());
		var speed = parseFloat($('#speed').val());
		var angle = parseFloat($('#angle').val());
	  if (!isNaN(mass) && !isNaN(distance) && !isNaN(speed) && !isNaN(angle)){
			scene.remove(orbitPath);
			var radAngle = Math.PI * angle / 180;
			orbit = calcOrbit(mass, distance, speed, radAngle);
			drawOrbit(orbit, distance);
	  }
  }
	
	var updateShipPos = function(){
	  var mass = parseFloat($('#mass').val());
		var meanAnomaly;
		var nu;
		if (orbit.e < 1){ //Elliptical orbit
			meanAnomaly = Math.sqrt(g*mass/Math.pow(orbit.a, 3)) * time + orbit.M0;
			if (orbit.e < 0.03){ //This is an approximation that only works when e is small, I chose 0.03 as an arbitrary threshold
				nu = meanAnomaly + 2*orbit.e*Math.sin(meanAnomaly) + 1.25*Math.pow(orbit.e, 2)*Math.sin(2*meanAnomaly);
			} else {
				//console.log('meanAnomaly=' + meanAnomaly);
				var eccAnomaly = orbit.calcEccentricAnomaly(meanAnomaly);
				eccAnomaly = UTIL.unsignedModulo(eccAnomaly, 2*Math.PI);
				//console.log('eccAnomaly=' + eccAnomaly);
				nu = Math.acos((Math.cos(eccAnomaly) - orbit.e) / (1 - orbit.e*Math.cos(eccAnomaly)));
				if (eccAnomaly > Math.PI)
					nu = 2*Math.PI - nu;
			}
		} else { //Hyperbolic orbit
			meanAnomaly = Math.sqrt(-g*mass/Math.pow(orbit.a, 3)) * time + orbit.M0;
			var hypAnomaly = orbit.calcHyperbolicAnomaly(meanAnomaly);
			nu = Math.acos((Math.cosh(hypAnomaly) - orbit.e) / (1 - orbit.e*Math.cosh(hypAnomaly)));
			if (hypAnomaly < 0)
				nu = -nu;
		}
		//console.log('meanAnomaly=' + meanAnomaly);
		var dist = orbit.a*(1-Math.pow(orbit.e, 2)) / (1 + orbit.e*Math.cos(nu));
		shipAngle = nu + orbit.periAng;
		ship.position.x = dist*Math.cos(shipAngle);
		ship.position.z = -dist*Math.sin(shipAngle);
		$('#distance').val(dist);
		var speed = Math.sqrt(g*mass*(2/dist - 1/orbit.a));
		$('#speed').val(speed);
		var angleRad = -Math.atan(orbit.e*Math.sin(nu)/(1 + orbit.e*Math.cos(nu))) + Math.PI/2;
		var angle = 180 * angleRad / Math.PI;
		$('#angle').val(angle);
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
		$('#mass').prop("disabled", true);
		$('#distance').prop("disabled", true);
		$('#speed').prop("disabled", true);
		$('#angle').prop("disabled", true);
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
		$('#mass').prop("disabled", false);
		$('#distance').prop("disabled", false);
		$('#speed').prop("disabled", false);
		$('#angle').prop("disabled", false);
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