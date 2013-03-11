(function(exports) {

	var Mass = new Behaviour('mass', {
		ontick: function(delta) {
			this.dy += this.engine.gravity * delta;
		},

		ongizmos: function(ctx) {
		},

		applyForce: function(x, y) {
			this.dx += x;
			this.dy += y;
		}
	});

	exports.Mass = Mass;

}(typeof(exports) !== 'undefined' ? exports : window));
