var MAX_HORIZONAL_SPEED = 75000;
var JUMP_SPEED = 1800;

if (cards && cards.browser && cards.browser.setOrientationLock) {
	cards.browser.setOrientationLock('portrait');
}

gg.setSize(640, 960);
gg.background = '#8ed8eb';
gg.gravity = 4500;

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

gg.behaviour('rotate', {
	ontick: function(delta) {
		if (this.accelerationX) {
			this.rotation = Math.PI / 3 * this.accelerationX;

			if (this.scaleY === 1) {
				var targetDx = MAX_HORIZONAL_SPEED * this.accelerationX * delta;

				this.dx = targetDx;
			}
		}
	}
});

gg.behaviour('hamster', {
	requires: ['bounce', 'wrap', 'accelerometer', 'rotate', 'sprite', 'collider'],
	defaults: {
		dx: 0, dy: 0,
		rotation: 0,
		url: 'res/hamster-rest.png',
		restingUrl: 'res/hamster-rest.png',
		jumpingUrl: 'res/hamster-jump.png'
	},

	onloaded: function() {
		this.centerX = this.width / 2;
		this.centerY = this.height;
	},

	ontick: function(delta) {
		if (this.scaleY === 1) {
			this.dy += this.engine.gravity * delta;
		}
		else {
			this.dx = 0;
			this.dy = 0;
		}

		if (this.dy < 0) {
			this.url = this.jumpingUrl;
		}
		else {
			this.url = this.restingUrl;
		}
	},

	oncollision: function() {
		if (this.dy !== 0) {
			this.trigger('bounce');
		}

		this.dy = 0;
		this.scaleY = 0.999;
	},

	collidesWith: function(other) {
		return this.dy > 0;
	},

	getBoundingBox: function() {
		var x = ~~this.x - ~~this.centerX;
		var y = ~~this.y - 15;

		return {
			x: x + 20, y: y, width: this.width - 40, height: 15
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

gg.object('hamster', {
	x: gg.view.width / 2,
	y: gg.view.height / 2,
	z: 100,
});

function platform(x, y) {
	gg.object('collider', 'sprite', {
		url: 'res/platform-orange.png',
		x: x,
		y: y,
		z: 1,

		getBoundingBox: function() {
			var x = ~~this.x;
			var y = ~~this.y;

			return {
				x: x, y: y, width: this.width, height: 15
			}
		}
	});
}

for (var i = 0; i < 10; ++i) {
	platform(gg.view.width/2, gg.view.height - i * 18000);
}
