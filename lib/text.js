(function(exports) {
	var Text = new Behaviour('text', {
		defaults: {
			scaleX: 1, scaleY: 1, rotation: 0,
			align: 'left'
		},
		setText: function(text) {
			this.text = text;
		},

		getLetterUrl: function(letter) {
			return letter + '.png';
		},

		getKerning: function(letter) {
			return ~~this.kerning;
		},

		transformLetter: function(letter) {
			if (/[A-Z]/.test(letter)) {
				letter = 'u' + letter.toLowerCase();
			}

			switch (letter) {
				case '!':
					return 'exclamation';
				case ':':
					return 'colon';
				case '.':
					return 'period';
				case ',':
					return 'comma';
				case '-':
					return 'hyphen';
				case ' ':
					return 'space';
				default:
					return letter;
			}
		},

		measure: function() {
			var w = 0;
			var h = 0;
			var cacheable = true;

			var period = this.getLetterUrl('period');
			var periodKerning = this.getKerning('period');

			var ellipsisWidth = (period.width || 0) * 3 + periodKerning * 3;

			var targetWidth = this.fixedWidth ? this.fixedWidth : Number.MAX_VALUE;
			var targetEllipsisWidth = this.fixedWidth ? this.fixedWidth - ellipsisWidth : Number.MAX_VALUE;

			var ellipsisIndex = -1;

			this.ellipsized = false;
			this.ellipsisLength = 0;

			for (var i = 0, l = this.text.length; i < l; ++i) {
				var letter = this.transformLetter(this.text[i]);
				var letterUrl = this.getLetterUrl(letter);

				var img = null;
				var skipped = false;

				if (letter === 'space') {
					skipped = true;
					w += this.getSpaceSize ? this.getSpaceSize() : 0;
				}
				else {
					img = this.engine.resources.image(letterUrl);
				}

				if (img) {
					w += img.width;

					if (i !== this.text.length-1) {
						w += this.getKerning(letter);
					}

					h = Math.max(img.height, h);
				}
				else {
					w += this.getKerning(letter);

					if (!skipped) {
						cacheable = false;
					}
				}

				if (ellipsisIndex < 0 && w >= targetEllipsisWidth) {
					ellipsisIndex = i-1;
					targetEllipsisWidth = w;
				}

				if (w > targetWidth) {
					this.ellipsized = true;
					this.ellipsisLength = ellipsisIndex;

					w = targetEllipsisWidth;
					break;
				}
			}

			if (cacheable) {
				this.measuredText = this.text;
			}

			this.measuredWidth = w;
			this.height = h;
			
			this.trigger('textchanged');

			return {
				width: this.measuredWidth,
				height: this.height
			};
		},

		onrender: function(ctx) {
			var x = ~~(this.x + 0.5);
			var y = ~~(this.y + 0.5);
			var xoffset = 0;

			if (this.measuredText !== this.text && typeof(this.align) !== 'undefined') {
				this.measure();
			}

			var startx = x;

			if (''+this.text !== this.text) {
				return;
			}

			if (this.align === 'right') {
				startx = x - this.measuredWidth;
				this.centerX = this.measuredWidth;
			}
			else if (this.align === 'center') {
				startx = x - this.measuredWidth / 2;
				this.centerX = this.measuredWidth / 2;
			}

			this.width = this.measuredWidth;

			var l = this.ellipsized ? this.ellipsisLength : this.text.length;

			for (var i = 0; i < l; ++i) {
				var letter = this.text[i];

				letter = this.transformLetter(letter);

				if (letter === 'space') {
					xoffset += this.getSpaceSize ? this.getSpaceSize() : 0;
				}

				var img = this.engine.resources.image(this.getLetterUrl(letter));

				if (!img) {
					xoffset += this.getKerning(letter);
					continue;
				}

				ctx.drawImage(img.img,
					img.x, img.y,
					img.width, img.height,
					startx + xoffset, y,
					img.width, img.height);

				xoffset += img.width;
				xoffset += this.getKerning(letter);
			}

			if (this.ellipsized) {
				for (var i = 0; i < 3; ++i) {
					var letter = 'period';

					letter = this.transformLetter(letter);
					
					var img = this.engine.resources.image(this.getLetterUrl(letter));

					if (!img) {
						xoffset += this.getKerning(letter);
						continue;
					}

					ctx.drawImage(img.img,
						img.x, img.y,
						img.width, img.height,
						startx + xoffset, y,
						img.width, img.height);

					xoffset += img.width;
					xoffset += this.getKerning(letter);
				}
			}
		}
	});

	var CanvasText = new Behaviour('canvas-text', {
		defaults: {
			scaleX: 1, scaleY: 1, rotation: 0
		},
		setText: function(text) {
			this.text = text;
		},
		measure: function(ctx) {
			var w = 0;
			var h = 0;

			if (!ctx && document) {
				ctx = document.createElement('canvas').getContext('2d');
			}

			if (this.font) {
				ctx.font = this.font;
			}

			var metrics = ctx.measureText(this.text);

			this.measuredText = this.text;
			this.measuredWidth = metrics.width;
			this.height = metrics.height;

			this.trigger('textchanged');

			return {
				width: this.measuredWidth,
				height: this.height
			};
		},

		onrender: function(ctx) {
			var x = ~~(this.x + 0.5);
			var y = ~~(this.y + 0.5) + ~~this.height;
			var xoffset = 0;

			if (this.font) {
				ctx.font = this.font;
			}

			if (this.color) {
				ctx.fillStyle = this.color;
			}

			if (this.measuredText !== this.text) {
				this.measure(ctx);
			}

			var startx = x;

			if (''+this.text !== this.text) {
				return;
			}

			if (this.align === 'right') {
				startx = x - this.measuredWidth;
				this.centerX = this.measuredWidth;
			}
			else if (this.align === 'center') {
				startx = x - this.measuredWidth / 2;
				this.centerX = this.measuredWidth / 2;
			}

			this.width = this.measuredWidth;

			if (this.strokeStyle) {
				ctx.lineWidth = 6;
				ctx.strokeStyle = this.strokeStyle;
				ctx.strokeText(this.text, startx, y);
			}

			ctx.fillText(this.text, startx, y);
		}
	});

	exports.CanvasText = CanvasText;
	exports.Text = Text;

}(typeof(exports) !== 'undefined' ? exports : window));
