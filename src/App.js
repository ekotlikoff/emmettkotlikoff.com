import React, { Component } from 'react'
import {
  BrowserRouter as Router,
  Route,
  Switch,
} from 'react-router-dom'
import { Col } from 'reactstrap';
import './App.css'
import * as firebase from 'firebase';
import createActivityDetector from 'activity-detector';
import Header from './header'
import Projects from './pages/projects'
import Resume from './pages/Resume'
import Game from './pages/game/Game';
import { initializePixi } from './pixiUtils';
import { connectToDB } from './databaseUtils';

class App extends Component {
  constructor() {
    super();

    this.state = { renderer: null, stage: null };
  }

  componentWillMount() {
    var config = {
      apiKey: 'AIzaSyBfLOYLx9S_Kmh6QFTYLx_sz3pl7-J3HjE',
      authDomain: 'my-site-5f648.firebaseapp.com',
      databaseURL: 'https://my-site-5f648.firebaseio.com',
      projectId: 'my-site-5f648',
      storageBucket: 'my-site-5f648.appspot.com',
      messagingSenderId: '743241622263'
    };
    firebase.initializeApp(config);
    connectToDB().then((user) => {
      this.setState({ userId: user.uid });
    })
  }

  componentDidMount() {
    this.createRenderer();
    this.signOutIdleUsers();
  }

  createRenderer() {
    this.setState(initializePixi(this));
  }

  signOutIdleUsers() {
    const activityDetector = createActivityDetector({ timeToIdle: 60000, inactivityEvents: null });
    const signOut = () => {
      this.setState({ signedOut: true }, () => {
        firebase.database().ref('users/' + this.state.userId).remove()
      });
    };
    activityDetector.on('idle', function() {
      signOut();
      firebase.auth().signOut();
    });
  }

  render() {
    return (
      <Router>
        <div>
          <Route path='/:page?' component={Header} />
          <Route component={() => (
            <Col id='background' style={{ minHeight: 'calc(100vh - 150px)' }}>
              <Switch>
                <Route path='/aboutMe' component={Resume} />
                <Route path='/projects' component={Projects} />
                <Route path='/experimental' render={() =>
                  <Game {...this.state} />} />
                <Route component={Resume} />
              </Switch>
            </Col>
          )} />
        </div>
      </Router>
    )
  }
}

export default App
