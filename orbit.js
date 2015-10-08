$(document).ready(function() {
	var scene, camera, renderer, ship, ellipse;
	
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
	};
	
	var calcAndDrawOrbit = function(){
		var g = 6.67e-11;
	  var mass = parseFloat($('#mass').val());
	  var distance = parseFloat($('#distance').val());
		var speed = parseFloat($('#speed').val());
		var angle = parseFloat($('#angle').val());
	  if (!isNaN(mass) && !isNaN(distance) && !isNaN(speed) && !isNaN(angle)){
			var radAngle = Math.PI * angle / 180;
			var eccentricitySqrd = Math.pow((distance*speed*speed/(g*mass) - 1)*Math.sin(radAngle), 2) + Math.pow(Math.cos(radAngle), 2);
	    var eccentricity = Math.sqrt(eccentricitySqrd);
			//console.log('e=' + eccentricity);
			if (eccentricity < 1){
				ship.position.x = distance;
				var semiMajorAxis = 1 / (2/distance - speed*speed / (g * mass));
				var semiMinorAxis = semiMajorAxis*Math.sqrt(1-eccentricitySqrd);
				var c = 2*g*mass/(distance*speed*speed);
				var periapsis = distance*(-c+Math.sqrt(c*c+4*(1-c)*Math.pow(Math.sin(radAngle),2)))/(2*(1-c));
				var apoapsis = distance*(-c-Math.sqrt(c*c+4*(1-c)*Math.pow(Math.sin(radAngle),2)))/(2*(1-c));
				var f = eccentricity*semiMajorAxis;
				var nu = Math.atan2(Math.sin(radAngle)*Math.cos(radAngle), Math.pow(Math.sin(radAngle), 2) - g*mass/(distance*speed*speed));
				scene.remove(ellipse);
				curve = new THREE.EllipseCurve(
					-f*Math.cos(-nu),  -f*Math.sin(-nu),            // ax, aY
					semiMajorAxis, semiMinorAxis,           // xRadius, yRadius
					0,  2 * Math.PI,  // aStartAngle, aEndAngle
					false,            // aClockwise
					-nu                 // aRotation 
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
		console.log(camera.position.z);
		renderer.render(scene, camera);
	});
	$('#zoomOut').click(function(){
		camera.position.z = camera.position.z*2;
		console.log(camera.position.z);
		renderer.render(scene, camera);
	});
});