var screenWidth = $(window).width();
var screenHeight = $(window).height();
var xPos = 100.0;
var yPos = 100.0;
var xVel = 0.0;
var yVel = 0.0;
var ang = 0.0;
var going = false;
var interval;

var refresh = function(){
  $('.ship').css('top',yPos+'px').css('left',xPos+'px').css('-webkit-transform', 'rotate('+ang+'deg)').css('-moz-transform', 'rotate('+ang+'deg)').css('-o-transform', 'rotate('+ang+'deg)').css('-ms-transform', 'rotate('+ang+'deg)').css('transform', 'rotate('+ang+'deg)');
}

var update = function(){
  xPos = (xPos + xVel)%screenWidth;
  yPos = (yPos + yVel)%screenHeight;
  refresh();
}

var main = function() {
  $(document).keydown(function(e){
    var code = (e.keyCode ? e.keyCode : e.which);
	switch(code) {
	  case 83: //s
	    if (going){
		  clearInterval(interval);
		  going = false;
		  xPos = 100;
		  yPos = 100;
		  xVel = 0;
		  yVel = 0;
		  ang = 0;
		} else {
		  interval = setInterval(update, 50);
		  going = true;
		}
	    break;
      case 37: //left arrow
	    if (going){
		  ang = ang - 10;
		}
	    break;
	  case 38: //up arrow
	    if (going){
		  xVel = xVel + 2*Math.cos(ang*Math.PI/180);
		  yVel = yVel + 2*Math.sin(ang*Math.PI/180);
		}
		break;
	  case 39: //right arrow
	    if (going){
		  ang = ang + 10;
		}
		break;
	  //case 40: //down arrow
	  //  if (going)
		//  yVel = yVel + 1;
		//break;
	}
  });
}

$(document).ready(main);