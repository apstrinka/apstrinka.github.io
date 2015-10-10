$(document).ready(function() {
	var scene, camera, renderer, ship, ellipse, semiMajorAxis, eccentricity, periapsisAngle, shipAngle, initMeanAnomaly, clock, timeWarp;
	
	var init = function(){
		scene = new THREE.Scene();
		camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1e100 );
		camera.position.z = 10485760;
		renderer = new THREE.WebGLRenderer();
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
		var eccAnomaly = Math.acos((eccentricity + Math.cos(nu))/(1+eccentricity*Math.cos(nu)));
		if (nu > Math.PI)
			eccAnomaly = - eccAnomaly;
		initMeanAnomaly = eccAnomaly - eccentricity*Math.sin(eccAnomaly);
	}
	
	var calcAndDrawOrbit = function(){
		var g = 6.67e-11;
	  var mass = parseFloat($('#mass').val());
	  var distance = parseFloat($('#distance').val());
		var speed = parseFloat($('#speed').val());
		var angle = parseFloat($('#angle').val());
	  if (!isNaN(mass) && !isNaN(distance) && !isNaN(speed) && !isNaN(angle)){
			var radAngle = Math.PI * angle / 180;
			var eccentricitySqrd = Math.pow((distance*speed*speed/(g*mass) - 1)*Math.sin(radAngle), 2) + Math.pow(Math.cos(radAngle), 2);
			//console.log('e=' + eccentricity);
			if (eccentricitySqrd < 1){
				eccentricity = Math.sqrt(eccentricitySqrd);
				ship.position.x = distance*Math.cos(shipAngle);
				ship.position.y = distance*Math.sin(shipAngle);
				semiMajorAxis = 1 / (2/distance - speed*speed / (g * mass));
				var semiMinorAxis = semiMajorAxis*Math.sqrt(1-eccentricitySqrd);
				//var c = 2*g*mass/(distance*speed*speed);
				//var periapsis = distance*(-c+Math.sqrt(c*c+4*(1-c)*Math.pow(Math.sin(radAngle),2)))/(2*(1-c));
				//var apoapsis = distance*(-c-Math.sqrt(c*c+4*(1-c)*Math.pow(Math.sin(radAngle),2)))/(2*(1-c));
				var f = eccentricity*semiMajorAxis;
				var nu = Math.atan2(Math.sin(radAngle)*Math.cos(radAngle), Math.pow(Math.sin(radAngle), 2) - g*mass/(distance*speed*speed));
				periapsisAngle = shipAngle-nu;
				setInitMeanAnomaly(nu);
				scene.remove(ellipse);
				curve = new THREE.EllipseCurve(
					-f*Math.cos(periapsisAngle),  -f*Math.sin(periapsisAngle),            // ax, aY
					semiMajorAxis, semiMinorAxis,           // xRadius, yRadius
					0,  2 * Math.PI,  // aStartAngle, aEndAngle
					false,            // aClockwise
					periapsisAngle                 // aRotation 
				);
				path = new THREE.Path( curve.getPoints( 50 ) );
				geometry = path.createPointsGeometry( 50 );
				material = new THREE.LineBasicMaterial( { color : 0xff0000 } );
				ellipse = new THREE.Line( geometry, material );
				scene.add(ellipse);
				renderer.render(scene, camera);
			}
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
	
	var updateShipPos = function(time){
		var g = 6.67e-11;
	  var mass = parseFloat($('#mass').val());
		var meanAnomaly = Math.sqrt(g*mass/Math.pow(semiMajorAxis, 3)) * time * timeWarp + initMeanAnomaly;
		var nu;
		if (eccentricity < 0.03){
			nu = meanAnomaly + 2*eccentricity*Math.sin(meanAnomaly) + 1.25*Math.pow(eccentricity, 2)*Math.sin(2*meanAnomaly);
		} else {
			var eccAnomaly = calcEccentricAnomaly(meanAnomaly);
			console.log('E=' + eccAnomaly);
			console.log('e=' + eccentricity);
			eccAnomaly = eccAnomaly % (2*Math.PI);
			if (eccAnomaly < 0)
				eccAnomaly = eccAnomaly + 2*Math.PI;
			console.log('E%2pi=' + eccAnomaly);
			nu = Math.acos((Math.cos(eccAnomaly) - eccentricity) / (1 - eccentricity*Math.cos(eccAnomaly)));
			if (eccAnomaly > Math.PI)
				nu = 2*Math.PI - nu;
			console.log('nu=' + nu);
		}
		var dist = semiMajorAxis*(1-Math.pow(eccentricity, 2)) / (1 + eccentricity*Math.cos(nu));
		shipAngle = nu + periapsisAngle;
		ship.position.x = dist*Math.cos(shipAngle);
		ship.position.y = dist*Math.sin(shipAngle);
		$('#distance').val(dist);
		var speed = Math.sqrt(g*mass*(2/dist - 1/semiMajorAxis));
		$('#speed').val(speed);
		var angleRad = Math.atan(eccentricity*Math.sin(nu)/(1 + eccentricity*Math.cos(nu))) + Math.PI/2;
		var angle = 180 * angleRad / Math.PI;
		$('#angle').val(angle);
	}
	
	var	animate = function(){
		if (timeWarp > 0){
			requestAnimationFrame(animate);
			updateShipPos(clock.getElapsedTime());
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
		timeWarp = 100;
		clock = new THREE.Clock(true);
		$('#mass').prop("disabled", true);
		$('#distance').prop("disabled", true);
		$('#speed').prop("disabled", true);
		$('#angle').prop("disabled", true);
		$('#start').hide();
		$('#stop').show();
		animate(clock);
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
	});
});