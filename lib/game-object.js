if (typeof(require) !== 'undefined') {
	var utils = require('./utils.js');

	Utils = utils.Utils;
	Events = utils.Events;
}

(function(exports) {

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

		return this;
	};

	Behaviour.prototype.removeBehaviour = function(target) {
		var methods = this.methods;
		var listeners = this.listeners;

		this._objects.remove(target);

		for (var method in methods) {
			if (methods.hasOwnProperty(method)) {
				delete target[method];
			}
		}

		for (var ev in listeners) {
			if (listeners.hasOwnProperty(ev)) {
				target.off(ev, listeners[ev], target);
			}
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
	var GameObject = Utils.extendTo(Events, function(engine) {
		this.super();

		this._behaviours = {};
		this._children = [];
		this.active = true;

		this.engine = engine;

		return this;
	});

	GameObject.prototype.addBehaviour = function (behaviour) {
		if (''+behaviour === behaviour) {
			behaviour = this.engine.getBehaviour(behaviour);
		}

		var name = behaviour.getName();

		if (!this._behaviours.hasOwnProperty(name)) {
			this._behaviours[name] = behaviour;

			// bind the behaviour
			behaviour.applyBehaviour(this);
		}

		return this;
	};

	GameObject.prototype.removeBehaviour = function (behaviour) {
		if (''+behaviour === behaviour) {
			behaviour = this.engine.getBehaviour(behaviour);
		}

		var name = behaviour.getName();

		if (this._behaviours.hasOwnProperty(name)) {
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

	GameObject.prototype.addChild = function(child) {
		this._children.push(child);

		this.trigger('childAdded', child);

		return this;
	};

	GameObject.prototype.removeChild = function(child) {
		this._children.remove(child);

		this.trigger('childRemoved', child);

		return this;
	};

	exports.Behaviour = Behaviour;
	exports.GameObject = GameObject;
	
} (typeof(exports) !== undefined ? exports : window));
