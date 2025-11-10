import React from 'react';
import { Modal, Button, Form, Alert, Spinner, Row, Col, ListGroup } from 'react-bootstrap';

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
  mode = 'create', // 'create' or 'edit'
  duplicateError,
  checkingDuplicate,
  existingDocuments = [],
  loadingDocuments = false
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
          {duplicateError && <Alert variant="danger">{duplicateError}</Alert>}
          
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
                  value={form.control_id}
                  onChange={onChange}
                  required
                  disabled={loading || mode === 'edit'}
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
                  disabled={loading || mode === 'edit'}
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
                  disabled={loading || mode === 'edit'}
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

          {mode === 'edit' && (
            <Form.Group className="mb-3">
              <Form.Label>Existing Documents</Form.Label>
              {loadingDocuments ? (
                <div className="text-center py-2">
                  <Spinner animation="border" size="sm" /> Loading documents...
                </div>
              ) : existingDocuments.length > 0 ? (
                <ListGroup>
                  {existingDocuments.map((doc, index) => {
                    // Extract base URL (without /api) for serving static files
                    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
                    const baseUrl = apiUrl.replace('/api', '');
                    const documentUrl = `${baseUrl}/uploads/${doc.artifact_url}`;
                    const fileName = doc.artifact_url.split('/').pop() || `Document ${index + 1}`;
                    return (
                      <ListGroup.Item key={doc.document_id} className="d-flex justify-content-between align-items-center">
                        <a 
                          href={documentUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-decoration-none"
                        >
                          <i className="fas fa-file me-2"></i>
                          {fileName}
                        </a>
                      </ListGroup.Item>
                    );
                  })}
                </ListGroup>
              ) : (
                <Form.Text className="text-muted">No documents uploaded yet.</Form.Text>
              )}
            </Form.Group>
          )}

        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            Cancel
          </Button>
          <Button 
            variant="success" 
            type="submit" 
            disabled={loading || checkingDuplicate || duplicateError || !form.control_id || !form.evidence_name || !form.testing_status || !form.year || !form.quarter || !form.client_id}
          >
            {loading ? <><Spinner as="span" animation="border" size="sm" /> Saving...</> : checkingDuplicate ? <><Spinner as="span" animation="border" size="sm" /> Checking...</> : 'Save Request'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default PbcCreateModal;

