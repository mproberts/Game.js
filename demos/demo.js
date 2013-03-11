var MAX_SPEED = 75000;
var JUMP_SPEED = 1500;

if (cards && cards.browser && cards.browser.setOrientationLock) {
	cards.browser.setOrientationLock('portrait');
}

gg.setSize(640, 960);
gg.background = '#8ed8eb';

gg.setCanvas(document.getElementById('game'));
gg.updateDisplay(document.documentElement.offsetWidth, document.documentElement.offsetHeight);

gg.start();

gg.behaviour('wrap', {
	ontick: function(delta) {
		var xoffset = this.centerX ? this.centerX : 0;
		var x = this.x - xoffset;
		var xw = this.x - xoffset + this.width;

		if (xw > this.engine.view.width + this.width) {
			this.x = -this.width + xoffset;
		}
		else if (x < -this.width) {
			this.x = this.engine.view.width + this.width - xoffset;
		}
	}
});

gg.behaviour('bounce', {
	ontick: function(delta) {
		var y = this.centerY ? this.y - this.centerY : this.y;
		var yh = this.centerY ? this.y + (this.height - this.centerY) : this.y + this.height;

		if (yh > this.engine.view.height) {
			this.dy = 0;
			this.y = this.engine.view.height - (this.height - this.centerY) - 1;

			this.trigger('bounce');
		}
	}
});

gg.object('bounce', 'wrap', 'accelerometer', 'sprite', 'scene', {
	dx: 0, dy: 0,
	x: gg.view.width / 2,
	y: gg.view.height / 2,
	rotation: 0,
	url: 'hamster-rest.png',

	onloaded: function() {
		this.centerX = this.width / 2;
		this.centerY = this.height;
	},

	ontick: function(delta) {
		if (this.accelerationX) {
			this.rotation = Math.PI / 3 * this.accelerationX;

			if (this.scaleY === 1) {
				var targetDx = MAX_SPEED * this.accelerationX * delta;

				this.dx = targetDx;
			}
		}

		if (this.scaleY === 1) {
			this.dy += this.engine.gravity * delta;
		}
		else {
			this.dx = 0;
			this.dy = 0;
		}
	},

	onbounce: function() {
		this.ease({
			scaleY: 0.4,
			scaleX: 1.4
		},
		0.3,
		easeRebound,
		function() {
			this.dy = -JUMP_SPEED;
		});
	}
});
