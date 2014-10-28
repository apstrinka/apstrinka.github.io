var main = function() {
  $('.btn').click(function() {
    var number = $('.value').val();
	var from = parseInt($('.fromBase').val(), 10);
	var to = parseInt($('.toBase').val(), 10);
	if (isNaN(from) || isNaN(to) || from < 2 || from > 36 || to < 2 || to > 36){
	  $('.result').text('The bases need to be numbers between 2 and 36.');
	} else {
	  var numerals = '0123456789abcdefghijklmnopqrstuvwxyz';
	  var result = '';
	  var value = 0;
	  for (var i = 0; i < number.length; i++){
	    var digit = number[i];
		var d = numerals.indexOf(digit);
		if (d === -1){
		  result = 'Invalid character in number.';
		  break;
		}
		value = value*from + d;
	  }
	  if (result === ''){
	    while(value > 0){
	      var remainder = numerals[value % to];
		  result = remainder.concat(result);
		  value = Math.floor(value / to);
		}
		if (result === '')
		  result = '0';
	  }
      $('.result').text(result);
	}
  });
}

$(document).ready(main);