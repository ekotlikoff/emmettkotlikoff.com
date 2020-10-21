import React, { Component } from 'react';
import PropTypes from 'prop-types';
import * as firebase from 'firebase';
import * as PIXI from 'pixi.js';
import { Button } from 'reactstrap';
import * as Constants from './Constants';
import { createKeyboardListeners, destroyKeyboardListeners } from './inputHandling';
import { initializePixiCanvas } from '../../pixiUtils';

class Game extends Component {
  constructor() {
    super();

    this.isActive = false;
    this.usersRef = firebase.database().ref('users/');

    this.initializeGame = this.initializeGame.bind(this);
    this.onChildAdded = this.onChildAdded.bind(this);
    this.onChildChanged = this.onChildChanged.bind(this);
    this.onChildRemoved = this.onChildRemoved.bind(this);
    this.animate = this.animate.bind(this);
    this.loadUsersAndListenForChanges = this.loadUsersAndListenForChanges.bind(this);
    this.destroyGame = this.destroyGame.bind(this);
  }

  componentDidMount() {
    if (this.props.userId) {
      this.players = {};
      this.initializeGame();
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
    this.destroyGame();
  }

  initializeGame() {
    if (this.isActive) {
      return;
    }
    this.isActive = true;
    const pixieState = initializePixiCanvas(Constants.CANVAS_WIDTH, Constants.CANVAS_HEIGHT);
    this.stage = pixieState.stage;
    this.renderer = pixieState.renderer;
    this.aspectRatio = pixieState.aspectRatio;
    this.refs.gameCanvas.appendChild(this.renderer.view);
    this.loadUsersAndListenForChanges();
  }

  destroyGame() {
    if (!this.isActive) {
      return;
    }
    this.isActive = false;
    this.stage.destroy(true);
    this.stage = null;
    this.refs.gameCanvas.removeChild(this.renderer.view);
    this.renderer.destroy(true);
    this.renderer = null;
    this.usersRef.off('child_added', this.onChildAdded);
    this.usersRef.off('child_changed', this.onChildChanged);
    this.usersRef.off('child_removed', this.onChildRemoved);
    if (this.keys) {
      this.keys.forEach(destroyKeyboardListeners);
    }
  }

  loadUsersAndListenForChanges() {
    this.usersRef.on('child_added', this.onChildAdded);
    this.usersRef.on('child_changed', this.onChildChanged);
    this.usersRef.on('child_removed', this.onChildRemoved);
  }

  onChildAdded(snapshot) {
    // Player signed in
    this.players[snapshot.key] = new PIXI.Sprite.fromImage('cat.png');
    this.stage.addChild(this.players[snapshot.key]);
    if (snapshot.key === this.props.userId) {
      this.thisPlayer = this.players[snapshot.key];
      this.thisPlayer.x = 0;
      this.thisPlayer.y = 0;
      this.thisPlayer.vx = 0;
      this.thisPlayer.vy = 0;

      this.keys = createKeyboardListeners(
        this.thisPlayer, window, this.renderer, Constants.PLAYER_VELOCITY
      );
    }
  }

  onChildChanged(snapshot) {
    // Player moved
    this.players[snapshot.key].x = snapshot.val().xCoordinate;
    this.players[snapshot.key].y = snapshot.val().yCoordinate;
  }

  onChildRemoved(snapshot) {
    // Player signed out
    this.stage.removeChild(this.players[snapshot.key]);
    delete this.players[snapshot.key];
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
        if(this.usersRef && !this.props.signedOut) {
          this.usersRef.child(this.props.userId).set({ xCoordinate: this.thisPlayer.x, yCoordinate: this.thisPlayer.y });
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
