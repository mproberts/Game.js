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

		this.on('subrender', function(context) {
			var children = this._children;

			var contextSaved = false;
			var x = ~~this.x;
			var y = ~~this.y;

			/*
			if (~~x !== 0 || ~~y !== 0) {
				if (!contextSaved) {
					contextSaved = true;
					context.save();
				}
				
				context.translate(x, y);
			}
			*/

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

				context.translate(x, y);

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

			if (children.length > 0) {
				if (!contextSaved) {
					contextSaved = true;

					context.save();
					context.translate(x, y);
				}

				children = [].concat(children);

				// render all children
				for (var i = 0, l = children.length; i < l; ++i) {
					var child = children[i];

					child.trigger('subrender', context);
				}
			}

			if (contextSaved) {
				context.translate(-x, -y);
			}

			this.trigger('render', context);

			if (contextSaved) {
				context.restore();
			}

			if (compositeChanged) {
				context.globalCompositeOperation = 'source-over';
			}

			if (alphaChanged) {
				context.globalAlpha = oldAlpha;
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

		if (!child.engine && this.engine) {
			child.engine = this.engine;
			child.trigger('attach', this.engine);
		}
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

		if (!child.engine && this.engine) {
			child.engine = this.engine;
			child.trigger('attach', this.engine);
		}
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
