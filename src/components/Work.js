import React from 'react'
import PropTypes from 'prop-types'
import Entry from './Entry'
import { Row, Col } from 'reactstrap';

const Work = ({content}) => (
  <Row>
    <Col xs={{ size: '10', offset: 1 }} id='work'>
      <div className='entryRow work'>
        <div className='eleven columns main-col'>
          {content.map(function(entry, index) {
            return (<Entry key={index} index={index} total={content.length} entry={entry} />);
          })}
        </div>
      </div>
    </Col>
  </Row>
)

Work.propTypes = {
  content: PropTypes.arrayOf(PropTypes.shape({
    company: PropTypes.string.isRequired,
    position: PropTypes.string.isRequired,
    website: PropTypes.string,
    startDate: PropTypes.string.isRequired,
    endDate: PropTypes.string.isRequired,
    summary: PropTypes.string.isRequired,
    highlights: PropTypes.array,
  }))
}

export default Work
