'use strict';

const RAD = Math.PI / 180;

const CANVAS = document.createElement("canvas");
const ctx = CANVAS.getContext('2d');
document.body.append(CANVAS);

const tiles = new Image();
tiles.srcArr = [
    './src/images/tiles_morning_420_3x2.jpg',
    './src/images/tiles_evening_420_3x2.jpg'
];
tiles.usedSrc = 0;
tiles.src = tiles.srcArr[tiles.usedSrc];
tiles.setNextTiles = function() {
    tiles.usedSrc++;
    if (tiles.usedSrc == tiles.srcArr.length) tiles.usedSrc = 0;
    tiles.src = tiles.srcArr[tiles.usedSrc];
};
const tileSize = 420;
const lastTilePixel = tileSize - 1;

const map = [
    // mountains       forest       fields         City         forest    
    [{x: 1, y: 1}, {x: 2, y: 1}, {x: 0, y: 0}, {x: 1, y: 0}, {x: 2, y: 1}],
    //   forest        lake         forest       airport        fields
    [{x: 2, y: 1}, {x: 0, y: 1}, {x: 2, y: 1}, {x: 2, y: 0}, {x: 0, y: 0}],
    //   fields      mountains      fields         forest        lake
    [{x: 0, y: 0}, {x: 1, y: 1}, {x: 0, y: 0}, {x: 2, y: 1}, {x: 0, y: 1}],
    //   forest       airport        City        mountains      fields
    [{x: 2, y: 1}, {x: 2, y: 0}, {x: 1, y: 0}, {x: 1, y: 1}, {x: 0, y: 0}],
    //    City        fields       forest         lake         forest
    [{x: 1, y: 0}, {x: 0, y: 0}, {x: 2, y: 1}, {x: 0, y: 1}, {x: 2, y: 1}]
];
map.forEach(line => line.forEach(tile => {
    tile.x *= tileSize;
    tile.y *= tileSize;
    tile.lowClouds = [];
    tile.smoke = [];
    // tile.missiles = [];
    // tile.bullets = [];
    tile.enemies = [];
    tile.heighClouds = [];
}));
const mapSize = tileSize * map.length;
const lastMapTileIndex = map.length - 1;

let C_WIDTH, C_HEIGHT, VIEW_CX, VIEW_CY, VIEW_RADIUS;
let tilesInRadius, tilesInViewLine, tilesInRadiusSize;

const resize = () => {
    C_WIDTH = CANVAS.width = window.innerWidth;
    C_HEIGHT = CANVAS.height = window.innerHeight;
    VIEW_CX = C_WIDTH / 2;
    VIEW_CY = (C_HEIGHT / 3) * 2;
    VIEW_RADIUS = Math.ceil(Math.sqrt((VIEW_CX ** 2) + (VIEW_CY ** 2)));
    tilesInRadius = Math.ceil(VIEW_RADIUS / tileSize);
    tilesInViewLine = 1 + (tilesInRadius * 2);
    tilesInRadiusSize = tilesInRadius * tileSize;
} 

resize()
window.addEventListener('resize', resize)

/*****************
 *  RANDOM INTEGER
 */

function getRandomInt(size) {
    return Math.floor(Math.random() * size);
}

/*****************
 *  CONTROL
 */

// COMPASS
let compassAngleImage = new Image();
compassAngleImage.src = "./src/images/appliance_compass_angle_80.png";

let compassBaseImage = new Image();
compassBaseImage.src = "./src/images/appliance_compass_base_80.png";

function drawCompass() {

    ctx.drawImage(compassBaseImage, 0, 0, 80, 80, 0, 0, 80, 80);

    ctx.save();
    ctx.translate(40, 40);
    ctx.rotate( getAngle() );
    ctx.translate(-40, -40);

    ctx.drawImage(compassAngleImage, 0, 0, 80, 80, 0, 0, 80, 80);

    ctx.restore();
}

// PLANE
let planeImage = new Image();
planeImage.src = "./src/images/plane_160x160.png";

let frameSize = 160;
let frameHalfSize = 80;

let planeMapX = mapSize / 2 - 1;
let planeMapY = mapSize / 2 - 1;

const minSpeed = -2;
const cruisingSpeed = 0;
const maxSpeed = 5;

const turnSpeed = 0.3;
const accSpeed = 0.01;
const defSpeed = 0.002;

