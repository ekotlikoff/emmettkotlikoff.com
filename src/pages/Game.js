import React, { Component } from 'react'
import * as firebase from 'firebase';
import * as PIXI from 'pixi.js';

let players = {};
let userRef = null;
let database = null;
let userId = null;

const keyboard = (keyCode) => {
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

const createKeyboardListeners = (cat) => {
  const left = keyboard(37),
      up = keyboard(38),
      right = keyboard(39),
      down = keyboard(40);

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

let thisPlayer = null;

class Game extends Component {
  constructor() {
    super();
    this.componentDidMount = this.componentDidMount.bind(this);
    this.initializePixiCanvas = this.initializePixiCanvas.bind(this);
    this.animate = this.animate.bind(this);
    this.loadImages = this.loadImages.bind(this);
    this.connectToDB = this.connectToDB.bind(this);
  }

  initializePixiCanvas() {
    //Setup PIXI Canvas in componentDidMount
    this.renderer = PIXI.autoDetectRenderer(1366, 768);
    this.refs.gameCanvas.appendChild(this.renderer.view);

    // create the root of the scene graph
    this.stage = new PIXI.Container();
  }

  loadImages() {
    PIXI.loader
      .add("cat.png")
      .load(this.createSprites);
  }

  connectToDB() {
    firebase.auth().signInAnonymously().catch(function(error) {
      console.log(error.code);
      console.log(error.message);
    });
    const setState = (uid) => {
      database = firebase.database();
      userRef = database.ref('users/' + uid);
      userId = uid;
    }
    const userCreated = () => userRef;
    const updateUsers = (data) => {
      for (const playerKey in players) {
        if (players.hasOwnProperty(playerKey)) {
          if (!data.hasOwnProperty(playerKey)) {
            this.stage.removeChild(players[playerKey]);
            delete players[playerKey];
          }
        }
      }
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          if (!players.hasOwnProperty(key)) {
            players[key] = new PIXI.Sprite(
              PIXI.loader.resources["cat.png"].texture
            );
            this.stage.addChild(players[key]);
            if (key === userId) {
              thisPlayer = players[key];
              thisPlayer.x = 0;
              thisPlayer.y = 0;
              thisPlayer.vx = 0;
              thisPlayer.vy = 0;
              this.stage.addChild(thisPlayer);

              createKeyboardListeners(thisPlayer);
            }
          }
          players[key].x = data[key].xCoordinate;
          players[key].y = data[key].yCoordinate;
        }
      }
    }
    firebase.auth().onAuthStateChanged(function(user) {
      if (user && !userCreated()) {
        // User is signed in.
        console.log(`User id, ${user.uid}, connected`);
        setState(user.uid);
        database.ref('users/' + user.uid).set({
          xCoordinate: 1,
          yCoordinate: 1,
        });
        database.ref('users/' + user.uid).onDisconnect().remove();
      }
      database.ref('users/').on('value', (snapshot) => {
        updateUsers(snapshot.val());
      })
    });
  }

  componentDidMount() {
    this.connectToDB();
    this.initializePixiCanvas();
    this.loadImages();
    this.animate();
  }

  animate() {
      // render the stage container'
      this.frame = requestAnimationFrame(this.animate);
      // Update
      if (thisPlayer) {
        thisPlayer.x += thisPlayer.vx;
        thisPlayer.y += thisPlayer.vy;
        // Update user's location on DB.
        if (database) {
          database.ref('users/' + userId).set({ xCoordinate: thisPlayer.x, yCoordinate: thisPlayer.y });
        }
      }
      this.renderer.render(this.stage);
  }

  render() {
    return (
      <div className='game-canvas-container' ref='gameCanvas' />
    )
  }
}

export default Game
