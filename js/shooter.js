/* create an object to hold all images so they are only generated once.  this type of object is called a 'singleton'
*/

var imageRepository = new function() {
	// define images
	this.background = new Image();
	this.spaceship = new Image();
	this.bullet = new Image();
	this.enemy = new Image();
	this.enemyBullet = new Image();

	// ensure all images have loaded before starting the game
	var numImages = 5;
	var numLoaded = 0;
	function imageLoaded() {
		numLoaded++;
		if(numLoaded === numImages) {
			window.init();
		}
	}

	this.background.onload = function() {
		imageLoaded();
	}
	this.spaceship.onload = function() {
		imageLoaded();
	}

	this.bullet.onload = function() {
		imageLoaded();
	}

	this.enemy.onload = function() {
		imageLoaded();
	}

	this.enemyBullet.onload = function() {
		imageLoaded();
	}

	// set images src
	this.background.src = "images/bg.png";
	this.spaceship.src = "images/ship.png";
	this.bullet.src = "images/bullet.png";
	this.enemy.src = "images/enemy.png";
	this.enemyBullet.src = "images/bullet_enemy.png";
}

/*	create a drawable object that will be the base cass for all drawable objects in the game.  set up default variables so that all child objects will inherit, as well as the default functions.
*/

function Drawable() {
	this.init = function(x, y, width, height) {
		// declare default variables
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
	}

/*	this.speed = 0;
	this.canvasWidth = 0;
	this.canvasHeight = 0;

	// define abstract function to be implemented in child objects
	this.draw = function() {
	};
*/
}

/*	create the background object which will become a child of the drawable object.  
	the background is drawn on the 'background' canvas and creates the illusion of omving by panning the image.
*/

function Background() {
	this.speed = 1;	// redefine the speed of panning for the background

	//	implement abstract function
	this.draw = function() {
		// background panning
		this.y += this.speed;
		this.context.drawImage(imageRepository.background, this.x, this.y);

		// draw another image at the top edge of the first image
		this.context.drawImage(imageRepository.background, this.x, this.y - this.canvasHeight);

		// reset the screen once it scrolls to the end
		if (this.y >= this.canvasHeight)
			this.y = 0;
	};
}

Background.prototype = new Drawable();

/*	requestAnim shim layer by paul irish.  
	finds the first api that works to optimize the animation loop, otherwise defaults to setTimeout().
*/

window.requestAnimFrame = ( function() {
	return window.requestAnimationFrame 	||
		window.webkitRequestAnimationFrame 	||
		window.mozRequestAnimationFrame 		||
		window.oRequestAnimationFrame 		||
		window.msRequestAnimationFrame 		||
		function(/* function */ callback, /* DOMElement */ element) {
			window.setTimeout(callback, 1000 / 60);
		};
})();

//	custom Pool object.  holds bullet objects to be managed to prevent garbage collection
function Pool(maxSize) {
	var size = maxSize;	// max bullets allowed in the pool
	var pool = [];

	// populates the pool array with Bullet objects
	this.init = function(object) {
		if (object == "bullet") {
			for (var i=0;i<size;i++) {
				// initialize the bullet object
				var bullet = new Bullet("bullet");
				bullet.init(0,0, imageRepository.bullet.width,
								imageRepository.bullet.height);
				pool[i] = bullet;
			}
		}
		else if (object == "enemy") {
			for (var i=0; i < size; i++) {
				var enemy = new Enemy();
				enemy.init(0,0, imageRepository.enemy.width, imageRepository.enemy.height);
				pool[i] = enemy;
			}
		}
		else if (object == "enemyBullet") {
			for (var i = 0; i < size; i++) {
				var bullet = new Bullet("enemyBullet");
				bullet.init(0,0, imageRepository.enemyBullet.width, imageRepository.enemyBullet.height);
				pool[i] = bullet;
			}
		}
	};

	//	grabs the last item in the list and initializes it and pushes it to the front of the array

	this.get = function(x, y, speed) {
		if (!pool[size - 1].alive) {
			pool[size - 1].spawn(x, y, speed);
			pool.unshift(pool.pop());
		}
	};

	/* Used for the ship to be abe to get two bullets at once.
		if only the get() function is used twice, the ship is able to fire
		and only have 1 bullet spawn instead of 2
	*/
	this.getTwo = function(x1, y1, speed1, x2, y2, speed2) {
		if(!pool[size - 1].alive &&
			!pool[size -2].alive) {
			 this.get(x1, y1, speed1);
			 this.get(x2, y2, speed2);
			}
	};

	// draws any in-use bullets.  if a bullet goes off the screen, clears it and pushes it to the front of the array
	this.animate = function() {
		for (var i=0;i<size;i++) {
			if (pool[i].alive) {
				if (pool[i].draw()) {
					pool[i].clear();
					pool.push((pool.splice(i,1))[0]);
				}
			}
			else
				break;
		}
	};
}


