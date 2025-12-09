import React, { useState, useEffect } from 'react';
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
  clients,
  selectedClientId,
  onClientChange,
  mode = 'create', // 'create' or 'edit'
  duplicateError,
  checkingDuplicate,
  existingDocuments = [],
  existingPolicyDocuments = [],
  loadingDocuments = false,
  onDeleteDocument = null
}) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [policyDocumentFlags, setPolicyDocumentFlags] = useState({});
  
  const testingStatuses = ['Pending', 'Partial Received', 'Received'];
  
  // Reset when modal opens/closes
  useEffect(() => {
    if (!show) {
      setSelectedFiles([]);
      setPolicyDocumentFlags({});
    }
  }, [show]);
  
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
      <Form onSubmit={(e) => {
        e.preventDefault();
        // Build form data with policy document flags
        const formData = new FormData();
        formData.append('client_id', form.client_id);
        formData.append('control_id', form.control_id);
        formData.append('evidence_name', form.evidence_name);
        formData.append('testing_status', form.testing_status);
        formData.append('year', form.year);
        formData.append('quarter', form.quarter);
        
        // Append files and policy flags
        if (selectedFiles && selectedFiles.length > 0) {
          for (let i = 0; i < selectedFiles.length; i++) {
            formData.append('documents', selectedFiles[i]);
            // Append policy flag for each file
            const isPolicy = policyDocumentFlags[i] || false;
            formData.append('is_policy_document', isPolicy);
          }
        }
        
        // Call parent's onSubmit with the event and formData
        onSubmit(e, formData);
      }}>
        <Modal.Body>
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
                <Form.Label>PBC Status <span className="text-danger">*</span></Form.Label>
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
            <Form.Label>Upload Document(s){mode === 'edit' && (<span className="italic"> - You will have to re-test the newly uploaded document(s)</span>)}</Form.Label>
            <Form.Control 
              type="file" 
              onChange={(e) => {
                const files = Array.from(e.target.files);
                setSelectedFiles(files);
                // Initialize policy flags to false for all files
                const flags = {};
                files.forEach((file, index) => {
                  flags[index] = false;
                });
                setPolicyDocumentFlags(flags);
                onFileChange(e);
              }} 
              multiple
              disabled={loading}
            />
            <Form.Text className="text-muted">
              You can select multiple files to attach to this evidence request.
            </Form.Text>
            
            {/* Show checkboxes for selected files */}
            {selectedFiles.length > 0 && (
              <div className="mt-3">
                <Form.Label className="fw-bold">Mark as Policy Document:</Form.Label>
                <ListGroup>
                  {selectedFiles.map((file, index) => (
                    <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                      <span>
                        <i className="fas fa-file me-2"></i>
                        {file.name}
                      </span>
                      <Form.Check
                        type="switch"
                        id={`policy-doc-${index}`}
                        checked={policyDocumentFlags[index] || false}
                        onChange={(e) => {
                          setPolicyDocumentFlags(prev => ({
                            ...prev,
                            [index]: e.target.checked
                          }));
                        }}
                        label="Policy Document"
                      />
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </div>
            )}
          </Form.Group>

          {mode === 'edit' && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Existing Evidence Documents</Form.Label>
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
                            {doc.document_name || fileName}
                          </a>
                          {onDeleteDocument && (
                            <Button
                              variant="link"
                              size="sm"
                              className="text-danger p-0 ms-2"
                              onClick={() => onDeleteDocument(doc.document_id)}
                              disabled={loading}
                              title="Delete document"
                            >
                              <i className="fas fa-trash"></i>
                            </Button>
                          )}
                        </ListGroup.Item>
                      );
                    })}
                  </ListGroup>
                ) : (
                  <Form.Text className="text-muted">No evidence documents uploaded yet.</Form.Text>
                )}
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Existing Policy Documents</Form.Label>
                {loadingDocuments ? (
                  <div className="text-center py-2">
                    <Spinner animation="border" size="sm" /> Loading documents...
                  </div>
                ) : existingPolicyDocuments.length > 0 ? (
                  <ListGroup>
                    {existingPolicyDocuments.map((doc, index) => {
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
                            {doc.document_name || fileName}
                          </a>
                          {onDeleteDocument && (
                            <Button
                              variant="link"
                              size="sm"
                              className="text-danger p-0 ms-2"
                              onClick={() => onDeleteDocument(doc.document_id)}
                              disabled={loading}
                              title="Delete document"
                            >
                              <i className="fas fa-trash"></i>
                            </Button>
                          )}
                        </ListGroup.Item>
                      );
                    })}
                  </ListGroup>
                ) : (
                  <Form.Text className="text-muted">No policy documents uploaded yet.</Form.Text>
                )}
              </Form.Group>
            </>
          )}

          {/* Duplicate error message at bottom above button */}
          {duplicateError && (
            <Alert variant="danger" className="mt-3 mb-0">{duplicateError}</Alert>
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

