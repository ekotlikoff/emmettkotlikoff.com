import React, { Component } from 'react'
import {
  BrowserRouter as Router,
  Route,
  Switch,
} from 'react-router-dom'

import Header from './header'
import Home from './pages/Home'
import Projects from './pages/projects'
import Resume from './pages/Resume'
import { Col } from 'reactstrap';
import './App.css'
import * as firebase from 'firebase';

class App extends Component {
  componentDidMount() {
    var config = {
      apiKey: 'AIzaSyBfLOYLx9S_Kmh6QFTYLx_sz3pl7-J3HjE',
      authDomain: 'my-site-5f648.firebaseapp.com',
      databaseURL: 'https://my-site-5f648.firebaseio.com',
      projectId: 'my-site-5f648',
      storageBucket: 'my-site-5f648.appspot.com',
      messagingSenderId: '743241622263'
    };
    firebase.initializeApp(config);
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
