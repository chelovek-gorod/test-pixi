'use strict';

let VIEW_WIDTH, VIEW_HEIGHT, VIEW_CX, VIEW_CY, VIEW_RADIUS;
let tilesInRadius, tilesInViewLine, tilesInRadiusSize;

let tileSize = 420;

const resize = () => {
    VIEW_WIDTH = window.innerWidth;
    VIEW_HEIGHT = window.innerHeight;
    VIEW_CX = VIEW_WIDTH / 2;
    VIEW_CY = (VIEW_HEIGHT / 3) * 2;
    VIEW_RADIUS = Math.ceil(Math.sqrt((VIEW_CX ** 2) + (VIEW_CY ** 2)));
    tilesInRadius = Math.ceil(VIEW_RADIUS / tileSize);
    tilesInViewLine = 1 + (tilesInRadius * 2);
    tilesInRadiusSize = tilesInRadius * tileSize;
} 
window.addEventListener('resize', resize);
resize();

let app = new PIXI.Application({ width: VIEW_WIDTH, height: VIEW_HEIGHT });
document.body.appendChild(app.view);

const container = new PIXI.Container();
app.stage.addChild(container);




// Magically load the PNG asynchronously
let sprite = PIXI.Sprite.from('./src/images/plane_200x200.png');

app.stage.addChild(sprite);

// Add a variable to count up the seconds our demo has been running
let elapsed = 0.0;
// Tell our application's ticker to run a new callback every frame, passing
// in the amount of time that has passed since the last tick
app.ticker.add((delta) => {
  // Add the time to our total elapsed time
  elapsed += delta;
  // Update the sprite's X position based on the cosine of our elapsed time.  We divide
  // by 50 to slow the animation down a bit...
  sprite.x = 100.0 + Math.cos(elapsed/50.0) * 100.0;
});