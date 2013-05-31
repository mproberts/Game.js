# Game.js

Simple name, simple engine.

Game.js is a basic JavaScript game engine designed to work best on mobile devices. This is a work in progress, documentation and demos will be available soon.

## Getting Started

```html
<!DOCTYPE html>
<html manifest="cache.manifest">
<head>
  <meta name="viewport" content="width=device-width, maximum-scale=1.0, user-scalable=no">
  <style>
  ::-webkit-scrollbar {
    width: 0 !important
  }

  html, body {
    margin: 0px;
    padding: 0px;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background-color: #000;
  }
  canvas {
    position: absolute;
    left: 0px;
    right: 0px;
    top: 0px;
    bottom: 0px;
    margin: 0px;
    padding: 0px;
    width: 100%;
    height: 100%;
  }
  </style>
  <title>Kingdom Clash</title>
</head>
<body>
  <canvas id="game"></canvas>
  
  <script type="text/javascript" src="game.js">
  <script type="text/javascript">
    var game = new Game();
    
    game.view.scaleMode = Game.ScaleMode.FillWidth;
    game.setSize(960, 640);
    
    game.setCanvas(document.getElementById('game'));
    
    game.addChild(game.object('canvas-text', {
      color: '#000',
      font: 'bold 32px Helvetica, Roboto, Arial, sans-serif',
      x: 0, y: 0,
      text: 'Hello World'
    }));
    
    // get it started
    game.start();
  </script>
</body>
</html>
```
