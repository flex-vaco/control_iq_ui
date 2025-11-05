import React from 'react';
import { Modal, Button, Form, Alert, Spinner, Row, Col } from 'react-bootstrap';

const PbcCreateModal = ({
  show,
  onHide,
  form,
  onChange,
  onFileChange,
  onSubmit,
  rcmControls,
  currentDescription,
  loading,
  submissionStatus,
  clients,
  selectedClientId,
  onClientChange,
  mode = 'create' // 'create' or 'edit'
}) => {
  const testingStatuses = ['Pending', 'Partial Received', 'Received'];
  
  // Generate year options (current year and next 5 years)
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = 0; i <= 5; i++) {
    years.push(currentYear + i);
  }

  // Quarter options
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{mode === 'edit' ? 'Edit Evidence (PBC)' : 'Create New Evidence (PBC)'}</Modal.Title>
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
                  value={form.client_id || selectedClientId || ''}
                  onChange={onChange}
                  required
                  disabled={loading}
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
                  value={form.control_id}
                  onChange={onChange}
                  required
                  disabled={loading}
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

          <Form.Group controlId="controlDescriptionDisplay" className="mb-3">
            <Form.Label>Control Description</Form.Label>
            <Form.Control 
              as="textarea" 
              rows={3} 
              value={currentDescription || 'Select a Control ID above to see the description.'} 
              readOnly 
              className="bg-light"
            />
          </Form.Group>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group controlId="yearSelect">
                <Form.Label>Year <span className="text-danger">*</span></Form.Label>
                <Form.Control 
                  as="select" 
                  name="year"
                  value={form.year || ''}
                  onChange={onChange}
                  required
                  disabled={loading}
                >
                  <option value="" disabled>Select Year...</option>
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </Form.Control>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="quarterSelect">
                <Form.Label>Quarter <span className="text-danger">*</span></Form.Label>
                <Form.Control 
                  as="select" 
                  name="quarter"
                  value={form.quarter || ''}
                  onChange={onChange}
                  required
                  disabled={loading}
                >
                  <option value="" disabled>Select Quarter...</option>
                  {quarters.map(quarter => (
                    <option key={quarter} value={quarter}>{quarter}</option>
                  ))}
                </Form.Control>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group controlId="evidenceNameInput">
                <Form.Label>Evidence Name / Title <span className="text-danger">*</span></Form.Label>
                <Form.Control 
                  type="text" 
                  placeholder="e.g., System Access Report"
                  name="evidence_name"
                  value={form.evidence_name}
                  onChange={onChange}
                  required
                  disabled={loading}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="testingStatusSelect">
                <Form.Label>Testing Status <span className="text-danger">*</span></Form.Label>
                <Form.Control 
                  as="select" 
                  name="testing_status"
                  value={form.testing_status}
                  onChange={onChange}
                  required
                  disabled={loading}
                >
                  {testingStatuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </Form.Control>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group controlId="documentUpload" className="mb-3">
            <Form.Label>Upload Document(s) (Optional - Accepts any file type)</Form.Label>
            <Form.Control 
              type="file" 
              onChange={onFileChange} 
              multiple
              disabled={loading}
            />
            <Form.Text className="text-muted">
              You can select multiple files to attach to this evidence request.
            </Form.Text>
          </Form.Group>

        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            Cancel
          </Button>
          <Button 
            variant="success" 
            type="submit" 
            disabled={loading || !form.control_id || !form.evidence_name || !form.testing_status || !form.year || !form.quarter}
          >
            {loading ? <><Spinner as="span" animation="border" size="sm" /> Saving...</> : 'Save Request'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default PbcCreateModal;

