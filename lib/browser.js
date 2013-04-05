var gg = new Game();

gg.behaviour(Mass);
gg.behaviour(Accelerometer);
gg.behaviour(Collider);
gg.behaviour(Sprite);
gg.behaviour(Text);

gg.on('tick', Collider.handleCollisions);

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
