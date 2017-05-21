import React, { Component } from 'react';
import PropTypes from 'prop-types';
import * as firebase from 'firebase';
import * as PIXI from 'pixi.js';
import { Button } from 'reactstrap';
import { createKeyboardListeners } from './inputHandling';

let database = null;
let thisPlayer = null;

class Game extends Component {
  constructor() {
    super();
    this.initializePixiCanvas = this.initializePixiCanvas.bind(this);
    this.animate = this.animate.bind(this);
    this.loadUsersAndListenForChanges = this.loadUsersAndListenForChanges.bind(this);
  }

  initializePixiCanvas() {
    if (this.props.renderer && this.refs.gameCanvas) {
      this.refs.gameCanvas.appendChild(this.props.renderer.view);
    }
  }

  loadUsersAndListenForChanges() {
    if (!firebase.auth().currentUser ||
        !this.props.stage ||
        !this.props.renderer ||
        this.props.signedOut) {
      return;
    }
    database = firebase.database();
    database.ref('users/').on('child_changed', (snapshot) => {
      // Player moved
      this.players[snapshot.key].x = snapshot.val().xCoordinate;
      this.players[snapshot.key].y = snapshot.val().yCoordinate;
    });
    database.ref('users/').on('child_added', (snapshot) => {
      // Player signed in
      this.players[snapshot.key] = new PIXI.Sprite(
        PIXI.loader.resources["cat.png"].texture
      );
      this.props.stage.addChild(this.players[snapshot.key]);
      if (snapshot.key === this.props.userId) {
        thisPlayer = this.players[snapshot.key];
        thisPlayer.x = 0;
        thisPlayer.y = 0;
        thisPlayer.vx = 0;
        thisPlayer.vy = 0;
        this.props.stage.addChild(thisPlayer);

        createKeyboardListeners(thisPlayer, window, this.props.renderer);
      }
    });
    database.ref('users/').on('child_removed', (snapshot) => {
      // Player signed out
      this.props.stage.removeChild(this.players[snapshot.key]);
      delete this.players[snapshot.key];
    });
  }

  componentDidMount() {
    if (this.props.userId) {
      this.players = {};
      this.loadUsersAndListenForChanges();
      this.initializePixiCanvas();
      const fitToScreen = () => {
        let w, h = null;
        if (window.innerWidth / window.innerHeight >= this.props.aspectRatio) {
           w = window.innerHeight * this.props.aspectRatio;
           h = window.innerHeight;
        } else {
           w = window.innerWidth;
           h = window.innerWidth / this.props.aspectRatio;
        }
        this.props.renderer.view.style.width = w + 'px';
        this.props.renderer.view.style.height = h + 'px';
      }
      window.onresize = fitToScreen;
      fitToScreen();
      this.animate();
    }
  }

  componentWillUnmount() {
    window.cancelAnimationFrame(this.frame);
  }

  animate() {
      if (!this.props.renderer) {
        return;
      }

      // Update
      if (thisPlayer) {
        thisPlayer.x += thisPlayer.vx;
        thisPlayer.y += thisPlayer.vy;
        // Update user's location on DB.
        if(database && !this.props.signedOut) {
          database.ref('users/' + this.props.userId).set({ xCoordinate: thisPlayer.x, yCoordinate: thisPlayer.y });
        }
      }
      this.props.renderer.render(this.props.stage);
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
