import React, { Component } from 'react'
import {
  BrowserRouter as Router,
  Route,
  Switch,
} from 'react-router-dom'
import { Col } from 'reactstrap';
import './App.css'
import * as firebase from 'firebase';
import Header from './header'
import Projects from './pages/projects'
import Resume from './pages/Resume'
import Game from './pages/Game';

class App extends Component {
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
    console.log('app initialized');
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
                <Route path='/experimental' component={Game} />
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
