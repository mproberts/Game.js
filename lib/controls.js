(function(exports) {

	var Accelerometer = new Behaviour('accelerometer', {
		ontick: function(delta) {
			if (this.engine.accelerationX || this.engine.accelerationY || this.engine.accelerationZ) {
				this.accelerationX = this.engine.accelerationX;
				this.accelerationY = this.engine.accelerationY;
				this.accelerationZ = this.engine.accelerationZ;

				this.smoothAccelerationX = this.engine.smoothAccelerationX;
				this.smoothAccelerationY = this.engine.smoothAccelerationY;
				this.smoothAccelerationZ = this.engine.smoothAccelerationZ;
			}
		}
	});

	var Orientation = new Behaviour('orientation', {
		ontick: function(delta) {
			if (this.engine.orientation) {
				this.orientation = {
					alpha: this.engine.orientation.alpha,
					beta: this.engine.orientation.beta,
					gamma: this.engine.orientation.gamma
				};
			}
		}
	});

	exports.Accelerometer = Accelerometer;
	exports.Orientation = Orientation;

}(typeof(exports) !== 'undefined' ? exports : window));
