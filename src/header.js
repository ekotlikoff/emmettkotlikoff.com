import React from 'react'
import PropTypes from 'prop-types'
import { Nav, NavItem, NavLink } from 'reactstrap';
import { Link } from 'react-router-dom'

const Header = ({ match }) => (
  <div style={{ height: '150px' }}>
    <div className='App-header' style={{ textAlign: 'center' }}>
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
          <NavLink tag={Link} to='/aboutMe' active={match.params.page !== 'projects'}>About Me</NavLink>
        </NavItem>
        <NavItem>
          <NavLink tag={Link} to='/projects' active={match.params.page === 'projects'}>Projects</NavLink>
        </NavItem>
      </Nav>
    </div>
  </div>
)

Header.propTypes = {
  match: PropTypes.object,
}

export default Header
