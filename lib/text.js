(function(exports) {
	var Text = new Behaviour('text', {
		defaults: {
			scaleX: 1, scaleY: 1, rotation: 0
		},
		setText: function(text) {
			this.text = text;
		},

		getLetterUrl: function(letter) {
			return letter + '.png';
		},

		transformLetter: function(letter) {
			switch (letter) {
				case ':':
					return 'colon';
				case '.':
					return 'period';
				case ',':
					return 'comma';
				case '-':
					return 'hyphen';
				default:
					return letter;
			}
		},

		measure: function() {
			var w = 0;
			var h = 0;
			var cacheable = true;

			for (var i = 0, l = this.text.length; i < l; ++i) {
				var letter = this.transformLetter(this.text[i]);
				var letterUrl = this.getLetterUrl(letter);

				var img = this.engine.resources.image(letterUrl);

				if (img) {
					w += img.width;
					w += ~~this.kerning;

					h = Math.max(img.height, h);
				}
				else {
					cacheable = false;
				}
			}

			if (cacheable) {
				this.measuredText = this.text;
				this.measuredWidth = w;
				this.height = h;
			}
			
			this.trigger('textchanged');
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

			for (var i = 0, l = this.text.length; i < l; ++i) {
				var letter = this.text[i];

				var img = this.engine.resources.image(this.getLetterUrl(this.transformLetter(letter)));

				if (!img) {
					continue;
				}

				ctx.drawImage(img.img,
					img.x, img.y,
					img.width, img.height,
					startx + xoffset, y,
					img.width, img.height);

				xoffset += img.width;
				xoffset += ~~this.kerning;
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

			var metrics = ctx.measureText(this.text);

			this.measuredText = this.text;
			this.measuredWidth = metrics.width;

			this.trigger('textchanged');
		},

		onrender: function(ctx) {
			var x = ~~(this.x + 0.5);
			var y = ~~(this.y + 0.5);
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

			ctx.fillText(this.text, startx, y);
		}
	});

	exports.CanvasText = CanvasText;
	exports.Text = Text;

}(typeof(exports) !== 'undefined' ? exports : window));
