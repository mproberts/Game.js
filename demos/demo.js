if (cards && cards.browser && cards.browser.setOrientationLock) {
	cards.browser.setOrientationLock('portrait');
}

gg.setCanvas(document.getElementById('game'));

gg.start();

gg.debugging = true;

gg.behaviour('bounce', {
	ontick: function(delta) {
		if (this.y > this.engine.view.height || this.y < 0) {
			this.dy = -this.dy;
			this.y += this.dy * delta / 1000;
		}

		if (this.x > this.engine.view.width || this.x < 0) {
			this.dx = -this.dx;
			this.x += this.dx * delta / 1000;
		}
	}
});

gg.gravity = 0;

gg.object('mass', 'bounce', 'accelerometer', {
	dx: 0, dy: 0,
	x: gg.view.width / 2,
	y: gg.view.height / 2,
	onacceleration: function(x, y, z) {
		var targetDx = 5 * x;
		var targetDy = 5 * y;

		this.dx = this.dx + (targetDx - this.dx) / 16;
		this.dy = this.dy + (targetDy - this.dy) / 16;
	}
});