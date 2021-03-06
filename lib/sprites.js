(function(exports) {

	var Sprite = new Behaviour('sprite', {
		defaults: {
			scaleX: 1,
			scaleY: 1
		},
		
		init: function() {
			var self = this;

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
			var self = this;

			if (this.url && (!this.cachedImage || this.cachedUrl !== this.url)) {
				var found = false;

				this.engine.resources.image(this.url, function(cache, url) {
					if (cache) {
						found = true;
						self.cachedImage = cache;
						self.cachedUrl = url;

						self.width = self.width || cache.width;
						self.height = self.height || cache.height;

						self.srcwidth = cache.width;
						self.srcheight = cache.height;

						self.trigger('loaded');
					}
				});
			}

			if (this.cachedImage) {
				img = this.cachedImage.img;
			}
			
			var x = ~~(this.x + 0.5);
			var y = ~~(this.y + 0.5);

			if (img) {
				var width = this.width || (this.res ? this.res.width : 0);
				var height = this.height || (this.res ? this.res.height : 0);

				if (this.crop) {
					w = this.width;
					h = this.height;
				}
				else {
					w = this.srcwidth;
					h = this.srcheight;
				}

				ctx.drawImage(img,
					(this.offsetX || 0) + this.cachedImage.x, (this.offsetY || 0) + this.cachedImage.y,
					w, h,
					x-~~this.centerX, y-~~this.centerY,
					width, height);
			}
		}
	});

	exports.Sprite = Sprite;

}(typeof(exports) !== 'undefined' ? exports : window));
