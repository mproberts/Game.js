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

		this.x = this.x || 0;
		this.y = this.y || 0;

		this.dx = 0;
		this.dy = 0;

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

			if (this.dx) {
				this.x += this.dx * timeStep;
			}

			if (this.dy) {
				this.y += this.dy * timeStep;
			}
		});

		this.on('touchstart', function(x, y) {
			var children = this._children;
			var result = false;

			// render all children
			for (var i = 0, l = children.length; i < l; ++i) {
				var child = children[i];

				result = child.trigger('render', context) || result;
			}

			return result;
		});

		this.on('render', function(context) {
			var children = this._children;

			// render all children
			for (var i = 0, l = children.length; i < l; ++i) {
				var child = children[i];

				child.trigger('render', context);
			}
		});

		this.on('gizmos', function(context) {
			var children = this._children;

			// render gizmos for all children
			for (var i = 0, l = children.length; i < l; ++i) {
				var child = children[i];

				child.trigger('gizmos', context);
			}
		});

		this.on('gizmos', function(ctx) {

			ctx.strokeStyle = '#0000ff';
			ctx.lineWidth = 1;

			if (this.x && this.y && this.width && this.height) {
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
				ctx.lineTo(this.x + this.dx / 10, this.y + this.dy / 10);
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

	GameObject.prototype.ease = function(to, duration, easing, after) {
		var self = this;
		var amount = 0;
		var finished = false;
		var assigner = Utils.ease(this, to);

		easing = easing || easeLinear;

		function tick(delta) {
			amount += delta;

			if (amount >= duration) {
				finished = true;
				amount = duration;
			}

			var scaledAmount = amount / duration;

			scaledAmount = Math.min(Math.max(scaledAmount, 0), 1);

			//console.log(scaledAmount);

			var easeAmount = easing(scaledAmount);

			assigner(self, easeAmount);

			if (finished) {
				if (after) {
					after.call(self);
				}
				self.off('tick', tick);
			}
		}

		this.on('tick', tick);
	};

	exports.Behaviour = Behaviour;
	exports.GameObject = GameObject;
	
} (typeof(exports) !== 'undefined' ? exports : window));
