import React, { Component } from 'react'
import * as firebase from 'firebase';
import PIXI from "pixi.js"

class Game extends Component {
  constructor() {
    super();
    this.state = { userData: null };
    this.componentDidMount = this.componentDidMount.bind(this);
  }
  componentDidMount() {
    firebase.auth().signInAnonymously().catch(function(error) {
      console.log(error.code);
      console.log(error.message);
    });
    const database = firebase.database();
    const setState = (uid) => {
        this.setState({
        userRef: database.ref('users/' + this.state.userId + '/xCoordinate'),
        database,
        userId: uid,
      });
    }
    const userCreated = () => this.state.userRef;
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
      } else {
        // User is signed out.
        console.log('signed out');
      }
    });
  }

  render() {
    if (this.state.userRef) {
      console.log('updating db');
      this.state.database.ref('users/' + this.state.userId).transaction((userData) => {
        console.log('user data found in transaction block: ' + userData);
        if (userData) {
          return { xCoordinate: userData.xCoordinate + 1, yCoordinate: userData.xCoordinate + 1 };
        }
        return null;
      }
      ,
      function(error, committed, snapshot) {
        if (error) {
          console.log('Transaction failed abnormally!', error);
        } else if (!committed) {
          console.log('not committed');
        } else {
          console.log('committed!');
        }
      })
    }
    return (
      <button onClick={() => {this.setState({ render: '' })}}>
        game
      </button>
    )
  }
}

export default Game
