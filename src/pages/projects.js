import React, { Component } from 'react'
import PropTypes from 'prop-types'
import * as firebase from 'firebase';
import FileSaver from 'file-saver';
import { Row, Col, Button, ButtonGroup } from 'reactstrap';

class Projects extends Component {
  constructor(props) {
    super(props);

    this.state = { macLoading: false, windowsLoading: false };
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(mac) {
    return () => {
      // FIREBASE file
      const url = mac ?
        'https://firebasestorage.googleapis.com/v0/b/my-site-5f648.appspot.com/o/Oscar%20launcher.zip?alt=media&token=b70187f5-4c39-48a5-bef3-106bb783de8e'
        : 'https://firebasestorage.googleapis.com/v0/b/my-site-5f648.appspot.com/o/windows.zip?alt=media&token=07963c4b-ac36-488a-96e9-1c961d5dfa51';
      this.setState({[mac ? 'macLoading' : 'windowsLoading']: true});
      var storage = firebase.storage();
      var httpsReference = storage.refFromURL(url);
      httpsReference.getDownloadURL().then(function(url) {
        // This can be downloaded directly:
        var xhr = new XMLHttpRequest();
        xhr.responseType = 'blob';
        xhr.onload = function(event) {
          var blob = xhr.response;
          FileSaver.saveAs(blob, 'Oscar.zip');
          this.setState({[mac ? 'macLoading' : 'windowsLoading']: false});
        }.bind(this);
        xhr.open('GET', url);
        xhr.send();
      }.bind(this)).catch(function(error) {
        if (error.code === 'storage/unauthorized') {
            console.log('User does not have permission to access the object, change settings in firebase!');
        }
        console.log(error);
        this.setState({[mac ? 'macLoading' : 'windowsLoading']: false});
      }.bind(this));
    }
  }

  render() {
    return (
      <Row>
        <Col style={{ minWidth: '375px' }} sm={{ offset: 1 }}>
          <Row>
            <iframe src='https://player.vimeo.com/video/214382832' title='oscar-video' width='640' height='480' frameBorder='0' allowFullScreen />
          </Row>
        </Col>
        <Col>
          <Col>
            <Row>
              <ButtonGroup style={{ margin: 'auto' }}>
                <Button
                  disabled={this.state.macLoading}
                  onClick={this.handleClick(true)}>
                  Download OSX
                </Button>
                <Button
                  disabled={this.state.windowsLoading}
                  onClick={this.handleClick(false)}>
                  Download Windows
                </Button>
              </ButtonGroup>
            </Row>
          </Col>
          <Col sm={{ offset: 1, size: 10 }}>
            <Row>
              Jump into the world of Oscar, a charming flamingo on the run.
            </Row>
          </Col>
        </Col>
      </Row>
    );
  }
}

Projects.propTypes = {
  match: PropTypes.object,
}

export default Projects
