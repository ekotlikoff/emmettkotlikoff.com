import React, { Component } from 'react'
import * as PIXI from 'pixi.js';
import PropTypes from 'prop-types';
import { Button, Row, Col } from 'reactstrap';
import * as firebase from 'firebase';
import { initializePixiCanvas } from '../../pixiUtils';
import Model from './Model.js';
import Score from './Score.js';
import Highscores from './Highscores.js';
import * as Constants from './Constants.js'

// TODO handle scoring, storage of highscores, and display of highscores

let state;
let deltaSinceLastUpdate = 0;

let model;

class Snake extends Component {
  constructor() {
    super();

    this.state = { score: 0, highscores: [] };
    this.initializePixiCanvas = this.initializePixiCanvas.bind(this);
    this.update = this.update.bind(this);
    this.initializeGame = this.initializeGame.bind(this);
    this.keyDownHandler = this.keyDownHandler.bind(this);
    this.mobileTouchHandler = this.mobileTouchHandler.bind(this);
    this.handleTouch = this.handleTouch.bind(this);
    this.updateScore = this.updateScore.bind(this);
    this.getHighscores = this.getHighscores.bind(this);
    this.handleHighscore = this.handleHighscore.bind(this);
    this.pauseGame = this.pauseGame.bind(this);
    this.unpauseGame = this.unpauseGame.bind(this);
    this.handleEndOfGame = this.handleEndOfGame.bind(this);
  }

  componentWillUnmount() {
    document.removeEventListener("keydown", this.keyDownHandler, false);
    document.removeEventListener("touchstart", this.mobileTouchHandler, false);
    if (state.ticker) {
      state.ticker.stop();
    }
  }

  componentDidMount() {
    document.addEventListener("keydown", this.keyDownHandler, false);
    document.addEventListener("touchstart", this.mobileTouchHandler, false);
    state = initializePixiCanvas(this, Constants.CANVAS_WIDTH, Constants.CANVAS_HEIGHT);
    model = new Model(
      Constants.screenToGameCoordinates(Constants.INITIAL_X),
      Constants.screenToGameCoordinates(Constants.INITIAL_Y),
      Constants.INITIAL_DIRECTION,
      Constants.INITIAL_UPDATES_PER_SECOND,
      Constants.ADDITIONAL_UPDATES_PER_SECOND_PER_SNAKE_PIXEL,
      Constants.CANVAS_WIDTH,
      Constants.CANVAS_HEIGHT,
      state.stage,
      this.updateScore
    );
    this.initializeGame();
  }

  initializeGame() {
    if (this.props.userId) {
      this.getHighscores();
      this.initializePixiCanvas();
      const fitToScreen = () => {
        let w, h = null;
        // 198 pixels in header attributes
        let totalWindowHeight = window.innerHeight - 198;
        if (window.innerWidth / totalWindowHeight >= state.aspectRatio) {
           w = totalWindowHeight * state.aspectRatio;
           h = totalWindowHeight;
        } else {
           w = window.innerWidth;
           h = window.innerWidth / state.aspectRatio;
        }
        // state.renderer.resize(w, h);
        state.renderer.view.style.width = w + 'px';
        state.renderer.view.style.height = h + 'px';
      }
      window.onresize = fitToScreen;
      fitToScreen();
      if (!state.ticker) {
        state.ticker = new PIXI.ticker.Ticker();
        state.ticker.stop();
        state.ticker.add(this.update);
      }
      state.ticker.start();
      state.renderer.render(state.stage);
    }
  }

  initializePixiCanvas() {
    if (state.renderer && this.refs.snakeCanvas) {
      this.refs.snakeCanvas.appendChild(state.renderer.view);
    }
  }

  pauseGame() {
    state.ticker.stop();
  }

  unpauseGame() {
    this.setState({ wasPaused: true }, () => state.ticker.start());
  }

  keyDownHandler(e) {
    if (Constants.INPUT_KEYS.includes(e.keyCode)) {
      e.preventDefault();
      model.setNextDirection(e.keyCode);
    }
  }