let speed = cruisingSpeed;
let direction = 0;

function getAngle() {
    return RAD * direction;
}

let toLeftIs = false;
let toRightIs = false;
let accelerationIs = false;
let slowdownIs = false;

function planeMove(tileX, tileY, tilePositionX, tilePositionY) {

    // ADD SMOKE
    let smokeAdd = Math.ceil(6 / speed);
    if (frame % smokeAdd === 0) {
        map[tileY][tileX].smoke.push( new Smoke(tilePositionX, tilePositionY, smokeImage) );

        /*
        let angle = getAngle();

        let x1 = tilePositionX + Math.sin(angle + 90 * RAD) * 60;
        let y1 = tilePositionY + Math.cos(angle + 90 * RAD) * 60;
        map[tileY][tileX].smoke.push( new Smoke(x1, y1, smokeImage) );

        let x2 = tilePositionX + Math.sin(angle + 90 * RAD) * -60;
        let y2 = tilePositionY + Math.cos(angle + 90 * RAD) * -60;
        map[tileY][tileX].smoke.push( new Smoke(x2, y2, smokeImage) );
        */
    }

    // TEST PLANE CONTROL
    if (accelerationIs != slowdownIs) {
        if (accelerationIs && speed < maxSpeed) speed = ((speed + accSpeed) < maxSpeed) ? (speed + accSpeed) : maxSpeed;
        if (slowdownIs && speed > minSpeed) speed = ((speed - accSpeed) > minSpeed) ? (speed - accSpeed) : minSpeed;
    } else if (speed != cruisingSpeed) {
        if (speed < cruisingSpeed) speed = ((speed + defSpeed) < cruisingSpeed) ? (speed + defSpeed) : cruisingSpeed;
        if (speed > cruisingSpeed) speed = ((speed - defSpeed) > cruisingSpeed) ? (speed - defSpeed) : cruisingSpeed;
    }
    
    // UPDATE PLANE X AND Y
    let angle = getAngle();
    planeMapX -= Math.sin(angle) * speed;
    planeMapY -= Math.cos(angle) * speed;
    
    if (planeMapX < 0) planeMapX += mapSize;
    if (planeMapX >= mapSize) planeMapX = planeMapX - mapSize;
    if (planeMapY < 0) planeMapY += mapSize;
    if (planeMapY >= mapSize) planeMapY = planeMapY - mapSize;

    // UPDATE PLANE TURN FRAMES
    if (toLeftIs != toRightIs) {
        if (toRightIs) {
            direction -= turnSpeed
        } else {
            direction += turnSpeed
        }
    }
    
}

document.addEventListener('keydown', (event) => {
    switch(event.code) {
        case 'KeyA' : toLeftIs = true; break;
        case 'KeyD' : toRightIs = true; break;
        case 'KeyW' : accelerationIs = true; break;
        case 'KeyS' : slowdownIs = true; break;
    
        case 'ArrowLeft' : toLeftIs = true; break;
        case 'ArrowRight' : toRightIs = true; break;
        case 'ArrowUp' : accelerationIs = true; break;
        case 'ArrowDown' : slowdownIs = true; break;
    }
});
  
document.addEventListener('keyup', (event) => {
    switch(event.code) {
        case 'KeyA' : toLeftIs = false; break;
        case 'KeyD' : toRightIs = false; break;
        case 'KeyW' : accelerationIs = false; break;
        case 'KeyS' : slowdownIs = false; break;
    
        case 'ArrowLeft' : toLeftIs = false; break;
        case 'ArrowRight' : toRightIs = false; break;
        case 'ArrowUp' : accelerationIs = false; break;
        case 'ArrowDown' : slowdownIs = false; break;

        case 'KeyB' : tiles.setNextTiles(); break;
    }
    console.log('keypress', event.code);
});

/*****************
 *  ENEMIES
 */

const enemyImagesArr = [];

const enemyImage1 = new Image();
enemyImage1.src = './src/images/enemy_1_160x160.png';
enemyImagesArr.push(enemyImage1);

const enemyImage2 = new Image();
enemyImage2.src = './src/images/enemy_2_160x160.png';
enemyImagesArr.push(enemyImage2);

const enemyImage3 = new Image();
enemyImage3.src = './src/images/enemy_3_160x160.png';
enemyImagesArr.push(enemyImage3);

