var gg = new Engine(new ClockTimer());

gg.behaviour(Mass);
gg.behaviour(Accelerometer);

var faked = false;
var name;
var version;
var match;
var userAgent = navigator.userAgent;

if (match = /\bCPU.*OS (\d+(_\d+)?)/i.exec(userAgent)) {
	name    = 'ios';
	version = match[1].replace('_', '.');
}
else if (match = /\bAndroid (\d+(\.\d+)?)/.exec(userAgent)) {
	name    = 'android';
	version = match[1];
}

gg.platform = {
	faked: faked,
	name: name,
	versionString: version,
	version: version && parseFloat(version)
};

gg.platform.android = name === 'android';
gg.platform.iOS = name === 'ios';

window.onresize = function() {
	gg.updateDisplay(document.documentElement.offsetWidth, document.documentElement.offsetHeight);
};
