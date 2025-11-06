import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { api } from '../../services/api';

const AttributesCreateModal = ({
  show,
  onHide,
  form,
  onChange,
  onSubmit,
  loading,
  submissionStatus,
  clients,
  mode = 'create' // 'create' or 'edit'
}) => {
  const [rcmControls, setRcmControls] = useState([]);

  useEffect(() => {
    if (form.client_id && show) {
      fetchRcmControls(form.client_id);
    } else {
      setRcmControls([]);
    }
  }, [form.client_id, show]);

  const fetchRcmControls = async (clientId) => {
    if (!clientId) return;
    try {
      const response = await api.get('/data/rcm-controls', { params: { client_id: clientId } });
      setRcmControls(response.data);
    } catch (err) {
      console.error('Failed to fetch RCM controls:', err);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{mode === 'edit' ? 'Edit Test Attribute' : 'Create New Test Attribute'}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={onSubmit}>
        <Modal.Body>
          {submissionStatus && <Alert variant={submissionStatus.variant}>{submissionStatus.message}</Alert>}
          
          <Row className="mb-3">
            <Col md={12}>
              <Form.Group controlId="clientSelect">
                <Form.Label>Select Client <span className="text-danger">*</span></Form.Label>
                <Form.Control 
                  as="select" 
                  name="client_id"
                  value={form.client_id || ''}
                  onChange={onChange}
                  required
                  disabled={loading || mode === 'edit'}
                >
                  <option value="" disabled>Choose a Client...</option>
                  {clients.map((client) => (
                    <option key={client.client_id} value={client.client_id}>
                      {client.client_name}
                    </option>
                  ))}
                </Form.Control>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={12}>
              <Form.Group controlId="controlIdSelect">
                <Form.Label>Select RCM Control ID <span className="text-danger">*</span></Form.Label>
                <Form.Control 
                  as="select" 
                  name="control_id"
                  value={form.control_id || ''}
                  onChange={onChange}
                  required
                  disabled={loading || !form.client_id}
                >
                  <option value="" disabled>Choose a Control ID...</option>
                  {rcmControls.map((control, index) => (
                    <option key={index} value={control.control_id}>
                      {control.control_id}
                    </option>
                  ))}
                </Form.Control>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={12}>
              <Form.Group controlId="attributeNameInput">
                <Form.Label>Attribute Name <span className="text-danger">*</span></Form.Label>
                <Form.Control 
                  type="text" 
                  name="attribute_name"
                  value={form.attribute_name || ''}
                  onChange={onChange}
                  required
                  disabled={loading}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={12}>
              <Form.Group controlId="attributeDescriptionInput">
                <Form.Label>Attribute Description</Form.Label>
                <Form.Control 
                  as="textarea" 
                  rows={3}
                  name="attribute_description"
                  value={form.attribute_description || ''}
                  onChange={onChange}
                  disabled={loading}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={12}>
              <Form.Group controlId="testStepsInput">
                <Form.Label>Test Steps</Form.Label>
                <Form.Control 
                  as="textarea" 
                  rows={4}
                  name="test_steps"
                  value={form.test_steps || ''}
                  onChange={onChange}
                  disabled={loading}
                />
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
            disabled={loading || !form.attribute_name || !form.control_id || !form.client_id}
          >
            {loading ? <><Spinner as="span" animation="border" size="sm" /> Saving...</> : mode === 'edit' ? 'Update Attribute' : 'Create Attribute'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default AttributesCreateModal;