const enemyImage4 = new Image();
enemyImage4.src = './src/images/enemy_4_160x160.png';
enemyImagesArr.push(enemyImage4);

const enemyImage5 = new Image();
enemyImage5.src = './src/images/enemy_5_160x160.png';
enemyImagesArr.push(enemyImage5);

const enemyImage6 = new Image();
enemyImage6.src = './src/images/enemy_6_160x160.png';
enemyImagesArr.push(enemyImage6);

const enemyImage7 = new Image();
enemyImage7.src = './src/images/enemy_7_160x160.png';
enemyImagesArr.push(enemyImage7);

const enemyImage8 = new Image();
enemyImage8.src = './src/images/enemy_8_160x160.png';
enemyImagesArr.push(enemyImage8);

const enemiesSmokePoints = [
    [0],
    [20, -20]
];
 
class Enemy {
 
    constructor(image, smokeArr, x, y, direction, speed) {
        this.image = image;
        this.angle = RAD * (direction);
        this.drawAngle = RAD * (direction+180);
        this.speed = speed;
        this.size = 160;
        this.halfSize = 80;
        this.x = x;
        this.y = y;
        this.turnTimeout = 0;
        this.onTurnIs = false;
        this.smokePoints = smokeArr;
    }
 
    draw(pointX, pointY) {

        let myX = pointX + this.x;
        let myY = pointY + this.y;

        ctx.save();
        ctx.translate(myX, myY);
        ctx.rotate(-this.drawAngle);
        ctx.translate(-myX, -myY);

        ctx.drawImage(this.image, 0, 0, this.size, this.size,
            myX - this.halfSize, myY - this.halfSize, this.size, this.size);

        ctx.restore();

    }
 
    fly(tileX, tileY) {

        // ADD SMOKE
        let smokeAdd = Math.ceil(6 / this.speed);
        if (frame % smokeAdd === 0) {
            if (this.smokePoints.length < 2) map[tileY][tileX].smoke.push( new Smoke(this.x, this.y, smokeImage) );
            else {
                this.smokePoints.forEach(x => {
                    let xx = this.x + Math.sin(this.angle + 90 * RAD) * x;
                    let yy = this.y + Math.cos(this.angle + 90 * RAD) * x;

                    map[tileY][tileX].smoke.push( new Smoke(xx, yy, smokeImage) );
                });
            }
        }

        // FLY
        this.x += Math.sin(this.angle) * this.speed;
        this.y += Math.cos(this.angle) * this.speed;

        let newTileX = null, newTileY = null;
        if (this.x < 0) {
            this.x = tileSize + this.x;
            newTileX = (tileX > 0) ? tileX - 1 : lastMapTileIndex;
        } else if (this.x > lastTilePixel) {
            this.x = this.x - tileSize;
            newTileX = (tileX < lastMapTileIndex) ? tileX + 1 : 0;
        }

        if (this.y < 0) {
            this.y = tileSize + this.y;
            newTileY = (tileY > 0) ? tileY - 1 : lastMapTileIndex;
        } else if (this.y > lastTilePixel) {
            this.y = this.y - tileSize;
            newTileY = (tileY < lastMapTileIndex) ? tileY + 1 : 0;
        }

        if (newTileX !== null || newTileY !== null) {
            map[tileY][tileX].enemies = map[tileY][tileX].enemies.filter(enemy => enemy != this);

            if (newTileX !== null && newTileY !== null) map[newTileY][newTileX].enemies.push(this);
            else if (newTileX !== null) map[tileY][newTileX].enemies.push(this);
            else if (newTileY !== null) map[newTileY][tileX].enemies.push(this);
        }

    }
 
};
 
function setEnemies() {
    for (let i = 0; i < 16; i++) {
        let image = enemyImagesArr[i % enemyImagesArr.length];
        let smokeArr = enemiesSmokePoints[i % 2];
        let enemyX = getEnemyPosition();
        let enemyY = getEnemyPosition();
        let enemyPositionX = enemyX % tileSize; // px
        let enemyTileX = Math.floor(enemyX / tileSize); // tiles
        let enemyPositionY = enemyY % tileSize; // px
        let enemyTileY = Math.floor(enemyY / tileSize); // tiles

        let enemy = new Enemy(image, smokeArr, enemyPositionX, enemyPositionY, getRandomInt(360), getEnemySpeed());
        map[enemyTileY][enemyTileX].enemies.push(enemy);

        console.log(smokeArr);
    }
}
setEnemies();
 
