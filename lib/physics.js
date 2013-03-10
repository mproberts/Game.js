(function(exports) {

	var Mass = new Behaviour('mass', {
		init: function() {
			this.x = this.x || 0;
			this.y = this.y || 0;

			this.dx = 0;
			this.dy = 0;
		},

		ontick: function(delta) {
			this.dy += this.engine.gravity * delta;

			this.x += this.dx * delta;
			this.y += this.dy * delta;
		},

		ongizmos: function(ctx) {
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
		},

		applyForce: function(x, y) {
			this.dx += x;
			this.dy += y;
		}
	});

	exports.Mass = Mass;

}(typeof(exports) !== 'undefined' ? exports : window));
