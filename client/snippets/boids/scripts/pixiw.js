'use strict';

// Create a global reference to the game so we can reference it.
var PixiGame = PixiGame || {};

// Used by pixi
PixiGame.stage = null;
PixiGame.renderer = null;

// Game Loop Controller
PixiGame.gameLoopController = null;

// Create a reference to the scene controller
PixiGame.sceneController = null;

PixiGame.GameLoopController = function() {
    this._isGameActive = false;
    this._fps = 60;
    this._updateInterval = null;
}

PixiGame.GameLoopController.constructor = PixiGame.GameLoopController;

PixiGame.GameLoopController.prototype.update = function() {
    if (!this._isGameActive) {
        return;
    }

    PixiGame.renderer.render(PixiGame.stage);
    PixiGame.sceneController.update();
}

PixiGame.GameLoopController.prototype.start = function() {
    if (this._isGameActive) {
        return;
    }

    this._isGameActive = true;

    // Create the game loop
    this._updateInterval = setInterval(function() {
        this.update();
    }.bind(this), 1000 / this._fps);
};

PixiGame.GameLoopController.prototype.pause = function() {
    if (!this._isGameActive) {
        return;
    }

    clearInterval(this._updateInterval);
    this._isGameActive = false;
};

Object.defineProperty(PixiGame.GameLoopController.prototype, 'isPaused', {
    get: function() {
        return !this._isGameActive;
    },
});

PixiGame.SceneController = function(Scene) {

    this._currentScene = new Scene();
    this._previousScene = null;

    PixiGame.stage.addChild(this._currentScene);
}

PixiGame.SceneController.constructor = PixiGame.SceneController;

PixiGame.SceneController.prototype.update = function() {
    this._currentScene.update();
}

PixiGame.SceneController.prototype.requestSceneChange = function(Scene) {

    if (this._currentScene !== null) {
        this._previousScene = this._currentScene;
        this._previousScene.destroy();
        PixiGame.stage.removeChild(this._previousScene);
    }

    this._currentScene = new Scene();
    PixiGame.stage.addChild(this._currentScene);
}

PixiGame.MainMenuScene = function() {
    PIXI.Graphics.call(this);

    this._playButton = null;
    this.setup();
};

PixiGame.MainMenuScene.constructor = PixiGame.MainMenuScene;
PixiGame.MainMenuScene.prototype = Object.create(PIXI.Graphics.prototype);

PixiGame.MainMenuScene.prototype.setup = function() {
    this._playButton = new PIXI.Sprite.fromImage('images/game/play-game-btn.png');
    this._playButton.anchor = new PIXI.Point(0.5, 0.5);
    this._playButton.position.x = 320;
    this._playButton.position.y = 480;
    this._playButton.interactive = true;
    this._playButton.touchstart = this._playButton.mousedown = this.handlePlayButtonPressed.bind(this);
    this.addChild(this._playButton);
}

PixiGame.MainMenuScene.prototype.handlePlayButtonPressed = function(event) {
    PixiGame.sceneController.requestSceneChange(PixiGame.GameScene);
}

PixiGame.MainMenuScene.prototype.update = function() {}

PixiGame.MainMenuScene.prototype.destroy = function() {
    this.removeChildren();
    this._playButton = null;
}

PixiGame.GameScene = function() {
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.time = 0;
    this.mouse = new Boid(); //https://www.npmjs.com/package/boid
    this.NUM_BOIDS = 0;
    this.START_BOIDS = 15;
    this.flockers = []; //Pboids
    this.boids = []; //Boids


    PIXI.Graphics.call(this);
    this.setup();
};

PixiGame.GameScene.constructor = PixiGame.GameScene;
PixiGame.GameScene.prototype = Object.create(PIXI.Graphics.prototype);

PixiGame.GameScene.prototype.setup = function() {
    for (var i = 0; i < this.START_BOIDS; i++) {
        this.addBoid();
    };
}
PixiGame.GameScene.prototype.addBoid = function() {
    var index = this.NUM_BOIDS;
    this.boids[index] = new Boid(); //create new BOID
    this.boids[index].setBounds(this.w, this.h);
    this.boids[index].position.x = this.w * Math.random();
    this.boids[index].position.y = this.h * Math.random();
    this.boids[index].velocity.x = 20 * Math.random() - 10;
    this.boids[index].velocity.y = 20 * Math.random() - 10;
    this.flockers[index] = new PixiGame.PBoid(index); //Graph representation
    this.addChild(this.flockers[index]); //to be rendered
    this.NUM_BOIDS++;
}


PixiGame.GameScene.prototype.update = function() {
    this.time += 0.1;
    for (var i = 0; i < this.NUM_BOIDS; i++) {
        if (i == 0) {
            this.boids[0].position.x = document.posx;
            this.boids[0].position.y = document.posy;
        } else {
            this.boids[i].pursue(this.boids[0]);
        }
        this.boids[i].flock(this.boids); //set the flock        
        this.boids[i].update(); //calculate new position
        this.flockers[i].setPosition(this.boids[i].position); //copy position from boid to Pboid        
        this.flockers[i].update(this.time); //update
    };
}

PixiGame.GameScene.prototype.destroy = function() {
    this.removeChildren();
}



$(document).mousemove(function(e) {
    document.posx = e.pageX;
    document.posy = e.pageY;
})

document.addEventListener('DOMContentLoaded', function() {

    //
    PixiGame.renderer = new PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight);
    PixiGame.renderer.view.setAttribute('class', 'renderer');
    document.body.appendChild(PixiGame.renderer.view);

    //
    PixiGame.stage = new PIXI.Container();

    // 
    //PixiGame.sceneController = new PixiGame.SceneController(PixiGame.MainMenuScene);
    PixiGame.sceneController = new PixiGame.SceneController(PixiGame.GameScene);

    //
    PixiGame.gameLoopController = new PixiGame.GameLoopController();
    PixiGame.gameLoopController.start();
});

var letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"

PixiGame.PBoid = function(index) {
    this.index = index;
    PIXI.Graphics.call(this);
    this.setup();

};
PixiGame.PBoid.constructor = PixiGame.PBoid;
PixiGame.PBoid.prototype = Object.create(PIXI.Graphics.prototype);

PixiGame.PBoid.prototype.setup = function() {
    //console.info('PBoid ' +this.index+ ' setup');
    //this.beginFill(0xFFFFFF);
    //this.drawCircle(0, 0, 2);
    //this.endFill();
    this.addChild(new PIXI.Text(letters[this.index], {
        font: '20px Arial',
        fill: 0xff1010,
        align: 'center'
    }));
}

PixiGame.PBoid.prototype.update = function(time) {
    //console.info('PBoid ' +this.index+ ' update');	
}

PixiGame.PBoid.prototype.setPosition = function(pos) {
    this.position.x = pos.x;
    this.position.y = pos.y;
};

PixiGame.PBoid.prototype.destroy = function() {
    this.removeChildren();
}


var rand = function(min, max) {
    return Math.floor(Math.random() * max) + min;
}
