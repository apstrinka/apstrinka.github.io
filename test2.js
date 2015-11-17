var main = function() {
	var scene = new THREE.Scene();
	var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );

	var renderer = new THREE.WebGLRenderer();
	renderer.setSize( window.innerWidth, window.innerHeight );
	$('#viewportFrame').append( renderer.domElement );
	
	var geometry = new THREE.SphereGeometry( .1 );
	var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
	var cube = new THREE.Mesh( geometry, material );
	scene.add( cube );
	
	var curve = new THREE.EllipseCurve(
		1, 0,            // ax, aY
		2, 1,           // xRadius, yRadius
		0, 2 * Math.PI,  // aStartAngle, aEndAngle
		false,            // aClockwise
		Math.PI/2                 // aRotation 
	);
	var path = new THREE.Path( curve.getPoints( 50 ) );
	var geometry = path.createPointsGeometry( 50 );
	var material = new THREE.LineBasicMaterial( { color : 0xff0000 } );

	// Create the final Object3d to add to the scene
	var ellipse = new THREE.Line( geometry, material );
	scene.add(ellipse);
	
	camera.position.z = 5;
	
	renderer.render(scene, camera);

	//var render = function () {
	//	requestAnimationFrame( render );
	//	renderer.render(scene, camera);
	//};

	//render();
}

$(document).ready(main);