import React from 'react'
import PropTypes from 'prop-types'
import { Nav, NavItem, NavLink } from 'reactstrap';
import { Link } from 'react-router-dom'

const isActive = (headerItem, currentPath) => {
  switch (headerItem) {
    case ('projects'):
      return currentPath === 'projects';
    case ('snake'):
      return currentPath === 'snake';
    case ('experimental'):
      return currentPath === 'experimental';
    default:
      return currentPath === 'aboutMe';
  }
}

const Header = ({ match }) => (
  <div style={{ height: '150px' }}>
    <div style={{ textAlign: 'center', paddingTop: '15' }}>
      <div style={{ marginBottom: '18px' }}>
        <h2>Emmett Kotlikoff</h2>
        <h7 id='link'>
          <a
            style={{ marginRight: '10px' }}
            href='https://www.linkedin.com/in/emmettkotlikoff/'
          >
            LinkedIn
          </a>
          <a style={{ marginRight: '10px' }} href='mailto:emmettkotlikoff@gmail.com'>Email</a>
          <a href='emmett.kotlikoff.pdf'>Resume</a>
        </h7>
      </div>
      <Nav tabs>
        <NavItem>
          <NavLink tag={Link} to='/aboutMe' active={isActive('aboutMe', match.params.page)}>Me</NavLink>
        </NavItem>
        <NavItem>
          <NavLink tag={Link} to='/projects' active={isActive('projects', match.params.page)}>Projects</NavLink>
        </NavItem>
        <NavItem>
          <NavLink tag={Link} to='/snake' active={isActive('snake', match.params.page)}>Snake</NavLink>
        </NavItem>
        <NavItem>
          <NavLink tag={Link} to='/experimental' active={isActive('experimental', match.params.page)}>Experimental</NavLink>
        </NavItem>
      </Nav>
    </div>
  </div>
)

Header.propTypes = {
  match: PropTypes.object,
}

export default Header
