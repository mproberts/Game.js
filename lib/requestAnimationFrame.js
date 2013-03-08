(function(window) {
	// setup requestAnimationFrame
	var lastTime = 0;
	var vendors = ['ms', 'moz', 'webkit', 'o'];

	for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
		window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
		window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
		                           || window[vendors[x]+'CancelRequestAnimationFrame'];
	}

	// use setTimeout if all else fails
	if (!window.requestAnimationFrame) {
		window.requestAnimationFrame = function(callback, element) {
			var currTime = Date.now();
			var timeToCall = Math.max(0, 10 - (currTime - lastTime));
			
			var id = window.setTimeout(function() {
				callback(currTime + timeToCall);
			}, timeToCall);
			
			lastTime = currTime + timeToCall;
			
			return id;
		};
		
		window.cancelAnimationFrame = function(id) {
			clearTimeout(id);
		};
	}
})(window);
