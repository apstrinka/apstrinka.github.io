$(document).ready(function(){
	var size = 20;
	$(document.body).css("font-size", size-1);
  var screenHeight = $(window).innerHeight();
	var screenWidth = $(window).innerWidth();
	var rows = Math.floor(screenHeight/size);
	var cols = Math.floor(screenWidth*2/size)-1;
	
	var y = Math.floor(rows/2);
	var x = Math.floor(cols/2);
	
	for (i = 0; i < rows; i++){
		for (j = 0; j < cols; j++){
			var top = size*i;
			var left = size*j/2;
			var div = $('<div>').attr("id", "row"+i+"col"+j).css("top", top).css("left", left);
			if (i == 0 || j == 0 || i == rows-1 || j == cols-1) {
				div.text("#").css("color", "#7f7f7f");
			} else if (i == y && j == x) {
				div.text("@").css("color", "#ff0000");
			} else {
				div.text(".").css("color", "#ffffff");
			}
			$(document.body).append(div);
		}
	}
	
	$(document).keydown(function(e){
		var code = (e.keyCode ? e.keyCode : e.which);
		switch(code) {
		case 37: //left arrow
			if (x > 1){
				$("#row" + y + "col" + x).text(".").css("color", "#ffffff");
				x = x - 1;
				$("#row" + y + "col" + x).text("@").css("color", "#ff0000");
			}
			break;
		case 38: //up arrow
			if (y > 1){
				$("#row" + y + "col" + x).text(".").css("color", "#ffffff");
				y = y - 1;
				$("#row" + y + "col" + x).text("@").css("color", "#ff0000");
			}
			break;
		case 39: //right arrow
			if (x < cols - 2){
				$("#row" + y + "col" + x).text(".").css("color", "#ffffff");
				x = x + 1;
				$("#row" + y + "col" + x).text("@").css("color", "#ff0000");
			}
			break;
		case 40: //down arrow
			if (y < rows - 2){
				$("#row" + y + "col" + x).text(".").css("color", "#ffffff");
				y = y + 1;
				$("#row" + y + "col" + x).text("@").css("color", "#ff0000");
			}
			break;
		}
	});
});