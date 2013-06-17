(function(exports) {

	var DOUBLE_CLICK_THRESHOLD = 200;

	var Scroller = new Behaviour('scroller', {

		defaults: {
			offsetX: 0,
			offsetY: 0,
			clip: true
		},

		init: function() {
			this._lastDownEvent = null;
			this._lastTouchEvent = null;
			this._velocity = null;
		},

		ontick: function() {
			var reset = false;

			this.contentWidth = 0;
			this.contentHeight = 0;

			for (var i = 0; i < this._children.length; ++i) {
				var child = this._children[i];

				var xw = child.x - ~~child.centerX + ~~child.width;
				var yh = child.y - ~~child.centerY + ~~child.height;

				this.contentWidth = Math.max(this.contentWidth, xw);
				this.contentHeight = Math.max(this.contentHeight, yh);
			}

			if (this._targetOffsetX && this.offsetX !== this._targetOffsetX) {
				reset = true;

				if (Math.abs(this.offsetX-this._targetOffsetX) < 1) {
					this.offsetX = this._targetOffsetX;
				}
				else {
					this.offsetX = this.offsetX + (this._targetOffsetX - this.offsetX) / 8;
				}
			}

			if (this._targetOffsetY && this.offsetY !== this._targetOffsetY) {
				reset = true;

				if (Math.abs(this.offsetY-this._targetOffsetY) < 1) {
					this.offsetY = this._targetOffsetY;
				}
				else {
					this.offsetY = this.offsetY + (this._targetOffsetY - this.offsetY) / 8;
				}
			}

			if (reset) {
				this.updateOffsets(this.offsetX, this.offsetY);
			}
		},

		isInBounds: function(x, y) {
			var thisx = this.x - ~~this.centerX;
			var thisy = this.y - ~~this.centerY;

			var parent = this.parent;

			while (parent) {
				thisx += parent.x;
				thisy += parent.y;

				parent = parent.parent;
			}

			var dx = x - thisx;
			var dy = y - thisy;

			if (dx >= 0 && dx < ~~this.width
			 && dy >= 0 && dy < ~~this.height) {
			 	return true;
			}

			return false;
		},

		boundedOffsets: function(x, y) {
			var sx = this.scaleX || 1;
			var sy = this.scaleY || 1;

			x = Math.max((this.width-this.contentWidth) * sx, x);
			y = Math.max((this.height-this.contentHeight) * sy, y);

			x = Math.min(0, x);
			y = Math.min(0, y);

			this.trigger('scrollChanged', x, y);

			return [x, y];
		},

		updateOffsets: function(x, y, animate) {
			var offsets = this.boundedOffsets(x, y);

			this.offsetX = offsets[0];
			this.offsetY = offsets[1];
		},

		_markTouchEvent: function(x, y) {
			var now = +new Date();

			if (this._lastTouchEvent) {
				var dt = now-this._lastTouchEvent.ts;

				var dx = (this._lastTouchEvent.x - x);
				var dy = (this._lastTouchEvent.y - y);

				dt = dt || 1;
				dt /= 2;

				var oldVelocity = this._velocity;

				this._velocity = {
					x: dx / dt,
					y: dy / dt
				};

				if (oldVelocity) {
					this._velocity = {
						x: (this._velocity.x + oldVelocity.y) / 2,
						y: (this._velocity.y + oldVelocity.y) / 2,
					}
				}
			}

			this._lastTouchEvent = {x: x, y: y, ts: now};
		},

		ontouchstart: function(x, y, ev) {
			if (ev.cancelled) {
				return;
			}

			this._velocity = null;
			this._lastTouchEvent = null;
			this._markTouchEvent(x, y);

			var now = +new Date();

			if (this._lastDownEvent) {
				var delta = (now - this._lastDownEvent);
				if (delta < DOUBLE_CLICK_THRESHOLD) {
					this.trigger('doubletap', x, y);
					this._lastDownEvent = null;
					return;
				}
			}

			this._lastDownEvent = now;

			if (this.isInBounds(x, y)) {
				this.isDown = true;
				this.touched = true;

				this.initialX = x;
				this.initialY = y;
				this.initialOffsetX = ~~this.offsetX;
				this.initialOffsetY = ~~this.offsetY;
			}
			else {
				this.isDown = false;
				this.touched = false;
			}
		},

		ontouchmove: function(x, y, ev) {
			if (ev.cancelled) {
				return;
			}

			this._markTouchEvent(x, y);
			
			if (this.isDown) {
				this.updateOffsets((x - this.initialX) + this.initialOffsetX, (y - this.initialY) + this.initialOffsetY);
			}
		},

		ontouchend: function(x, y, ev) {
			if (ev.cancelled) {
				return;
			}

			this._markTouchEvent(x, y);
			
			if (this.isDown) {
				this.updateOffsets((x - this.initialX) + this.initialOffsetX, (y - this.initialY) + this.initialOffsetY);

				if (this._velocity) {
					var offsets = this.boundedOffsets(
						this.offsetX - 100 * this._velocity.x,
						this.offsetY - 100 * this._velocity.y);

					this._targetOffsetX = offsets[0];
					this._targetOffsetY = offsets[1];
				}
			}

			this.touched = false;
			this.isDown = false;
		}
	});

	exports.Scroller = Scroller;

}(typeof(exports) !== 'undefined' ? exports : window));
