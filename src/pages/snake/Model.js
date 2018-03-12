// All snakePixels and snacks are 1 by 1 in game coordinates.
import * as Constants from './Constants.js';
import * as PIXI from 'pixi.js';

const Model = (() => {
	let initialXGameCoordinate;
	let initialYGameCoordinate;
	let initialDirection;
	let initialUpdatesPerSecond;
	let additionalUpdatesPerSecondPerSnakePixel;
	let gameWidth;
	let gameHeight;
	let snake;
	let directionChanges;
	let nextDirection;
	let snack;
	let snakeGotSnack;
	let updatesPerSecond;
	let stage;
	let updateScore;
	let score = 0;

	return class Model {
	    constructor(
	    	initialXGameCoordinateIn,
	    	initialYGameCoordinateIn,
	    	initialDirectionIn,
	    	initialUpdatesPerSecondIn,
	    	additionalUpdatesPerSecondPerSnakePixelIn,
	    	gameWidthIn,
	    	gameHeightIn,
	    	stageIn,
	    	updateScoreIn
	    	)
	    {
			initialXGameCoordinate = initialXGameCoordinateIn;
			initialYGameCoordinate = initialYGameCoordinateIn;
			initialDirection = initialDirectionIn;
			initialUpdatesPerSecond = initialUpdatesPerSecondIn;
			additionalUpdatesPerSecondPerSnakePixel = additionalUpdatesPerSecondPerSnakePixelIn;
			gameWidth = gameWidthIn;
			gameHeight = gameHeightIn;
			stage = stageIn;
			updateScore = updateScoreIn;
		    this.resetState();
	    }

		resetState() {
			// TODO clear all snakePixels, snacks etc from PIXIE stage. (Is clear the method)
			stage.removeChildren();
		    snake = [createSnakePixel(initialXGameCoordinate, initialYGameCoordinate, initialDirection)];
			directionChanges = [];
			nextDirection = null;
			snack = createSnack();
			snakeGotSnack = false;
			updatesPerSecond = initialUpdatesPerSecond;
			score = 0;
			updateScore(score);
		}

		moveSnake() {
			for (let i = 0; i < snake.length; i++) {
				let snakePixel = snake[i];
				moveSnakePixel(snakePixel);
			}
		}

		handleDirectionChanges() {
			for (let i = 0; i < directionChanges.length; i++) {
				let directionChange = directionChanges[i];
				snake[directionChange.index].direction = directionChange.direction;
				directionChange.index++;
				if (directionChange.index >= snake.length) {
					directionChanges.pop();
				}
			}
		}

		handleNextDirection() {
			if (nextDirection && !isOppositeDirection(nextDirection, snake[0].direction)) {
				directionChanges.unshift(createDirectionChange(nextDirection));
			}
			nextDirection = null;
		}

		updateUpdatesPerSecond() {
			updatesPerSecond = initialUpdatesPerSecond + (snake.length - 1) * additionalUpdatesPerSecondPerSnakePixel;
		}

		getUpdatesPerSecond() {
			return updatesPerSecond;
		}

		handleSnackCollision() {
			if (snake.some(snakePixel => collidesWith(snakePixel, snack))) {
				stage.removeChild(snack);
				snack = null;
				snakeGotSnack = true;
			}
		}

		handleSnakeGotSnack() {
			if (snakeGotSnack) {
				score += 1;
				updateScore(score);
				addNewSnakePixel();
				snakeGotSnack = false;
			}
		}

		createSnackIfEaten() {
			if (!snack) {
				snack = createSnack();
			}
		}

		didLoseGame() {
			return isSnakeOutOfBounds() || didSnakeHitItself();
		}

		didWinGame() {
			return snake.length === gameHeight * gameWidth;
		}

		setNextDirection(nextDir) {
			nextDirection = nextDir;
		}

		getSnake() {
			return snake;
		}

		getSnack() {
			return snack;
		}

		getScore() {
			return score;
		}
	}

	function addNewSnakePixel() {
		const lastSnakePixel = snake[snake.length - 1];
		let newSnakePixel = createSnakePixel(Constants.screenToGameCoordinates(lastSnakePixel.position.x), Constants.screenToGameCoordinates(lastSnakePixel.position.y), lastSnakePixel.direction);
		// Move newSnakePixel in opposite direction of lastSnakePixel.
		switch (newSnakePixel.direction) {
			case Constants.UP:
				newSnakePixel.position.y += Constants.gameCoordinatesToScreen(Constants.PIXEL_GAME_WIDTH);
				break;
			case Constants.DOWN:
				newSnakePixel.position.y -= Constants.gameCoordinatesToScreen(Constants.PIXEL_GAME_WIDTH);
				break;
			case Constants.LEFT:
				newSnakePixel.position.x += Constants.gameCoordinatesToScreen(Constants.PIXEL_GAME_WIDTH);
				break;
			case Constants.RIGHT:
				newSnakePixel.position.x -= Constants.gameCoordinatesToScreen(Constants.PIXEL_GAME_WIDTH);
				break;
			default:
				console.error('ERROR: Unrecognized direction');
		}
		snake.push(newSnakePixel);
	}

	function didSnakeHitItself() {
		if (snake.length > 4) {
			return snake.slice(1).some(snakePixel => collidesWith(snake[0], snakePixel));
		}
	}

	function isSnakeOutOfBounds() {
		const front = snake[0];
		const outUp = front.y < 0;
		const outDown = front.y + Constants.PIXEL_GAME_WIDTH > gameHeight;
		const outLeft = front.x < 0;
		const outRight = front.x + Constants.PIXEL_GAME_WIDTH > gameWidth;
		return outUp || outDown || outLeft || outRight;
	}

	
	function collidesWith(pixel1, pixel2) {
		return pixel1.position.x < pixel2.position.x + Constants.PIXEL_LENGTH * Constants.PIXEL_GAME_WIDTH &&
			   pixel1.position.x + Constants.PIXEL_LENGTH * Constants.PIXEL_GAME_WIDTH > pixel2.position.x &&
	           pixel1.position.y < pixel2.position.y + Constants.PIXEL_LENGTH * Constants.PIXEL_GAME_WIDTH &&
	           Constants.PIXEL_LENGTH * Constants.PIXEL_GAME_WIDTH + pixel1.position.y > pixel2.position.y;
	}

	function createSnack() {
		const validLocations = getValidLocations();
		let location;
		if (validLocations.length > 0) {
			location = validLocations[Math.floor(Math.random() * validLocations.length)];
		}
		let snack = new PIXI.Graphics();
	    snack.beginFill(Constants.SNACK_COLOR);
	    snack.drawRect(0, 0, Constants.PIXEL_GAME_WIDTH * Constants.PIXEL_LENGTH, Constants.PIXEL_GAME_WIDTH * Constants.PIXEL_LENGTH);
    	snack.endFill();
    	snack.position.x = Constants.gameCoordinatesToScreen(location.x);
    	snack.position.y = Constants.gameCoordinatesToScreen(location.y);
    	stage.addChild(snack);
    	return snack;
	}

	function getValidLocations() {
		let validLocations = [];
		for (let x = 0; x < Constants.screenToGameCoordinates(gameWidth); x++) {
			for (let y = 0; y < Constants.screenToGameCoordinates(gameHeight); y++) {
				if (!snake.some(snakePixel => collidesWith(snakePixel, { position: { x, y } }))) {
					validLocations.push({ x, y });
				}
			}
		}
		return validLocations;
	}

	function createSnakePixel(x, y, direction) {
		let snakePixel = new PIXI.Graphics();
		snakePixel.direction = direction;
	    snakePixel.beginFill(Constants.SNAKE_COLOR);
	    snakePixel.drawRect(0, 0, Constants.PIXEL_GAME_WIDTH * Constants.PIXEL_LENGTH, Constants.PIXEL_GAME_WIDTH * Constants.PIXEL_LENGTH);
    	snakePixel.position.x = Constants.gameCoordinatesToScreen(x);
    	snakePixel.position.y = Constants.gameCoordinatesToScreen(y)
    	snakePixel.endFill();
    	stage.addChild(snakePixel);
    	return snakePixel;
	}

	function moveSnakePixel(snakePixel) {
		switch (snakePixel.direction) {
			case Constants.UP:
				snakePixel.y -= Constants.gameCoordinatesToScreen(Constants.PIXEL_GAME_WIDTH);
				break;
			case Constants.DOWN:
				snakePixel.y += Constants.gameCoordinatesToScreen(Constants.PIXEL_GAME_WIDTH);
				break;
			case Constants.LEFT:
				snakePixel.x -= Constants.gameCoordinatesToScreen(Constants.PIXEL_GAME_WIDTH);
				break;
			case Constants.RIGHT:
				snakePixel.x += Constants.gameCoordinatesToScreen(Constants.PIXEL_GAME_WIDTH);
				break;
			default:
				console.error('ERROR: Unrecognized direction');
		}
	}

	function createDirectionChange(direction) {
		return { direction, index: 0 };
	}

	function isOppositeDirection(direction1, direction2) {
		switch (direction1) {
			case Constants.UP:
				return direction2 === Constants.DOWN;
			case Constants.DOWN:
				return direction2 === Constants.UP;
			case Constants.LEFT:
				return direction2 === Constants.RIGHT;
			case Constants.RIGHT:
				return direction2 === Constants.LEFT;
			default:
				console.error('ERROR: Unrecognized direction');
		}
	}
})();

export default Model;