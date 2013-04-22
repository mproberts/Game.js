(function(exports) {

	var FUDGE_AMOUNT = 40;

	var GameButton = new Behaviour('button', {
		requires: ['sprite'],
		
		init: function() {
			this.updateState();
		},

		isInBounds: function(x, y, fudge) {
			var thisx = this.x - ~~this.centerX - (fudge ? FUDGE_AMOUNT : 0);
			var thisy = this.y - ~~this.centerY - (fudge ? FUDGE_AMOUNT : 0);

			var parent = this.parent;

			while (parent) {
				this.x += parent.x;
				this.y += parent.y;

				parent = parent.parent;
			}

			var dx = x - thisx;
			var dy = y - thisy;

			if (dx >= 0 && dx < ~~this.width + (fudge ? 2*FUDGE_AMOUNT : 0)
			 && dy >= 0 && dy < ~~this.height + (fudge ? 2*FUDGE_AMOUNT : 0)) {
			 	return true;
			}

			return false;
		},

		updateState: function() {
			this.url = this.isDown ? this.pressedUrl : this.unpressedUrl;
		},

		ontouchstart: function(x, y) {
			if (this.isInBounds(x, y)) {
				this.isDown = true;
			}

			this.updateState();
		},

		ontouchmove: function(x, y) {
			if (!this.isInBounds(x, y, true)) {
				this.isDown = false;
			}

			this.updateState();
		},

		ontouchend: function(x, y) {
			if (!this.isInBounds(x, y, true)) {
				this.isDown = false;
			}

			if (this.isDown) {
				this.isDown = false;
				this.trigger('click', x, y);
			}

			this.updateState();
		}
	});

	exports.GameButton = GameButton;

}(typeof(exports) !== 'undefined' ? exports : window));