  mobileTouchHandler(e) {
    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      this.handleTouch(touch);
    }
  }

  handleTouch(touch) {
    const snakeHead = model.getSnake()[0];
    switch (snakeHead.direction) {
      case Constants.UP:
        if (snakeHead.position.x > touch.screenX) {
          model.setNextDirection(Constants.LEFT);
        } else if (snakeHead.position.x < touch.screenX) {
          model.setNextDirection(Constants.RIGHT);
        }
        break;
      case Constants.DOWN:
        if (snakeHead.position.x > touch.screenX) {
          model.setNextDirection(Constants.LEFT);
        } else if (snakeHead.position.x < touch.screenX) {
          model.setNextDirection(Constants.RIGHT);
        }
        break;
      case Constants.LEFT:
        if (snakeHead.position.y > touch.screenY) {
          model.setNextDirection(Constants.UP);
        } else if (snakeHead.position.y < touch.screenY) {
          model.setNextDirection(Constants.DOWN);
        }
        break;
      case Constants.RIGHT:
        if (snakeHead.position.y > touch.screenY) {
          model.setNextDirection(Constants.UP);
        } else if (snakeHead.position.y < touch.screenY) {
          model.setNextDirection(Constants.DOWN);
        }
        break;
      default:
        console.error('ERROR: Unrecognized direction');
    }
  }

  updateScore(score) {
    this.setState({ score });
  }

  isValidUsername(username, preexistingUsernames) {
    return username && username.length < 15 && /^[a-zA-Z0-9]+$/.test(username) && !preexistingUsernames[username];
  }

  handleHighscore() {
    const database = firebase.database();
    const score = this.state.score;
    database.ref('snake/highscores/').orderByValue().once('value').then((snapshot) => {
      let toReplaceKey;
      let usernames = {};
      snapshot.forEach((child) => {
        if (score > child.val()) {
          if (!toReplaceKey) {
            toReplaceKey = child.key;
          }
        }
        usernames[child.key] = true;
      });
      if (snapshot.numChildren() < 10 || toReplaceKey) {
        let username;
        username = window.prompt("Highscore!  What's your name?");
        while (!this.isValidUsername(username, usernames)) {
          username = window.prompt("Highscore! Username: " + username + " is being used, what's your name?");
        }
        if (snapshot.numChildren() >= 10) {
          database.ref('snake/highscores/' + toReplaceKey).remove();
        }
        database.ref('snake/highscores/' + username).set(score);
        this.getHighscores();
      }
      this.unpauseGame();
    });
  }

  getHighscores() {
    const database = firebase.database();
    let highscores = [];
    database.ref('snake/highscores/').once('value').then((snapshot) => {
      snapshot.forEach((child) => {
        highscores.push({ username: child.key, score: child.val() });
      });
      highscores.sort((e1, e2) => e2.score - e1.score);
      this.setState({ highscores });
    });
  }

  handleEndOfGame() {
    if (model.didLoseGame()) {
      state.ticker.stop();
      this.handleHighscore();
      model.resetState();
    } else if (model.didWinGame()) {
      console.log('You win !');
      state.ticker.stop();
      this.handleHighscore();
      model.resetState();
    }
  }

  update(delta) {
    deltaSinceLastUpdate += state.ticker.elapsedMS;
    if (deltaSinceLastUpdate > 1000 / model.getUpdatesPerSecond()) {
      model.handleNextDirection();
      model.handleDirectionChanges();
      model.moveSnake();
      model.handleSnackCollision();
      model.createSnackIfEaten();
      model.handleSnakeGotSnack();
      this.handleEndOfGame();
      model.updateUpdatesPerSecond();
      deltaSinceLastUpdate -= 1000 / model.getUpdatesPerSecond();
      state.renderer.render(state.stage);
    }
    if (this.state.wasPaused) {
      // If we were paused deltaSinceLastUpdate will be huge, to prevent many updates quickly we reset this.
      deltaSinceLastUpdate = 0;
      this.setState({ wasPaused: false })
    }
  }

  render() {
    const element = this.props.signedOut ?
      <Button onClick={() => window.location.reload(false)}>You have been signed out due to inactivity, click here to log back in </Button> :
      <div className='game-canvas-container' ref='snakeCanvas' />;
    return <div>
      <Row>
        <Col>
          <Highscores highscores={this.state.highscores} pauseGame={this.pauseGame} unpauseGame={this.unpauseGame} />
        </Col>
        <Col sm={{ size: 'auto' }}>
          <Score score={this.state.score}/>
        </Col>
      </Row>
      <Row>
       {element}
      </Row>
    </div>;
  }
}

Snake.propTypes = {
    userId: PropTypes.string,
    signedOut: PropTypes.bool,
}

export default Snake
