$(document).ready(function(){
	"use strict";
	var i;
	var mapWindow = new VIEW.Window(1, 1, Math.floor(2*VIEW.cols/3)-1, VIEW.rows-2);
	//var statusWindow = new VIEW.Window(Math.floor(2*VIEW.cols/3)+1, 1, VIEW.cols-Math.floor(2*VIEW.cols/3)-2, 2);
	//var messageWindow = new VIEW.Window(Math.floor(2*VIEW.cols/3)+1, 4, VIEW.cols-Math.floor(2*VIEW.cols/3)-2, VIEW.rows-7);
	var pc = {
		x: Math.floor(mapWindow.width/2),
		y: Math.floor(mapWindow.height/2),
		text: "@",
		color: VIEW.colors.red,
		hp: 10,
		maxHp: 10,
	}
	
	var randInt = function(min, max){
		var r = Math.random() * (max-min+1);
		return Math.floor(r + min);
	}
	
	var Map = function(width, height){
		var i, j, r, color;
		this.tiles = new Array(height);
		for (i = 0; i < height; i++){
			this.tiles[i] = new Array(width);
			for (j = 0; j < width; j++){
				r = randInt(0, 9);
				if (r > 0){
					r = randInt(0, 1);
					if (r > 0)
						color = VIEW.colors.green;
					else
						color = VIEW.colors.brown;
					this.tiles[i][j] = {
						text: ".",
						color: color,
						passable: true
					};
				} else {
					this.tiles[i][j] = {
						text: "T",
						color: VIEW.colors.darkGreen,
						passable: false
					};
				}
			}
		}
		
		this.draw = function(window){
			for (i = 0; i < height; i++){
				for (j = 0; j < width; j++){
					window.setText(j, i, this.tiles[i][j].text);
					window.setColor(j, i, this.tiles[i][j].color);
				}
			}
		}
	}
	var map = new Map(mapWindow.width, mapWindow.height);
	
	var Character = function(x, y, text, color, hp){
		this.x = x;
		this.y = y;
		this.text = text;
		this.color = color;
		this.hp = hp;
		this.maxHp = hp;
	}
	
	var generateCharacters = function(num){
		var ret = new Array(num);
		var i;
		for (i = 0; i < num; i++){
			var x = randInt(0, mapWindow.width-1);
			var y = randInt(0, mapWindow.height-1);
			while (!map.tiles[y][x].passable){
				x = randInt(0, mapWindow.width-1);
				y = randInt(0, mapWindow.height-1);
			}
			ret[i] = new Character(x, y, "g", VIEW.colors.blue, 8);
		}
		return ret;
	}
	
	var enemies = generateCharacters(randInt(3, 5));
	
	var drawCharacter = function(character){
		mapWindow.setText(character.x, character.y, character.text);
		mapWindow.setColor(character.x, character.y, character.color);
	}
	
	var getCharacterAt = function(x, y){
		var i;
		if (pc.x === x && pc.y === y)
			return pc;
		for (i = 0; i < enemies.length; i++){
			if (enemies[i].x === x && enemies[i].y === y)
				return enemies[i];
		}
		return null;
	}
	
	var die = function(character){
		mapWindow.setText(character.x, character.y, map.tiles[character.y][character.x].text);
		mapWindow.setColor(character.x, character.y, map.tiles[character.y][character.x].color);
		if (character === pc){
			//messageWindow.clear();
			//messageWindow.drawText(0, 0, "You died.");
			VIEW.bufferMessage("You died");
			VIEW.appendMessages();
		} else {
			var index = enemies.indexOf(character);
			enemies.splice(index, 1);
		}
	}
	
	var attack = function(character, other){
		var damage = 0;
		damage = damage + randInt(0, 1);
		damage = damage + randInt(0, 1);
		other.hp = other.hp - damage;
		var message = "";
		if (character === pc)
			message += "You ";
		else
			message += "The goblin ";
		if (damage === 0)
			message += "misses ";
		else
			message += "hits ";
		if (other === pc)
			message += "you";
		else
			message += "the goblin";
		if (other.hp <= 0)
			message += " and kills it";
		else if (damage > 0)
			message += " and does " + damage + " points of damage";
		message += ". ";
		//messageWindow.clear();
		//messageWindow.drawText(0, 0, message);
		VIEW.bufferMessage(message);
		if (other === pc){
			//statusWindow.clear();
			//statusWindow.drawText(0, 0, "HP:" + pc.hp + "/" + pc.maxHp);
			VIEW.updateStatus("HP:" + pc.hp + "/" + pc.maxHp);
		}
		if (other.hp <= 0){
			die(other);
		}
		
	}
	
	var move = function(character, xDiff, yDiff){
		var oldX = character.x;
		var oldY = character.y;
		var newX = oldX + xDiff;
		var newY = oldY + yDiff;
		if (newX >= 0 && newX < mapWindow.width && newY >= 0 && newY < mapWindow.height && map.tiles[newY][newX].passable){
			var other = getCharacterAt(newX, newY);
			if (other !== null && other !== character){
				attack(character, other);
			} else {
				character.x = newX;
				character.y = newY;
				mapWindow.setText(oldX, oldY, map.tiles[oldY][oldX].text);
				mapWindow.setColor(oldX, oldY, map.tiles[oldY][oldX].color);
				mapWindow.setText(newX, newY, character.text);
				mapWindow.setColor(newX, newY, character.color);
			}
		}
	}
	
	var aiAct = function(character){
		var xDiff = pc.x - character.x;
		var yDiff = pc.y - character.y;
		var distSqrd = xDiff*xDiff + yDiff*yDiff;
		if (distSqrd > 36){
			xDiff = randInt(-1, 1);
			yDiff = randInt(-1, 1);
			move(character, xDiff, yDiff);
		} else {
			xDiff = Math.sign(xDiff);
			yDiff = Math.sign(yDiff);
			move(character, xDiff, yDiff);
		}
	}
	
	var moveEnemies = function(){
		var i;
		for (i = 0; i < enemies.length; i++){
			aiAct(enemies[i]);
		}
	}
	
	
	VIEW.drawBorders(Math.floor(2*VIEW.cols/3), 3, VIEW.rows-6);
	map.draw(mapWindow);
	drawCharacter(pc);
	for (i = 0; i < enemies.length; i++){
		drawCharacter(enemies[i]);
	}
	//statusWindow.drawText(0,0,"HP:" + pc.hp + "/" + pc.maxHp);
	VIEW.updateStatus("HP:" + pc.hp + "/" + pc.maxHp);
	
	$(document).keydown(function(e){
		if (pc.hp > 0){
			var code = (e.keyCode ? e.keyCode : e.which);
			switch(code) {
			case 37: //left arrow
			case 100: //numpad 4
				move(pc, -1, 0);
				break;
			case 36: //home
			case 103: //numpad 7
				move(pc, -1, -1);
				break;
			case 38: //up arrow
			case 104: //numpad 8
				move(pc, 0, -1);
				break;
			case 33: //page up
			case 105: //numpad 9
				move(pc, 1, -1);
				break;
			case 39: //right arrow
			case 102: //numpad 6
				move(pc, 1, 0);
				break;
			case 34: //page down
			case 99: //numpad 3
				move(pc, 1, 1);
				break;
			case 40: //down arrow
			case 98: //numpad 2
				move(pc, 0, 1);
				break;
			case 35: //end
			case 97: //numpad 1
				move(pc, -1, 1);
				break;
			case 12:
			case 101: //numpad 5
				break;
			}
			moveEnemies();
			VIEW.appendMessages();
		}
	});
});