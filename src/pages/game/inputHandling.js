const keyboard = (keyCode, window) => {
  let key = {};
  key.code = keyCode;
  key.isDown = false;
  key.isUp = true;
  key.press = undefined;
  key.release = undefined;
  //The `downHandler`
  key.downHandler = function(event) {
    if (event.keyCode === key.code) {
      if (key.isUp && key.press) key.press();
      key.isDown = true;
      key.isUp = false;
    }
    event.preventDefault();
  };

  //The `upHandler`
  key.upHandler = function(event) {
    if (event.keyCode === key.code) {
      if (key.isDown && key.release) key.release();
      key.isDown = false;
      key.isUp = true;
    }
    event.preventDefault();
  };

  //Attach event listeners
  window.addEventListener(
    "keydown", key.downHandler.bind(key), false
  );
  window.addEventListener(
    "keyup", key.upHandler.bind(key), false
  );
  return key;
}

export const createKeyboardListeners = (cat, window) => {
  const left = keyboard(37, window),
      up = keyboard(38, window),
      right = keyboard(39, window),
      down = keyboard(40, window);

  left.press = function() {
    cat.vx = -5;
  };

  left.release = function() {
    if (!right.isDown) {
      cat.vx = 0;
    }
  };

  up.press = function() {
    cat.vy = -5;
  };
  up.release = function() {
    if (!down.isDown) {
      cat.vy = 0;
    }
  };

  right.press = function() {
    cat.vx = 5;
  };
  right.release = function() {
    if (!left.isDown) {
      cat.vx = 0;
    }
  };

  down.press = function() {
    cat.vy = 5;
  };
  down.release = function() {
    if (!up.isDown) {
      cat.vy = 0;
    }
  };
};
