/* create an object to hold all images so they are only generated once.  this type of object is called a 'singleton'
*/

var imageRepository = new function() {
	this.background = new Image();

	this.background.src = "images/bg.png";
}

/*	create a drawable object that will be the base cass for all drawable objects in the game.  set up default variables so that all child objects will inherit, as well as the default functions.
*/

function Drawable() {
	this.init = function(x, y) {
		// declare default variables
		this.x = x;
		this.y = y;
	}

	this.speed = 0;
	this.canvasWidth = 0;
	this.canvasHeight = 0;

	// define abstract function to be implemented in child objects
	this.draw = function() {
	};
}

/*	create the background object which will become a child of the drawable object.  the background is drawn on the 'background' canvas and creates the illusion of omving by panning the image.
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

/*	create the game object that will hold all the objects and data for the game
*/

function Game() {
	/*	gets canvas information and context and sets up all game objects.  returns true if the canvas is supported and false if it is not.  this is to stop the animation script from constanty running on older browsers.
	*/

	this.init = function() {
	// get canvas element
	this.bgCanvas = document.getElementById('background');
	
		// test to see if canvas is supported
		if (this.bgCanvas.getContext) {
			this.bgContext = this.bgCanvas.getContext('2d');

			// initialize objects to contain their context and canvas information
			Background.prototype.context = this.bgContext;
			Background.prototype.canvasWidth = this.bgCanvas.width;
			Background.prototype.canvasHeight = this.bgCanvas.height;

			//	initialize the background object
			this.background = new Background();
			this.background.init(0,0);		// set draw point to 0,0
			return true;
		} else {
			return false;
		}
	};

	// start the animation loop
	this.start = function() {
		animate();
	};
}		


/*	the animation loop.  calls the requestAnimationFrame shim to optimize the game loop and draws all game objects.  this function must be a gobal function and cannot be within an object
*/

function animate() {
	requestAnimFrame( animate );
	game.background.draw();
}

/*	requestAnim shim layer by paul irish.  finds the first api that works to optimize the animation loop, otherwise defaults to setTimeout().
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


/*	initialize game and run it
*/

var game = new Game();

function init() {
	if (game.init())
		game.start();
}









