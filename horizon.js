$(document).ready(function() {
  $('.btn').click(function() {
		var radius = parseInt($('.radius').val(), 10);
		var height = parseInt($('.height').val(), 10);
		if (isNaN(radius) || radius <= 0 || isNaN(height) || height <= 0){
			$('.result').text('Radius and height need to be numbers greater than zero');
		} else {
			dist = Math.sqrt(2*radius*height + height*height);
			arc = radius*Math.acos(radius/(radius+height))
			$('.straight').text("Straight line distance: " + dist);
			$('.arc').text("Distance along the ground: " + arc);
		}
  });
});