function getEnemySpeed() {
    return 2 + getRandomInt(2);
    //return 1;
}
 
function getEnemyPosition() {
    return getRandomInt(mapSize) - 1;
}

function getNextTurnTimeout() {
    return 2000 + getRandomInt(5000);
}

function getTurnTimeout() {
    return 1500 + getRandomInt(3000);
}
/*****************
 *  CLOUDS
 */

const cloudImage64 = new Image();
cloudImage64.src = './src/images/clouds_64.png';

const cloud64Width = 600;
const cloud64Height = 400;
const cloud64HalfWidth = 300;
const cloud64HalfHeight = 200;

const cloudImage83 = new Image();
cloudImage83.src = './src/images/clouds_83.png';

const cloud83Width = 800;
const cloud83Height = 300;
const cloud83HalfWidth = 400;
const cloud83HalfHeight = 150;

class Cloud {

    constructor(type, img, speed, x, y) {
        this.img = (type === 64) ? cloudImage64 : cloudImage83;
        this.frameX = img * ((type === 64) ? cloud64Width : cloud83Width);
        this.frameY = getRandomInt(2) * ((type === 64) ? cloud64Height : cloud83Height);
        this.width = (type === 64) ? cloud64Width : cloud83Width;
        this.height = (type === 64) ? cloud64Height : cloud83Height;
        this.halfWidth = (type === 64) ? cloud64HalfWidth : cloud83HalfWidth;
        this.halfHeight = (type === 64) ? cloud64HalfHeight : cloud83HalfHeight;
        this.x = x - ((type === 64) ? cloud64HalfWidth : cloud83HalfWidth);
        this.y = y - ((type === 64) ? cloud64HalfHeight : cloud83HalfHeight);

        this.speed = speed;
    }

    draw(pointX, pointY) {
        ctx.drawImage(this.img, this.frameX, this.frameY, this.width, this.height,
            pointX + this.x, pointY + this.y, this.width, this.height);
    }

    fly(tileX, tileY, type) {
        this.x -= this.speed;
        if (this.x < -this.halfWidth) {
            this.x = tileSize + this.x;
            let newTileX = (tileX > 0) ? tileX - 1 : lastMapTileIndex;

            if (type == 'low') {
                map[tileY][tileX].lowClouds = map[tileY][tileX].lowClouds.filter(cloud => cloud != this);
                map[tileY][newTileX].lowClouds.push(this);
            } else {
                map[tileY][tileX].heighClouds = map[tileY][tileX].heighClouds.filter(cloud => cloud != this);
                map[tileY][newTileX].heighClouds.push(this);
            }
        }
    }

};

function setClouds() {

    for (let i = 0; i < 6; i++) {
        let cloudMapX = getCloudPosition();
        let cloudMapY = getCloudPosition();
        let cloudPositionX = cloudMapX % tileSize; // px
        let cloudTileX = Math.floor(cloudMapX / tileSize); // tiles
        let cloudPositionY = cloudMapY % tileSize; // px
        let cloudTileY = Math.floor(cloudMapY / tileSize); // tiles
        map[cloudTileY][cloudTileX].lowClouds.push( new Cloud(64, i, getCloudSpeed(), cloudPositionX, cloudPositionY) );
    }

    for (let i = 0; i < 4; i++) {
        let cloudMapX = getCloudPosition();
        let cloudMapY = getCloudPosition();
        let cloudPositionX = cloudMapX % tileSize; // px
        let cloudTileX = Math.floor(cloudMapX / tileSize); // tiles
        let cloudPositionY = cloudMapY % tileSize; // px
        let cloudTileY = Math.floor(cloudMapY / tileSize); // tiles
        map[cloudTileY][cloudTileX].heighClouds.push( new Cloud(83, i, getCloudSpeed(), cloudPositionX, cloudPositionY) );
    }

}
setClouds(); setClouds();

function getCloudSpeed() {
    return (2 + getRandomInt(6)) / 10;
}

function getCloudPosition() {
    return getRandomInt(mapSize) - 1;
}

/*****************
 *  PLANE SMOKE
 */

const smokeImage = new Image();
smokeImage.src = './src/images/smoke32_10x8.png';

