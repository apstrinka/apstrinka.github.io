var VIEW = function(){
	"use strict";
  var screenHeight = $(window).innerHeight();
	var screenWidth = $(window).innerWidth();
	var rows = 30; //Math.floor(screenHeight/size);
	var cols = 90; //Math.floor(screenWidth*2/size)-1;
	var size = Math.floor((screenHeight-20)/rows);
	console.log(screenHeight);
	console.log(rows);
	console.log(size);
	var xOffset = (screenWidth - (cols*size/2))/2;
	var yOffset = (screenHeight - (rows*size))/2;
	var cells = new Array(rows);
	var div = $('#view');
	var statusDiv = $('#status');
	var messageDiv = $('#messages');
	var i, j;
	
	div.css("font-size", size+"px").css("line-height", size+"px").css("margin-top", yOffset+"px");
	
	for (i = 0; i < rows; i++){
		cells[i] = new Array(cols);
		for (j = 0; j < cols; j++){
			var top = size*i + yOffset;
			var left = size*j/2 + xOffset;
			var span = $('<span>');//.css("top", top).css("left", left).css("height", size).css("width", size/2);
			cells[i][j] = span;
			span.text('\u00a0');
			span.css("color", "#ffffff");
			div.append(span);
		}
		div.append($('<br>'));
	}
	
	var ULposition = cells[1][Math.floor(2*cols/3)+1].offset();
	var URposition = cells[1][cols-1].offset();
	var width = URposition.left - ULposition.left;
	var height = cells[1][cols-1].height();
	height = height*2;
	statusDiv.css("font-size", size+"px").css("line-height", size+"px").css("position", "absolute").css(ULposition).css("height", height+"px").css("width", width+"px");
	
	ULposition = cells[4][Math.floor(2*cols/3)+1].offset();
	URposition = cells[4][cols-1].offset();
	width = URposition.left - ULposition.left;
	height = cells[4][cols-1].height();
	height = height*(rows-7);
	messageDiv.css("font-size", size+"px").css("line-height", size+"px").css("position", "absolute").css(ULposition).css("height", height+"px").css("width", width+"px");
	
	var drawBorders = function(w, h1, h2){
		var i, j;
		
		cells[0][0].text("┌");
		cells[0][cols-1].text("┐");
		cells[0][w].text("┬");
		cells[h1][w].text("├");
		cells[h1][cols-1].text("┤");
		cells[h1+h2][w].text("├");
		cells[h1+h2][cols-1].text("┤");
		cells[rows-1][0].text("└");
		cells[rows-1][w].text("┴");
		cells[rows-1][cols-1].text("┘");
		
		for (i = 1; i < w; i++){
			cells[0][i].text("─");
			cells[rows-1][i].text("─");
		}
		for (i = w+1; i < cols-1; i++){
			cells[0][i].text("─");
			cells[h1][i].text("─");
			cells[h1+h2][i].text("─");
			cells[rows-1][i].text("─");
		}
		for (i = 1; i < rows-1; i++){
			cells[i][0].text("│");
		}
		for (i = 1; i < h1; i++){
			cells[i][w].text("│");
			cells[i][cols-1].text("│");
		}
		for (i = h1+1; i < h1+h2; i++){
			cells[i][w].text("│");
			cells[i][cols-1].text("│");
		}
		for (i = h1+h2+1; i < rows-1; i++){
			cells[i][w].text("│");
			cells[i][cols-1].text("│");
		}
	}
	drawBorders(Math.floor(2*cols/3), 3, rows-6);
	
	var Window = function(left, top, width, height){
		this.x = left;
		this.y = top;
		this.width = width;
		this.height = height;
		
		this.clear = function(){
			var i, j;
			for (i = 0; i < this.width; i++){
				for (j = 0; j < this.height; j++){
					cells[j+this.y][i+this.x].text('\u00a0');
				}
			}
		}
		
		this.setText = function(x, y, text){
			if (x < this.width && x + this.x < cols && y < this.height && y + this.y < rows){
				cells[y+this.y][x+this.x].text(text);
			}
		}
		
		this.setColor = function(x, y, color){
			if (x < this.width && x + this.x < cols && y < this.height && y + this.y < rows){
				cells[y+this.y][x+this.x].css("color", color);
			}
		}
	}
	
	var mapWindow = new Window(1, 1, Math.floor(2*cols/3)-1, rows-2);
	
	var updateStatus = function(text){
		statusDiv.text(text);
	}
	
	var messageBuffer = "";
	var bufferMessage = function(text){
		messageBuffer = messageBuffer + text;
	}
	
	var appendMessages = function(){
		if (messageBuffer !== ""){
			var p = $('<p>');
			p.text(messageBuffer);
			messageDiv.prepend(p);
			messageBuffer = "";
		}
	}
	
	return{
		colors:{
			white:"#ffffff",
			red:"#ff0000",
			green:"#00ff00",
			darkGreen:"#008000",
			blue:"#0000ff",
			brown:"#804000",
			gray:"#7f7f7f",
			black:"#000000"},
		rows:rows,
		cols:cols,
		mapWindow:mapWindow,
		updateStatus:updateStatus,
		bufferMessage:bufferMessage,
		appendMessages:appendMessages
	}
}();