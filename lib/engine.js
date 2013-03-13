if (typeof(require) !== 'undefined') {
	var utils = require('./utils.js');
	var resources = require('./resources.js');
	var timers = require('./timers.js');
	var gameObject = require('./game-object.js');

	Utils = utils.Utils;
	Events = utils.Events;

	Resources = resources.Resources;

	Timer = timers.Timer;
	ClockTimer = timers.ClockTimer;

	GameObject = gameObject.GameObject;
	Behaviour = gameObject.Behaviour;
}

(function(exports, window) {

	var MAX_ACCELERATION_HISTORY = 4;

	var Engine = Utils.extendTo(GameObject, function(timer) {
		var self = this;

		this.super(this);

		this.accelerationHistory = [];

		window.ondevicemotion = function(event) {
			var accelerationX = event.accelerationIncludingGravity.x;
			var accelerationY = -event.accelerationIncludingGravity.y;
			var accelerationZ = event.accelerationIncludingGravity.z;

			if (self.platform.android) {
				accelerationX = -accelerationX;
				accelerationY = -accelerationY;
			}

			accelerationX = Math.min(1, Math.max(-1, accelerationX / 10));
			accelerationY = Math.min(1, Math.max(-1, accelerationY / 10));
			accelerationZ = Math.min(1, Math.max(-1, accelerationZ / 10));

			// add the new acceleration data
			self.accelerationHistory.push({
				x: accelerationX,
				y: accelerationY,
				z: accelerationZ
			});

			// remove the holdest history entry
			if (self.accelerationHistory.length > MAX_ACCELERATION_HISTORY) {
				self.accelerationHistory.shift();
			}
		};

		this.on('gizmos', function(ctx) {
			var y = 0;

			ctx.font = 'bold 26px sans-serif';
			ctx.fillStyle = '#666';
			ctx.fillText(self.fps(), 4, y += 30);

			ctx.font = 'bold 26px sans-serif';
			ctx.fillStyle = '#666';
			ctx.fillText(self.hasForceRepaint ? 'true' : 'false', 4, y += 30);

			ctx.font = 'bold 26px sans-serif';
			ctx.fillStyle = '#666';
			ctx.fillText(self.accelerationX, 4, y += 30);
		});

		this.resources = new Resources();

		this._loadedBehaviours = {};

		this.timer = timer || new Timer();
		this.timer.setCallback(function(timestep, callback) {
			self._tick(timestep, callback);
		});

		this._display = {
			width: 960,
			height: 640
		};

		this.view = {
			scaleMode: this.ScaleMode.FillHeight,
			x: 0,
			y: 0,
			width: 640,
			height: 960
		};

		if (cards && cards._ && cards._.bridge) {
			var Browser = cards._.bridge('Browser');

			if (Browser && Browser.forceRepaint) {
				this.browser = Browser;
				this.hasForceRepaint = true;
			}
		}

		this.backgroundColor = '#ffffff';

		this.touches = [];
		this.touch = {};

		this.gravity = 2800;

		this._objects = {};

		this._fixedStep = null;
		this._skipThreshold = null;
		this._renderThreshold = null;
		this._timer = timer;
		this._timestamp = 0;
		this._remaining = 0;
		this._lastRenderTime = 0;
		this.debugging = false;

		// fps calculation
		this._fps = -1;
		this._renderings = 0;
		this._lastFpsUpdate = -1;

		this._updateTimes = [];
		this._renderTimes = [];

		this.on('tick', function(delta) {
			function lowPass(x, property) {
				var n = x[x.length-1][property];

				for (var i = 0; i < x.length; ++i) {
					n = (x[i][property] + n) / 2;
				}

				return n;
			}

			if (self.accelerationHistory.length > 0) {
				var accelerationX = lowPass(self.accelerationHistory, 'x');
				var accelerationY = lowPass(self.accelerationHistory, 'y');
				var accelerationZ = lowPass(self.accelerationHistory, 'z');

				self.accelerationX = (accelerationX + (self.accelerationX ? self.accelerationX : 0))/2;
				self.accelerationY = (accelerationY + (self.accelerationY ? self.accelerationY : 0))/2;
				self.accelerationZ = (accelerationZ + (self.accelerationZ ? self.accelerationZ : 0))/2;
			}

			if (self.touches[0]) {
				var touch = self.touches[0];
				self.trigger('touchdown', touch.x, touch.y);
			}
		});
	});

	Engine.prototype.ScaleMode = {
		Fixed: 'fixed',
		Center: 'center',
		Fill: 'fill',
		FillWidth: 'fill-width',
		FillHeight: 'fill-height'
	};

	Engine.prototype.FPS_60 = (1000 / 60) / 1000;
	Engine.prototype.FPS_30 = (1000 / 30) / 1000;
	Engine.prototype.FPS_10 = (1000 / 10) / 1000;

	Engine.prototype.updateDisplay = function(width, height) {
		this._display.width = width;
		this._display.height = height;
		this._display.changed = true;
	};

	Engine.prototype.fps = function() {
		return Math.round(this._fps);
	};

	Engine.prototype.setCanvas = function(canvas) {
		var self = this;

		this.canvas = canvas;
		this.context = this.canvas.getContext('2d');

		this._display.changed = true;

		function position(touch) {
			var x = touch.clientX;
			var y = touch.clientY;

			x = self.view.width * x / canvas.clientWidth;
			y = self.view.height * y / canvas.clientHeight;

			return [x, y];
		}

		function fromEvent(e) {
			var touches = e.changedTouches;
			var pos = position(touches ? touches[0] : e);
			var x = pos[0];
			var y = pos[1];

			return [x, y];
		}

		function updateCursors(e, down, clicked) {
			var touches = e.changedTouches;

			if (!touches) {
				return;
			}

			for (var i = 0; i < touches.length; ++i) {
				var cursor = {};
				var touch = touches[i];

				if (!touch) {
					continue;
				}

				if (!down) {
					self.touches[i] = null;
					continue;
				}

				var pos = position(touch);

				cursor.x = pos[0];
				cursor.y = pos[1];
				cursor.isDown = down;
				cursor.clicked = clicked;

				self.touches[i] = cursor;
			}
		}

		function touchStart(e) {
			var pos = fromEvent(e.changedTouches ? e.changedTouches[0] : e);

			self.touch.x = pos[0];
			self.touch.y = pos[1];
			self.touch.isDown = true;
			self.touch.clicked = true;

			if (e.touches.length === 3) {
				self.touch.trippleTapped = true;
				self.debugging = !self.debugging;
			}

			updateCursors(e, true, true);

			e.preventDefault();
			return false;
		}

		function touchMove(e) {
			var pos = fromEvent(e.changedTouches ? e.changedTouches[0] : e);

			self.touch.x = pos[0];
			self.touch.y = pos[1];

			updateCursors(e, true, false);

			e.preventDefault();
			return false;
		}

		function touchEnd(e) {
			var pos = fromEvent(e.changedTouches ? e.changedTouches[0] : e);

			self.touch.x = pos[0];
			self.touch.y = pos[1];
			self.touch.isDown = false;

			updateCursors(e, false, false);

			self._lastX = -1;
			self._lastY = -1;

			e.preventDefault();
			return false;
		}

		canvas.addEventListener("touchstart", touchStart, false);
		canvas.addEventListener("touchmove", touchMove, false);
		canvas.addEventListener("touchend", touchEnd, false);
	};

	Engine.prototype.setSize = function(width, height) {
		this.view.width = width;
		this.view.height = height;

		this._display.changed = true;
	}

	Engine.prototype._tick = function(delta, callback) {
		var self = this;

		var startUpdate = Date.now(), endUpdate;
		var updated = false;

		delta = delta / 1000;

		if (this._display.changed) {
			this._display.changed = false;

			switch (this.view.scaleMode) {
				case this.ScaleMode.Fixed:
					// do nothing...
					break;

				case this.ScaleMode.Center:
					this.view.xoffset = Math.round((this._display.width - this.view.width) / 2);
					this.view.yoffset = Math.round((this._display.height - this.view.height) / 2);
					break;

				case this.ScaleMode.Fill:
					this.view.xoffset = 0;
					this.view.yoffset = 0;
					this.view.width = this._display.width;
					this.view.height = this._display.height;
					break;

				case this.ScaleMode.FillWidth:
					this.view.xoffset = 0;
					this.view.yoffset = 0;
					this.view.width = Math.round(this._display.width * this.view.height / this._display.height);
					break;

				case this.ScaleMode.FillHeight:
					this.view.xoffset = 0;
					this.view.yoffset = 0;
					this.view.height = Math.round(this._display.height * this.view.width / this._display.width);
					break;
			}

			this.canvas.width = this.view.width;
			this.canvas.height = this.view.height;
		}

		// add delta from last step to our remainder
		if (self._fixedStep) {
			self._remaining += delta;

			while (self._remaining >= self._fixedStep) {
				self._timestamp += self._fixedStep;
				updated = true;

				// update at the fixed rate until we have exhausted our
				// available time
				self.trigger('tick', self._fixedStep, self._timestamp);
			
				self._remaining -= self._fixedStep;
			}
		}
		else {
			self._timestamp += delta;
			updated = true;

			self.trigger('tick', delta, self._timestamp);
		}

		// measure the time across the update step
		endUpdate = Date.now();

		self._updateTimes.unshift(endUpdate-startUpdate);
		if (self._updateTimes.length >= 10) {
			self._updateTimes.pop();
		}

		if (updated && self.context) {
			//setTimeout(function() {
				self._render(self.context);

				var now = +new Date();

				if (now - self._lastFpsUpdate > 1000) {
					var fpsUpdate = self._renderings;

					if (self._fps < 0) {
						self._fps = fpsUpdate;
					}

					// update FPS
					self._fps = (4 * fpsUpdate + self._fps) / 5;
					self._renderings = 0;
					self._lastFpsUpdate = now;
				}

				if (this.hasForceRepaint) {
					setTimeout(function() {
						this.browser.forceRepaint();
					}, 0);
				}

				callback();
		}
		else {
			callback();
		}
	};

	Engine.prototype._render = function(context) {
		var startRender = Date.now(), endRender;

	 	// render and update the last render time
	 	this._lastRenderTime = this._timestamp;

		// render scene objects under using the camera
		context.setTransform(1, 0, 0, 1, 0, 0);

		context.fillStyle = this.background;
		context.fillRect(0, 0, this.view.width, this.view.height);

		this.trigger('render', context);

		++this._renderings;

		// measure the time across the rendering step
		endRender = Date.now();

		this._renderTimes.unshift(endRender-startRender);
		if (this._renderTimes.length >= 10) {
			this._renderTimes.pop();
		}

		if (this.debugging) {
			context.setTransform(1, 0, 0, 1, 0, 0);

			this.trigger('gizmos', context);
		}
	};

	Engine.prototype.start = function(name, definition) {
		this.timer.start();
	};

	Engine.prototype.behaviour = function(name, definition) {
		var behaviour;

		if (typeof(name) === 'object') {
			behaviour = name;
			name = behaviour.getName();
		}

		if (typeof(this._loadedBehaviours[name]) !== 'undefined') {
			return this._loadedBehaviours[name];
		}

		if (!behaviour) {
			behaviour = new Behaviour(name, definition);
		}

		this._loadedBehaviours[name] = behaviour;
	};

	Engine.prototype.object = function(defaults) {
		var behaviours = Array.prototype.slice.call(arguments, 0),
		    object = new GameObject(this);

		this.addChild(object);

		if (behaviours.length > 0) {
			var lastComponent = behaviours[behaviours.length-1];

			if (typeof(lastComponent) === 'object') {
				defaults = lastComponent;
				behaviours.pop();
			}
			else {
				defaults = null;
			}
		}

		if (defaults) {
			var savedDefaults = {};

			for (var key in defaults) {
				if (defaults.hasOwnProperty(key)) {
					if (key.indexOf('on') == 0) {
						var ev = key.substring(2);

						object.on(ev, defaults[key]);
					}
					else {
						savedDefaults[key] = defaults[key];
						object[key] = defaults[key];
					}
				}
			}
		}

		for (var i = 0, l = behaviours.length; i < l; ++i) {
			object.addBehaviour(behaviours[i]);
		}
	};

	Engine.prototype.getObject = function(id) {
		return this._objects[id];
	};

	Engine.prototype.addObject = function(object) {
		this._objects[object.id] = object;
	};

	Engine.prototype.removeObject = function(object) {
		delete this._objects[object.id];
	};

	Engine.prototype.getBehaviour = function(name) {
		return this._loadedBehaviours[name];
	};

	exports.Engine = Engine;
	
} (typeof(exports) !== 'undefined' ? exports : window, typeof(window) !== 'undefined' ? window : exports));
