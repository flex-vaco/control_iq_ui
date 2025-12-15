import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Nav, Button, Collapse } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [adminOpen, setAdminOpen] = useState(
    location.pathname.includes('/user-management') ||
    location.pathname.includes('/role-management') ||
    location.pathname.includes('/access-control')
  );
  const [testingOpen, setTestingOpen] = useState(location.pathname.includes('/periodic-testing'));

  // Keep submenus open when on their respective routes
  useEffect(() => {
    if (
      location.pathname.includes('/user-management') ||
      location.pathname.includes('/role-management') ||
      location.pathname.includes('/access-control')
    ) {
      setAdminOpen(true);
    }
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
          <Nav.Link as={NavLink} to="/client" id="nav-client">
            Client
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
          <Nav.Link as={NavLink} to="/ai-prompts" id="nav-ai-prompts">
            AI Prompts
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
        
        <Nav.Item>
          <Nav.Link
            onClick={(e) => {
              e.preventDefault();
              setAdminOpen(!adminOpen);
            }}
            active={adminOpen}
            style={{ cursor: 'pointer' }}
          >
            <i className={`fas fa-chevron-${adminOpen ? 'down' : 'right'}`} style={{ marginRight: '8px', fontSize: '12px' }}></i>
            Administration
          </Nav.Link>
          <Collapse in={adminOpen}>
            <div style={{ marginLeft: '20px', marginTop: '5px' }}>
              <Nav.Item>
                <Nav.Link 
                  as={NavLink} 
                  to="/user-management" 
                  id="nav-user-management"
                  className="submenu-link"
                >
                  User Management
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link 
                  as={NavLink} 
                  to="/role-management" 
                  id="nav-role-management"
                  className="submenu-link"
                >
                  Role Management
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link 
                  as={NavLink} 
                  to="/access-control" 
                  id="nav-access-control"
                  className="submenu-link"
                >
                  Access Control
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