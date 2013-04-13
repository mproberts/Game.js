var vows   = require('vows'),
    should = require('should'),
    assert = require('assert');

var Engine = require('../lib/engine.js');
var Game = Engine.Game;
var GameObject = Engine.GameObject;
var Behaviour = Engine.Behaviour;

vows.describe('GameObject').addBatch({
	'Adding behaviour': {
		'to an empty object directly': function() {
			var go = new GameObject();
			var behaviour = new Behaviour('xxx');

			assert.ok(!go.hasBehaviour('xxx'));

			go.addBehaviour(behaviour);
			assert.ok(go.hasBehaviour('xxx'));
		},

		'to an object with multiple behaviours': function() {
			var go = new GameObject();
			var behaviourXxx = new Behaviour('xxx');
			var behaviourYyy = new Behaviour('yyy');

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
			var go = new GameObject();
			var behaviour = new Behaviour('xxx', {
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
			var go = new GameObject();
			var behaviour = new Behaviour('xxx', {
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
			var go = new GameObject();
			var behaviourXxx = new Behaviour('xxx');
			var behaviourYyy = new Behaviour('yyy');

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
			var go = new GameObject();
			var behaviour = new Behaviour('xxx', {
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
			var go = new GameObject();
			var behaviour = new Behaviour('xxx', {
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
