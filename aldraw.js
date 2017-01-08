"use strict";

$(document).ready(function(){
	$("#myCanvas").click(function(ev){
		var ctx = document.getElementById("myCanvas").getContext("2d");
		ctx.beginPath();
		ctx.arc(ev.offsetX, ev.offsetY, 5, 0, 2*Math.PI);
		ctx.fill();
	});
});