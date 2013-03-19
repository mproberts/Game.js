(function(exports) {

	function handleCollisions(delta) {
		var colliders = this.behaviour('collider');
		var objects = colliders.getObjects();

		for (var i = 0, l = objects.length; i < l; ++i) {
			var o1 = objects[i];

		 	o1.collided = false;
		}

		for (var i = 0, l = objects.length; i < l; ++i) {
			var o1 = objects[i];
			var box = o1.getBoundingBox();

			for (var j = i+1; j < l; ++j) {
				var o = objects[j];

				if (o === o1) {
					// skip collisions with self
					continue;
				}
				else if (!o1.collidesWith(o) || !o.collidesWith(o1)) {
					// skip non-colliding types
					continue;
				}
				else {
					var otherBox = o.getBoundingBox();

					if (o1.checkAABBIntersection(box, otherBox)
					 || o1.checkAABBIntersection(otherBox, box)) {

					 	o1.collided = true;
					 	o.collided = true;

						// collision
						o1.trigger('collision', o);
						o.trigger('collision', o1);
					}
				}
			}
		}
	}

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

	Collider.handleCollisions = handleCollisions;

	exports.Collider = Collider;

}(typeof(exports) !== 'undefined' ? exports : window));
