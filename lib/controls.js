(function(exports) {

	var Accelerometer = new Behaviour('accelerometer', {
		ontick: function(delta) {
			if (this.engine.accelerationX || this.engine.accelerationY || this.engine.accelerationZ) {
				this.accelerationX = this.engine.accelerationX * 1000 * delta;
				this.accelerationY = this.engine.accelerationY * 1000 * delta;
				this.accelerationZ = this.engine.accelerationZ * 1000 * delta;
			}
		}
	});

	exports.Accelerometer = Accelerometer;

}(typeof(exports) !== 'undefined' ? exports : window));
