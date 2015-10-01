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
      $('.result').text(eccentricity);
	}
  });
}

$(document).ready(main);