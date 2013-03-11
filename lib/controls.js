(function(exports) {

	var Accelerometer = new Behaviour('accelerometer', {
		ontick: function(delta) {
			if (this.engine.accelerationX || this.engine.accelerationY || this.engine.accelerationZ) {
				var accelerationX = this.engine.accelerationX;
				var accelerationY = this.engine.accelerationY;
				var accelerationZ = this.engine.accelerationZ;

				if (this.accelerationX) {
					this.accelerationX = this.accelerationX + (accelerationX - this.accelerationX) / 2;
					this.accelerationY = this.accelerationY + (accelerationY - this.accelerationY) / 2;
					this.accelerationZ = this.accelerationY + (accelerationZ - this.accelerationZ) / 2;
				}
				else {
					this.accelerationX = accelerationX;
					this.accelerationY = accelerationY;
					this.accelerationZ = accelerationZ;
				}
			}
		}
	});

	exports.Accelerometer = Accelerometer;

}(typeof(exports) !== 'undefined' ? exports : window));
