export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 800;

export const HEADER_HEIGHT = 198;
export const BOTTOM_MARGIN = 10;

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

export const NUM_HIGHSCORES = 10;

export const SNAKE_COLOR = 0xFF0000;
export const SNACK_COLOR = 0x84a460;
export const BACKGROUND_COLOR = 0xADD8E6;
export const PIXEL_SCREEN_LENGTH = 20;
export const PIXEL_GAME_WIDTH = 1;

export const screenToGameCoordinates = (pixels) => {
	return pixels / PIXEL_SCREEN_LENGTH;
}

export const gameCoordinatesToScreen = (gameCoordinates) => {
	return gameCoordinates * PIXEL_SCREEN_LENGTH;
}


export const DEFAULT_USERNAME_PROMPT = "Highscore! What's your name?";
export const USERNAME_TAKEN_PROMPT = "Name already taken. What's your name?";