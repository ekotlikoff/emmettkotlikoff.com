export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 800;

export const UP = 38;
export const DOWN = 40;
export const LEFT = 37;
export const RIGHT = 39;
export const INPUT_KEYS = [UP, DOWN, LEFT, RIGHT];

export const INITIAL_X = CANVAS_WIDTH / 2;
export const INITIAL_Y = CANVAS_HEIGHT / 2;

export const INITIAL_DIRECTION = DOWN;
export const INITIAL_UPDATES_PER_SECOND = 3;
export const ADDITIONAL_UPDATES_PER_SECOND_PER_SNAKE_PIXEL = .1;

export const SNAKE_COLOR = "0XFF0000";
export const SNACK_COLOR = "0X00FF00";
export const PIXEL_LENGTH = 20;
export const PIXEL_GAME_WIDTH = 1;

export const screenToGameCoordinates = (pixels) => {
	return pixels / PIXEL_LENGTH;
}

export const gameCoordinatesToScreen = (gameCoordinates) => {
	return gameCoordinates * PIXEL_LENGTH;
}