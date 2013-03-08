(function(exports, window) {

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

	var Timer = function Timer(callback) {
		this._currentTime = 0;
		this._callback = callback;

		return this;
	};

	Timer.prototype.setCallback = function(callback) {
		this._callback = callback;
	};

	Timer.prototype.currentTime = function() {
		return this._currentTime;
	};

	Timer.prototype.advance = function(amount, callback) {
		this._currentTime += amount;

		this._callback(amount, callback);
	};

	/**
	 * Timer for the web and node!
	 */
	var ClockTimer = Utils.extendTo(Timer, function(callback) {
		this.super(callback);

		this._maxAdvance = maxAdvance || ClockTimer.DEFAULT_MAX_ADVANCE;

		this._running = false;
		this._lastTimestamp = 0;
		this._nextRequest = 0;

		return this;
	});

	ClockTimer.DEFAULT_MAX_ADVANCE = 100;

	ClockTimer.prototype.start = function() {
		this._running = true;

		this._nextFrame(this._lastTimestamp);
	};

	ClockTimer.prototype.stop = function() {
		this._running = false;

		window.cancelAnimationFrame(this._nextRequest);

		delete this._nextRequest;
	};

	ClockTimer.prototype._nextFrame = function(timestamp) {
		var delta = timestamp-this._lastTimestamp;
		var self = this;

		this._lastTimestamp = timestamp;

		this.advance(Math.min(delta, this._maxAdvance), function() {
			if (self._running) {
				self._nextRequest = window.requestAnimationFrame(self._nextFrame.bind(self));
			}
		});
	};

	exports.ClockTimer = ClockTimer;
	exports.Timer = Timer;

} (typeof(exports) !== 'undefined' ? exports : window), typeof(window) !== 'undefined' ? window : exports);