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
	var Behaviour = Utils.extendTo(Events, function(name, definition, engine) {
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
					target.on(eventName, listeners[eventName], target);
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
		this.super();

		this._behaviours = {};
		this._children = [];
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

			this.trigger('tick', timeStep);

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

			this.trigger('render', context);

			if (contextSaved) {
				context.translate(x, y);
			}

			if (children.length > 0) {
				if (!contextSaved) {
					contextSaved = true;

					context.save();
					context.translate(x + offsetX + ~~this.centerX, y + offsetY + ~~this.centerY);
				}
				else {
					context.translate(offsetX + ~~this.centerX, offsetY + ~~this.centerY);
				}

				children = [].concat(children);

				// render all children
				for (var i = 0, l = children.length; i < l; ++i) {
					var child = children[i];

					child.trigger('subrender', context);
				}
			}

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

				ctx.font = '24px sans-serif';

				ctx.fillText(this.id, this.x - ~~this.centerX + 10, this.y - ~~this.centerY + 30);
			}
		});

		if (defaults && typeof(defaults.init) === 'function') {
			defaults.init.call(this);
		}

		return this;
	});

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

			for (var k in child._behaviours) {
				var behaviour = child._behaviours[k];

				behaviour.unhookChild(child);
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
