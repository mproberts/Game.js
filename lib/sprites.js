(function(exports) {

	var Sprite = new Behaviour('sprite', {
		defaults: {
			scaleX: 1,
			scaleY: 1
		},
		
		init: function() {
			var self = this;

			if (this.url) {
				this.engine.resources.image(this.url, function(cache, url) {
					self.cachedImage = cache;

					self.width = self.width || cache.width;
					self.height = self.height || cache.height;

					self.trigger('loaded');
				});
			}

			if (this.align) {
				this.on('loaded', function() {
					if (this.align === 'center') {
						self.centerX = self.width / 2;
						self.centerY = self.height / 2;
					}
				});
			}
		},

		onrender: function(ctx) {
			var img;

			if (this.cachedImage) {
				img = this.cachedImage.img;
			}
			
			var x = ~~(this.x + 0.5);
			var y = ~~(this.y + 0.5);

			if (img) {
				if (this.alpha && this.alpha !== 1) {
					ctx.globalAlpha = this.alpha;
				}
				else {
					ctx.globalAlpha = 1;
				}

				var width = this.width || (this.res ? this.res.width : 0);
				var height = this.height || (this.res ? this.res.height : 0);

				if (typeof(this.rotation) !== 'undefined' && this.rotation !== 0
				 || typeof(this.scaleX) !== 'undefined' && this.scaleX !== 0
				 || typeof(this.scaleY) !== 'undefined' && this.scaleY !== 0) {
					ctx.save();
					ctx.translate(x, y);

					if (typeof(this.scaleX) !== 'undefined' && this.scaleX !== 1
					 || typeof(this.scaleY) !== 'undefined' && this.scaleY !== 1) {
						ctx.scale(this.scaleX || 1, this.scaleY || 1);
					}

					if (typeof(this.rotation) !== 'undefined' && this.rotation !== 0) {
						ctx.rotate(this.rotation);
					}

					ctx.drawImage(img,
						this.offsetX || 0, this.offsetY || 0,
						width, height,
						-this.centerX, -this.centerY,
						width, height);
					ctx.restore();
				}
				else {
					ctx.drawImage(img,
						this.offsetX || 0, this.offsetY || 0,
						width, height,
						x-this.centerX, y-this.centerY,
						width, height);
				}

				if (this.alpha && this.alpha !== 1) {
					ctx.globalAlpha = 1;
				}
			}
		}
	});

	exports.Sprite = Sprite;

}(typeof(exports) !== 'undefined' ? exports : window));
