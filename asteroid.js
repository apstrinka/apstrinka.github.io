var screenWidth = $(window).width();
var screenHeight = $(window).height();
var going = false;
var interval;
var ship;
var bullets = [];


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
				restart();
				$('.instructions').fadeOut(2000);//, function() {
					//$(this).show().css({visibility: 'hidden'});
				//});
			}
			break;
		case 37: //left arrow
			if (going){
				ship.ang = ship.ang - 10;
			}
			break;
		case 38: //up arrow
			if (going){
				ship.xVel = ship.xVel + 2*Math.cos(ship.ang*Math.PI/180);
				ship.yVel = ship.yVel + 2*Math.sin(ship.ang*Math.PI/180);
			}
			break;
		case 39: //right arrow
			if (going){
				ship.ang = ship.ang + 10;
			}
			break;
		case 32: //space
			if (going){
				var xVel = ship.xVel + 10*Math.cos(ship.ang*Math.PI/180);
				var yVel = ship.yVel + 10*Math.sin(ship.ang*Math.PI/180);
				
				bullets.push(new Bullet(ship.xPos, ship.yPos, xVel, yVel));
			}
			break;
		}
	});
}

var restart = function(){
	ship = new Ship(100, 100, 0, 0);
	bullets = [];
	$('.bullet').remove();
}

var update = function(){
	ship.update();
	ship.draw();
	for (var i = 0; i < bullets.length; i++){
		var t = bullets[i];
		t.update();
		t.draw();
	}
}

function Ship(xPos, yPos, xVel, yVel){
	this.xPos = xPos;
	this.yPos = yPos;
	this.xVel = xVel;
	this.yVel = yVel;
	this.ang = 0;
	
	this.update = function(){
		this.xPos = (this.xPos + this.xVel + screenWidth) % screenWidth;
		this.yPos = (this.yPos + this.yVel + screenHeight) % screenHeight;
	}
	
	this.draw = function(){
		var top = (this.yPos-10) + 'px';
		var left = (this.xPos-10) + 'px';
		var rotate = 'rotate(' + this.ang + 'deg)';
		$('.ship').css('top',top).css('left',left).css('-webkit-transform',rotate).css('-moz-transform',rotate).css('-o-transform',rotate).css('-ms-transform',rotate).css('transform',rotate);
	}
}

var bulletNum = 0;

function Bullet(xPos, yPos, xVel, yVel){
	this.xPos = xPos;
	this.yPos = yPos;
	this.xVel = xVel;
	this.yVel = yVel;
	bulletNum++;
	this.id = 'bullet' + bulletNum;
	var img = $('<img/>').addClass('bullet').attr('id', this.id).attr('src', 'bullet.png').css('top', yPos+'px').css('left', xPos+'px');
	$('body').append(img);
	
	this.update = function(){
		this.xPos = (this.xPos + this.xVel + screenWidth) % screenWidth;
		this.yPos = (this.yPos + this.yVel + screenHeight) % screenHeight;
	}
	
	this.draw = function(){
		var top = (this.yPos-3) + 'px';
		var left = (this.xPos-3) + 'px';
		var img = $('#'+this.id).css('top',top).css('left',left);
		
	}
}

$(document).ready(main);