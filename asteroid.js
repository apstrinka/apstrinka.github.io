var screenWidth = $(window).innerWidth();
var screenHeight = $(window).innerHeight();
$('.ship').css('top',screenHeight/2-15 + 'px').css('left',screenWidth/2-15 + 'px');
$('.ship').children().css('top', 5).css('left', 5);
var going = false;
var score = 0;
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
			if (going && ship.coolDown == 0){
				ship.coolDown = 5;
				var xVel = ship.xVel + 10*Math.cos(ship.ang*Math.PI/180);
				var yVel = ship.yVel + 10*Math.sin(ship.ang*Math.PI/180);
				
				bullets.push(new Bullet(ship.xPos, ship.yPos, xVel, yVel));
			}
			break;
		}
	});
}

var restart = function(){
	score = 0;
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
	asteroids.push(new Asteroid(xPos, yPos, xVel, yVel, rot, 40));
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
	
	$('.score').text(score);
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
	score++;
	var a = asteroids[index];
	$('#'+a.id).remove();
	asteroids.splice(index, 1);
	if (a.radius > 5){
		var dx = Math.floor(Math.random()*20-10);
		var dy = Math.floor(Math.random()*20-10);
		var dr = Math.floor(Math.random()*20-10);
		asteroids.push(new Asteroid(a.xPos, a.yPos, a.xVel+dx, a.yVel+dy, a.rot+dr, a.radius/2));
		asteroids.push(new Asteroid(a.xPos, a.yPos, a.xVel-dx, a.yVel-dy, a.rot-dr, a.radius/2));
	}
}

function Ship(xPos, yPos, xVel, yVel){
	this.xPos = xPos;
	this.yPos = yPos;
	this.xVel = xVel;
	this.yVel = yVel;
	this.ang = 0;
	this.radius = 7;
	this.coolDown = 0;
	
	this.update = function(){
		this.xPos = (this.xPos + this.xVel + screenWidth) % screenWidth;
		this.yPos = (this.yPos + this.yVel + screenHeight) % screenHeight;
		if (this.coolDown > 0)
			this.coolDown--;
	}
	
	this.draw = function(){
		var top = (this.yPos-15) + 'px';
		var left = (this.xPos-15) + 'px';
		var height = 15 + Math.min(15, screenHeight-this.yPos);
		var width = 15 + Math.min(15, screenWidth-this.xPos);
		var rotate = 'rotate(' + this.ang + 'deg)';
		var div = $('.ship').css('top',top).css('left',left).css('height', height).css('width', width);
		div.children().css('-webkit-transform',rotate).css('-moz-transform',rotate).css('-o-transform',rotate).css('-ms-transform',rotate).css('transform',rotate);
	}
}

var bulletNum = 0;

function Bullet(xPos, yPos, xVel, yVel){
	this.xPos = xPos;
	this.yPos = yPos;
	this.xVel = xVel;
	this.yVel = yVel;
	this.radius = 1;
	this.decay = 100;
	bulletNum++;
	this.id = 'bullet' + bulletNum;
	var div = $('<div>').addClass('bullet').attr('id', this.id).css('top', (yPos-3)+'px').css('left', (xPos-3)+'px');
	var img = $('<img/>').attr('src', 'bullet.png');
	div.append(img);
	$('body').append(div);
	
	this.update = function(){
		this.decay = this.decay - 1;
		this.xPos = (this.xPos + this.xVel + screenWidth) % screenWidth;
		this.yPos = (this.yPos + this.yVel + screenHeight) % screenHeight;
	}
	
	this.draw = function(){
		var top = (this.yPos-3) + 'px';
		var left = (this.xPos-3) + 'px';
		var height = 3 + Math.min(3, screenHeight-this.yPos);
		var width = 3 + Math.min(3, screenWidth-this.xPos);
		var div = $('#'+this.id).css('top',top).css('left',left).css('height', height).css('width', width);
	}
}

var asteroidNum = 0;

function Asteroid(xPos, yPos, xVel, yVel, rot, radius){
	this.xPos = xPos;
	this.yPos = yPos;
	this.xVel = xVel;
	this.yVel = yVel;
	this.ang = Math.floor(Math.random()*360);
	this.rot = rot;
	this.radius = radius;
	asteroidNum++;
	this.id = 'asteroid' + asteroidNum;
	var imgNum = Math.floor(Math.random()*2+1);
	var div = $('<div>').addClass('asteroid').attr('id', this.id).css('height', 3*this.radius).css('width', 3*this.radius).css('top', yPos+'px').css('left', xPos+'px');
	var img = $('<img/>').attr('src', 'asteroid'+imgNum+'.png').css('height', 2*this.radius).css('width', 2*this.radius).css('top', .5*this.radius+'px').css('left', .5*this.radius+'px');
	div.append(img);
	$('body').append(div);
	
	this.update = function(){
		this.xPos = (this.xPos + this.xVel + screenWidth) % screenWidth;
		this.yPos = (this.yPos + this.yVel + screenHeight) % screenHeight;
		this.ang = this.ang + rot;
	}
	
	this.draw = function(){
		var top = (this.yPos-1.5*this.radius) + 'px';
		var left = (this.xPos-1.5*this.radius) + 'px';
		var height = 1.5*this.radius + Math.min(1.5*this.radius, screenHeight-this.yPos);
		var width = 1.5*this.radius + Math.min(1.5*this.radius, screenWidth-this.xPos);
		var rotate = 'rotate(' + this.ang + 'deg)';
		var div = $('#'+this.id).css('top',top).css('left',left).css('height', height).css('width', width);
		div.children().css('-webkit-transform',rotate).css('-moz-transform',rotate).css('-o-transform',rotate).css('-ms-transform',rotate).css('transform',rotate);
	}
	
}

$(document).ready(main);