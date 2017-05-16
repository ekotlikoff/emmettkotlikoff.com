import React from 'react'
import PropTypes from 'prop-types'

import BulletPoints from './BulletPoints'

const Entry = ({ index, entry, total }) => {
    const startDate = entry.startDate;
    const endDate = entry.endDate;
    const divider = index + 1 === total
      ? (<br />)
      : (<hr />);

    return (
      <div className='entryRow item'>
        <div className='twelve columns'>
          <h3>
            <a href={entry.website}>{entry.company}</a>
          </h3>
          <p className='info'>
            {entry.position}
            <span>
              &bull;
            </span>
            <span className='info-summary'>{entry.summary}</span>
            <span>
              &bull;
            </span>
            <em className='date'>{startDate} - {endDate}</em>
          </p>
          <BulletPoints points={entry.highlights} />
          {divider}
        </div>
      </div>
    );
  };

Entry.propTypes = {
  index: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  entry: PropTypes.shape({
    company: PropTypes.string.isRequired,
    position: PropTypes.string.isRequired,
    website: PropTypes.string,
    startDate: PropTypes.string.isRequired,
    endDate: PropTypes.string.isRequired,
    summary: PropTypes.string.isRequired,
    highlights: module.exports.bulletPoints,
  }),
}

export default Entry
