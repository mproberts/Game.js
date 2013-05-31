(function(exports) {

	var FUDGE_AMOUNT = 80;

	var GameButton = new Behaviour('button', {
		requires: ['sprite'],
		
		init: function() {
			this.updateState();
		},

		isInBounds: function(x, y, fudge) {
			var thisx = this.x - ~~this.centerX - (fudge ? FUDGE_AMOUNT : 0);
			var thisy = this.y - ~~this.centerY - (fudge ? FUDGE_AMOUNT : 0);

			var dx = x - thisx;
			var dy = y - thisy;

			if (dx >= 0 && dx < ~~this.width + (fudge ? 2*FUDGE_AMOUNT : 0)
			 && dy >= 0 && dy < ~~this.height + (fudge ? 2*FUDGE_AMOUNT : 0)) {
			 	return true;
			}

			return false;
		},

		updateState: function() {
			var wasDown = this.wasDown;

			this.wasDown = this.isDown;
			this.url = this.isDown ? this.pressedUrl : this.unpressedUrl;

			if (!!wasDown != !!this.isDown) {
				this.trigger('stateChanged', this.isDown);
			}
		},

		ontouchstart: function(x, y) {
			if (this.disabled) {
				return;
			}

			if (this.isInBounds(x, y)) {
				this.isDown = true;
				this.touched = true;
			}
			else {
				this.isDown = false;
				this.touched = false;
			}

			this.updateState();

			return this.isDown;
		},

		ontouchmove: function(x, y) {
			if (this.disabled) {
				return;
			}
			
			if (!this.isInBounds(x, y, true)) {
				this.isDown = false;
			}
			else if (this.touched) {
				this.isDown = true;
			}

			this.updateState();

			return this.touched;
		},

		ontouchend: function(x, y) {
			var wasTouched = this.touched;
			
			this.touched = false;

			if (!this.isInBounds(x, y, true)) {
				this.isDown = false;
			}

			if (this.isDown) {
				this.isDown = false;

				if (!this.disabled) {
					this.trigger('click', x, y);
				}
			}

			this.updateState();

			return wasTouched;
		}
	});

	exports.GameButton = GameButton;

}(typeof(exports) !== 'undefined' ? exports : window));
