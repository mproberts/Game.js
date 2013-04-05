var vows   = require('vows'),
    should = require('should'),
    assert = require('assert');

var Game = require('../lib/engine.js').Game;

vows.describe('GameObject').addBatch({
	'Adding behaviour': {
		'to an empty object directly': function() {
			var go = new Game.Object(null);
			var behaviour = new Game.Behaviour('xxx');

			assert.ok(!go.hasBehaviour('xxx'));

			go.addBehaviour(behaviour);
			assert.ok(go.hasBehaviour('xxx'));
		},

		'to an object with multiple behaviours': function() {
			var go = new Game.Object(null);
			var behaviourXxx = new Game.Behaviour('xxx');
			var behaviourYyy = new Game.Behaviour('yyy');

			assert.ok(!go.hasBehaviour('xxx'));
			assert.ok(!go.hasBehaviour('yyy'));

			go.addBehaviour(behaviourXxx);
			assert.ok(go.hasBehaviour('xxx'));

			go.addBehaviour(behaviourYyy);
			assert.ok(go.hasBehaviour('xxx'));
			assert.ok(go.hasBehaviour('yyy'));
		},

		'binds event handlers': function() {
			var triggeredValue = null;
			var go = new Game.Object(null);
			var behaviour = new Game.Behaviour('xxx', {
				onfancy: function(value) {
					triggeredValue = value;
				}
			});

			go.addBehaviour(behaviour);

			go.trigger('fancy', 'abc');
			assert.equal(triggeredValue, 'abc');
		},

		'binds method calls': function() {
			var methodValue = null;
			var go = new Game.Object(null);
			var behaviour = new Game.Behaviour('xxx', {
				aMethod: function(value) {
					methodValue = value;
				}
			});

			go.addBehaviour(behaviour);

			go.aMethod('123');
			assert.equal(methodValue, '123');
		}
	},
	
	'Removing behaviour': {
		'removes behaviour references': function() {
			var go = new Game.Object(null);
			var behaviourXxx = new Game.Behaviour('xxx');
			var behaviourYyy = new Game.Behaviour('yyy');

			go.addBehaviour(behaviourXxx);
			go.addBehaviour(behaviourYyy);
			
			assert.ok(go.hasBehaviour('xxx'));
			assert.ok(go.hasBehaviour('yyy'));

			go.removeBehaviour(behaviourXxx);
			
			assert.ok(!go.hasBehaviour('xxx'));
			assert.ok(go.hasBehaviour('yyy'));

			go.removeBehaviour(behaviourYyy);
			
			assert.ok(!go.hasBehaviour('xxx'));
			assert.ok(!go.hasBehaviour('yyy'));
		},

		'unbinds event handlers': function() {
			var triggeredValue = null;
			var go = new Game.Object(null);
			var behaviour = new Game.Behaviour('xxx', {
				onfancy: function(value) {
					triggeredValue = value;
				}
			});

			go.addBehaviour(behaviour);
			go.removeBehaviour(behaviour);

			go.trigger('fancy', 'abc');
			assert.equal(triggeredValue, null);
		},

		'unbinds method calls': function() {
			var methodValue = null;
			var go = new Game.Object(null);
			var behaviour = new Game.Behaviour('xxx', {
				aMethod: function(value) {
					methodValue = value;
				}
			});

			go.addBehaviour(behaviour);
			go.removeBehaviour(behaviour);

			assert.equal(go.aMethod, undefined);
		}
	}
}).export(module);
