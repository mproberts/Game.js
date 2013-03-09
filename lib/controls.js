(function(exports) {

	var Accelerometer = new Behaviour('accelerometer', {
		ontick: function(delta) {
			if (this.engine.accelerationX || this.engine.accelerationY || this.engine.accelerationZ) {
				this.trigger('acceleration',
					this.engine.accelerationX * delta,
					this.engine.accelerationY * delta,
					this.engine.accelerationZ * delta);
			}
		}
	});

	exports.Accelerometer = Accelerometer;

}(typeof(exports) !== 'undefined' ? exports : window));
