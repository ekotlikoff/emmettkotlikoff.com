import React, { Component } from 'react'
import * as PIXI from 'pixi.js';
import PropTypes from 'prop-types';
import { Button, Input, InputGroup, InputGroupAddon, Row, Col } from 'reactstrap';
import * as firebase from 'firebase';
import { initializePixiCanvas } from '../../pixiUtils';
import Model from './Model.js';
import Score from './Score.js';
import Highscores from './Highscores.js';
import * as Constants from './Constants.js'

class Snake extends Component {
  constructor() {
    super();

    this.state = {
      score: 0,
      highscores: [],
      handlingHighscore: false,
      username: '',
      takenUsernames: {},
      promptForUsernameMessage: Constants.DEFAULT_USERNAME_PROMPT
    };
    this.deltaSinceLastUpdate = 0;
    this.isActive = false;

    this.initializePixiCanvas = this.initializePixiCanvas.bind(this);
    this.update = this.update.bind(this);
    this.initializeGame = this.initializeGame.bind(this);
    this.keyDownHandler = this.keyDownHandler.bind(this);
    this.mobileTouchHandler = this.mobileTouchHandler.bind(this);
    this.updateScore = this.updateScore.bind(this);
    this.getHighscores = this.getHighscores.bind(this);
    this.handleHighscore = this.handleHighscore.bind(this);
    this.submitHighscore = this.submitHighscore.bind(this);
    this.updateUsername = this.updateUsername.bind(this);
    this.resetHandleHighscoreState = this.resetHandleHighscoreState.bind(this);
    this.pauseGame = this.pauseGame.bind(this);
    this.unpauseGame = this.unpauseGame.bind(this);
    this.handleEndOfGame = this.handleEndOfGame.bind(this);
  }

  componentWillUnmount() {
    document.removeEventListener("keydown", this.keyDownHandler, false);
    this.destroyGame();
    if (this.ticker) {
      this.ticker.stop();
    }
  }

  componentDidMount() {
    document.addEventListener("keydown", this.keyDownHandler, false);
    this.initializeGame();
  }

  initializeGame() {
    if (this.props.userId) {
      if (this.isActive) {
        return;
      }
      this.isActive = true;
      this.getHighscores();
      this.initializePixiCanvas();
      this.stage.interactive = true;
      this.stage.hitArea = new PIXI.Rectangle(0, 0, Constants.CANVAS_WIDTH, Constants.CANVAS_HEIGHT);
      this.stage.tap = this.mobileTouchHandler;
      const fitToScreen = () => {
        let w, h = null;
        // 198 pixels in header attributes
        let totalWindowHeight = window.innerHeight - Constants.HEADER_HEIGHT - Constants.BOTTOM_MARGIN;
        if (window.innerWidth / totalWindowHeight >= this.aspectRatio) {
           w = totalWindowHeight * this.aspectRatio;
           h = totalWindowHeight;
        } else {
           w = window.innerWidth;
           h = window.innerWidth / this.aspectRatio;
        }
        this.renderer.view.style.width = w + 'px';
        this.renderer.view.style.height = h + 'px';
      }
      window.onresize = fitToScreen;
      fitToScreen();
      if (!this.ticker) {
        this.ticker = new PIXI.ticker.Ticker();
        this.ticker.stop();
        this.ticker.add(this.update);
      }
      this.ticker.start();
    }
  }

  destroyGame() {
    if (!this.isActive) {
      return;
    }
    this.isActive = false;
    this.stage.destroy(true);
    this.stage = null;
    this.refs.snakeCanvas.removeChild(this.renderer.view);
    this.renderer.destroy(true);
    this.renderer = null;
  }

  initializePixiCanvas() {
    const pixieState = initializePixiCanvas(Constants.CANVAS_WIDTH, Constants.CANVAS_HEIGHT);
    this.stage = pixieState.stage;
    this.renderer = pixieState.renderer;
    this.renderer.backgroundColor = Constants.BACKGROUND_COLOR;
    this.aspectRatio = pixieState.aspectRatio;
    this.model = new Model(
      Constants.screenToGameCoordinates(Constants.INITIAL_X),
      Constants.screenToGameCoordinates(Constants.INITIAL_Y),
      Constants.INITIAL_DIRECTION,
      Constants.INITIAL_UPDATES_PER_SECOND,
      Constants.ADDITIONAL_UPDATES_PER_SECOND_PER_SNAKE_PIXEL,
      Constants.CANVAS_WIDTH,
      Constants.CANVAS_HEIGHT,
      this.stage,
      this.updateScore
    );
    if (this.refs.snakeCanvas) {
      this.refs.snakeCanvas.appendChild(this.renderer.view);
    }
  }

  pauseGame() {
    this.ticker.stop();
  }

  unpauseGame() {
    this.setState({ wasPaused: true }, () => this.ticker.start());
  }

  keyDownHandler(e) {
    if (Constants.INPUT_KEYS.includes(e.keyCode)) {
      e.preventDefault();
      this.model.setNextDirection(e.keyCode);
    }
  }

