if (typeof(require) !== 'undefined') {
	var utils = require('./utils.js');
	var timers = require('./timers.js');
	var gameObject = require('./game-object.js');

	Utils = utils.Utils;
	Events = utils.Events;

	Timer = timers.Timer;
	ClockTimer = timers.ClockTimer;

	GameObject = gameObject.GameObject;
	Behaviour = gameObject.Behaviour;
}

(function(exports) {

	var Engine = Utils.extendTo(GameObject, function(timer) {
		var self = this;

		this.super(this);

		this._loadedBehaviours = {};

		this.behaviour('scene', {});
		this.behaviour('overlay', {});

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

		this.backgroundColor = '#ffffff';

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
	});

	Engine.prototype.ScaleMode = {
		Fixed: 'fixed',
		Center: 'center',
		Fill: 'fill',
		FillWidth: 'fill-width',
		FillHeight: 'fill-height'
	};

	Engine.prototype.FPS_60 = 17;
	Engine.prototype.FPS_30 = 33;
	Engine.prototype.FPS_10 = 100;

	Engine.prototype.updateDisplay = function(width, height) {
		this._display.width = width;
		this._display.height = height;
		this._display.changed = true;
	};

	Engine.prototype.fps = function() {
		return Math.round(this._fps);
	};

	Engine.prototype.setCanvas = function(canvas) {
		this.canvas = canvas;
		this.context = this.canvas.getContext('2d');

		this._display.changed = true;
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

		if (this._display.changed) {
			this._display.changed = false;

			switch (this.view.scaleMode) {
				case this.ScaleMode.Fixed:
					// do nothing...
					break;

				case this.ScaleMode.Center:
					this.view.xoffset = (this._display.width - this.view.width) / 2;
					this.view.yoffset = (this._display.height - this.view.height) / 2;
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
					this.view.width = this._display.height * this.view.width / this._display.width;
					break;

				case this.ScaleMode.FillHeight:
					this.view.xoffset = 0;
					this.view.yoffset = 0;
					this.view.height = this._display.width * this.view.height / this._display.height;
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
			setTimeout(function() {
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

				if (cards && cards.browser && cards.browser.forceRepaint) {
					cards.browser.forceRepaint();
				}

				callback();
			}, 0);
		}
		else {
			callback();
		}
	};

	Engine.prototype._render = function(context) {
		var startRender = Date.now(), endRender;

	 	// render and update the last render time
	 	this._lastRenderTime = this._timestamp;

		var sceneObjects = this.behaviour('scene').getObjects();
		var overlayObjects = this.behaviour('overlay').getObjects();

		// render scene objects under using the camera
		context.setTransform(1, 0, 0, 1, 0, 0);

		// I'm assuming someone is going to fill the screen at some point
		context.fillStyle = this.backgroundColor;
		context.fillRect(0, 0, this.view.width, this.view.height);

		//var xoffset = ~~(this.viewport.xoffset + 0.5);

		for (var i = 0, l = sceneObjects.length; i < l; ++i) {
			sceneObjects[i].trigger('render', context);
		}

		// render overlay objects without the camera
		context.setTransform(1, 0, 0, 1, 0, 0);

		for (var i = 0, l = overlayObjects.length; i < l; ++i) {
			overlayObjects[i].trigger('render', context);
		}

		++this._renderings;

		// measure the time across the rendering step
		endRender = Date.now();

		this._renderTimes.unshift(endRender-startRender);
		if (this._renderTimes.length >= 10) {
			this._renderTimes.pop();
		}

		if (this.debugging) {
			for (var i = 0, l = sceneObjects.length; i < l; ++i) {
				sceneObjects[i].trigger('gizmos', context);
			}

			// render overlay objects without the camera
			context.setTransform(1, 0, 0, 1, 0, 0);

			for (var i = 0, l = overlayObjects.length; i < l; ++i) {
				overlayObjects[i].trigger('gizmos', context);
			}
		}
	};

	Engine.prototype.start = function(name, definition) {
		this.timer.start();
	};

	Engine.prototype.behaviour = function(name, definition) {
		if (typeof(this._loadedBehaviours[name]) !== 'undefined') {
			return this._loadedBehaviours[name];
		}

		var behaviour = new Behaviour(name, definition);

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
			object.defaults(defaults);
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
	
} (typeof(exports) !== 'undefined' ? exports : window));
