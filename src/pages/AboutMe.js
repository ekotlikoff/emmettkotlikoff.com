import React from 'react'
import PropTypes from 'prop-types'
import { Row, Col } from 'reactstrap';

const AboutMe = ({ match }) => (
  <div>
    <Col sm={{ size: 'auto', offset: 1 }}>
      <Row>
        <a href='https://www.linkedin.com/in/emmett-kotlikoff/'>LinkedIn</a>
      </Row>
      <Row>
        <a href='mailto:ekotlikoff@gmail.com'>Email</a>
      </Row>
      <Row>
        <a href='emmett.kotlikoff.pdf'>Resume</a>
      </Row>
    </Col>
  </div>
)

AboutMe.propTypes = {
  match: PropTypes.object,
}

export default AboutMe
