import React, { Component } from 'react'
import {
  BrowserRouter as Router,
  Route,
} from 'react-router-dom'

import Header from './header'
import Home from './pages/Home'
import Projects from './pages/projects'
import AboutMe from './pages/AboutMe'
import Resume from './pages/Resume'
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
          <Route exact path='/' component={Home} />
          <Route path='/projects' component={Projects} />
          <Route path='/experience' component={Resume} />
          <Route path='/aboutme' component={AboutMe} />
        </div>
      </Router>
    )
  }
}

export default App
