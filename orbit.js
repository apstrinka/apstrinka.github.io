$(document).ready(function() {
	var scene, camera, renderer, ship, orbitPath, semiMajorAxis, eccentricity, periapsisAngle, shipAngle, initMeanAnomaly, clock, timeWarp, time;
	
	var init = function(){
		scene = new THREE.Scene();
		camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1e100 );
		camera.position.z = 10485760;
		renderer = new THREE.WebGLRenderer();
		renderer.setClearColor( 0x000000, 1 );
		renderer.setSize( window.innerWidth, window.innerHeight );
		$('#viewportFrame').append( renderer.domElement );
	
		var geometry = new THREE.SphereGeometry( 5e6, 100, 100 );
		var greenMaterial = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
		var redMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
		var planet = new THREE.Mesh( geometry, greenMaterial );
		scene.add( planet );
	
		geometry = new THREE.SphereGeometry(1e5);
		ship = new THREE.Mesh(geometry, redMaterial);
		ship.position.x = 1;
		scene.add(ship);
		
		shipAngle = 0;
	};
	
	var setInitMeanAnomaly = function(){
		var nu = shipAngle - periapsisAngle;
		nu = nu % (2*Math.PI);
		if (nu < 0)
			nu = nu + 2*Math.PI;
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
	
	var calcAndDrawOrbit = function(){
		var g = 6.67e-11;
	  var mass = parseFloat($('#mass').val());
	  var distance = parseFloat($('#distance').val());
		var speed = parseFloat($('#speed').val());
		var angle = parseFloat($('#angle').val());
		var nu;
	  if (!isNaN(mass) && !isNaN(distance) && !isNaN(speed) && !isNaN(angle)){
			scene.remove(orbitPath);
			var radAngle = Math.PI * angle / 180;
			var eccentricitySqrd = Math.pow((distance*speed*speed/(g*mass) - 1)*Math.sin(radAngle), 2) + Math.pow(Math.cos(radAngle), 2);
			eccentricity = Math.sqrt(eccentricitySqrd);
			$('#eccentricity').val(eccentricity);
			semiMajorAxis = 1 / (2/distance - speed*speed / (g * mass));
			$('#semimajoraxis').val(semiMajorAxis);
			ship.position.x = distance*Math.cos(shipAngle);
			ship.position.y = distance*Math.sin(shipAngle);
			if (eccentricitySqrd < 1){
				var semiMinorAxis = semiMajorAxis*Math.sqrt(1-eccentricitySqrd);
				//var c = 2*g*mass/(distance*speed*speed);
				//var periapsis = distance*(-c+Math.sqrt(c*c+4*(1-c)*Math.pow(Math.sin(radAngle),2)))/(2*(1-c));
				//var apoapsis = distance*(-c-Math.sqrt(c*c+4*(1-c)*Math.pow(Math.sin(radAngle),2)))/(2*(1-c));
				var f = eccentricity*semiMajorAxis;
				nu = Math.atan2(Math.sin(radAngle)*Math.cos(radAngle), Math.pow(Math.sin(radAngle), 2) - g*mass/(distance*speed*speed));
				periapsisAngle = shipAngle-nu;
				setInitMeanAnomaly(nu);
				
				curve = new THREE.EllipseCurve(
					-f*Math.cos(periapsisAngle),  -f*Math.sin(periapsisAngle),            // ax, aY
					semiMajorAxis, semiMinorAxis,           // xRadius, yRadius
					0,  2 * Math.PI,  // aStartAngle, aEndAngle
					false,            // aClockwise
					periapsisAngle                 // aRotation 
				);
				path = new THREE.Path( curve.getPoints( 50 ) );
				geometry = path.createPointsGeometry( 50 );
			} else {
				var cosNu = (semiMajorAxis*(1-eccentricitySqrd) - distance)/(eccentricity*distance);
				if (cosNu > 1)
					cosNu = 1;
				if (cosNu < -1)
					cosNu = -1;
				nu = Math.acos(cosNu);
				if (radAngle > Math.PI/2 && radAngle < 3*Math.PI/2)
					nu = -nu;
				periapsisAngle = shipAngle - nu;
				setInitMeanAnomaly(nu);
				
				path = new THREE.Path(getHyperbolaPoints(semiMajorAxis, eccentricity, -semiMajorAxis*eccentricity*Math.cos(periapsisAngle), -semiMajorAxis*eccentricity*Math.sin(periapsisAngle), periapsisAngle));
				geometry = path.createPointsGeometry( 100 );
			}
			material = new THREE.LineBasicMaterial( { color : 0xff0000 } );
			orbitPath = new THREE.Line( geometry, material );
			scene.add(orbitPath);
			renderer.render(scene, camera);
	  }
  }
	
	var newtonsMethod = function(f, df, x){
		var epsilon = .00001;
		var maxIter = 10;
		var iter = 0;
		var y = f(x);
		while (Math.abs(y) > epsilon && iter < maxIter){
			iter = iter + 1;
			x = x - y/df(x);
			y = f(x);
		}
		return x;
	}
	
	var calcEccentricAnomaly = function(meanAnomaly){
		var f = function(x){
			return x - eccentricity*Math.sin(x) - meanAnomaly;
		}
		
		var df = function(x){
			return 1 - eccentricity*Math.cos(x);
		}
		
		return newtonsMethod(f, df, meanAnomaly);
	}
	
	var calcHyperbolicAnomaly = function(meanAnomaly){
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
		return newtonsMethod(f, df, guess);
	}
	
	var updateShipPos = function(){
		var g = 6.67e-11;
	  var mass = parseFloat($('#mass').val());
		var meanAnomaly;
		var nu;
		if (eccentricity < 1){ //Elliptical orbit
			meanAnomaly = Math.sqrt(g*mass/Math.pow(semiMajorAxis, 3)) * time + initMeanAnomaly;
			if (eccentricity < 0.03){ //This is an approximation that only works when e is small, I chose 0.03 as an arbitrary threshold
				nu = meanAnomaly + 2*eccentricity*Math.sin(meanAnomaly) + 1.25*Math.pow(eccentricity, 2)*Math.sin(2*meanAnomaly);
			} else {
				var eccAnomaly = calcEccentricAnomaly(meanAnomaly);
				eccAnomaly = eccAnomaly % (2*Math.PI);
				if (eccAnomaly < 0)
					eccAnomaly = eccAnomaly + 2*Math.PI;
				nu = Math.acos((Math.cos(eccAnomaly) - eccentricity) / (1 - eccentricity*Math.cos(eccAnomaly)));
				if (eccAnomaly > Math.PI)
					nu = 2*Math.PI - nu;
			}
		} else { //Hyperbolic orbit
			meanAnomaly = Math.sqrt(-g*mass/Math.pow(semiMajorAxis, 3)) * time + initMeanAnomaly;
			var hypAnomaly = calcHyperbolicAnomaly(meanAnomaly);
			nu = Math.acos((Math.cosh(hypAnomaly) - eccentricity) / (1 - eccentricity*Math.cosh(hypAnomaly)));
			if (hypAnomaly < 0)
				nu = -nu;
		}
		//console.log('meanAnomaly=' + meanAnomaly);
		var dist = semiMajorAxis*(1-Math.pow(eccentricity, 2)) / (1 + eccentricity*Math.cos(nu));
		shipAngle = nu + periapsisAngle;
		ship.position.x = dist*Math.cos(shipAngle);
		ship.position.y = dist*Math.sin(shipAngle);
		$('#distance').val(dist);
		var speed = Math.sqrt(g*mass*(2/dist - 1/semiMajorAxis));
		$('#speed').val(speed);
		var angleRad = -Math.atan(eccentricity*Math.sin(nu)/(1 + eccentricity*Math.cos(nu))) + Math.PI/2;
		var angle = 180 * angleRad / Math.PI;
		$('#angle').val(angle);
	}
	
	var	animate = function(){
		if (timeWarp !== 0){
			requestAnimationFrame(animate);
			time = time + clock.getDelta()*timeWarp;
			updateShipPos();
			renderer.render(scene, camera);
		}
	}
	
	init();
	calcAndDrawOrbit();

	

	//var render = function () {
	//	requestAnimationFrame( render );
	//	renderer.render(scene, camera);
	//};

	//render();
	
  $('.parameter').change(calcAndDrawOrbit);
	$('#zoomIn').click(function(){
		camera.position.z = camera.position.z/2;
		ship.scale = ship.scale.divideScalar(2);
		console.log(camera.position.z);
		renderer.render(scene, camera);
	});
	$('#zoomOut').click(function(){
		camera.position.z = camera.position.z*2;
		ship.scale = ship.scale.multiplyScalar(2);
		console.log(camera.position.z);
		renderer.render(scene, camera);
	});
	$('#start').click(function(){
		time = 0;
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
		setInitMeanAnomaly();
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
});