import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Nav, Button, Collapse } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [testingOpen, setTestingOpen] = useState(location.pathname.includes('/periodic-testing'));

  // Keep Testing submenu open when on periodic-testing route
  useEffect(() => {
    if (location.pathname.includes('/periodic-testing')) {
      setTestingOpen(true);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="d-flex flex-column p-3 h-100">
      <img src='/logo.png' alt="ControlIQ" className="mb-3" />
      <hr />
      <Nav variant="pills" className="flex-column mb-auto">
        <Nav.Item>
          <Nav.Link as={NavLink} to="/dashboard" id="nav-dashboard">
            Dashboard
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link as={NavLink} to="/rcm" id="nav-rcm">
            RCM
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link as={NavLink} to="/pbc" id="nav-pbc">
            PBC
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link as={NavLink} to="/attributes" id="nav-attributes">
            Attributes
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link as={NavLink} to="/client" id="nav-client">
            Client
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link
            onClick={(e) => {
              e.preventDefault();
              setTestingOpen(!testingOpen);
            }}
            active={testingOpen}
            style={{ cursor: 'pointer' }}
          >
            <i className={`fas fa-chevron-${testingOpen ? 'down' : 'right'}`} style={{ marginRight: '8px', fontSize: '12px' }}></i>
            Testing
          </Nav.Link>
          <Collapse in={testingOpen}>
            <div style={{ marginLeft: '20px', marginTop: '5px' }}>
              <Nav.Item>
                <Nav.Link 
                  as={NavLink} 
                  to="/periodic-testing" 
                  id="nav-periodic-testing"
                  className="submenu-link"
                >
                  Periodic Testing
                </Nav.Link>
              </Nav.Item>
            </div>
          </Collapse>
        </Nav.Item>
      </Nav>
      <hr />
      <div>
        {user && <div className="mb-2 small">{user.email}</div>}
        <Button 
          variant="outline-danger" 
          size="sm" 
          onClick={handleLogout} 
          id="logout-button"
        >
          Logout
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;