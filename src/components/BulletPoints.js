import React, { Component } from 'react'
import PropTypes from 'prop-types'

class BulletPoints extends Component {
    render() {
        return (
          <div>
            {this.props.points.map(function (point, index) {
              return (
                <p key={index} className='point'>
                  <span className='bullet-point'>&bull; </span>
                  {point}
                </p>
              );
            })}
          </div>
        );
    }
};

BulletPoints.propTypes = {
    points: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default BulletPoints;
