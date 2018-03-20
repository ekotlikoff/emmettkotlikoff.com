import React, { Component } from 'react';
import PropTypes from 'prop-types';
import * as firebase from 'firebase';
import * as PIXI from 'pixi.js';
import { Button } from 'reactstrap';
import { createKeyboardListeners } from './inputHandling';
import { initializePixi } from '../../pixiUtils';

class Game extends Component {
  constructor() {
    super();

    this.initializePixiCanvas = this.initializePixiCanvas.bind(this);
    this.animate = this.animate.bind(this);
    this.loadUsersAndListenForChanges = this.loadUsersAndListenForChanges.bind(this);
    this.destroyGame = this.destroyGame.bind(this);
  }

  componentDidMount() {
    if (this.props.userId) {
      this.players = {};
      this.initializePixiCanvas();
      this.loadUsersAndListenForChanges();
      const fitToScreen = () => {
        let w, h = null;
        if (window.innerWidth / window.innerHeight >= this.aspectRatio) {
           w = window.innerHeight * this.aspectRatio;
           h = window.innerHeight;
        } else {
           w = window.innerWidth;
           h = window.innerWidth / this.aspectRatio;
        }
        this.renderer.view.style.width = w + 'px';
        this.renderer.view.style.height = h + 'px';
      }
      window.onresize = fitToScreen;
      fitToScreen();
      this.animate();
    }
  }

  componentWillUnmount() {
    window.cancelAnimationFrame(this.frame);
    if (this.keys) {
       this.keys.forEach(key => {
        window.removeEventListener('keydown', key.downHandler, false);
        window.removeEventListener('keyup', key.upHandler, false);
      });
    }
    this.destroyGame();
  }

  initializePixiCanvas() {
    const pixieState = initializePixi(this.storeTextures);
    this.stage = pixieState.stage;
    this.renderer = pixieState.renderer;
    this.aspectRatio = pixieState.aspectRatio;
    if (this.refs.gameCanvas) {
      this.refs.gameCanvas.appendChild(this.renderer.view);
    }
  }

  destroyGame() {
    if (this.stage) {
      this.stage.destroy(true);
    }
    this.stage = null;
    if (this.renderer) {
      this.refs.gameCanvas.removeChild(this.renderer.view);
    }
    if (this.renderer) {
      this.renderer.destroy(true);
    }
    this.renderer = null;
    if (this.database) {
      this.database.ref('users/').off();
    }
  }

  loadUsersAndListenForChanges() {
    this.database = firebase.database();

    this.database.ref('users/').on('child_changed', (snapshot) => {
      // Player moved
      this.players[snapshot.key].x = snapshot.val().xCoordinate;
      this.players[snapshot.key].y = snapshot.val().yCoordinate;
    });

    this.database.ref('users/').on('child_added', (snapshot) => {
      // Player signed in
      this.players[snapshot.key] = new PIXI.Sprite.fromImage('cat.png');
      this.stage.addChild(this.players[snapshot.key]);
      if (snapshot.key === this.props.userId) {
        this.thisPlayer = this.players[snapshot.key];
        this.thisPlayer.x = 0;
        this.thisPlayer.y = 0;
        this.thisPlayer.vx = 0;
        this.thisPlayer.vy = 0;

        this.keys = createKeyboardListeners(this.thisPlayer, window, this.renderer);
      }
    });

    this.database.ref('users/').on('child_removed', (snapshot) => {
      // Player signed out
      this.stage.removeChild(this.players[snapshot.key]);
      delete this.players[snapshot.key];
    });
  }

  animate() {
      if (!this.renderer) {
        return;
      }

      // Update
      if (this.thisPlayer) {
        this.thisPlayer.x += this.thisPlayer.vx;
        this.thisPlayer.y += this.thisPlayer.vy;
        // Update user's location on DB.
        if(this.database && !this.props.signedOut) {
          this.database.ref('users/' + this.props.userId).set({ xCoordinate: this.thisPlayer.x, yCoordinate: this.thisPlayer.y });
        }
      }
      this.renderer.render(this.stage);
      // render the stage container'
      this.frame = requestAnimationFrame(this.animate);
  }

  render() {
    const element = this.props.signedOut ?
      <Button onClick={() => window.location.reload(false)}>You have been signed out due to inactivity, click here to log back in </Button> :
      <div className='game-canvas-container' ref='gameCanvas' />;
    return element;
  }
}

Game.propTypes = {
  stage: PropTypes.object,
  userId: PropTypes.string,
  renderer: PropTypes.object,
  aspectRatio: PropTypes.number,
  signedOut: PropTypes.bool,
}

export default Game
