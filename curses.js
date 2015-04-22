$(document).ready(function(){
	"use strict";
	var y = Math.floor(VIEW.rows/2);
	var x = Math.floor(VIEW.cols/2);
	var window = new VIEW.Window(0, 0, VIEW.cols, VIEW.rows);
	var i, j;
	
	$(document).keydown(function(e){
		var code = (e.keyCode ? e.keyCode : e.which);
		switch(code) {
		case 65: //a
			for (i = 0; i < window.width; i++){
				for (j = 0; j < window.height; j++){
					window.setText(i, j, "─");
				}
			}
			break;
		case 37: //left arrow
			if (x > 1){
				window.setText(x, y, ".");
				window.setColor(x, y, VIEW.colors.white);
				x = x - 1;
				window.setText(x, y, "@");
				window.setColor(x, y, VIEW.colors.red);
			}
			break;
		case 38: //up arrow
			if (y > 1){
				window.setText(x, y, ".");
				window.setColor(x, y, VIEW.colors.white);
				y = y - 1;
				window.setText(x, y, "@");
				window.setColor(x, y, VIEW.colors.red);
			}
			break;
		case 39: //right arrow
			if (x < VIEW.cols - 2){
				window.setText(x, y, ".");
				window.setColor(x, y, VIEW.colors.white);
				x = x + 1;
				window.setText(x, y, "@");
				window.setColor(x, y, VIEW.colors.red);
			}
			break;
		case 40: //down arrow
			if (y < VIEW.rows - 2){
				window.setText(x, y, ".");
				window.setColor(x, y, VIEW.colors.white);
				y = y + 1;
				window.setText(x, y, "@");
				window.setColor(x, y, VIEW.colors.red);
			}
			break;
		}
	});
});