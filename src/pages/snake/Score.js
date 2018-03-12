import React, { Component } from 'react'
import PropTypes from 'prop-types';

class Score extends Component {
  render() {
    return <div>
      Score: {this.props.score}
    </div>;
  }
}

Score.propTypes = {
    score: PropTypes.number
}

export default Score