// bullet object for both ship and enemy firing.  bullets drawn on 'main' canvas
function Bullet(object) {
	this.alive = false;	// is true if the bullet is currently in use
	var self = object;

	// sets the bullet values
	this.spawn = function(x , y, speed) {
		this.x = x;
		this.y = y;
		this.speed = speed;
		this.alive = true;	// boolean value
	};

	/*	uses a 'dirty rectangle' to erase the bullet and moves it.
		returns true if the bullet moved off the screen, indicating that
		the bullet is ready to be cleared by the pool, otherwise draws the bullet
	*/
	this.draw = function() {
		this.context.clearRect(this.x, this.y, this.width, this.height);
		this.y -= this.speed;
		if (self === "bullet" && this.y <= 0 - this.height) {
			return true;
		}
		else if (self === "enemyBullet" && this.y >= this.canvasHeight) {
			return true;
		}
		else {
			if (self == "bullet") {
				this.context.drawImage(imageRepository.bullet, this.x, this.y);
			}
			else if (self === "enemyBullet") {
				this.context.drawImage(imageRepository.enemyBullet, this.x, this.y);
			}
			
			return false;
		}
	};

	// resets the bullet values
	this.clear = function() {
		this.x = 0;
		this.y = 0;
		this.speed = 0;
		this.alive = false;
	};
}

Bullet.prototype = new Drawable();

/* create the ship object that the player controls.  the ship
	is drawn on the 'ship' canvas and uses dirty retanges to move
	around the screen
*/
function Ship() {
	this.speed = 3;
	this.bulletPool = new Pool(30);
	this.bulletPool.init("bullet");

	var fireRate = 15;
	var counter = 0;

	this.draw = function() {
		this.context.drawImage(imageRepository.spaceship, this.x, this.y);
	};
	this.move = function() {
		counter++;
		// determine if the action is move action
		if (KEY_STATUS.left || KEY_STATUS.right ||
			KEY_STATUS.down || KEY_STATUS.up) {
			// the ship moved, so erase its current image so it can
			// be redrawn in its new location
			this.context.clearRect(this.x, this.y, this.width, this.height);

			// Update x and y according to the direction to move and
			// redraw the ship.  Change the else if's to if statements
			//	to have diagonal movement
			
			if (KEY_STATUS.left) {
				this.x -= this.speed
				if (this.x <= 0)	// keep player within the screen
					this.x = 0;
			} else if (KEY_STATUS.right) {
				this.x += this.speed
				if (this.x >= this.canvasWidth - this.width)
					this.x = this.canvasWidth- this.width;
			} else if (KEY_STATUS.up) {
				this.y -= this.speed
				if (this.y <= this.canvasHeight/4*3)
					this.y = this.canvasHeight/4*3;	// limits the movement in the y axis
			} else if (KEY_STATUS.down) {
				this.y += this.speed
				if (this.y >= this.canvasHeight - this.height)
					this.y = this.canvasHeight - this.height;
			}
			

			// finish by redrawing the ship
			this.draw();
		}

		if (KEY_STATUS.space && counter >= fireRate) {
			this.fire();
			counter = 0;
		}
	};

	// fires two bullets
	this.fire = function() {
		this.bulletPool.getTwo(this.x+6, this.y, 3,
									 this.x+33, this.y, 3);
	};
}

Ship.prototype = new Drawable();

/* Create the Enemy ship objects
*/

function Enemy() {
	var percentFire = .01;
	var chance = 0;
	this.alive = false;
	

	// Sets the Enemy values
	this.spawn = function(x, y, speed) {
		this.x = x;
		this.y = y;
		this.speed = speed;
		this.speedX = 0;
		this.speedY = speed;
		this.alive = true;
		this.leftEdge = this.x - 90;
		this.rightEdge = this.x + 90;
		this.bottomEdge = this.y + 140;
	};

	// Enemy Movement
	this.draw = function() {
		this.context.clearRect(this.x-1, this.y, this.width+1, this.height);
		this.x += this.speedX;
		this.y += this.speedY;
		if (this.x <= this.leftEdge) {
			this.speedX = this.speed;
		}
		else if (this.x >= this.rightEdge + this.width) {
			this.speedX = -this.speed;
		}
		else if (this.y >= this.bottomEdge) {
			this.speed = 1.5;
			this.speedY = 0;
			this.y -= 5;
			this.speedX = -this.speed;
		}

		this.context.drawImage(imageRepository.enemy, this.x, this.y);

		// enemy has a chance to shoot every movement
		chance = Math.floor(Math.random()*101);
		if (chance/100 < percentFire) {
			this.fire();
		}
	};

	// fires a bullet
	this.fire = function() {
		game.enemyBulletPool.get(this.x+this.width/2, this.y+this.height, -2.5);
	}

	// resets the enemy values
	this.clear = function() {
		this.x = 0;
		this.y = 0;
		this.speed = 0;
		this.speedX = 0;
		this.speedY = 0;
		this.alive = false;
	};
}	

