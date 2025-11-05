import React from 'react';
import { Card, Row, Col } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div>
      <h2>Dashboard</h2>
      <div className="dashboard-welcome">
        {user && (
          <Card className="mb-4">
            <Card.Body>
              <h5 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>
                Welcome back, <strong>{user.email}</strong>!
              </h5>
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                You are logged in and can now access all system features via the sidebar.
              </p>
            </Card.Body>
          </Card>
        )}
        
        <Row>
          <Col md={4}>
            <Card className="mb-3">
              <Card.Body>
                <h6 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>📊 RCM</h6>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                  Manage your Risk Control Matrix data
                </p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="mb-3">
              <Card.Body>
                <h6 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>📋 PBC</h6>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                  Create and manage PBC evidence requests
                </p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="mb-3">
              <Card.Body>
                <h6 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>✅ Attributes</h6>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                  Manage test attributes and controls
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default Dashboard;