const smokeWidth = 32;
const smokeHeight = 32;
const smokeStepsX = 10;
const smokeStepsY = 8;

class Smoke {

    constructor(x, y, image) {
        this.image = image
        this.x = x - 16;  
        this.y = y - 16;
        this.frameX = 0;
        this.frameY = 0;
        this.maxFrameX = smokeWidth * smokeStepsX;
        this.maxFrameY = smokeHeight * smokeStepsY;
    }

    draw(pointX, pointY, tileX, tileY) {
        ctx.drawImage(this.image, this.frameX, this.frameY, smokeWidth, smokeHeight,
            pointX + this.x, pointY + this.y, smokeWidth, smokeHeight);
        if (frame % 6 === 0) {
            this.frameX += smokeWidth;

            if (this.frameX === this.maxFrameX) {
                this.frameX = 0;
                this.frameY += smokeHeight;

                if (this.frameY === this.maxFrameY) {
                    map[tileY][tileX].smoke = map[tileY][tileX].smoke.filter(smoke => smoke != this);
                }
            }
        }
    }

};

/*****************
 *  DRAW 
 */

function drawGround(startPointX, startPointY, startTileX, startTileY) {

    let pointX = startPointX; // px
    let tileX = startTileX; // tiles

    let pointY = startPointY; // px
    let tileY = startTileY; // tiles

    for (let yy = 0; yy < tilesInViewLine; yy++) {
        for (let xx = 0; xx < tilesInViewLine; xx++) {
            ctx.drawImage(
                tiles, map[tileY][tileX].x, map[tileY][tileX].y,
                tileSize, tileSize, pointX, pointY, tileSize, tileSize);

            pointX += tileSize;
            tileX++;
            if (tileX > lastMapTileIndex) tileX = 0;
        }
        pointX = startPointX;
        tileX = startTileX;
        pointY += tileSize;
        tileY++;
        if (tileY > lastMapTileIndex) tileY = 0;
    }

}

function drawLowClouds(startPointX, startPointY, startTileX, startTileY) {

    let pointX = startPointX; // px
    let tileX = startTileX; // tiles

    let pointY = startPointY; // px
    let tileY = startTileY; // tiles

    for (let yy = 0; yy < tilesInViewLine; yy++) {
        for (let xx = 0; xx < tilesInViewLine; xx++) {
            map[tileY][tileX].lowClouds.forEach( o => o.draw(pointX, pointY) );
            pointX += tileSize;
            tileX++;
            if (tileX > lastMapTileIndex) tileX = 0;
        }
        pointX = startPointX;
        tileX = startTileX;
        pointY += tileSize;
        tileY++;
        if (tileY > lastMapTileIndex) tileY = 0;
    }

    // FLY
    for (let tileYY = 0; tileYY < map.length; tileYY++) {
        for (let tileXX = 0; tileXX < map.length; tileXX++) {
            map[tileYY][tileXX].lowClouds.forEach( o => o.fly(tileXX, tileYY, 'low') );
        }
    }

}

function drawSmoke(startPointX, startPointY, startTileX, startTileY) {

    let pointX = startPointX; // px
    let tileX = startTileX; // tiles

    let pointY = startPointY; // px
    let tileY = startTileY; // tiles

    for (let yy = 0; yy < tilesInViewLine; yy++) {
        for (let xx = 0; xx < tilesInViewLine; xx++) {
            map[tileY][tileX].smoke.forEach( o => o.draw(pointX, pointY, tileX, tileY) );
            pointX += tileSize;
            tileX++;
            if (tileX > lastMapTileIndex) tileX = 0;
        }
        pointX = startPointX;
        tileX = startTileX;
        pointY += tileSize;
        tileY++;
        if (tileY > lastMapTileIndex) tileY = 0;
    }

}

