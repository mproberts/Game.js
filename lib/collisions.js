(function(exports) {

	function handleCollisions(collider, delta) {
		var objects = collider.getObjects();

		for (var i = 0, l = objects.length; i < l; ++i) {
			var o = objects[i];

			o.collided = false;
		 	o.collisions = {};
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
				else if (!o1.collisions.hasOwnProperty(o.id)) {
					var otherBox = o.getBoundingBox();

					if (o1.checkAABBIntersection(box, otherBox)
					 || o1.checkAABBIntersection(otherBox, box)) {
					 	o1.collisions[o.id] = o;
					 	o.collisions[o1.id] = o1;
					}
				}
			}
		}

		for (var i = 0, l = objects.length; i < l; ++i) {
			var o = objects[i];

			for (var j in o.collisions) {
				o.collided = true;

				if (o.collisions.hasOwnProperty(j)) {
					o.trigger('collision', o.collisions[j]);
				}
			}
		}
	}

	var Collider = new Behaviour('collider', {
		ongizmos: function(ctx) {
			var box = this.getBoundingBox();

			if (this.collided) {
				ctx.strokeStyle = '#ff0000';
				ctx.lineWidth = 4;
			}
			else {
				ctx.strokeStyle = '#00ff00';
				ctx.lineWidth = 2;
			}

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
