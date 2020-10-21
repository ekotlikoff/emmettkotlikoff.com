import React from 'react'
import Work from '../components/Work'

const experienceContent = [
  {
    company: 'Goldman Sachs',
    position: 'Technology Analyst',
    website: 'http://www.goldmansachs.com/',
    startDate: 'August 2016',
    endDate: 'Present',
    summary: 'New York City',
    highlights: [
      'SRE',
      'Public cloud infrastructure',
      'Full stack development',
    ],
  },
  {
    company: 'Google',
    position: 'Software Engineering Intern',
    website: 'https://www.google.com/intl/en/about/',
    startDate: 'May 2015',
    endDate: 'August 2015',
    summary: 'Mountain View, CA',
    highlights: [
      'Learning the ropes',
    ],
  },
  {
    company: 'Cornell University',
    position: 'Consultant for CS 3110',
    website: 'https://www.cs.cornell.edu/',
    startDate: '2015',
    endDate: '2014',
    summary: 'Ithaca, NY',
    highlights: [
      'Assisted students during weekly office hours with fun projects - an Ocaml interpreter, Map Reduce system',
    ],
  }
]

const educationContent = [
  {
    company: 'Cornell University',
    position: 'BA in Computer Science',
    startDate: '2012',
    endDate: '2016',
    summary: 'Ithaca, NY',
    highlights: [
      'Tech lead for the team that brought you Oscar!'
    ],
  },
];

const Resume = () => (
  <div id='work'>
    <h1 style={{ marginLeft: '15px' }}>
      <span>
        Experience
      </span>
    </h1>
    <Work content={experienceContent} />
    <h1 style={{ marginLeft: '15px' }}>
      <span>
        Education
      </span>
    </h1>
    <Work content={educationContent} />
  </div>
)

export default Resume