function drawEnemies(startPointX, startPointY, startTileX, startTileY) {

    let pointX = startPointX; // px
    let tileX = startTileX; // tiles

    let pointY = startPointY; // px
    let tileY = startTileY; // tiles

    for (let yy = 0; yy < tilesInViewLine; yy++) {
        for (let xx = 0; xx < tilesInViewLine; xx++) {
            map[tileY][tileX].enemies.forEach( o => o.draw(pointX, pointY) );
            pointX += tileSize;
            tileX++;
            if (tileX > lastMapTileIndex) tileX = 0;
        }
        pointX = startPointX;
        tileX = startTileX;
        pointY += tileSize;
        tileY++;
        if (tileY > lastMapTileIndex) tileY = 0;
    }

    // FLY
    for (let tileYY = 0; tileYY < map.length; tileYY++) {
        for (let tileXX = 0; tileXX < map.length; tileXX++) {
            map[tileYY][tileXX].enemies.forEach( o => o.fly(tileXX, tileYY) );
        }
    }

}

function drawHeighClouds(startPointX, startPointY, startTileX, startTileY) {

    let pointX = startPointX; // px
    let tileX = startTileX; // tiles

    let pointY = startPointY; // px
    let tileY = startTileY; // tiles

    for (let yy = 0; yy < tilesInViewLine; yy++) {
        for (let xx = 0; xx < tilesInViewLine; xx++) {
            map[tileY][tileX].heighClouds.forEach( o => o.draw(pointX, pointY) );
            pointX += tileSize;
            tileX++;
            if (tileX > lastMapTileIndex) tileX = 0;
        }
        pointX = startPointX;
        tileX = startTileX;
        pointY += tileSize;
        tileY++;
        if (tileY > lastMapTileIndex) tileY = 0;
    }

    // FLY
    for (let tileYY = 0; tileYY < map.length; tileYY++) {
        for (let tileXX = 0; tileXX < map.length; tileXX++) {
            map[tileYY][tileXX].heighClouds.forEach( o => o.fly(tileXX, tileYY, 'heigh') );
        }
    }

}

/*********************
 *    ANIMATION
 */

let lastAnimateTimestamp = performance.now();
let frame = 0;

let mostLongFrameTimeout = 0;

function animate() {

    // COUNT DELTA TIME
    let timeStamp = performance.now();
    let animateTimeout = timeStamp - lastAnimateTimestamp;
    lastAnimateTimestamp = timeStamp;

    // COUNT ENVIRONMENTS COORDINATES
    let tilePositionX = planeMapX % tileSize; // px
    let tileX = Math.floor(planeMapX / tileSize); // tiles

    let tilePositionY = planeMapY % tileSize; // px
    let tileY = Math.floor(planeMapY / tileSize); // tiles

    let startTileX = tileX - tilesInRadius; // tiles
    let startTileY = tileY - tilesInRadius; // tiles

    while (startTileX < 0) startTileX += map.length; // tiles
    while (startTileY < 0) startTileY += map.length; // tiles

    let startPointX = VIEW_CX - (tilesInRadiusSize + tilePositionX); // px
    let startPointY = VIEW_CY - (tilesInRadiusSize + tilePositionY); // px

    // CLEAR CANVAS
    ctx.clearRect(0, 0, C_WIDTH, C_HEIGHT);

    // DRAW
    ctx.save();
    ctx.translate(VIEW_CX, VIEW_CY);
    ctx.rotate( getAngle() );
    ctx.translate(-VIEW_CX, -VIEW_CY);

    drawGround(startPointX, startPointY, startTileX, startTileY);
    drawLowClouds(startPointX, startPointY, startTileX, startTileY);
    drawSmoke(startPointX, startPointY, startTileX, startTileY);

    drawEnemies(startPointX, startPointY, startTileX, startTileY);
    
    ctx.restore();
    
    ctx.drawImage(planeImage, 0, 0, frameSize, frameSize,
        VIEW_CX - frameHalfSize, VIEW_CY - frameHalfSize, frameSize, frameSize);

    ctx.save();
    ctx.translate(VIEW_CX, VIEW_CY);
    ctx.rotate( getAngle() );
    ctx.translate(-VIEW_CX, -VIEW_CY);

    drawHeighClouds(startPointX, startPointY, startTileX, startTileY);

    ctx.restore();

    drawCompass();

    // MOVING
    planeMove(tileX, tileY, tilePositionX, tilePositionY);

    // test performance
    let _time_ = performance.now() - timeStamp;
    if (_time_ > mostLongFrameTimeout) mostLongFrameTimeout = _time_;
    if (frame % 600 == 0) console.log('mostLongFrameTimeout', mostLongFrameTimeout);

    // UPDATE FRAME
    frame++;
    window.requestAnimationFrame(animate);
}
window.requestAnimationFrame(animate);