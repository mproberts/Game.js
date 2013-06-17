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
