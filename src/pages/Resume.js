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
      'Implemented the user interface for an enterprise web app used by 20 coworkers for controlling data manipulation and reporting',
      'Jump-started a team’s end-to-end testing initiative by onboarding them onto the enterprise provided testing platform',
      'On boarded a large team to a central enterprise wide data platform, requiring extensive data-model design of 20 interconnected tables',
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
      'Designed and implemented a performance simulator for a flash storage scheduling algorithm',
      'Built a large framework allowing configurability for users interested in analyzing performance with different hardware constraints',
      'Regularly submitted code for review learning excellent testing and style habits',
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
      'Collaborated with team of 40 to design and grade 7 sets of 300 problem sets and 3 exams',
      'Assisted students during weekly office hours with complex projects such as a sudo Ocaml interpreter, BitTorrent protocol, and Map Reduce system',
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
