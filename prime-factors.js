$(document).ready(function() {
  $('.btn').click(function() {
		var max = parseInt($('.usernumber').val(), 10);
		if (isNaN(max) || max < 2){
			$('.result').text('Max needs to be a number greater than 1.');
		} else {
			var allFactors = ["2"];
			var primes = [2];
			for (var n = 3; n <= max; n++){
				var isPrime = true;
				var factors = "";
				for (var i = 0; i < primes.length && primes[i] <= Math.sqrt(n); i++){
					var j = primes[i];
					if (n%j === 0){
						isPrime = false;
						factors = j.toString() + "*" + allFactors[n/j-2];
						break;
					}
				}
				if (isPrime){
					factors = n.toString();
					primes.push(n);
				}
				allFactors.push(factors);
			}
			$('.result').empty();
			for (var i = 0; i < allFactors.length; i++){
				var row = $('<tr>');
				row.append($('<td style="text-align:right">').text((i+2).toString()));
				row.append($('<td>').text(" = "));
				row.append($('<td>').text(allFactors[i]));
				$('.result').append(row);
			}
		}
  });
});
