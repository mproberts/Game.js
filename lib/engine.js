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

		this.timer = timer || new ClockTimer();
		this.timer.setCallback(function(timestep) {
			self.tick(timestep, callback);
		});
	});

	Engine.prototype.tick = function(timestep, callback) {
		this.trigger(timestep);
	};

	Engine.prototype.behaviour = function(name, definition) {
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
	exports.gg = new Engine(new ClockTimer());
	
} (typeof(exports) !== 'undefined' ? exports : window));
