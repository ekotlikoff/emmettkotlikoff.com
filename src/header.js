import React from 'react'
import PropTypes from 'prop-types'
import { Nav, NavItem, NavLink } from 'reactstrap';
import { Link } from 'react-router-dom'

const Header = ({ match }) => (
  <div>
    <div className='App-header' style={{ textAlign: 'center' }}>
      <div style={{ display: 'inline-block '}}>
        <h6>Hi I'm, </h6><h2>Emmett Kotlikoff</h2>
      </div>
      <Nav tabs>
        <NavItem>
          <NavLink tag={Link} to='/experience' active={match.params.page === 'experience'}>Experience</NavLink>
        </NavItem>
        <NavItem>
          <NavLink tag={Link} to='/projects' active={match.params.page === 'projects'}>Projects</NavLink>
        </NavItem>
        <NavItem>
          <NavLink tag={Link} to='/aboutme' active={match.params.page === 'aboutme'}>About Me</NavLink>
        </NavItem>
      </Nav>
    </div>
  </div>
)

Header.propTypes = {
  match: PropTypes.object,
}

export default Header