Enemy.prototype = new Drawable();

// keycodes that will be mapped when a user presses a button
//	original code by doug mcinnes


KEY_CODES = {
	32: 'space',
	37: 'left', 
	38: 'up',
	39: 'right',
	40: 'down',
}

/*	creates the array to hold the KEY_CODES and sets all their values
	to false.  checking true/false is the quickest way to check status
	of a key press and which one was pressd when determining
	when to move and which direction
*/

KEY_STATUS = {};
for ( code in KEY_CODES) {
	KEY_STATUS[ KEY_CODES[ code]] = false;
}

/*	sets up the document to listen to onkeydown events (fired when
	any key on the keyboard is pressed down). when a key is pressed,
	it sets the appropriate direction to true to let us know which 
	key it was.
*/

document.onkeydown = function (e) {
	// firefox and opera user charCode instead of keyCode
	//	to return which key was pressed
	var keyCode = (e.keyCode) ? e.keyCode : e.charCode;
	if (KEY_CODES[keyCode]) {
		e.preventDefault();
		KEY_STATUS[KEY_CODES[keyCode]] = true;
	}
}

/*	sets up the document to listen to ownkeyup events (fired when any
	key on the keyboard is released).	when  key is released, it sets
	the appropriate direction to false to let us know which key it was.
*/
document.onkeyup = function (e) {
	var keyCode = (e.keyCode) ? e.keyCode : e.charCode;
	if (KEY_CODES[keyCode]) {
		e.preventDefault();
		KEY_STATUS[KEY_CODES[keyCode]] = false;
	}
}


//create the game object that will hold all the objects and data for the game
function Game() {
	/*	gets canvas information and context and sets up all game objects.  
		returns true if the canvas is supported and false if it is not.  
		this is to stop the animation script from constanty running on older browsers.
	*/

	this.init = function() {
		// get canvas element
		this.bgCanvas = document.getElementById('background');
		this.shipCanvas = document.getElementById('ship');
		this.mainCanvas = document.getElementById('main');

		// test to see if canvas is supported
		if (this.bgCanvas.getContext) {
			this.bgContext = this.bgCanvas.getContext('2d');
			this.shipContext = this.shipCanvas.getContext('2d');
			this.mainContext = this.mainCanvas.getContext('2d');

			// initialize objects to contain their context and canvas information
			Background.prototype.context = this.bgContext;
			Background.prototype.canvasWidth = this.bgCanvas.width;
			Background.prototype.canvasHeight = this.bgCanvas.height;

			Ship.prototype.context = this.shipContext;
			Ship.prototype.canvasWidth = this.shipCanvas.width;
			Ship.prototype.canvasHeight = this.shipCanvas.height;

			Bullet.prototype.context = this.mainContext;
			Bullet.prototype.canvasWidth = this.mainCanvas.width;
			Bullet.prototype.canvasHeight = this.mainCanvas.height;
		
			Enemy.prototype.context = this.mainContext;
			Enemy.prototype.canvasWidth = this.mainCanvas.width;
			Enemy.prototype.canvasHeight = this.mainCanvas.height; 

			//	initialize the background object
			this.background = new Background();
			this.background.init(0,0);		// set draw point to 0,0

			// initialize the ship object
			this.ship = new Ship();
			// set the ship to start near the bottom middle of the canvas
			var shipStartX = this.shipCanvas.width/2 - imageRepository.spaceship.width;
			var shipStartY = this.shipCanvas.height/4*3 + imageRepository.spaceship.height*2;
			this.ship.init(shipStartX, shipStartY, imageRepository.spaceship.width,
								imageRepository.spaceship.height);
			

			// initialize the enmy pool object
			this.enemyPool = new Pool(30);
			this.enemyPool.init("enemy");
			var height = imageRepository.enemy.height;
			var width = imageRepository.enemy.width;
			var x = 100;
			var y = -height;
			var spacer = y * 1.5;
			for (var i = 1; i <= 18; i++) {
				this.enemyPool.get(x,y,2);
				x += width + 25;
				if (i % 6 == 0) {
					x = 100;
					y += spacer;
				}
			}
			
			this.enemyBulletPool = new Pool(50);
			this.enemyBulletPool.init("enemyBullet");			
			
			return true;
		} else {
			return false;
		}
	};

	// start the animation loop
	this.start = function() {
		this.ship.draw();
		animate();
	};
}		


/*	the animation loop.  
	calls the requestAnimationFrame shim to optimize the game loop and draws all game objects.  
	this function must be a gobal function and cannot be within an object
*/
function animate() {
	requestAnimFrame( animate );
	game.background.draw();
	game.ship.move();
	game.ship.bulletPool.animate();
	game.enemyPool.animate();
	game.enemyBulletPool.animate();
}

//	initialize game and run it

var game = new Game();

function init() {
	if (game.init())
		game.start();
}









