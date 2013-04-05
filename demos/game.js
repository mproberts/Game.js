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

	Utils.extendTo = function(base, ctor) {
		function dummy() {
		}

		function clzz() {
			var result;
			var old = this.super;

			this.super = base;
			result = ctor.apply(this, arguments);

			if (old) {
				this.super = old;
			}

			return result;
		}

		clzz.toString = function toString() {
			return ctor.toString.call(this);
		};

		dummy.prototype = base.prototype;
		dummy.prototype.constructor = base;

		clzz.prototype = new dummy();
		clzz.prototype.constructor = clzz;

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
			str.replace('(', '');
			str.replace(')', '');

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

	for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
		window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
		window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
		                           || window[vendors[x]+'CancelRequestAnimationFrame'];
	}

	// use setTimeout if all else fails
	if (!window.requestAnimationFrame) {
		window.requestAnimationFrame = function(callback, element) {
			var currTime = Date.now();
			var timeToCall = Math.max(0, 17 - (currTime - lastTime));
			
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
	var ClockTimer = Utils.extendTo(Timer, function(callback, maxAdvance) {
		this.super(callback);

		this._maxAdvance = maxAdvance || ClockTimer.DEFAULT_MAX_ADVANCE;

		this._running = false;
		this._lastTimestamp = 0;
		this._nextRequest = 0;

		return this;
	});

	ClockTimer.DEFAULT_MAX_ADVANCE = 50;

	ClockTimer.prototype.start = function() {
		if (!this._running) {
			this._running = true;

			this._nextRequest = window.requestAnimationFrame(this._nextFrame.bind(this));
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
					self._nextRequest = window.requestAnimationFrame(self._nextFrame.bind(self));
				}
			});
		}
		else {
			this._lastTimestamp = timestamp;

			if (this._running) {
				this._nextRequest = window.requestAnimationFrame(this._nextFrame.bind(this));
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
	var Behaviour = Utils.extendTo(Events, function(name, definition) {
		this.super();

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

		this._name = name;
		this._objects = [];

		this.requires = requires || [];
		this.defaults = defaults;
		this.listeners = listeners;
		this.methods = methods;

		return this;
	});

	Behaviour.prototype.applyBehaviour = function(target) {
		var methods = this.methods;
		var listeners = this.listeners;

		this._objects.push(target);

		for (var name in methods) {
			if (methods.hasOwnProperty(name) && !target.hasOwnProperty(name)) {
				target[name] = methods[name];
			}
		}

		for (var ev in listeners) {
			if (listeners.hasOwnProperty(ev)) {
				target.on(ev, listeners[ev], target);
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

		if (typeof(methods.init) === 'function') {
			methods.init.call(target);
		}

		return this;
	};

	Behaviour.prototype.removeBehaviour = function(target) {
		var methods = this.methods;
		var listeners = this.listeners;

		Utils.removeElement(this._objects, target);

		for (var method in methods) {
			if (methods.hasOwnProperty(method)) {
				if (target[method] === methods[method]) {
					delete target[method];
				}
			}
		}

		for (var ev in listeners) {
			if (listeners.hasOwnProperty(ev)) {
				target.off(ev, listeners[ev], target);
			}
		}

		if (typeof(methods.destroy) === 'function') {
			methods.destroy.call(target);
		}

		return this;
	};

	Behaviour.prototype.getObjects = function() {
		return this._objects;
	};

	Behaviour.prototype.getName = function() {
		return this._name;
	};

	/**
	 * The root game object
	 */
	var GameObject = Utils.extendTo(Events, function(defaults) {
		this.super();

		this.dx = 0;
		this.dy = 0;

		this._behaviours = {};
		this._children = [];
		this._updating = false;

		this._pendingRemoves = [];
		this._pendingAdds = [];

		this.active = true;
		//this.engine = engine;

		this.id = GameObject.getNextId();
		this.tag = null;

		////////
		var behaviours = Array.prototype.slice.call(arguments, 0);

		if (behaviours.length > 0) {
			var lastComponent = behaviours[behaviours.length-1];

			if (!(lastComponent instanceof Behaviour)) {
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

						this.on(ev, defaults[key]);
					}
					else {
						savedDefaults[key] = defaults[key];
						this[key] = defaults[key];
					}
				}
			}
		}

		for (var i = 0, l = behaviours.length; i < l; ++i) {
			this.addBehaviour(behaviours[i]);
		}

		///////

		this.on('tick', function(timeStep) {
			var children = this._children;

			this._updating = true;

			// tick all active children
			if (children.length > 0) {
				children = [].concat(children);

				for (var i = 0, l = children.length; i < l; ++i) {
					var child = children[i];

					if (child.active) {
						child.trigger('tick', timeStep);
					}
				}
			}

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

			if (this.dx) {
				this.x += this.dx * timeStep;
			}

			if (this.dy) {
				this.y += this.dy * timeStep;
			}

			if (this.sortOnTick || false) {
				this._children.sort(function(a, b) {
					return ~~a.z - ~~b.z;
				});
			}
		});

		this.on('touchstart', function(x, y) {
			var children = this._children;
			var result = false;

			x -= ~~this.x;
			y -= ~~this.y;

			// pass touches top to bottom
			for (var i = children.length-1; i >= 0; --i) {
				var child = children[i];

				result = child.trigger('touchstart', x, y);

				if (result) {
					break;
				}
			}

			return result;
		});

		this.on('touchmove', function(x, y) {
			var children = this._children;
			var result = false;

			x -= ~~this.x;
			y -= ~~this.y;

			// pass touches top to bottom
			for (var i = children.length-1; i >= 0; --i) {
				var child = children[i];

				result = child.trigger('touchmove', x, y);

				if (result) {
					break;
				}
			}

			return result;
		});

		this.on('touchend', function(x, y) {
			var children = this._children;
			var result = false;

			x -= ~~this.x;
			y -= ~~this.y;

			// pass touches top to bottom
			for (var i = children.length-1; i >= 0; --i) {
				var child = children[i];

				result = child.trigger('touchend', x, y);

				if (result) {
					break;
				}
			}

			return result;
		});

		this.on('render', function(context) {
			var children = this._children;

			if (children.length > 0) {
				children = [].concat(children);
				
				var contextSaved = false;
				var x = ~~this.x;
				var y = ~~this.y;

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

				if (typeof(this.scaleX) !== 'undefined' && this.scaleX !== 1
				 || typeof(this.scaleY) !== 'undefined' && this.scaleY !== 1) {
					context.scale(
						typeof(this.scaleX) !== 'undefined' ? this.scaleX : 1,
						typeof(this.scaleY) !== 'undefined' ? this.scaleY : 1);
				}

				// render all children
				for (var i = 0, l = children.length; i < l; ++i) {
					var child = children[i];

					child.trigger('render', context);
				}

				if (contextSaved) {
					context.restore();
				}
			}
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
			}
		});

		return this;
	});

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

	GameObject.prototype.addBehaviour = function (behaviour) {
		var name = behaviour.getName();

		if (!this._behaviours.hasOwnProperty(name)) {
			this._behaviours[name] = behaviour;

			// bind the behaviour
			behaviour.applyBehaviour(this);
		}

		return this;
	};

	GameObject.prototype.removeBehaviour = function (behaviour) {
		var name = behaviour.getName();

		if (this._behaviours.hasOwnProperty(name)) {
			// unbind the behaviour
			behaviour.removeBehaviour(this);

			delete this._behaviours[name];
		}

		return this;
	};

	GameObject.prototype.hasBehaviour = function (behaviour) {
		return this._behaviours.hasOwnProperty(behaviour);
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

	GameObject.prototype.addChild = function(child) {
		if (child.parent) {
			// unbind from existing parent
			child.parent.removeChild(child, false);
		}

		child.parent = this;

		this._children.push(child);

		if (child.engine) {
			child.engine.addObject(child);
		}

		this.trigger('childAdded', child);

		return this;
	};

	GameObject.prototype.insertChild = function(child, index) {
		if (child.parent) {
			// unbind from existing parent
			child.parent.removeChild(child, false);
		}

		child.parent = this;

		this._children.splice(index, 0, child);

		if (child.engine) {
			child.engine.addObject(child);
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
		var assigner = Utils.ease(this, to);

		easing = easing || easeLinear;

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
					if (after) {
						after.call(self);
					}
					self.off('tick', tick);
				}
			}
		}

		this.on('tick', tick);
	};

	exports.Behaviour = Behaviour;
	exports.GameObject = GameObject;
	
} (typeof(exports) !== 'undefined' ? exports : window));
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
		});

		this.resources = new Resources();

		this.timer = timer || new ClockTimer();
		this.timer.setCallback(function(timestep, callback) {
			self._tick(timestep, callback);
		});

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

			var touch = self.touch;

			if (!touch.wasDown && touch.isDown) {
				touch.wasDown = true;
				self.trigger('touchstart', touch.x, touch.y);
			}
			else if (touch.wasDown && touch.isDown) {
				self.trigger('touchmove', touch.x, touch.y);
			}
			else if (touch.wasDown && !touch.isDown) {
				touch.wasDown = false;
				self.trigger('touchend', touch.x, touch.y);
			}
		});
	});

	Game.Object = GameObject;
	Game.Behaviour = Behaviour;

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
		this._display.width = width;
		this._display.height = height;
		this._display.changed = true;

		this._fixViewSize();
	};

	Game.prototype.fps = function() {
		return Math.round(this._fps);
	};

	Game.prototype.setCanvas = function(canvas) {
		var self = this;

		this.canvas = canvas;
		this.context = this.canvas.getContext('2d');

		this._display.changed = true;

		window.onresize = function() {
			if (typeof(document) !== undefined) {
				self.updateDisplay(document.documentElement.offsetWidth, document.documentElement.offsetHeight);
			}
		};

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
			self.touch.wasDown = false;
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
		}
	};

	Game.prototype._tick = function(delta, callback) {
		var self = this;

		var startUpdate = Date.now(), endUpdate;
		var updated = false;

		delta = delta / 1000;

		delta *= self.multiplier || 1;

		this._fixViewSize();

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
					//setTimeout(function() {
					//	this.browser.forceRepaint();
					//}, 0);
				}

				callback();
		}
		else {
			callback();
		}
	};

	Game.prototype._render = function(context) {
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

	Game.prototype.start = function(name, definition) {
		this.timer.start();
	};

	Game.prototype.getObject = function(id) {
		return this._objects[id];
	};

	Game.prototype.addObject = function(object) {
		this._objects[object.id] = object;
	};

	Game.prototype.removeObject = function(object) {
		delete this._objects[object.id];

		var behaviours = object._behaviours;

		for (var k in behaviours) {
			if (behaviours.hasOwnProperty(k)) {
				behaviours[k].removeBehaviour(object);
			}
		}
	};

	exports.Game = Game;
	
} (typeof(exports) !== 'undefined' ? exports : window, typeof(window) !== 'undefined' ? window : exports));
;(function(exports) {

	var Mass = new Behaviour('mass', {
		ontick: function(delta) {
			this.dy += this.engine.gravity * delta;
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
			}
		}
	});

	exports.Accelerometer = Accelerometer;

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

			if (this.url) {
				this.engine.resources.image(this.url, function(cache, url) {
					self.cachedImage = cache;

					self.width = self.width || cache.width;
					self.height = self.height || cache.height;

					self.trigger('loaded');
				});
			}

			if (this.cachedImage) {
				img = this.cachedImage.img;
			}
			
			var x = ~~(this.x + 0.5);
			var y = ~~(this.y + 0.5);

			if (img) {
				var alphaChanged = false;
				var compositeChanged = false;

				if (typeof(this.compositeOperation) !== 'undefined') {
					compositeChanged = true;
					ctx.globalCompositeOperation = this.compositeOperation;
				}

				if (typeof(this.alpha) !== 'undefined' && this.alpha !== 1) {
					alphaChanged = true;
					ctx.globalAlpha = this.alpha;
				}
				else {
					ctx.globalAlpha = 1;
				}

				var width = this.width || (this.res ? this.res.width : 0);
				var height = this.height || (this.res ? this.res.height : 0);

				if (typeof(this.rotation) !== 'undefined' && this.rotation !== 0
				 || typeof(this.scaleX) !== 'undefined' && this.scaleX !== 1
				 || typeof(this.scaleY) !== 'undefined' && this.scaleY !== 1) {
					ctx.save();
					ctx.translate(x, y);

					if (typeof(this.scaleX) !== 'undefined' && this.scaleX !== 1
					 || typeof(this.scaleY) !== 'undefined' && this.scaleY !== 1) {
						ctx.scale(this.scaleX || 1, this.scaleY || 1);
					}

					if (typeof(this.rotation) !== 'undefined' && this.rotation !== 0) {
						ctx.rotate(this.rotation);
					}

					ctx.drawImage(img,
						this.offsetX || 0, this.offsetY || 0,
						width, height,
						-this.centerX, -this.centerY,
						width, height);
					ctx.restore();
				}
				else {
					ctx.drawImage(img,
						this.offsetX || 0, this.offsetY || 0,
						width, height,
						x-~~this.centerX, y-~~this.centerY,
						width, height);
				}

				if (compositeChanged) {
					ctx.globalCompositeOperation = 'source-over';
				}

				if (alphaChanged) {
					ctx.globalAlpha = 1;
				}
			}
		}
	});

	exports.Sprite = Sprite;

}(typeof(exports) !== 'undefined' ? exports : window));
;(function(exports) {
	var Text = new Behaviour('text', {
		defaults: {
			scaleX: 1, scaleY: 1, rotation: 0
		},
		setText: function(text) {
			this.text = text;
		},

		getLetterUrl: function(letter) {
			return letter + '.png';
		},

		transformLetter: function(letter) {
			switch (letter) {
				case ':':
					return 'colon';
				case '.':
					return 'period';
				case ',':
					return 'comma';
				case '-':
					return 'hyphen';
				default:
					return letter;
			}
		},

		measure: function() {
			var w = 0;
			var h = 0;
			var cacheable = true;

			for (var i = 0, l = this.text.length; i < l; ++i) {
				var letter = this.transformLetter(this.text[i]);
				var letterUrl = this.getLetterUrl(letter);

				var img = this.engine.resources.image(letterUrl);

				if (img) {
					w += img.width;
					w += ~~this.kerning;

					h = Math.max(img.height, h);
				}
				else {
					cacheable = false;
				}
			}

			if (cacheable) {
				this.measuredText = this.text;
				this.measuredWidth = w;
				this.height = h;
			}
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

			var transformed = false;

			if (typeof(this.rotation) !== 'undefined' && this.rotation !== 0
			 || typeof(this.scaleX) !== 'undefined' && this.scaleX !== 1
			 || typeof(this.scaleY) !== 'undefined' && this.scaleY !== 1) {
			 	transformed = true;

				ctx.save();
				ctx.translate(startx - ~~this.centerX, y);

				startx = 0;

				if (typeof(this.scaleX) !== 'undefined' && this.scaleX !== 1
				 || typeof(this.scaleY) !== 'undefined' && this.scaleY !== 1) {
					ctx.scale(this.scaleX || 1, this.scaleY || 1);
				}

				if (typeof(this.rotation) !== 'undefined' && this.rotation !== 0) {
					ctx.rotate(this.rotation);
				}
			}

			for (var i = 0, l = this.text.length; i < l; ++i) {
				var letter = this.text[i];

				var img = this.engine.resources.image(this.getLetterUrl(this.transformLetter(letter)));

				if (!img) {
					continue;
				}

				ctx.drawImage(img.img,
					img.x, img.y,
					img.width, img.height,
					startx + xoffset, y,
					img.width, img.height);

				xoffset += img.width;
				xoffset += ~~this.kerning;
			}

			if (transformed) {
				ctx.restore();
			}
		}
	});

	exports.Text = Text;

}(typeof(exports) !== 'undefined' ? exports : window));
;(function(exports) {

	function handleCollisions(delta) {
		var colliders = this.behaviour('collider');
		var objects = colliders.getObjects();

		for (var i = 0, l = objects.length; i < l; ++i) {
			var o1 = objects[i];

		 	o1.collided = false;
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
				else {
					var otherBox = o.getBoundingBox();

					if (o1.checkAABBIntersection(box, otherBox)
					 || o1.checkAABBIntersection(otherBox, box)) {

					 	o1.collided = true;
					 	o.collided = true;

						// collision
						o1.trigger('collision', o);
						o.trigger('collision', o1);
					}
				}
			}
		}
	}

	var Collider = new Behaviour('collider', {
		ongizmos: function(ctx) {
			var box = this.getBoundingBox();

			if (this.collided) {
				ctx.strokeStyle = '#ff0000';
			}
			else {
				ctx.strokeStyle = '#00ff00';
			}

			ctx.lineWidth = 2;

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
