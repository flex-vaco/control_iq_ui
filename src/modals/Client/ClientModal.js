import React from 'react';
import { Modal, Button, Form, Alert, Spinner, Row, Col } from 'react-bootstrap';

const ClientModal = ({
  show,
  onHide,
  form,
  onChange,
  onSubmit,
  loading,
  submissionStatus,
  mode = 'create' // 'create' or 'edit'
}) => {
  const statuses = ['active', 'inactive'];

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{mode === 'edit' ? 'Edit Client' : 'Create New Client'}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={onSubmit}>
        <Modal.Body>
          {submissionStatus && <Alert variant={submissionStatus.variant}>{submissionStatus.message}</Alert>}
          
          <Row className="mb-3">
            <Col md={12}>
              <Form.Group controlId="clientNameInput">
                <Form.Label>Client Name <span className="text-danger">*</span></Form.Label>
                <Form.Control 
                  type="text" 
                  placeholder="e.g., Acme Corporation"
                  name="client_name"
                  value={form.client_name || ''}
                  onChange={onChange}
                  required
                  disabled={loading}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group controlId="industryInput">
                <Form.Label>Industry</Form.Label>
                <Form.Control 
                  type="text" 
                  placeholder="e.g., Technology, Finance"
                  name="industry"
                  value={form.industry || ''}
                  onChange={onChange}
                  disabled={loading}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="regionInput">
                <Form.Label>Region</Form.Label>
                <Form.Control 
                  type="text" 
                  placeholder="e.g., North America, APAC"
                  name="region"
                  value={form.region || ''}
                  onChange={onChange}
                  disabled={loading}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={12}>
              <Form.Group controlId="contactNameInput">
                <Form.Label>Contact Name</Form.Label>
                <Form.Control 
                  type="text" 
                  placeholder="e.g., John Doe"
                  name="contact_name"
                  value={form.contact_name || ''}
                  onChange={onChange}
                  disabled={loading}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group controlId="contactEmailInput">
                <Form.Label>Contact Email</Form.Label>
                <Form.Control 
                  type="email" 
                  placeholder="e.g., contact@client.com"
                  name="contact_email"
                  value={form.contact_email || ''}
                  onChange={onChange}
                  disabled={loading}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="contactPhoneInput">
                <Form.Label>Contact Phone</Form.Label>
                <Form.Control 
                  type="text" 
                  placeholder="e.g., +1-234-567-8901"
                  name="contact_phone"
                  value={form.contact_phone || ''}
                  onChange={onChange}
                  disabled={loading}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group controlId="statusSelect">
                <Form.Label>Status <span className="text-danger">*</span></Form.Label>
                <Form.Control 
                  as="select" 
                  name="status"
                  value={form.status || 'active'}
                  onChange={onChange}
                  required
                  disabled={loading}
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </Form.Control>
              </Form.Group>
            </Col>
          </Row>

        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            Cancel
          </Button>
          <Button 
            variant="success" 
            type="submit" 
            disabled={loading || !form.client_name || !form.status}
          >
            {loading ? <><Spinner as="span" animation="border" size="sm" /> Saving...</> : mode === 'edit' ? 'Update Client' : 'Create Client'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ClientModal;

