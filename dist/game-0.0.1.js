(function(exports) {
	/**
	 * Helper methods for class structure, eventing, etc.
	 */
	var Utils = {};

	Utils.createMulticall = function() {
		var listeners = [];
		var contexts = [];

		var fn = function() {
			var result = false;

			for (var i = 0, l = listeners.length; i < l; ++i) {
				if (typeof(listeners[i]) !== 'undefined') {
					result = listeners[i].apply(contexts[i] || this, arguments) || result;
				}
			}

			return result;
		};

		fn.listeners = this;
		fn.contexts = this;

		fn.add = function(callback, context) {
			listeners.push(callback);
			contexts.push(context || null);

			return this;
		};

		fn.remove = function(callback, context) {
			if (!callback && !context) {
				listeners.length = 0;
				contexts.length = 0;
			}
			else {
				var found = -1;

				for (var i = listeners.length; --i >= 0;) {
					var listener = listeners[i];
					var listenerContext = contexts[i];

					if (context && listenerContext === context
					 && listener === callback) {
					 	found = i;
						break;
					} else if (!context && callback === listener) {
						found = i;
						break;
					}
				}

				if (found > -1) {
					Utils.removeElement(listeners, i);
					Utils.removeElement(contexts, i);
				}
			}

			return this;
		};

		for (var i = 0, l = arguments.length - 1; i <= l; ++i) {
			fn.add(arguments[i]);
		}

		return fn;
	};

	Utils.delimit = function delimit(number) {
		var str = ''+number;
		var result = '';

		for (var i = str.length; i >= 0; i -= 3) {
			var start = i - 3;
			var wasEmpty = result.length === 0;

			if (start <= 0) {
				if (!wasEmpty) {
					result = ',' + result;
				}

				result = str.substring(0, start + 3) + result;
				break;
			}

			if (!wasEmpty) {
				result = ',' + result;
			}

			result = str.substr(start, 3) + result;
		}

		return result;
	};

	Utils.removeElement = function removeElement(array, element) {
		var index = 0, l;

		if (Array.prototype.indexOf) {
			index = array.indexOf(element);
		}
		else {
			for (index = 0, l = array.length; index < l; ++index) {
				if (array[index] === element) {
					break;
				}
			}
		}

		array.splice(index, 1);
	};

	Utils.shuffle = function(toshuffle, random) {
		var array = [].concat(toshuffle);

		if (typeof(random) !== 'function') {
			random = function() {
				return Math.random();
			};
		}

		for (var i = array.length; --i >= 1; ) {
			var j = Math.round(random() * i);
			var swap = array[i];

			array[i] = array[j];
			array[j] = swap;
		}

		return array;
	}

	Utils.ease = function(from, to) {
		var actions = [];

		for (var key in to) {
			if (!to.hasOwnProperty(key)) {
				continue;
			}

			var startValue = from[key];
			var targetValue = to[key];
			var isSetOnly = false;
			var isColor = false;

			if (startValue === targetValue) {
				continue;
			}

			var typeString = typeof(targetValue);

			if (+targetValue === targetValue) {
				// number
				startValue = +startValue || 0;
				targetValue = +targetValue;
			}
			else if (''+targetValue === targetValue) {
				try {
					// string type, check if it's a color
					var targetColor = Utils.parseColor(targetValue);

					if (targetColor) {
						targetValue = targetColor;
						startValue = Utils.parseColor(startValue) || [0, 0, 0, 1];

						isColor = true;
					}
				}
				catch (e) {
					isColor = false;
				}

				if (!isColor) {
					isSetOnly = true;
				}
			}
			else {
				// boolean, object or array (heavy-step types)
				isSetOnly = true;
			}

			var action = {
				key: key,
				source: startValue,
				dest: targetValue,
				isColor: isColor,
				isSet: isSetOnly
			};

			actions.push(action);
		}

		return function(target, amount) {
			for (var i = 0, l = actions.length; i < l; ++i) {
				var action = actions[i];
				var value;

				if (action.isColor) {
					value = Utils.mixColors(action.source, action.dest, amount);
				}
				else if (action.isSet) {
					value = amount === 1 ? action.dest : action.source;
				}
				else {
					value = action.source * (1-amount) + action.dest * amount;
				}

				target[action.key] = value;
			}
		};
	};

	Utils.checkAABBIntersection = function(a, b) {
		var bx = b.x, bxw = b.x + b.width;
		var by = b.y, byh = b.y + b.height;

		var points = [
			[a.x, a.y],
			[a.x+a.width, a.y],
			[a.x, a.y+a.height],
			[a.x+a.width, a.y+a.height]
		];

		for (var i = 0; i < 4; ++i) {
			var p = points[i];
			var px = p[0];
			var py = p[1];

			if (px >= bx && px <= bxw && py >= by && py <= byh) {
				return true;
			}
		}

		return false;
	};

	Utils.extendTo = function(base, ctor) {
		function dummy() {
		}

		function clzz() {
			var result;
			var old = this['super'];

			this['super'] = base;
			result = ctor.apply(this, arguments);

			if (old) {
				this['super'] = old;
			}

			return result;
		}

		clzz.toString = function toString() {
			return ctor.toString.call(this);
		};

		dummy.prototype = base.prototype;
		dummy.prototype['constructor'] = base;

		clzz.prototype = new dummy();
		clzz.prototype['constructor'] = clzz;

		return clzz;
	};

	Utils.toRadix = function(value, radix) {
		var replacements = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
		var result = [];

		while (value > 0) {
			var index = value % radix;

			value = Math.floor(value / radix);

			result.unshift(replacements[index]);
		}

		return result.join('');
	};

	Utils.isArray = function(arr) {
		return Object.prototype.toString.call(arr) == '[object Array]';
	};

	Utils.mixColors = function(color1, color2, amount) {
		if (!Utils.isArray(color1)) {
			color1 = Utils.parseColor(color1);
		}

		if (!Utils.isArray(color2)) {
			color2 = Utils.parseColor(color2);
		}

		var mixAmount = (1 - amount);
		var targetColor = [];

		for (var i = 0; i < 3; ++i) {
			targetColor[i] = Math.min(255, Math.max(0, Math.round((color1[i] * mixAmount) + (color2[i] * amount) || 0)));
		}

		targetColor[i] = Math.min(1, Math.max(0, (color1[3] * mixAmount) + (color2[3] * amount) || 0));

		return 'rgba(' + targetColor.join(',') + ')';
	};

	Utils.parseColor = function(str) {
		var components = [];
		var componentForm = false;

		str = str.trim();

		if (str.indexOf('rgba') === 0) {
			str = str.substring(4);
			componentForm = true;
		}
		else if (str.indexOf('rgb') === 0) {
			str = str.substring(3);
			componentForm = true;
		}

		if (componentForm) {
			str = str.replace('(', '');
			str = str.replace(')', '');

			var parts = str.split(',');

			for (var i = 0; i < parts.length; ++i) {
				components[i] = parseFloat(parts[i].trim());
			}
		}
		else if (str.indexOf('#') === 0) {
			var parts = str.match(/[0-9a-f]{2}/g);

			for (var i = 0; i < parts.length; ++i) {
				components[i] = parseInt(parts[i].trim(), 16);
			}
		}
		else {
			return false;
		}

		if (components.length === 3) {
			components.push(1);
		}

		return components;
	};

	Utils.applyDefaults = function(target, values) {
		for (var i in values) {
			if (values.hasOwnProperty(i)) {
				if (!target.hasOwnProperty(i)) {
					target[i] = values[i];
				}
			}
		}

		return target;
	};

	/**
	 * Creates an Event object which can fire events and be bound
	 * to for notification of events 
	 */
	var Events = function Events() {
		this._bindings = {};

		return this;
	};

	Events.prototype.on = function(eventName, callback, context) {
		if (!this._bindings) {
			this._bindings = {};
		}

		var listeners = this._bindings[eventName] || Utils.createMulticall();

		this._bindings[eventName] = listeners.add(callback, context)

		return this;
	};

	Events.prototype.once = function(eventName, callback, context) {
		if (!this._bindings) {
			this._bindings = {};
		}

		var listeners = this._bindings[eventName] || Utils.createMulticall();

		function onceFunction() {
			listeners.remove(onceFunction, context);

			return callback.apply(context || this, Array.prototype.slice.call(arguments, 0));
		}

		this._bindings[eventName] = listeners.add(onceFunction, context);

		return this;
	};

	Events.prototype.off = function(eventName, callback, context) {
		if (!this._bindings) {
			this._bindings = {};
		}

		var listeners = this._bindings[eventName];

		if (listeners) {
			listeners.remove(callback, context);
		}

		return this;
	};

	Events.prototype.trigger = function(eventName) {
		if (!this._bindings) {
			this._bindings = {};
		}

		var listeners = this._bindings[eventName];
		var result = undefined;

		if (listeners) {
			result = listeners.call(this, arguments[1], arguments[2], arguments[3]);
		}

		return result;
	};

	exports.Utils = Utils;
	exports.Events = Events;
	
} (typeof(exports) !== 'undefined' ? exports : window));
;(function(exports, window) {

	// setup requestAnimationFrame
	var lastTime = 0;
	var vendors = ['ms', 'moz', 'webkit', 'o'];

	function bind(fn, context) {
		return function() {
			return fn.apply(context, Array.prototype.slice.call(arguments, 0));
		};
	}

	for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
		window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
		window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
		                           || window[vendors[x]+'CancelRequestAnimationFrame'];
	}

	// use setTimeout if all else fails
	if (!window.requestAnimationFrame) {
		window.requestAnimationFrame = function(callback, element) {
			var currTime = +new Date();
			var timeToCall = Math.max(0, 15 - (currTime - lastTime));
			
			var id = window.setTimeout(function() {
				var nextTime = +new Date();
				callback(nextTime);
			}, 2);
			
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
	var ClockTimer = Utils.extendTo(Timer, function(callback, maxAdvance) {
		this['super'](callback);

		this._maxAdvance = maxAdvance || ClockTimer.DEFAULT_MAX_ADVANCE;

		this._running = false;
		this._lastTimestamp = 0;
		this._nextRequest = 0;

		return this;
	});

	ClockTimer.DEFAULT_MAX_ADVANCE = 100;

	ClockTimer.prototype.start = function() {
		if (!this._running) {
			this._running = true;

			this._nextRequest = window.requestAnimationFrame(bind(this._nextFrame, this));
		}
	};

	ClockTimer.prototype.stop = function() {
		this._running = false;

		window.cancelAnimationFrame(this._nextRequest);

		delete this._nextRequest;
	};

	ClockTimer.prototype._nextFrame = function(timestamp) {
		var self = this;

		if (this._lastTimestamp) {
			var delta = timestamp-this._lastTimestamp;

			this._lastTimestamp = timestamp;

			this.advance(Math.min(~~(delta + 0.5), this._maxAdvance), function() {
				if (self._running) {
					self._nextRequest = window.requestAnimationFrame(bind(self._nextFrame, self));
				}
			});
		}
		else {
			this._lastTimestamp = timestamp;

			if (this._running) {
				this._nextRequest = window.requestAnimationFrame(bind(this._nextFrame, this));
			}
		}
	};

	exports.ClockTimer = ClockTimer;
	exports.Timer = Timer;

} (typeof(exports) !== 'undefined' ? exports : window, typeof(window) !== 'undefined' ? window : exports));
;// Easing functions used in animations

(function(exports) {

	var Easing = {};

	Easing.easeLinear = function easeLinear(t) {
		return t;
	};

	Easing.easeCubic = function easeCubic(t) {
		return t * t * t;
	};

	Easing.easeOutBounce = function easeOutBounce(t) {
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

	Easing.easeOut = function easeOut(t) {
		t = t-1;
		return t*t*t + 1;
	};

	Easing.easeIn = function easeOut(t) {
		t = 1-t;
		return 1-t*t*t;
	};

	Easing.easeOvershoot = function easeOvershoot(t) {
		return -t * (t-1.4) * 2.5;
	};

	Easing.easeRebound = function easeRebound(t) {
		return 1 - (2 * t - 1) * (2 * t - 1);
	};

	exports.Easing = Easing;

}(typeof(exports) !== 'undefined' ? exports : window));
;if (typeof(require) !== 'undefined') {
	var fs = require('fs');
	var utils = require('./utils.js');

	Utils = utils.Utils;
}

(function(exports) {

	var Resources = function() {
		this._cache = {};
	};

	Resources.prototype.spritesheet = function(spritesheetUrl, json, callback) {
		var img = new Image();
		var self = this;

		// setup cache objects
		for (var i = 0; i < json.length; ++i) {
			var sprite = json[i];
			var cache = this._cache[sprite.url];

			if (typeof(cache) === 'undefined') {
				cache = {};
				cache.callback = Utils.createMulticall();
				cache.pending = true;

				this._cache[sprite.url] = cache;
			}

			if (callback) {
				cache.callback.add(callback);
			}
		}

		img.addEventListener('load', function() {
			for (var i = 0; i < json.length; ++i) {
				var sprite = json[i];
				var cache = self._cache[sprite.url];

				cache.pending = false;

				cache.img = img;
				cache.x = sprite.x;
				cache.y = sprite.y;
				cache.width = sprite.width;
				cache.height = sprite.height;

				cache.callback(cache, sprite.url);
			}
		}, false);

		img.addEventListener('error', function() {
			for (var i = 0; i < json.length; ++i) {
				cache.pending = false;

				var sprite = json[i];
				var cache = self._cache[sprite.url];
				
				cache.pending = false;
				cache.error = true;

				cache.callback(null, sprite.url);
			}
		}, false);

		img.src = spritesheetUrl;
	};

	Resources.prototype.image = function(url, callback) {
		var cache = this._cache[url];

		callback = callback || function() {};

		if (typeof(cache) === 'undefined') {
			cache = {};
			cache.callback = Utils.createMulticall();

			this._cache[url] = cache;
		}

		var img = cache.img;

		if (cache.pending) {
			// load already pending, bind the callback
			if (callback) {
				cache.callback.add(callback);
			}
		}
		else if (typeof(img) === 'undefined') {
			// start loading the image
			img = new Image();

			cache.img = img;
			if (callback) {
				cache.callback.add(callback);
			}

			if (typeof(fs) !== 'undefined') {
				fs.readFile(__dirname + url, function(err, data) {
					cache.pending = false;

					if (err) {
						cache.error = true;
						cache.callback(null, url);
					}
					else {
						img.src = data;

						cache.x = 0;
						cache.y = 0;
						cache.width = img.width;
						cache.height = img.height;

						cache.callback(cache, url);
					}
				});
			}
			else {
				cache.pending = true;
				cache.img = img;

				img.addEventListener('load', function() {
					cache.pending = false;

					cache.x = 0;
					cache.y = 0;
					cache.width = img.width;
					cache.height = img.height;

					cache.callback(cache, url);
				}, false);

				img.addEventListener('error', function() {
					cache.pending = false;
					cache.error = true;

					cache.callback(null, url);
				}, false);

				img.src = url;
			}
		}
		else {
			if (cache.error) {
				cache = null;
			}

			// loading already complete, callback immediately
			if (callback) {
				callback(cache, url);
			}
		}

		if (cache && !cache.pending) {
			return cache;
		}

		return null;
	};

	exports.Resources = Resources;
	
} (typeof(exports) !== 'undefined' ? exports : window));
;if (typeof(require) !== 'undefined') {
	var utils = require('./utils.js');

	Utils = utils.Utils;
	Events = utils.Events;
}

(function(exports) {

	var lastId = 0;

	/**
	 * The mixin type that adds behaviours to game objects
	 */
	var Behaviour = Utils.extendTo(Events, function(name, definition, engine) {
		this['super']();

		definition = definition || {};

		var requires = definition.requires;
		var defaults = definition.defaults;
		var listeners = {};
		var methods = {};

		for (var key in definition) {
			if (definition.hasOwnProperty(key)) {
				if (key.indexOf('on') == 0) {
					var ev = key.substring(2);

					listeners[ev] = definition[key];
				}
				else {
					methods[key] = definition[key];
				}
			}
		}

		this._definition = definition;

		this._name = name;
		this._objectListCache = [];
		this._objects = {};
		this._objectsDirty = true;

		this.engine = engine;

		this.requires = requires || [];
		this.defaults = defaults;
		this.listeners = listeners;
		this.methods = methods;

		return this;
	});

	Behaviour.prototype.copy = function(engine) {
		return new Behaviour(this._name, this._definition, engine);
	};

	Behaviour.prototype.applyBehaviour = function(target, init) {
		var methods = this.methods;
		var listeners = this.listeners;

		this._objectsDirty = true;
		this._objects[target.id] = target;

		for (var name in methods) {
			if (methods.hasOwnProperty(name) && !target.hasOwnProperty(name)) {
				target[name] = methods[name];
			}
		}

		target._boundListeners = target._boundListeners || {};

		for (var eventName in listeners) {
			var key = this._name + '.' + eventName;

			if (listeners.hasOwnProperty(eventName)) {
				if (!target._boundListeners[key]) {
					target._boundListeners[key] = true;

					var listener = listeners[eventName];

					// track particular events
					/*
					if (eventName === 'render' || eventName === 'tick') {
						listener = function(listener, behaviourName) {
							return function() {
								var startDate = +new Date();
								var value = listener.apply(this, Array.prototype.slice.call(arguments, 0));
								var endDate = +new Date();

								target.trackEvent(eventName, behaviourName, endDate-startDate);

								return value;
							};
						}(listener, this._name);
					}*/

					target.on(eventName, listener, target);
				}
			}
		}

		if (this.defaults) {
			Utils.applyDefaults(target, this.defaults);
		}

		for (var i = 0, l = this.requires.length; i < l; ++i) {
			var behaviour = this.requires[i];

			if (!target.hasBehaviour(behaviour)) {
				target.addBehaviour(behaviour);
			}
		}

		if (typeof(methods.init) === 'function' && init) {
			methods.init.call(target);
		}

		return this;
	};

	Behaviour.prototype.removeBehaviour = function(target) {
		var methods = this.methods;
		var listeners = this.listeners;

		this._objectsDirty = true;
		delete this._objects[target.id];

		for (var method in methods) {
			if (methods.hasOwnProperty(method)) {
				if (target[method] === methods[method]) {
					delete target[method];
				}
			}
		}

		target._boundListeners = target._boundListeners || {};

		for (var eventName in listeners) {
			var key = this._name + '.' + eventName;
			
			if (listeners.hasOwnProperty(eventName)) {
				if (target._boundListeners[key]) {
					target._boundListeners[key] = false;
					target.off(eventName, listeners[eventName], target);
				}
			}
		}

		if (typeof(methods.destroy) === 'function') {
			methods.destroy.call(target);
		}

		return this;
	};

	Behaviour.prototype.hookupChild = function(child) {
		if (this._objects.hasOwnProperty(child.id)) {
			return;
		}

		this._objectsDirty = true;
		this._objects[child.id] = child;
	};

	Behaviour.prototype.unhookChild = function(child) {
		if (!this._objects.hasOwnProperty(child.id)) {
			return;
		}

		this._objectsDirty = true;
		delete this._objects[child.id];
	};

	Behaviour.prototype.getObjects = function() {
		if (this._objectsDirty) {
			this._objectsDirty = false;
			this._objectListCache = [];

			for (var k in this._objects) {
				if (this._objects.hasOwnProperty(k)) {
					this._objectListCache.push(this._objects[k]);
				}
			}
		}

		return this._objectListCache;
	};

	Behaviour.prototype.getName = function() {
		return this._name;
	};

	/**
	 * The root game object
	 */
	var GameObject = Utils.extendTo(Events, function(behaviours, defaults, engine) {
		this['super']();

		this._behaviours = {};
		this._children = [];
		this._times = {};
		this._updating = false;

		this._pendingRemoves = [];
		this._pendingAdds = [];

		this.engine = engine;

		this.active = true;

		this.id = GameObject.getNextId();
		this.tag = null;

		if (defaults) {
			var savedDefaults = {};

			for (var key in defaults) {
				if (defaults.hasOwnProperty(key)) {
					if (key.indexOf('on') == 0) {
						var ev = key.substring(2);

						this.on(ev, defaults[key]);
					}
					else {
						savedDefaults[key] = defaults[key];
						this[key] = defaults[key];
					}
				}
			}

			this.savedDefaults = savedDefaults;
		}

		this.dx = this.dx || 0;
		this.dy = this.dy || 0;

		this.x = this.x || 0;
		this.y = this.y || 0;

		if (behaviours) {
			for (var i = 0, l = behaviours.length; i < l; ++i) {
				this.addBehaviour(behaviours[i]);
			}
		}

		///////
		this.on('attach', function(engine) {
			var children = this._children;

			// tick all active children
			if (children.length > 0) {
				children = [].concat(children);

				for (var i = 0, l = children.length; i < l; ++i) {
					var child = children[i];

					if (child.engine != engine) {
						child.engine = engine;
						child.trigger('attach', engine);
					}
				}
			}
		});

		this.on('subtick', function(timeStep) {
			var children = this._children;

			this._updating = true;

			var childUpdateStart = +new Date();

			// tick all active children
			if (children.length > 0) {
				children = [].concat(children);

				for (var i = 0, l = children.length; i < l; ++i) {
					var child = children[i];

					if (child.active) {
						child.trigger('subtick', timeStep);
					}
				}
			}

			var childUpdateEnd = +new Date();

			this.trigger('tick', timeStep);

			var updateEnd = +new Date();

			this._updating = false;

			// process deferred adds and removes
			for (var i = 0, l = this._pendingRemoves.length; i < l; ++i) {
				this.removeChild(this._pendingRemoves[i]);
			}

			for (var i = 0, l = this._pendingAdds.length; i < l; ++i) {
				this.addChild(this._pendingAdds[i]);
			}

			this._pendingRemoves = [];
			this._pendingAdds = [];

			if (this.sortOnTick || false) {
				this._children.sort(function(a, b) {
					return ~~a.z - ~~b.z;
				});
			}

			var childOrganzationEnd = +new Date();

			//this.trackTime('Child Update', childUpdateEnd-childUpdateStart);
			//this.trackTime('Update', updateEnd-childUpdateEnd);
		});

		this.on('touchstart', function(x, y, ev) {
			if (this.disabled) {
				return;
			}

			var children = this._children;
			var result = false;

			x -= ~~this.x;
			y -= ~~this.y;

			x /= this.scaleX || 1;
			y /= this.scaleY || 1;

			x -= ~~this.offsetX;
			y -= ~~this.offsetY;
			// pass touches top to bottom
			for (var i = children.length-1; i >= 0; --i) {
				var child = children[i];

				result = child.trigger('touchstart', x, y, ev) || ev.cancelled;

				if (result) {
					ev.cancelled = true;
					break;
				}
			}

			return result;
		});

		this.on('touchmove', function(x, y, ev) {
			if (this.disabled) {
				return;
			}
			
			var children = this._children;
			var result = false;

			x -= ~~this.x;
			y -= ~~this.y;

			x /= this.scaleX || 1;
			y /= this.scaleY || 1;

			x -= ~~this.offsetX;
			y -= ~~this.offsetY;

			// pass touches top to bottom
			for (var i = children.length-1; i >= 0; --i) {
				var child = children[i];

				result = child.trigger('touchmove', x, y, ev) || ev.cancelled;

				if (result) {
					ev.cancelled = true;
					break;
				}
			}

			return result;
		});

		this.on('touchend', function(x, y, ev) {
			if (this.disabled) {
				return;
			}
			
			var children = this._children;
			var result = false;

			x -= ~~this.x;
			y -= ~~this.y;

			x /= this.scaleX || 1;
			y /= this.scaleY || 1;

			x -= ~~this.offsetX;
			y -= ~~this.offsetY;

			// pass touches top to bottom
			for (var i = children.length-1; i >= 0; --i) {
				var child = children[i];

				result = child.trigger('touchend', x, y, ev) || ev.cancelled;

				if (result) {
					ev.cancelled = true;
					break;
				}
			}

			return result;
		});

		this.on('subrender', function(context) {
			if (game.breakOn === this.id) {
				game.breakOn = game.breakOn;
			}

			var parentRenderStart = +new Date();

			var children = this._children;

			var contextSaved = false;
			var x = ~~this.x - ~~this.centerX;
			var y = ~~this.y - ~~this.centerY;
			var offsetX = ~~this.offsetX;
			var offsetY = ~~this.offsetY;

			var oldAlpha;
			var alphaChanged = false;

			var oldComposite;
			var compositeChanged = false;

			if (typeof(this.compositeOperation) !== 'undefined') {
				compositeChanged = true;
				oldComposite = context.globalCompositeOperation || 'source-over';
				context.globalCompositeOperation = this.compositeOperation;
			}

			if (typeof(this.alpha) !== 'undefined' && this.alpha !== 1) {
				alphaChanged = true;
				oldAlpha = context.globalAlpha;
				context.globalAlpha = this.alpha * oldAlpha;
			}

			if (typeof(this.scaleX) !== 'undefined' && this.scaleX !== 1
			 || typeof(this.scaleY) !== 'undefined' && this.scaleY !== 1
			 || typeof(this.rotation) !== 'undefined') {
				if (!contextSaved) {
					contextSaved = true;
					context.save();
				}

				context.translate(x + ~~this.centerX, y + ~~this.centerY);

				if (typeof(this.scaleX) !== 'undefined' && this.scaleX !== 1
				 || typeof(this.scaleY) !== 'undefined' && this.scaleY !== 1) {
					context.scale(
						typeof(this.scaleX) !== 'undefined' ? this.scaleX : 1,
						typeof(this.scaleY) !== 'undefined' ? this.scaleY : 1);
				}

				if (this.rotation) {
					context.rotate(this.rotation);
				}
			}

			if (contextSaved) {
				//context.translate(-x, -y);
				context.translate(-x - ~~this.centerX, -y - ~~this.centerY);
			}

			if (this.clip) {
				if (!contextSaved) {
					contextSaved = true;
					context.save();
				}

				context.beginPath();

				context.rect(~~this.x, ~~this.y, ~~this.width, ~~this.height);

				context.closePath();

				context.clip();
			}

			var parentRenderEnd = +new Date();

			this.trigger('render', context);

			var renderEnd = +new Date();

			if (contextSaved) {
				context.translate(x, y);
			}

			if (children.length > 0) {
				if (!contextSaved) {
					var tx = x + offsetX + ~~this.centerX;
					var ty = y + offsetY + ~~this.centerY;

					if (tx !== 0 || ty !== 0) {
						contextSaved = true;

						context.save();
						context.translate(x + offsetX + ~~this.centerX, y + offsetY + ~~this.centerY);
					}
				}
				else {
					var tx = offsetX + ~~this.centerX;
					var ty = offsetY + ~~this.centerY;

					if (tx !== 0 || ty !== 0) {
						context.translate(offsetX + ~~this.centerX, offsetY + ~~this.centerY);
					}
				}

				children = [].concat(children);

				// render all children
				for (var i = 0, l = children.length; i < l; ++i) {
					var child = children[i];

					var cy = (child.y || 0);
					var cyh = cy + ~~child.height;

					if (this.clip) {
						if (cyh < -offsetY) {
							continue;
						}
						else if (cy > this.height - offsetY) {
							continue;
						}
					}

					child.trigger('subrender', context);
				}
			}

			if (contextSaved) {
				context.restore();
			}

			var childRenderEnd = +new Date();

			if (compositeChanged) {
				context.globalCompositeOperation = 'source-over';
			}

			if (alphaChanged) {
				context.globalAlpha = oldAlpha;
			}

			//this.trackTime('Render Setup', parentRenderEnd-parentRenderStart);
			//this.trackTime('Render', renderEnd-parentRenderEnd);
			//this.trackTime('Child Render', childRenderEnd-renderEnd);
		});

		this.on('gizmos', function(context) {
			var children = this._children;

			if (children.length > 0) {
				var contextSaved = false;
				var x = ~~this.x;
				var y = ~~this.y;
				var centerX = ~~this.centerX;
				var centerY = ~~this.centerY;

				if (~~x !== 0 || ~~y !== 0) {
					if (!contextSaved) {
						contextSaved = true;
						context.save();
					}
					
					context.translate(x, y);
				}

				if (this.rotation) {
					if (!contextSaved) {
						contextSaved = true;
						context.save();
					}

					context.rotate(this.rotation);
				}

				// render all children
				for (var i = 0, l = children.length; i < l; ++i) {
					var child = children[i];

					child.trigger('gizmos', context);
				}

				if (contextSaved) {
					context.restore();
				}
			}
		});

		this.on('gizmos', function(ctx) {

			ctx.strokeStyle = '#0000ff';
			ctx.lineWidth = 1;

			if (typeof(this.x) !== 'undefined' && typeof(this.y) !== 'undefined' && this.width && this.height) {
				var x = this.x;
				var y = this.y;

				if (this.rotation) {
					ctx.save();
					ctx.translate(x, y);
					ctx.rotate(this.rotation);

					x = 0;
					y = 0;
				}

				if (this.centerX) {
					x -= this.centerX;
				}

				if (this.centerY) {
					y -= this.centerY;
				}

				ctx.strokeRect(x, y, this.width, this.height);

				if (this.rotation) {
					ctx.restore();
				}
				
				ctx.fillStyle = '#0000ff';
				ctx.strokeStyle = '#0000ff';
				ctx.lineWidth = 2;

				ctx.beginPath();

				ctx.arc(this.x, this.y, 4, 0, 2 * Math.PI, false)
				ctx.fill();

				ctx.beginPath();
				ctx.moveTo(this.x, this.y);
				ctx.lineTo(this.x + this.dx / 20, this.y + this.dy / 20);
				ctx.closePath();
				ctx.stroke();

				ctx.closePath();

				ctx.font = '24px sans-serif';

				ctx.fillText(this.id, this.x - ~~this.centerX + 10, this.y - ~~this.centerY + 30);
			}
		});

		if (defaults && typeof(defaults.init) === 'function') {
			defaults.init.call(this);
		}

		return this;
	});

	GameObject.prototype.trackEvent = function(eventName, behaviourName, delta) {
		var target = [behaviourName, eventName].join('.');
		var current = this._times[target];
		var value = delta;

		if (current) {
			value = (current + delta)/2;
		}

		this._times[target] = value;
	};

	GameObject.prototype.trackTime = function(target, delta) {
		var current = this._times[target];
		var value = delta;

		if (current) {
			value = (current + delta)/2;
		}

		this._times[target] = value;
	};

	GameObject.prototype.boundingBox = function() {
		var x = ~~this.x - ~~this.centerX;
		var y = ~~this.y - ~~this.centerY;

		return {
			x: x, y: y, width: this.width, height: this.height
		};
	};

	GameObject.prototype.debugLog = function(parent, allKeys) {
		var result = '';

		function sum(array) {
			array = array || [];

			var sum = 0;

			for (var i = 0; i < array.length; ++i) {
				sum += array[i];
			}

			return sum;
		}

		function average(array) {
			return array.length > 0 ? sum(array) / array.length : 0;
		}

		function round(value, precision) {
			value *= Math.pow(10, precision);
			value = Math.round(value);
			value /= Math.pow(10, precision);

			return value;
		}

		var row = [];
		var name = this.tag ? this.tag + '(' + this.id + ')' : this.id;

		allKeys = allKeys || [];

		var keys = [];

		for (var k in this._times) {
			if (this._times.hasOwnProperty(k)) {
				keys.push(k);

				var found = false;

				for (var i = 0; i < allKeys.length; ++i) {
					if (allKeys[i] === k) {
						found = true;
						break;
					}
				}

				if (!found) {
					allKeys.push(k);
				}
			}
		}

		row.push(name);
		row.push(parent || '');

		for (var i = 0; i < allKeys.length; ++i) {
			if (this._times.hasOwnProperty(keys[i])) {
				row.push(round(this._times[keys[i]], 3));
			}
			else {
				row.push('');
			}
		}

		result += (row.join('\t')) + '\n';

		var children = this._children;

		// tick all active children
		if (children.length > 0) {
			children = [].concat(children);

			for (var i = 0, l = children.length; i < l; ++i) {
				var child = children[i];

				result += child.debugLog(name, allKeys);
			}
		}

		if (!parent) {
			var header = ['Name', 'Parent'];

			for (var i = 0; i < allKeys.length; ++i) {
				header.push(allKeys[i]);
			}

			result = (header.join('\t')) + '\n' + result;
		}

		return result;
	};

	GameObject.prototype.debugLog2 = function(parent) {
		parent = parent || '';

		function average(array) {
			array = array || [];

			var sum = 0;

			for (var i = 0; i < array.length; ++i) {
				sum += array[i];
			}

			return array.length > 0 ? sum / array.length : 0;
		}

		function round(value, precision) {
			value *= Math.pow(10, precision);
			value = Math.round(value);
			value /= Math.pow(10, precision);

			return value;
		}

		var row = [];
		var name = this.tag ? this.tag + '(' + this.id + ')' : this.id;

		var keys = [];

		for (var k in this._times) {
			if (this._times.hasOwnProperty(k)) {
				keys.push(k);
			}
		}

		if (!parent) {
			var header = ['Name', 'Parent'];

			for (var i = 0; i < keys.length; ++i) {
				header.push(keys[i]);
			}

			console.log(header.join('\t'));
		}

		row.push(name);
		row.push(parent);

		for (var i = 0; i < keys.length; ++i) {
			row.push(round(this._times[keys[i]], 3));
		}

		console.log(row.join('\t'));

		var children = this._children;

		// tick all active children
		if (children.length > 0) {
			children = [].concat(children);

			for (var i = 0, l = children.length; i < l; ++i) {
				var child = children[i];

				child.debugLog(name);
			}
		}
	};

	GameObject.prototype.addModal = function(modal) {
		var self = this;

		self.disabled = true;

		modal.on('completed', function() {
			self.disabled = false;
			modal.remove();
		});

		this.parent.addChild(modal);
	};

	GameObject.getNextId = function() {
		return Utils.toRadix(++lastId, 36);
	};

	GameObject.prototype.setTag = function(tags) {
		this.tag = tag;

		return this;
	};

	GameObject.prototype.getTag = function() {
		return this.tag || this.id;
	};

	GameObject.prototype.addBehaviour = function (behaviourName) {
		var behaviour;

		if (''+behaviourName === behaviourName) {
			behaviour = this.engine.behaviour(behaviourName);
		}
		else {
			behaviour = behaviourName;
		}

		var name = behaviour.getName();

		if (!this._behaviours.hasOwnProperty(name)) {
			this._behaviours[name] = behaviour;

			// bind the behaviour
			behaviour.applyBehaviour(this, true);
		}

		return this;
	};

	GameObject.prototype.removeBehaviour = function (behaviourName) {
		var behaviour;

		if (''+behaviourName !== behaviourName) {
			behaviourName = behaviourName.getName();
		}

		if (this._behaviours.hasOwnProperty(behaviourName)) {
			behaviour = this._behaviours[behaviourName];

			// unbind the behaviour
			behaviour.removeBehaviour(this);

			delete this._behaviours[behaviourName];
		}

		return this;
	};

	GameObject.prototype.hasBehaviour = function (behaviourName) {
		return this._behaviours.hasOwnProperty(behaviourName);
	};

	GameObject.prototype.getBehaviours = function() {
		var keys = [];

		for (var k in this._behaviours) {
			if (this._behaviours.hasOwnProperty(k)) {
				keys.push(k);
			}
		}
		
		return keys;
	};

	GameObject.prototype.remove = function() {
		if (this.parent) {
			this.parent.removeChild(this, true);
		}
	};

	GameObject.prototype.removeAllChildren = function() {
		var children = [].concat(this._children);

		for (var i = 0; i < children.length; ++i) {
			children[i].remove();
		}
	};

	GameObject.prototype.bringToFront = function() {

		if (this.parent) {
			var parent = this.parent;

			parent.removeChild(this, false);
			parent.addChild(this);
		}
	};

	GameObject.prototype.addChild = function(child) {
		if (child.parent) {
			// unbind from existing parent
			child.parent.removeChild(child, false);
		}

		child.parent = this;

		this._children.push(child);

		if (!child.engine && this.engine) {
			for (var k in child._behaviours) {
				var behaviour = child._behaviours[k];

				behaviour.hookupChild(child);
			}

			child.engine = this.engine;
			child.trigger('attach', this.engine);
		}
		if (child.engine) {
			child.engine._addObject(child);
		}

		this.trigger('childAdded', child);

		return this;
	};

	GameObject.prototype.indexOfChild = function(child) {
		for (var i = 0; i < this._children.length; ++i) {
			if (this._children[i] === child) {
				return i;
			}
		}

		return null;
	};

	GameObject.prototype.insertChild = function(child, index) {
		if (child.parent) {
			// unbind from existing parent
			child.parent.removeChild(child, false);
		}

		child.parent = this;

		this._children.splice(index, 0, child);

		if (!child.engine && this.engine) {
			child.engine = this.engine;
			child.trigger('attach', this.engine);
		}
		if (child.engine) {
			child.engine._addObject(child);
		}

		this.trigger('childAdded', child);

		return this;
	};

	GameObject.prototype.children = function() {
		return this._children;
	};

	GameObject.prototype.removeChild = function(child, engineRemove) {
		if (child.parent !== this) {
			// child not parented by this object
			return;
		}

		child.parent = null;

		Utils.removeElement(this._children, child);

		if (child.engine && engineRemove) {
			child.engine.removeObject(child);

			var children = [].concat(child._children);

			for (var i = 0, l = children.length; i < l; ++i) {
				child.removeChild(children[i], engineRemove);
			}

			child._children = [];

			for (var k in child._behaviours) {
				var behaviour = child._behaviours[k];

				behaviour.unhookChild(child);
				behaviour.removeBehaviour(child);
			}
		}

		this.trigger('childRemoved', child);

		return this;
	};

	GameObject.prototype.delay = function(duration, after) {
		var self = this;
		var amount = 0;
		var finished = false;

		function tick(delta) {
			if (!finished) {
				amount += delta;

				if (amount >= duration) {
					finished = true;
					amount = duration;
				}

				if (finished) {
					self.off('tick', tick);

					if (after) {
						after.call(self);
					}
				}
			}
		}

		this.on('tick', tick);
	};

	GameObject.prototype.ease = function(to, duration, easing, after) {
		var self = this;
		var amount = 0;
		var finished = false;
		var assigner = Utils.ease(this, to || this.savedDefaults);

		easing = easing || Easing.easeLinear;

		function tick(delta) {
			if (!finished) {
				amount += delta;

				if (amount >= duration) {
					finished = true;
					amount = duration;
				}

				var scaledAmount = amount / duration;

				scaledAmount = Math.min(Math.max(scaledAmount, 0), 1);

				var easeAmount = easing(scaledAmount);

				assigner(self, easeAmount);

				if (finished) {
					self.off('tick', tick);
					if (after) {
						after.call(self);
					}
				}
			}
		}

		this.on('tick', tick);
	};

	exports.Behaviour = Behaviour;
	exports.GameObject = GameObject;
	
} (typeof(exports) !== 'undefined' ? exports : window));
;(function(exports) {

	var Mass = new Behaviour('mass', {
		ontick: function(delta) {
			this.dy += this.engine.gravity * delta;

			this.x += this.dx * delta;
			this.y += this.dy * delta;
		},

		ongizmos: function(ctx) {
		},

		applyForce: function(x, y) {
			this.dx += x;
			this.dy += y;
		}
	});

	exports.Mass = Mass;

}(typeof(exports) !== 'undefined' ? exports : window));
;(function(exports) {

	var Accelerometer = new Behaviour('accelerometer', {
		ontick: function(delta) {
			if (this.engine.accelerationX || this.engine.accelerationY || this.engine.accelerationZ) {
				this.accelerationX = this.engine.accelerationX;
				this.accelerationY = this.engine.accelerationY;
				this.accelerationZ = this.engine.accelerationZ;

				this.smoothAccelerationX = this.engine.smoothAccelerationX;
				this.smoothAccelerationY = this.engine.smoothAccelerationY;
				this.smoothAccelerationZ = this.engine.smoothAccelerationZ;
			}
		}
	});

	var Orientation = new Behaviour('orientation', {
		ontick: function(delta) {
			if (this.engine.orientation) {
				this.orientation = {
					alpha: this.engine.orientation.alpha,
					beta: this.engine.orientation.beta,
					gamma: this.engine.orientation.gamma
				};
			}
		}
	});

	exports.Accelerometer = Accelerometer;
	exports.Orientation = Orientation;

}(typeof(exports) !== 'undefined' ? exports : window));
;(function(exports) {

	var FUDGE_AMOUNT = 80;

	var GameButton = new Behaviour('button', {
		requires: ['sprite'],
		
		init: function() {
			this.updateState();
		},

		isInBounds: function(x, y, fudge) {
			var thisx = this.x - ~~this.centerX - (fudge ? FUDGE_AMOUNT : 0);
			var thisy = this.y - ~~this.centerY - (fudge ? FUDGE_AMOUNT : 0);

			var dx = x - thisx;
			var dy = y - thisy;

			if (dx >= 0 && dx < ~~this.width + (fudge ? 2*FUDGE_AMOUNT : 0)
			 && dy >= 0 && dy < ~~this.height + (fudge ? 2*FUDGE_AMOUNT : 0)) {
			 	return true;
			}

			return false;
		},

		updateState: function() {
			var wasDown = this.wasDown;

			this.wasDown = this.isDown;
			this.url = this.isDown ? this.pressedUrl : this.unpressedUrl;

			if (!!wasDown != !!this.isDown) {
				this.trigger('stateChanged', this.isDown);
			}
		},

		ontouchstart: function(x, y) {
			if (this.disabled) {
				return;
			}

			if (this.isInBounds(x, y)) {
				this.isDown = true;
				this.touched = true;
			}
			else {
				this.isDown = false;
				this.touched = false;
			}

			this.updateState();

			return this.isDown;
		},

		ontouchmove: function(x, y) {
			if (this.disabled) {
				return;
			}
			
			if (!this.isInBounds(x, y, true)) {
				this.isDown = false;
			}
			else if (this.touched) {
				this.isDown = true;
			}

			this.updateState();

			return this.touched;
		},

		ontouchend: function(x, y) {
			var wasTouched = this.touched;
			
			this.touched = false;

			if (!this.isInBounds(x, y, true)) {
				this.isDown = false;
			}

			if (this.isDown) {
				this.isDown = false;

				this.updateState();

				if (!this.disabled) {
					this.trigger('click', x, y);
				}
			}

			return wasTouched;
		}
	});

	exports.GameButton = GameButton;

}(typeof(exports) !== 'undefined' ? exports : window));
;(function(exports) {

	var Sprite = new Behaviour('sprite', {
		defaults: {
			scaleX: 1,
			scaleY: 1
		},
		
		init: function() {
			var self = this;

			if (this.align) {
				this.on('loaded', function() {
					if (this.align === 'center') {
						self.centerX = self.width / 2;
						self.centerY = self.height / 2;
					}
				});
			}
		},

		onrender: function(ctx) {
			var img;
			var self = this;

			if (this.url && (!this.cachedImage || this.cachedUrl !== this.url)) {
				var found = false;

				this.engine.resources.image(this.url, function(cache, url) {
					if (cache) {
						found = true;
						self.cachedImage = cache;
						self.cachedUrl = url;

						self.width = self.width || cache.width;
						self.height = self.height || cache.height;

						self.srcwidth = cache.width;
						self.srcheight = cache.height;

						self.trigger('loaded');
					}
				});
			}

			if (this.cachedImage) {
				img = this.cachedImage.img;
			}
			
			var x = ~~(this.x + 0.5);
			var y = ~~(this.y + 0.5);

			if (img) {
				var width = this.width || (this.res ? this.res.width : 0);
				var height = this.height || (this.res ? this.res.height : 0);

				if (this.crop) {
					w = this.width;
					h = this.height;
				}
				else {
					w = this.srcwidth;
					h = this.srcheight;
				}

				ctx.drawImage(img,
					(this.offsetX || 0) + this.cachedImage.x, (this.offsetY || 0) + this.cachedImage.y,
					w, h,
					x-~~this.centerX, y-~~this.centerY,
					width, height);
			}
		}
	});

	exports.Sprite = Sprite;

}(typeof(exports) !== 'undefined' ? exports : window));
;(function(exports) {
	var Text = new Behaviour('text', {
		defaults: {
			scaleX: 1, scaleY: 1, rotation: 0,
			align: 'left'
		},
		setText: function(text) {
			this.text = text;
		},

		getLetterUrl: function(letter) {
			return letter + '.png';
		},

		getKerning: function(letter) {
			return ~~this.kerning;
		},

		transformLetter: function(letter) {
			if (/[A-Z]/.test(letter)) {
				letter = 'u' + letter.toLowerCase();
			}

			switch (letter) {
				case '!':
					return 'exclamation';
				case ':':
					return 'colon';
				case '.':
					return 'period';
				case ',':
					return 'comma';
				case '-':
					return 'hyphen';
				case ' ':
					return 'space';
				default:
					return letter;
			}
		},

		measure: function() {
			var w = 0;
			var h = 0;
			var cacheable = true;

			var period = this.getLetterUrl('period');
			var periodKerning = this.getKerning('period');

			var ellipsisWidth = (period.width || 0) * 3 + periodKerning * 3;

			var targetWidth = this.fixedWidth ? this.fixedWidth : Number.MAX_VALUE;
			var targetEllipsisWidth = this.fixedWidth ? this.fixedWidth - ellipsisWidth : Number.MAX_VALUE;

			var ellipsisIndex = -1;

			this.ellipsized = false;
			this.ellipsisLength = 0;

			for (var i = 0, l = this.text.length; i < l; ++i) {
				var letter = this.transformLetter(this.text[i]);
				var letterUrl = this.getLetterUrl(letter);

				var img = null;
				var skipped = false;

				if (letter === 'space') {
					skipped = true;
					w += this.getSpaceSize ? this.getSpaceSize() : 0;
				}
				else {
					img = this.engine.resources.image(letterUrl);
				}

				if (img) {
					w += img.width;

					if (i !== this.text.length-1) {
						w += this.getKerning(letter);
					}

					h = Math.max(img.height, h);
				}
				else {
					w += this.getKerning(letter);

					if (!skipped) {
						cacheable = false;
					}
				}

				if (ellipsisIndex < 0 && w >= targetEllipsisWidth) {
					ellipsisIndex = i-1;
					targetEllipsisWidth = w;
				}

				if (w > targetWidth) {
					this.ellipsized = true;
					this.ellipsisLength = ellipsisIndex;

					w = targetEllipsisWidth;
					break;
				}
			}

			if (cacheable) {
				this.measuredText = this.text;
			}

			this.measuredWidth = w;
			this.height = h;
			
			this.trigger('textchanged');

			return {
				width: this.measuredWidth,
				height: this.height
			};
		},

		onrender: function(ctx) {
			var x = ~~(this.x + 0.5);
			var y = ~~(this.y + 0.5);
			var xoffset = 0;

			if (this.measuredText !== this.text && typeof(this.align) !== 'undefined') {
				this.measure();
			}

			var startx = x;

			if (''+this.text !== this.text) {
				return;
			}

			if (this.align === 'right') {
				startx = x - this.measuredWidth;
				this.centerX = this.measuredWidth;
			}
			else if (this.align === 'center') {
				startx = x - this.measuredWidth / 2;
				this.centerX = this.measuredWidth / 2;
			}

			this.width = this.measuredWidth;

			var l = this.ellipsized ? this.ellipsisLength : this.text.length;

			for (var i = 0; i < l; ++i) {
				var letter = this.text[i];

				letter = this.transformLetter(letter);

				if (letter === 'space') {
					xoffset += this.getSpaceSize ? this.getSpaceSize() : 0;
				}

				var img = this.engine.resources.image(this.getLetterUrl(letter));

				if (!img) {
					xoffset += this.getKerning(letter);
					continue;
				}

				ctx.drawImage(img.img,
					img.x, img.y,
					img.width, img.height,
					startx + xoffset, y,
					img.width, img.height);

				xoffset += img.width;
				xoffset += this.getKerning(letter);
			}

			if (this.ellipsized) {
				for (var i = 0; i < 3; ++i) {
					var letter = 'period';

					letter = this.transformLetter(letter);
					
					var img = this.engine.resources.image(this.getLetterUrl(letter));

					if (!img) {
						xoffset += this.getKerning(letter);
						continue;
					}

					ctx.drawImage(img.img,
						img.x, img.y,
						img.width, img.height,
						startx + xoffset, y,
						img.width, img.height);

					xoffset += img.width;
					xoffset += this.getKerning(letter);
				}
			}
		}
	});

	var CanvasText = new Behaviour('canvas-text', {
		defaults: {
			scaleX: 1, scaleY: 1, rotation: 0
		},
		setText: function(text) {
			this.text = text;
		},
		measure: function(ctx) {
			var w = 0;
			var h = 0;

			if (!ctx && document) {
				ctx = document.createElement('canvas').getContext('2d');
			}

			if (this.font) {
				ctx.font = this.font;
			}

			var metrics = ctx.measureText(this.text);

			this.measuredText = this.text;
			this.measuredWidth = metrics.width;
			this.height = metrics.height;

			this.trigger('textchanged');

			return {
				width: this.measuredWidth,
				height: this.height
			};
		},

		onrender: function(ctx) {
			var x = ~~(this.x + 0.5);
			var y = ~~(this.y + 0.5) + ~~this.height;
			var xoffset = 0;

			if (this.font) {
				ctx.font = this.font;
			}

			if (this.color) {
				ctx.fillStyle = this.color;
			}

			if (this.measuredText !== this.text) {
				this.measure(ctx);
			}

			var startx = x;

			if (''+this.text !== this.text) {
				return;
			}

			if (this.align === 'right') {
				startx = x - this.measuredWidth;
				this.centerX = this.measuredWidth;
			}
			else if (this.align === 'center') {
				startx = x - this.measuredWidth / 2;
				this.centerX = this.measuredWidth / 2;
			}

			this.width = this.measuredWidth;

			if (this.strokeStyle) {
				ctx.lineWidth = 6;
				ctx.strokeStyle = this.strokeStyle;
				ctx.strokeText(this.text, startx, y);
			}

			ctx.fillText(this.text, startx, y);
		}
	});

	exports.CanvasText = CanvasText;
	exports.Text = Text;

}(typeof(exports) !== 'undefined' ? exports : window));
;(function(exports) {

	function handleCollisions(collider, delta) {
		var objects = collider.getObjects();

		for (var i = 0, l = objects.length; i < l; ++i) {
			var o = objects[i];

			o.collided = false;
		 	o.collisions = {};
		}

		for (var i = 0, l = objects.length; i < l; ++i) {
			var o1 = objects[i];
			var box = o1.getBoundingBox();

			for (var j = i+1; j < l; ++j) {
				var o = objects[j];

				if (o === o1) {
					// skip collisions with self
					continue;
				}
				else if (!o1.collidesWith(o) || !o.collidesWith(o1)) {
					// skip non-colliding types
					continue;
				}
				else if (!o1.collisions.hasOwnProperty(o.id)) {
					var otherBox = o.getBoundingBox();

					if (o1.checkAABBIntersection(box, otherBox)
					 || o1.checkAABBIntersection(otherBox, box)) {
					 	o1.collisions[o.id] = o;
					 	o.collisions[o1.id] = o1;
					}
				}
			}
		}

		for (var i = 0, l = objects.length; i < l; ++i) {
			var o = objects[i];

			for (var j in o.collisions) {
				o.collided = true;

				if (o.collisions.hasOwnProperty(j)) {
					o.trigger('collision', o.collisions[j]);
				}
			}
		}
	}

	var Collider = new Behaviour('collider', {
		ongizmos: function(ctx) {
			var box = this.getBoundingBox();

			if (this.collided) {
				ctx.strokeStyle = '#ff0000';
				ctx.lineWidth = 4;
			}
			else {
				ctx.strokeStyle = '#00ff00';
				ctx.lineWidth = 2;
			}

			ctx.strokeRect(box.x, box.y, box.width, box.height);
		},

		checkAABBIntersection: function(a, b) {
			var bx = b.x, bxw = b.x + b.width;
			var by = b.y, byh = b.y + b.height;

			var points = [
				[a.x, a.y],
				[a.x+a.width, a.y],
				[a.x, a.y+a.height],
				[a.x+a.width, a.y+a.height]
			];

			for (var i = 0; i < 4; ++i) {
				var p = points[i];
				var px = p[0];
				var py = p[1];

				if (px >= bx && px <= bxw && py >= by && py <= byh) {
					return true;
				}
			}

			return false;
		},

		getBoundingBox: function() {
			var x = ~~this.x - ~~this.centerX;
			var y = ~~this.y - ~~this.centerY;

			return {
				x: x, y: y, width: this.width, height: this.height
			}
		},

		collidesWith: function(other) {
			return true;
		}
	});

	Collider.handleCollisions = handleCollisions;

	exports.Collider = Collider;

}(typeof(exports) !== 'undefined' ? exports : window));
;(function(exports) {

	var Transition = {};

	Transition.fadeInOut = function fadeInOut(scene, options) {
		return function(callback) {
			var direction = options.direction || 'out';
			var duration = options.duration || 0.5;
			var color = options.color || '#000';

			var overlay = game.object({
				alpha: (direction === 'in' ? 1 : 0),
				x: 0,
				y: 0,
				width: scene.engine.view.width,
				height: scene.engine.view.height,
				onrender: function(ctx) {
					ctx.fillStyle = color;
					ctx.fillRect(this.x, this.y, this.width, this.height);
				}
			});

			overlay.ease({alpha: 1-overlay.alpha},
				duration,
				overlay.alpha === 0 ? Easing.easeOut : Easing.easeIn,
				function() {
					callback();
					overlay.remove();
			});

			scene.addChild(overlay);
		};
	}

	var Scene = new Behaviour('scene', {
		onrender: function(ctx) {
			if (this.background) {
				ctx.fillStyle = this.background;
				ctx.fillRect(0, 0, this.engine.view.width, this.engine.view.height);
			}
		},
		onentering: function(enterCallback) {
			var self = this;

			function callback() {
				self.trigger('enter');

				enterCallback();
			}

			var transitionFn = this.transitionIn();

			if (transitionFn) {
				transitionFn.call(this, callback);
			}
			else {
				callback();
			}
		},
		onleaving: function(leaveCallback) {
			var self = this;

			self.leaving = true;

			function callback() {
				self.trigger('leave');

				leaveCallback();

				self.leaving = true;
			}

			var transitionFn = this.transitionOut();

			if (transitionFn) {
				transitionFn.call(this, callback);
			}
			else {
				callback();
			}
		},
		transitionIn: function() {
			return Transition.fadeInOut(this, {
				direction: 'in',
				color: '#000',
				duration: 0.5
			});
		},
		transitionOut: function() {
			return Transition.fadeInOut(this, {
				direction: 'out',
				color: '#000',
				duration: 0.5
			});
		},
		removeFromStack: function() {
			if (this.engine) {
				this.engine.removeScene(this);
			}
		}
	});

	exports.Scene = Scene;
	exports.Transition = Transition;

}(typeof(exports) !== 'undefined' ? exports : window));
;(function(exports) {

	var DOUBLE_CLICK_THRESHOLD = 200;

	var Scroller = new Behaviour('scroller', {

		defaults: {
			offsetX: 0,
			offsetY: 0,
			clip: true
		},

		init: function() {
			this._lastDownEvent = null;
			this._lastTouchEvent = null;
			this._velocity = null;
		},

		ontick: function() {
			var reset = false;

			this.contentWidth = 0;
			this.contentHeight = 0;

			for (var i = 0; i < this._children.length; ++i) {
				var child = this._children[i];

				var xw = child.x - ~~child.centerX + ~~child.width;
				var yh = child.y - ~~child.centerY + ~~child.height;

				this.contentWidth = Math.max(this.contentWidth, xw);
				this.contentHeight = Math.max(this.contentHeight, yh);
			}

			if (this._targetOffsetX && this.offsetX !== this._targetOffsetX) {
				reset = true;

				if (Math.abs(this.offsetX-this._targetOffsetX) < 1) {
					this.offsetX = this._targetOffsetX;
				}
				else {
					this.offsetX = this.offsetX + (this._targetOffsetX - this.offsetX) / 8;
				}
			}

			if (this._targetOffsetY && this.offsetY !== this._targetOffsetY) {
				reset = true;

				if (Math.abs(this.offsetY-this._targetOffsetY) < 1) {
					this.offsetY = this._targetOffsetY;
				}
				else {
					this.offsetY = this.offsetY + (this._targetOffsetY - this.offsetY) / 8;
				}
			}

			if (reset) {
				this.updateOffsets(this.offsetX, this.offsetY);
			}
		},

		isInBounds: function(x, y) {
			var thisx = this.x - ~~this.centerX;
			var thisy = this.y - ~~this.centerY;

			var parent = this.parent;

			while (parent) {
				thisx += parent.x;
				thisy += parent.y;

				parent = parent.parent;
			}

			var dx = x - thisx;
			var dy = y - thisy;

			if (dx >= 0 && dx < ~~this.width
			 && dy >= 0 && dy < ~~this.height) {
			 	return true;
			}

			return false;
		},

		boundedOffsets: function(x, y) {
			var sx = this.scaleX || 1;
			var sy = this.scaleY || 1;

			x = Math.max((this.width-this.contentWidth) * sx, x);
			y = Math.max((this.height-this.contentHeight) * sy, y);

			x = Math.min(0, x);
			y = Math.min(0, y);

			this.trigger('scrollChanged', x, y);

			return [x, y];
		},

		updateOffsets: function(x, y, animate) {
			var offsets = this.boundedOffsets(x, y);

			this.offsetX = offsets[0];
			this.offsetY = offsets[1];
		},

		_markTouchEvent: function(x, y) {
			var now = +new Date();

			if (this._lastTouchEvent) {
				var dt = now-this._lastTouchEvent.ts;

				var dx = (this._lastTouchEvent.x - x);
				var dy = (this._lastTouchEvent.y - y);

				dt = dt || 1;
				dt /= 2;

				var oldVelocity = this._velocity;

				this._velocity = {
					x: dx / dt,
					y: dy / dt
				};

				if (oldVelocity) {
					this._velocity = {
						x: (this._velocity.x + oldVelocity.y) / 2,
						y: (this._velocity.y + oldVelocity.y) / 2,
					}
				}
			}

			this._lastTouchEvent = {x: x, y: y, ts: now};
		},

		ontouchstart: function(x, y, ev) {
			if (ev.cancelled) {
				return;
			}

			this._velocity = null;
			this._lastTouchEvent = null;
			this._markTouchEvent(x, y);

			var now = +new Date();

			if (this._lastDownEvent) {
				var delta = (now - this._lastDownEvent);
				if (delta < DOUBLE_CLICK_THRESHOLD) {
					this.trigger('doubletap', x, y);
					this._lastDownEvent = null;
					return;
				}
			}

			this._lastDownEvent = now;

			if (this.isInBounds(x, y)) {
				this.isDown = true;
				this.touched = true;

				this.initialX = x;
				this.initialY = y;
				this.initialOffsetX = ~~this.offsetX;
				this.initialOffsetY = ~~this.offsetY;
			}
			else {
				this.isDown = false;
				this.touched = false;
			}
		},

		ontouchmove: function(x, y, ev) {
			if (ev.cancelled) {
				return;
			}

			this._markTouchEvent(x, y);
			
			if (this.isDown) {
				this.updateOffsets((x - this.initialX) + this.initialOffsetX, (y - this.initialY) + this.initialOffsetY);
			}
		},

		ontouchend: function(x, y, ev) {
			if (ev.cancelled) {
				return;
			}

			this._markTouchEvent(x, y);
			
			if (this.isDown) {
				this.updateOffsets((x - this.initialX) + this.initialOffsetX, (y - this.initialY) + this.initialOffsetY);

				if (this._velocity) {
					var offsets = this.boundedOffsets(
						this.offsetX - 100 * this._velocity.x,
						this.offsetY - 100 * this._velocity.y);

					this._targetOffsetX = offsets[0];
					this._targetOffsetY = offsets[1];
				}
			}

			this.touched = false;
			this.isDown = false;
		}
	});

	exports.Scroller = Scroller;

}(typeof(exports) !== 'undefined' ? exports : window));
;var GameObject;
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
;Game.DEFAULT_BEHAVIOURS = [
	Sprite,
	CanvasText,
	Text,
	Mass,
	Collider,
	Accelerometer,
	Orientation,
	Scene,
	Scroller,
	GameButton,
];
