// TODO keep game properties centralized, not here.
const velocity = 5;

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

export const createKeyboardListeners = (thisPlayer, window, renderer) => {
  const left = keyboard(37, window),
      up = keyboard(38, window),
      right = keyboard(39, window),
      down = keyboard(40, window);

  left.press = function() {
    thisPlayer.vx = -1 * velocity;
  };

  left.release = function() {
    if (!right.isDown) {
      thisPlayer.vx = 0;
    }
  };

  up.press = function() {
    thisPlayer.vy = -1 * velocity;
  };
  up.release = function() {
    if (!down.isDown) {
      thisPlayer.vy = 0;
    }
  };

  right.press = function() {
    thisPlayer.vx = velocity;
  };
  right.release = function() {
    if (!left.isDown) {
      thisPlayer.vx = 0;
    }
  };

  down.press = function() {
    thisPlayer.vy = velocity;
  };
  down.release = function() {
    if (!up.isDown) {
      thisPlayer.vy = 0;
    }
  };
  const moveTowardFinger = (event) => {
    const deltaX = event.data.global.x - thisPlayer.x;
    const deltaY = event.data.global.y - thisPlayer.y;
    const magnitude = Math.sqrt(deltaX ** 2 + deltaY ** 2);

    thisPlayer.vx = velocity * deltaX / magnitude;
    thisPlayer.vy = velocity * deltaY / magnitude;
  }
  renderer.plugins.interaction.on('touchstart', moveTowardFinger);
  renderer.plugins.interaction.on('touchmove', moveTowardFinger);
  renderer.plugins.interaction.on('touchend', () => {
    thisPlayer.vx = 0;
    thisPlayer.vy = 0;
  });
};
