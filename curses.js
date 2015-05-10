$(document).ready(function(){
	"use strict";
	var i;
	
	MODEL.map.draw(VIEW.mapWindow);
	MODEL.drawCharacter(MODEL.pc);
	for (i = 0; i < MODEL.enemies.length; i++){
		MODEL.drawCharacter(MODEL.enemies[i]);
	}
	VIEW.updateStatus("HP:" + MODEL.pc.hp + "/" + MODEL.pc.maxHp);
	
	$(document).keydown(function(e){
		if (MODEL.pc.hp > 0){
			var code = (e.keyCode ? e.keyCode : e.which);
			switch(code) {
			case 37: //left arrow
			case 100: //numpad 4
				MODEL.move(MODEL.pc, -1, 0);
				break;
			case 36: //home
			case 103: //numpad 7
				MODEL.move(MODEL.pc, -1, -1);
				break;
			case 38: //up arrow
			case 104: //numpad 8
				MODEL.move(MODEL.pc, 0, -1);
				break;
			case 33: //page up
			case 105: //numpad 9
				MODEL.move(MODEL.pc, 1, -1);
				break;
			case 39: //right arrow
			case 102: //numpad 6
				MODEL.move(MODEL.pc, 1, 0);
				break;
			case 34: //page down
			case 99: //numpad 3
				MODEL.move(MODEL.pc, 1, 1);
				break;
			case 40: //down arrow
			case 98: //numpad 2
				MODEL.move(MODEL.pc, 0, 1);
				break;
			case 35: //end
			case 97: //numpad 1
				MODEL.move(MODEL.pc, -1, 1);
				break;
			case 12:
			case 101: //numpad 5
				break;
			}
			MODEL.moveEnemies();
			VIEW.appendMessages();
		}
	});
});