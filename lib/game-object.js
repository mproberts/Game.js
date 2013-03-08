if (typeof(require) !== 'undefined') {
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
	var GameObject = Utils.extendTo(Events, function(engine) {
		this.super();

		this._behaviours = {};
		this._children = [];
		this._updating = false;

		this._pendingRemoves = [];
		this._pendingAdds = [];

		this.active = true;
		this.engine = engine;

		this.id = GameObject.getNextId();
		this.tag = null;

		this.on('tick', function(timeStep) {
			var children = this._children;

			this._updating = true;

			// tick all active children
			for (var i = 0, l = children.length; i < l; ++i) {
				var child = children[i];

				if (child.active) {
					child.trigger('tick', timeStep);
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
		});

		this.on('render', function(context) {
			// render all children
			for (var i = 0, l = children.length; i < l; ++i) {
				var child = children[i];

				child.trigger('render', context);
			}
		});

		this.on('gizmos', function(context) {
			// render gizmos for all children
			for (var i = 0, l = children.length; i < l; ++i) {
				var child = children[i];

				child.trigger('gizmos', context);
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
			this.parent.removeChild(this);
		}
	};

	GameObject.prototype.addChild = function(child) {
		if (child.parent) {
			// unbind from existing parent
			child.parent.removeChild();
		}

		child.parent = this;

		if (this._updating) {
			Utils.removeElement(this._pendingRemoves, child);
			this._pendingAdds.push(child);
		}
		else {
			this._children.push(child);
		}

		if (child.engine) {
			child.engine.addObject(child);
		}

		this.trigger('childAdded', child);

		return this;
	};

	GameObject.prototype.removeChild = function(child) {
		if (child.parent !== this) {
			// child not parented by this object
			return;
		}

		child.parent = null;

		if (this._updating) {
			Utils.removeElement(this._pendingAdds, child);
			this._pendingRemoves.push(child);
		}
		else {
			Utils.removeElement(this._children, child);
		}

		if (child.engine) {
			child.engine.removeObject(child);
		}

		this.trigger('childRemoved', child);

		return this;
	};

	exports.Behaviour = Behaviour;
	exports.GameObject = GameObject;
	
} (typeof(exports) !== 'undefined' ? exports : window));