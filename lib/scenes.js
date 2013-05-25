(function(exports) {

	var Transition = {};

	Transition.fadeInOut = function fadeInOut(scene, options) {
		return function(callback) {
			var direction = options.direction || 'out';
			var duration = options.duration || 0.5;
			var color = options.color || '#000';

			var overlay = game.object({
				alpha: (direction === 'in' ? 1 : 0),
				x: 0,
				y: 0,
				width: scene.engine.view.width,
				height: scene.engine.view.height,
				onrender: function(ctx) {
					ctx.fillStyle = color;
					ctx.fillRect(this.x, this.y, this.width, this.height);
				}
			});

			overlay.ease({alpha: 1-overlay.alpha},
				duration,
				overlay.alpha === 0 ? Easing.easeOut : Easing.easeIn,
				function() {
					callback();
					overlay.remove();
			});

			scene.addChild(overlay);
		};
	}

	var Scene = new Behaviour('scene', {
		onentering: function(enterCallback) {
			var self = this;

			function callback() {
				self.trigger('enter');

				enterCallback();
			}

			var transitionFn = this.transitionIn();

			if (transitionFn) {
				transitionFn(callback);
			}
			else {
				callback();
			}
		},
		onleaving: function(leaveCallback) {
			var self = this;

			function callback() {
				self.trigger('leave');

				leaveCallback();
			}

			var transitionFn = this.transitionOut();

			if (transitionFn) {
				transitionFn(callback);
			}
			else {
				callback();
			}
		},
		transitionIn: function() {
			return Transition.fadeInOut(this, {
				direction: 'in',
				color: '#000',
				duration: 0.5
			});
		},
		transitionOut: function() {
			return Transition.fadeInOut(this, {
				direction: 'out',
				color: '#000',
				duration: 0.5
			});
		},
	});

	exports.Scene = Scene;
	exports.Transition = Transition;

}(typeof(exports) !== 'undefined' ? exports : window));
