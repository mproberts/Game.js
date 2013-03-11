if (typeof(require) !== 'undefined') {
	var fs = require('fs');
	var utils = require('./utils.js');

	Utils = utils.Utils;
}

(function(exports) {

	var Resources = function() {
		this._cache = {};
	};

	Resources.prototype.image = function(url, callback) {
		var cache = this._cache[url];

		callback = callback || function() {};

		if (typeof(cache) === 'undefined') {
			cache = {};
			cache.callback = Utils.createMulticall();

			this._cache[url] = cache;
		}

		var img = cache.img;

		if (cache.pending) {
			// load already pending, bind the callback
			cache.callback.add(callback);
		}
		else if (typeof(img) === 'undefined') {
			// start loading the image
			img = new Image();

			cache.img = img;
			cache.callback.add(callback);

			if (typeof(fs) !== 'undefined') {
				fs.readFile(__dirname + url, function(err, data) {
					cache.pending = false;

					if (err) {
						cache.error = true;
						cache.callback(null, url);
					}
					else {
						img.src = data;

						cache.x = 0;
						cache.y = 0;
						cache.width = img.width;
						cache.height = img.height;

						cache.callback(cache, url);
					}
				});
			}
			else {
				cache.pending = true;
				cache.img = img;

				img.addEventListener('load', function() {
					cache.pending = false;

					cache.x = 0;
					cache.y = 0;
					cache.width = img.width;
					cache.height = img.height;

					cache.callback(cache, url);
				}, false);

				img.addEventListener('error', function() {
					cache.pending = false;
					cache.error = true;

					cache.callback(null, url);
				}, false);

				img.src = url;
			}
		}
		else {
			if (cache.error) {
				cache = null;
			}

			// loading already complete, callback immediately
			callback(cache, url);
		}
	};

	exports.Resources = Resources;
	
} (typeof(exports) !== 'undefined' ? exports : window));
