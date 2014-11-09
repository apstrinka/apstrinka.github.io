var screenWidth = $(window).width();
var screenHeight = $(window).height();
$('.ship').css('top',screenHeight/2-10 + 'px').css('left',screenWidth/2-10 + 'px');
var going = false;
var interval;
var ship;
var bullets = [];
var asteroids = [];

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
	ship = new Ship(screenWidth/2, screenHeight/2, 0, 0);
	bullets = [];
	$('.bullet').remove();
	asteroids = [];
	$('.asteroid').remove();
	var xPos = Math.floor(Math.random()*screenWidth);
	var yPos = Math.floor(Math.random()*screenHeight);
	var xVel = Math.floor(Math.random()*20 - 10);
	var yVel = Math.floor(Math.random()*20 - 10);
	var rot = Math.floor(Math.random()*20 - 10);
	asteroids.push(new Asteroid(xPos, yPos, xVel, yVel, rot));
}

var update = function(){
	//Update positions
	ship.update();
	for (var i = 0; i < bullets.length; i++){
		var b = bullets[i];
		b.update();
	}
	for (var i = 0; i < asteroids.length; i++){
		var a = asteroids[i];
		a.update();
	}
	
	//Check for collisions
	for (var i = 0; i < bullets.length; i++){
		var b = bullets[i];
		var index = indexOfOverlappingAsteroid(b);
		if (index >= 0){
			removeBullet(i);
			breakAsteroid(index);
		} else if (b.decay < 0) {
			removeBullet(i);
		}
	}
	
	//Draw
	ship.draw();
	for (var i = 0; i < bullets.length; i++){
		var t = bullets[i];
		t.draw();
	}
	for (var i = 0; i < asteroids.length; i++){
		var t = asteroids[i];
		t.draw();
	}
}

var indexOfOverlappingAsteroid = function(thing){
	for (var i = 0; i < asteroids.length; i++){
		var a = asteroids[i];
		var dist = Math.sqrt(Math.pow(a.xPos-thing.xPos,2) + Math.pow(a.yPos-thing.yPos,2));
		if (dist < a.radius + thing.radius)
			return i;
	}
	return -1;
}

var removeBullet = function(index){
	var b = bullets[index];
	$('#'+b.id).remove();
	bullets.splice(index, 1);
}

var breakAsteroid = function(index){
	var a = asteroids[index];
	$('#'+a.id).remove();
	asteroids.splice(index, 1);
	var dx = Math.floor(Math.random()*20-10);
	var dy = Math.floor(Math.random()*20-10);
	var dr = Math.floor(Math.random()*20-10);
	asteroids.push(new Asteroid(a.xPos, a.yPos, a.xVel+dx, a.yVel+dy, a.rot+dr));
	asteroids.push(new Asteroid(a.xPos, a.yPos, a.xVel-dx, a.yVel-dy, a.rot-dr));
}

function Ship(xPos, yPos, xVel, yVel){
	this.radius = 7;
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
	this.radius = 1;
	this.decay = 100;
	this.xPos = xPos;
	this.yPos = yPos;
	this.xVel = xVel;
	this.yVel = yVel;
	bulletNum++;
	this.id = 'bullet' + bulletNum;
	var img = $('<img/>').addClass('bullet').attr('id', this.id).attr('src', 'bullet.png').css('top', yPos+'px').css('left', xPos+'px');
	$('body').append(img);
	
	this.update = function(){
		this.decay = this.decay - 1;
		this.xPos = (this.xPos + this.xVel + screenWidth) % screenWidth;
		this.yPos = (this.yPos + this.yVel + screenHeight) % screenHeight;
	}
	
	this.draw = function(){
		var top = (this.yPos-3) + 'px';
		var left = (this.xPos-3) + 'px';
		var img = $('#'+this.id).css('top',top).css('left',left);
	}
}

var asteroidNum = 0;

function Asteroid(xPos, yPos, xVel, yVel, rot){
	this.radius = 40;
	this.xPos = xPos;
	this.yPos = yPos;
	this.xVel = xVel;
	this.yVel = yVel;
	this.ang = Math.floor(Math.random()*360);
	this.rot = rot;
	asteroidNum++;
	this.id = 'asteroid' + asteroidNum;
	var imgNum = Math.floor(Math.random()*2+1);
	var img = $('<img/>').addClass('asteroid').attr('id', this.id).attr('src', 'asteroid'+imgNum+'.png').css('top', yPos+'px').css('left', xPos+'px');
	$('body').append(img);
	
	this.update = function(){
		this.xPos = (this.xPos + this.xVel + screenWidth) % screenWidth;
		this.yPos = (this.yPos + this.yVel + screenHeight) % screenHeight;
		this.ang = this.ang + rot;
	}
	
	this.draw = function(){
		var top = (this.yPos-40) + 'px';
		var left = (this.xPos-40) + 'px';
		var rotate = 'rotate(' + this.ang + 'deg)';
		var img = $('#'+this.id).css('top',top).css('left',left).css('-webkit-transform',rotate).css('-moz-transform',rotate).css('-o-transform',rotate).css('-ms-transform',rotate).css('transform',rotate);
	}
	
}

$(document).ready(main);