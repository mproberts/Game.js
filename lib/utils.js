(function(exports) {

	function createMulticall() {
		var listeners = [];
		var contexts = [];

		var fn = function() {
			for (var i = 0, l = listeners.length; i < l; ++i) {
				listeners[i].apply(contexts[i] || this, arguments);
			}
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

	/**
	 * Helper methods for class structure, eventing, etc.
	 */
	var Utils = {};

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

		var listeners = this._bindings[eventName] || createMulticall();

		this._bindings[eventName] = listeners.add(callback, context)

		return this;
	};

	Events.prototype.once = function(eventName, callback, context) {
		if (!this._bindings) {
			this._bindings = {};
		}

		var listeners = this._bindings[eventName] || createMulticall();

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

		if (listeners) {
			listeners.call(this, arguments[1], arguments[2], arguments[3]);
		}

		return this;
	};

	exports.Utils = Utils;
	exports.Events = Events;
	
} (typeof(exports) !== 'undefined' ? exports : window));
