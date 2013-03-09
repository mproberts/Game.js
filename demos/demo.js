gg.setCanvas(document.getElementById('game'));

gg.start();

gg.backgroundColor = '#ff0000';

gg.ease({
	backgroundColor: '#ff00ff'
}, 10000, easeOutBounce);
