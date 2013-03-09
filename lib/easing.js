// Easing functions used in animations

(function(exports) {

	exports.easeLinear = function easeLinear(t) {
		return t;
	};

	exports.easeCubic = function easeCubic(t) {
		return t * t * t;
	};

	exports.easeOutBounce = function easeOutBounce(t) {
		if (t < (1/2.75)) {
			return (7.5625*t*t);
		} else if (t < (2/2.75)) {
			return (7.5625*(t -= (1.5/2.75))*t + .75);
		} else if (t < (2.5/2.75)) {
			return (7.5625*(t -= (2.25/2.75))*t + .9375);
		} else {
			return (7.5625*(t -= (2.625/2.75))*t + .984375);
		}
	};

	exports.easeOut = function easeOut(t) {
		t = t-1;
		return t*t*t + 1;
	};

	exports.easeIn = function easeOut(t) {
		t = 1-t;
		return 1- t*t*t;
	};

	exports.easeOvershoot = function easeOvershoot(t) {
		return -t * (t-1.4) * 2.5;
	};

}(typeof(exports) !== 'undefined' ? exports : window));
