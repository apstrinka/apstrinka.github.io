var MODEL = function(){
	var mapWindow = VIEW.mapWindow;

	var pc = {
		x: Math.floor(mapWindow.width/2),
		y: Math.floor(mapWindow.height/2),
		text: "@",
		color: VIEW.colors.red,
		hp: 10,
		maxHp: 10,
	}
	
	var Map = function(width, height){
		var i, j, r, color;
		this.tiles = new Array(height);
		for (i = 0; i < height; i++){
			this.tiles[i] = new Array(width);
			for (j = 0; j < width; j++){
				r = UTIL.randInt(0, 9);
				if (r > 0){
					r = UTIL.randInt(0, 1);
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
			var x = UTIL.randInt(0, mapWindow.width-1);
			var y = UTIL.randInt(0, mapWindow.height-1);
			while (!map.tiles[y][x].passable){
				x = UTIL.randInt(0, mapWindow.width-1);
				y = UTIL.randInt(0, mapWindow.height-1);
			}
			ret[i] = new Character(x, y, "g", VIEW.colors.blue, 8);
		}
		return ret;
	}
	var enemies = generateCharacters(UTIL.randInt(3, 5));
	
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
			VIEW.bufferMessage("You died");
			VIEW.appendMessages();
		} else {
			var index = enemies.indexOf(character);
			enemies.splice(index, 1);
		}
	}
	
	var attack = function(character, other){
		var damage = 0;
		damage = damage + UTIL.randInt(0, 1);
		damage = damage + UTIL.randInt(0, 1);
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
		VIEW.bufferMessage(message);
		if (other === pc){
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
			xDiff = UTIL.randInt(-1, 1);
			yDiff = UTIL.randInt(-1, 1);
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
	
	return {
		pc: pc,
		enemies: enemies,
		map: map,
		generateCharacters: generateCharacters,
		drawCharacter: drawCharacter,
		move: move,
		moveEnemies: moveEnemies
	}
}();