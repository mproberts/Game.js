(function(exports) {

	var Accelerometer = new Behaviour('accelerometer', {
		ontick: function(delta) {
			if (this.engine.accelerationX || this.engine.accelerationY || this.engine.accelerationZ) {
				this.accelerationX = this.engine.accelerationX;
				this.accelerationY = this.engine.accelerationY;
				this.accelerationZ = this.engine.accelerationZ;
			}
		}
	});

	exports.Accelerometer = Accelerometer;

}(typeof(exports) !== 'undefined' ? exports : window));
