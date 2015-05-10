var UTIL = function(){
	var randInt = function(min, max){
		var r = Math.random() * (max-min+1);
		return Math.floor(r + min);
	}
	
	return{
		randInt: randInt
	};
}();