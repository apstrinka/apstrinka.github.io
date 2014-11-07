var xPos = 100;
var yPos = 100;
var xVel = 0;
var yVel = 0;
var going = false;
var interval;

var refresh = function(){
  $('.thing').css('top',yPos+'px').css('left',xPos+'px');
}

var update = function(){
  xPos = xPos + xVel;
  yPos = yPos + yVel;
  refresh();
}

function keyPressedHandler(e) {
}

var main = function() {
  $(document).keydown(function(e){
    var code = (e.keyCode ? e.keyCode : e.which);
	switch(code) {
	  case 83: //s
	    if (going){
		  clearInterval(interval);
		  going = false;
		} else {
		  interval = setInterval(update, 50);
		  going = true;
		}
	    break;
      case 37: //left arrow
	    if (going)
		  xVel = xVel - 1;
	    break;
	  case 38: //up arrow
	    if (going)
		  yVel = yVel - 1;
		break;
	  case 39: //right arrow
	    if (going)
		  xVel = xVel + 1;
		break;
	  case 40: //down arrow
	    if (going)
		  yVel = yVel + 1;
		break;
	}
  });
}

$(document).ready(main);