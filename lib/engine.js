var GameObject;
var Behaviour;

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

	var Game = Utils.extendTo(GameObject, function(timer) {
		var self = this;

		this['super']({}, this);

		this.engine = this;
		this.entityCount = 0;

		this.accelerationHistory = [];
		
		var faked = false;
		var platformName;
		var version;
		var match;
		var userAgent = navigator ? navigator.userAgent : 'Android';

		if (match = /\bCPU.*OS (\d+(_\d+)?)/i.exec(userAgent)) {
			platformName = 'ios';
			version = match[1].replace('_', '.');
		}
		else if (match = /\bAndroid (\d+(\.\d+)?)/.exec(userAgent)) {
			platformName = 'android';
			version = match[1];
		}

		var firstDate = +new Date();

		window.ondevicemotion = function(event) {
			var accelerationX = event.accelerationIncludingGravity.x;
			var accelerationY = -event.accelerationIncludingGravity.y;
			var accelerationZ = event.accelerationIncludingGravity.z;

			if (accelerationX < -10 || accelerationX > 10) {
				return;
			}

			accelerationX = accelerationX || 0;
			accelerationY = accelerationY || 0;
			accelerationZ = accelerationZ || 0;

			if (platformName === 'android') {
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

		window.ondeviceorientation = function(event) {
			var newOrientation = {
				alpha: event.alpha,
				beta: event.beta,
				gamma: event.gamma
			};

			if (self.orientation) {
				newOrientation.alpha = (newOrientation.alpha + self.orientation.alpha) / 2;
				newOrientation.beta = (newOrientation.beta + self.orientation.beta) / 2;
				newOrientation.gamma = (newOrientation.gamma + self.orientation.gamma) / 2;
			}

			self.orientation = newOrientation;
		};

		this.on('gizmos', function(ctx) {
			var y = 0;

			ctx.font = 'bold 26px sans-serif';
			ctx.fillStyle = '#666';
			ctx.fillText(self.fps(), 4, y += 30);

			ctx.font = 'bold 26px sans-serif';
			ctx.fillStyle = '#ff4444';
			ctx.fillText(self.accelerationX, 4, y += 30);

			ctx.font = 'bold 26px sans-serif';
			ctx.fillStyle = '#44ff44';
			ctx.fillText(self.smoothAccelerationX, 4, y += 30);
		});

		this.resources = new Resources();

		this.timer = timer || new ClockTimer();
		this.timer.setCallback(function(timestep, callback) {
			self._tick(timestep, callback);
		});

		this.activeScene = null;
		this._sceneHistory = [];

		this._display = {
			width: 960,
			height: 640
		};

		this.view = {
			scaleMode: Game.ScaleMode.FillHeight,
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
		this._behaviours = {};

		this._fixedStep = 17;
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

		for (var i = 0; i < Game.DEFAULT_BEHAVIOURS.length; ++i) {
			var behaviour = Game.DEFAULT_BEHAVIOURS[i];

			this.behaviour(behaviour._name, behaviour._definition, this);
		}

		this.on('tick', function(delta) {
			function lowPass(x, property) {
				var n = x[x.length-1][property];

				for (var i = 0; i < x.length; ++i) {
					n = (x[i][property] + n) / 2;
				}

				return n;
			}

			if (self.accelerationHistory.length > 0) {
				var acceleration = self.accelerationHistory[self.accelerationHistory.length-1];

				self.accelerationX = acceleration.x;
				self.accelerationY = acceleration.y;
				self.accelerationZ = acceleration.z;

				var accelerationX = lowPass(self.accelerationHistory, 'x');
				var accelerationY = lowPass(self.accelerationHistory, 'y');
				var accelerationZ = lowPass(self.accelerationHistory, 'z');

				self.accelerationXPre = (accelerationX + (self.accelerationXPre ? self.accelerationXPre : 0))/2;
				self.accelerationYPre = (accelerationY + (self.accelerationYPre ? self.accelerationYPre : 0))/2;
				self.accelerationZPre = (accelerationZ + (self.accelerationZPre ? self.accelerationZPre : 0))/2;

				self.smoothAccelerationX = self.accelerationXPre;
				self.smoothAccelerationY = self.accelerationYPre;
				self.smoothAccelerationZ = self.accelerationZPre;
			}

			var touch = self.touch;

			var ev = {};

			ev.cancelled = false;

			if (!touch.wasDown && touch.isDown) {
				touch.wasDown = true;
				//self.trigger('touchstart', touch.x, touch.y, ev);
			}
			else if (touch.wasDown && touch.isDown) {
				self.trigger('touchmove', touch.x, touch.y, ev);
			}
			else if (touch.wasDown && !touch.isDown) {
				touch.wasDown = false;
				self.trigger('touchend', touch.x, touch.y, ev);
			}
		});
	});

	Game.prototype.removeScene = function(scene) {
		for (var i = 0; i < this._sceneHistory.length; ++i) {
			if (this._sceneHistory[i] === scene) {
				this._sceneHistory.splice(i, 1);
				break;
			}
		}
	};

	Game.prototype.backScene = function() {
		var oldScene = this._sceneHistory.pop();

		this.changeScene(oldScene, true);
	};

	Game.prototype.changeScene = function(newScene, cancelPush) {
		var self = this;
		var oldScene = this.activeScene;

		function startScene(addToStack) {
			var oldIndex = 0;

			if (oldScene) {
				var pushToHistory = !cancelPush || (typeof(addToStack) !== 'undefined' && !addToStack);

				oldIndex = self.indexOfChild(oldScene);
				oldScene.parent.removeChild(oldScene, !pushToHistory);

				if (pushToHistory)  {
					self._sceneHistory.push(oldScene);
				}
			}

			self.insertChild(newScene, oldIndex);
			self.activeScene = newScene;

			newScene.trigger('entering', function() {});
		}

		if (oldScene) {
			oldScene.trigger('leaving', startScene);
		}
		else {
			startScene();
		}
	};

	Game.ScaleMode = {
		Fixed: 'fixed',
		Center: 'center',
		Fill: 'fill',
		FillWidth: 'fill-width',
		FillHeight: 'fill-height'
	};

	Game.FPS_60 = (1000 / 60) / 1000;
	Game.FPS_30 = (1000 / 30) / 1000;
	Game.FPS_10 = (1000 / 10) / 1000;

	Game.prototype.updateDisplay = function(width, height) {
		var oldWidth = this._display.width;
		var oldHeight = this._display.height;

		this._display.width = width;
		this._display.height = height;

		if (this._display.width !== oldWidth || this._display.height !== height) {
			this._display.changed = true;

			this._fixViewSize();
		}
	};

	Game.prototype.fps = function() {
		return Math.round(this._fps);
	};

	Game.prototype.setCanvas = function(canvas) {
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
			var ev = {};

			self.touch.x = pos[0];
			self.touch.y = pos[1];
			self.touch.isDown = true;
			self.touch.wasDown = false;
			self.touch.clicked = true;

			if (e.touches.length === 3) {
				self.touch.trippleTapped = true;
				self.debugging = !self.debugging;

				console.log(self.debugLog());
			}

			updateCursors(e, true, true);

			e.preventDefault();

			ev.cancelled = false;

			self.trigger('touchstart', self.touch.x, self.touch.y, ev);

			return false;
		}

		function touchMove(e) {
			var pos = fromEvent(e.changedTouches ? e.changedTouches[0] : e);

			self.touch.x = pos[0];
			self.touch.y = pos[1];
			self.touch.wasDown = true;

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

		//this._fixViewSize();
	};

	Game.prototype.setSize = function(width, height) {
		this.view.width = width;
		this.view.height = height;

		this._display.changed = true;

		//this._fixViewSize();
	};

	Game.prototype._fixViewSize = function() {
		if (this._display.changed) {
			this._display.changed = false;

			switch (this.view.scaleMode) {
				case Game.ScaleMode.Fixed:
					// do nothing...
					break;

				case Game.ScaleMode.Center:
					this.view.xoffset = Math.round((this._display.width - this.view.width) / 2);
					this.view.yoffset = Math.round((this._display.height - this.view.height) / 2);
					break;

				case Game.ScaleMode.Fill:
					this.view.xoffset = 0;
					this.view.yoffset = 0;
					this.view.width = this._display.width;
					this.view.height = this._display.height;
					break;

				case Game.ScaleMode.FillWidth:
					this.view.xoffset = 0;
					this.view.yoffset = 0;
					this.view.width = Math.round(this._display.width * this.view.height / this._display.height);
					break;

				case Game.ScaleMode.FillHeight:
					this.view.xoffset = 0;
					this.view.yoffset = 0;
					this.view.height = Math.round(this._display.height * this.view.width / this._display.width);
					break;
			}

			this.canvas.width = this.view.width;
			this.canvas.height = this.view.height;

			this.trigger('resize', this.view.width, this.view.height);

			if (!this._isReady) {
				this._isReady = true;
				this.trigger('ready');
			}
		}
	};

	Game.prototype.ready = function(fn) {
		if (!this._isReady) {
			this.once('ready', fn);
		}
		else {
			fn.call(this);
		}
	};

var deltas = [];

	Game.prototype._tick = function(inDelta, callback) {
		var self = this;
		var delta = inDelta;
		var steps = 0;
		var startUpdate = +new Date(), endUpdate, endRender, endCallback;
		var updated = false;

		this._eventTimeline = {};
		this._eventDeltas = {};
		this._eventStack = {};

		function finished() {
			endRender = +new Date();

			//deltas.push([inDelta, endUpdate-startUpdate, endRender-endUpdate, steps].join('\t'));

			if (deltas.length > 12) {
				var d = [].concat(deltas);

				deltas.length = 0;

				window.setTimeout(function() {
					console.log(d.join('\n'));
				}, 0);
			}
		}

		callback();

		delta *= self.multiplier || 1;

		if (typeof(this.canvas) !== undefined) {
			self.updateDisplay(this.canvas.clientWidth, this.canvas.clientHeight);
		}

		// add delta from last step to our remainder
		if (self._fixedStep) {
			self._remaining += delta;

			while (self._remaining >= self._fixedStep) {
				self._timestamp += self._fixedStep / 1000;
				updated = true;

				// update at the fixed rate until we have exhausted our
				// available time
				self.trigger('subtick', self._fixedStep / 1000, self._timestamp);

				++steps;
			
				self._remaining -= self._fixedStep;
			}
		}
		else {
			self._remaining = delta;

			delta = self._remaining / 1000;
			self._remaining = 0;

			self._timestamp += delta;
			updated = true;

			self.trigger('subtick', delta, self._timestamp);
		}

		// measure the time across the update step
		endUpdate = +new Date();

		if (updated) {
			self._updateTimes.unshift(endUpdate-startUpdate);
			if (self._updateTimes.length >= 10) {
				self._updateTimes.pop();
			}
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
				//setTimeout(function() {
					//this.browser.forceRepaint();
				//}, 0);
			}

			finished();
		}
		else {
			finished();
		}
	};

	Game.prototype._render = function(context) {
		var startRender = +new Date(), endRender;

	 	// render and update the last render time
	 	this._lastRenderTime = this._timestamp;

		// render scene objects under using the camera
		context.setTransform(1, 0, 0, 1, 0, 0);

		context.fillStyle = this.background;
		context.fillRect(0, 0, this.view.width, this.view.height);

		this.trigger('subrender', context);

		++this._renderings;

		// measure the time across the rendering step
		endRender = +new Date();

		this._renderTimes.unshift(endRender-startRender);
		if (this._renderTimes.length >= 10) {
			this._renderTimes.pop();
		}

		if (this.debugging) {
			context.setTransform(1, 0, 0, 1, 0, 0);

			this.trigger('gizmos', context);
		}
	};

	Game.prototype.object = function(defaults) {
		var behaviours = Array.prototype.slice.call(arguments, 0);

		if (behaviours.length > 0) {
			var lastComponent = behaviours[behaviours.length-1];

			if (!(lastComponent instanceof Behaviour) && (''+lastComponent !== lastComponent)) {
				defaults = lastComponent;
				behaviours.pop();
			}
			else {
				defaults = null;
			}
		}

		var obj = new GameObject(behaviours, defaults, this);

		this._addObject(obj);

		obj.trigger('attach', this);

		return obj;
	};

	Game.prototype.behaviour = function(name, definition) {
		if (this._behaviours.hasOwnProperty(name)) {
			return this._behaviours[name];
		}

		var behave = new Behaviour(name, definition, this);

		this._behaviours[name] = behave;

		return behave;
	};

	Game.prototype.start = function(name, definition) {
		this.timer.start();
	};

	Game.prototype.getObject = function(id) {
		return this._objects[id];
	};

	Game.prototype._addObject = function(object) {
		var wasAdded = !this._objects.hasOwnProperty(object.id);

		this._objects[object.id] = object;

		if (wasAdded) {
			this.entityCount++;
			
			var behaviours = object._behaviours;

			for (var k in behaviours) {
				if (behaviours.hasOwnProperty(k)) {
					behaviours[k].applyBehaviour(object);
				}
			}
		}
	};

	Game.prototype.removeObject = function(object) {
		if (this._objects.hasOwnProperty(object.id)) {
			this.entityCount--;

			delete this._objects[object.id];

			var behaviours = object._behaviours;

			for (var k in behaviours) {
				if (behaviours.hasOwnProperty(k)) {
					behaviours[k].removeBehaviour(object);
				}
			}
		}
	};

	exports.Game = Game;
	exports.GameObject = GameObject;
	exports.Behaviour = Behaviour;
	
} (typeof(exports) !== 'undefined' ? exports : window, typeof(window) !== 'undefined' ? window : exports));
