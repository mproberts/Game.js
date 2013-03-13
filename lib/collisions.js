(function(exports) {

	var Collider = new Behaviour('collider', {
		ongizmos: function(ctx) {
			var box = this.getBoundingBox();

			if (this.collided) {
				ctx.strokeStyle = '#ff0000';
			}
			else {
				ctx.strokeStyle = '#00ff00';
			}

			ctx.lineWidth = 2;

			ctx.strokeRect(box.x, box.y, box.width, box.height);
		},

		ontick: function(delta) {
			var colliders = this.engine.behaviour('collider');
			var objects = colliders.getObjects();
			var box = this.getBoundingBox();

		 	this.collided = false;

			for (var i = 0, l = objects.length; i < l; ++i) {
				var o = objects[i];

				if (o === this) {
					// skip collisions with self
					continue;
				}
				else if (!this.collidesWith(o) || !o.collidesWith(this)) {
					// skip non-colliding types
					continue;
				}
				else {
					var otherBox = o.getBoundingBox();

					if (this.checkAABBIntersection(box, otherBox)
					 || this.checkAABBIntersection(otherBox, box)) {

					 	this.collided = true;
					 	o.collided = true;

						// collision
						this.trigger('collision', o);
						o.trigger('collision', this);
					}
				}
			}
		},

		checkAABBIntersection: function(a, b) {
			var bx = b.x, bxw = b.x + b.width;
			var by = b.y, byh = b.y + b.height;

			var points = [
				[a.x, a.y],
				[a.x+a.width, a.y],
				[a.x, a.y+a.height],
				[a.x+a.width, a.y+a.height]
			];

			for (var i = 0; i < 4; ++i) {
				var p = points[i];
				var px = p[0];
				var py = p[1];

				if (px >= bx && px <= bxw && py >= by && py <= byh) {
					return true;
				}
			}

			return false;
		},

		getBoundingBox: function() {
			var x = ~~this.x - ~~this.centerX;
			var y = ~~this.y - ~~this.centerY;

			return {
				x: x, y: y, width: this.width, height: this.height
			}
		},

		collidesWith: function(other) {
			return true;
		}
	});

	exports.Collider = Collider;

}(typeof(exports) !== 'undefined' ? exports : window));