  mobileTouchHandler(touch) {
    const snakeHead = this.model.getSnake()[0];
    const point = touch.data.getLocalPosition(this.stage);
    switch (snakeHead.direction) {
      case Constants.UP:
        if (snakeHead.position.x > point.x) {
          this.model.setNextDirection(Constants.LEFT);
        } else if (snakeHead.position.x < point.x) {
          this.model.setNextDirection(Constants.RIGHT);
        }
        break;
      case Constants.DOWN:
        if (snakeHead.position.x > point.x) {
          this.model.setNextDirection(Constants.LEFT);
        } else if (snakeHead.position.x < point.x) {
          this.model.setNextDirection(Constants.RIGHT);
        }
        break;
      case Constants.LEFT:
        if (snakeHead.position.y > point.y) {
          this.model.setNextDirection(Constants.UP);
        } else if (snakeHead.position.y < point.y) {
          this.model.setNextDirection(Constants.DOWN);
        }
        break;
      case Constants.RIGHT:
        if (snakeHead.position.y > point.y) {
          this.model.setNextDirection(Constants.UP);
        } else if (snakeHead.position.y < point.y) {
          this.model.setNextDirection(Constants.DOWN);
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

  updateUsername(e) {
    this.setState({ username: e.target.value });
  }

  handleHighscore() {
    this.pauseGame();
    const database = firebase.database();
    const score = this.state.score;
    database.ref('snake/highscores/').orderByValue().once('value').then((highschoreSnapshot) => {
      let toReplaceKey;
      let takenUsernames = {};
      highschoreSnapshot.forEach((child) => {
        if (score > child.val()) {
          if (!toReplaceKey) {
            toReplaceKey = child.key;
          }
        }
        takenUsernames[child.key] = true;
      });
      if (highschoreSnapshot.numChildren() < Constants.NUM_HIGHSCORES || toReplaceKey) {
        this.setState({ handlingHighscore: true, takenUsernames, usernameKeyToReplace: toReplaceKey, numHighscores: highschoreSnapshot.numChildren() });
      } else {
        this.model.resetState();
        this.unpauseGame();
      }
    });
  }

  submitHighscore() {
    const database = firebase.database();
    if (!this.isValidUsername(this.state.username, this.state.takenUsernames)) {
      this.setState({ promptForUsernameMessage: Constants.USERNAME_TAKEN_PROMPT, username: '' });
    } else {
      if (this.state.numHighscores >= 10) {
        database.ref('snake/highscores/' + this.state.usernameKeyToReplace).remove();
      }
      database.ref('snake/highscores/' + this.state.username).set(this.state.score);
      this.model.resetState();
      this.getHighscores();
      this.resetHandleHighscoreState();
      this.unpauseGame();
    }
  }

  resetHandleHighscoreState() {
    this.setState({ handlingHighscore: false, promptForUsernameMessage: Constants.DEFAULT_USERNAME_PROMPT });
  }

  handleEndOfGame() {
    if (this.model.didLoseGame()) {
      this.handleHighscore();
      return true;
    } else if (this.model.didWinGame()) {
      console.log('You win !');
      this.handleHighscore();
      return true;
    }
    return false;
  }

  update(delta) {
    this.deltaSinceLastUpdate += this.ticker.elapsedMS;
    if (this.deltaSinceLastUpdate > 1000 / this.model.getUpdatesPerSecond()) {
      this.model.handleNextDirection();
      this.model.handleDirectionChanges();
      this.model.moveSnake();
      this.model.handleSnackCollision();
      this.model.createSnackIfEaten();
      this.model.handleSnakeGotSnack();
      if (this.handleEndOfGame()) {
        return;
      }
      this.model.updateUpdatesPerSecond();
      this.deltaSinceLastUpdate -= 1000 / this.model.getUpdatesPerSecond();
      this.renderer.render(this.stage);
    }
    if (this.state.wasPaused) {
      // If we were paused this.deltaSinceLastUpdate will be huge, to prevent many updates quickly we reset this.
      this.deltaSinceLastUpdate = 0;
      this.setState({ wasPaused: false })
    }
  }

  render() {
    const gameElement = this.props.signedOut ?
      <Button onClick={() => window.location.reload(false)}>You have been signed out due to inactivity, click here to log back in </Button> :
      <div className='game-canvas-container' ref='snakeCanvas' />;
    const highscoreInputElement = this.state.handlingHighscore && !this.props.signedOut ?
        <Row>
          <Col>
            <InputGroup>
              <InputGroupAddon color="secondary"><Button onClick={this.submitHighscore}>Submit</Button></InputGroupAddon>
              <Input placeholder={this.state.promptForUsernameMessage} type='text' onChange={this.updateUsername} value={this.state.username} />
            </InputGroup>
          </Col>
        </Row> : null;
        
    return <div>
      <Row>
        <Col>
          <Highscores highscores={this.state.highscores} pauseGame={this.pauseGame} unpauseGame={this.unpauseGame} />
        </Col>
        <Col sm={{ size: 'auto' }}>
          <Score score={this.state.score}/>
        </Col>
      </Row>
       {highscoreInputElement}
      <Row>
       {gameElement}
      </Row>
    </div>;
  }
}

Snake.propTypes = {
    userId: PropTypes.string,
    signedOut: PropTypes.bool,
}

export default Snake
