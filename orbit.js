var main = function() {
  $('.btn').click(function() {
		var g = 6.67e-11;
	  var mass = parseFloat($('.mass').val());
	  var distance = parseFloat($('.distance').val());
		var speed = parseFloat($('.speed').val());
		var angle = parseFloat($('.angle').val());
	  if (isNaN(mass) || isNaN(distance) || isNaN(speed) || isNaN(angle)){
	    $('.result').text('Please enter numbers');
	  } else {
			var radAngle = Math.PI * angle / 180;
	    var eccentricity = Math.sqrt(Math.pow((distance*speed*speed/(g*mass) - 1)*Math.sin(radAngle), 2) + Math.pow(Math.cos(radAngle), 2));
			var semiMajorAxis = 1 / (2/distance - speed*speed / (g * mass));
			var c = 2*g*mass/(distance*speed*speed);
			console.log(c);
			var periapsis = distance*(-c-Math.sqrt(c*c+4*(1-c)*Math.pow(Math.sin(radAngle),2)))/(2*(1-c))
			var apoapsis = distance*(-c+Math.sqrt(c*c+4*(1-c)*Math.pow(Math.sin(radAngle),2)))/(2*(1-c))
			$('.eccentricity').text(eccentricity);
      $('.semimajoraxis').text(semiMajorAxis);
			$('.periapsis').text(periapsis);
			$('.apoapsis').text(apoapsis);
	}
  });
}

$(document).ready(main);