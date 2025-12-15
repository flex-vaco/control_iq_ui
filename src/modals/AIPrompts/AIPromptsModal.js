import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner, Row, Col } from 'react-bootstrap';
import { api } from '../../services/api';

const AIPromptsModal = ({
  show,
  onHide,
  form,
  onChange,
  onSubmit,
  loading,
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
      setRcmControls([]);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{mode === 'edit' ? 'Edit AI Prompt' : 'Create New AI Prompt'}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={onSubmit}>
        <Modal.Body>
          <Row className="mb-3">
            <Col md={12}>
              <Form.Group controlId="clientSelect">
                <Form.Label>Client <span className="text-danger">*</span></Form.Label>
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
                <Form.Text className="text-muted">
                  {mode === 'edit' ? 'Client cannot be changed after creation.' : 'Select the client for this prompt.'}
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={12}>
              <Form.Group controlId="rcmSelect">
                <Form.Label>RCM Control (Optional)</Form.Label>
                <Form.Control 
                  as="select" 
                  name="rcm_id"
                  value={form.rcm_id || ''}
                  onChange={onChange}
                  disabled={loading || !form.client_id || mode === 'edit'}
                >
                  <option value="">Default Prompt (for all RCMs)</option>
                  {rcmControls.map((control, index) => (
                    <option key={index} value={control.control_id}>
                      {control.control_id} - {control.control_description?.substring(0, 50) || ''}
                    </option>
                  ))}
                </Form.Control>
                <Form.Text className="text-muted">
                  Leave empty for client-level default prompt. Select an RCM control for RCM-specific prompt.
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={12}>
              <Form.Group controlId="promptTextInput">
                <Form.Label>Prompt Text <span className="text-danger">*</span></Form.Label>
                <Form.Control 
                  as="textarea" 
                  rows={8}
                  placeholder="Enter the AI prompt text that will be used for attribute comparison..."
                  name="prompt_text"
                  value={form.prompt_text || ''}
                  onChange={onChange}
                  required
                  disabled={loading}
                />
                <Form.Text className="text-muted">
                  This prompt will replace the TASK section when comparing attributes with evidence. 
                  Use bullet points or numbered lists for better formatting.
                </Form.Text>
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
            disabled={loading || !form.client_id || !form.prompt_text?.trim()}
          >
            {loading ? (
              <>
                <Spinner as="span" animation="border" size="sm" /> Saving...
              </>
            ) : (
              mode === 'edit' ? 'Update Prompt' : 'Create Prompt'
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default AIPromptsModal;

