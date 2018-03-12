import React, { Component } from 'react'
import PropTypes from 'prop-types';
import { Button, Modal, ModalHeader, ModalBody, ListGroup, ListGroupItem } from 'reactstrap';

class Highscores extends Component {
  constructor() {
    super();

    this.state = { displayingHighscores: false };
    this.toggle = this.toggle.bind(this);
    this.getHighscoresDisplay = this.getHighscoresDisplay.bind(this);
  }

  toggle() {
  	this.props.pauseGame();
  	this.setState({ displayingHighscores: !this.state.displayingHighscores });
  }

  getHighscoresDisplay() {
  	return <ListGroup>
		{this.props.highscores.map((score) => <ListGroupItem key={score.username}>{score.username} : {score.score}</ListGroupItem>)}
	</ListGroup>;
  }

  render() {
    return <div>
    	<Button onClick={this.toggle}>Highscores</Button>
		<Modal isOpen={this.state.displayingHighscores} toggle={this.toggle} onExit={this.props.unpauseGame} className={this.props.className}>
			<ModalHeader toggle={this.toggle}>Highscores</ModalHeader>
			<ModalBody>
				{this.getHighscoresDisplay()}
			</ModalBody>
		</Modal>
	</div>;
  }
}

Highscores.propTypes = {
	highscores: PropTypes.array,
	pauseGame: PropTypes.func,
	unpauseGame: PropTypes.func
}

export default Highscores