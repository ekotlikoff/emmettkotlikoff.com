import React from 'react'
import PropTypes from 'prop-types'

const Home = ({ match }) => (
  <div>
    Welcome
  </div>
)

Home.propTypes = {
  match: PropTypes.object,
}

export default Home
