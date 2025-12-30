import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Spinner, Row, Col, ListGroup, Card, Accordion } from 'react-bootstrap';
import AddEvidenceDocumentsModal from '../PeriodicTesting/AddEvidenceDocumentsModal';

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
  onDeleteDocument = null,
  onDeleteSample = null,
  evidenceId = null,
  onRefreshDocuments = null
}) => {
  // Sample structure: { id, name, files: [], policyFlags: {} }
  const [samples, setSamples] = useState([{ id: 1, name: '', files: [], policyFlags: {} }]);
  const [activeAccordionKey, setActiveAccordionKey] = useState(null);
  const [activePolicyAccordionKey, setActivePolicyAccordionKey] = useState(null);
  const [showAddDocumentsModal, setShowAddDocumentsModal] = useState(false);
  const [selectedSampleForUpload, setSelectedSampleForUpload] = useState(null);

  // Get unique sample names from existing documents
  const existingSampleNames = React.useMemo(() => {
    const allDocs = [...existingDocuments, ...existingPolicyDocuments];
    const uniqueSamples = [...new Set(allDocs.map(doc => doc.sample_name).filter(Boolean))];
    return uniqueSamples;
  }, [existingDocuments, existingPolicyDocuments]);
  
  const testingStatuses = ['Pending', 'Partial Received', 'Received'];
  
  // Reset when modal opens/closes
  useEffect(() => {
    if (!show) {
      // In edit mode, start with empty samples array (optional)
      // In create mode, start with one sample (required)
      if (mode === 'create') {
        setSamples([{ id: 1, name: '', files: [], policyFlags: {} }]);
      } else {
        setSamples([]);
      }
      setActiveAccordionKey(null);
      setActivePolicyAccordionKey(null);
    }
  }, [show, mode]);

  // Set default accordion keys when documents are loaded
  useEffect(() => {
    if (existingDocuments.length > 0 && activeAccordionKey === null) {
      const groupedBySample = existingDocuments.reduce((acc, doc) => {
        const sampleName = doc.sample_name || 'No Sample';
        if (!acc[sampleName]) {
          acc[sampleName] = [];
        }
        acc[sampleName].push(doc);
        return acc;
      }, {});
      const sampleNames = Object.keys(groupedBySample);
      if (sampleNames.length > 0) {
        setActiveAccordionKey(sampleNames[0]);
      }
    }
  }, [existingDocuments, activeAccordionKey]);

  useEffect(() => {
    if (existingPolicyDocuments.length > 0 && activePolicyAccordionKey === null) {
      const groupedBySample = existingPolicyDocuments.reduce((acc, doc) => {
        const sampleName = doc.sample_name || 'No Sample';
        if (!acc[sampleName]) {
          acc[sampleName] = [];
        }
        acc[sampleName].push(doc);
        return acc;
      }, {});
      const sampleNames = Object.keys(groupedBySample);
      if (sampleNames.length > 0) {
        setActivePolicyAccordionKey(sampleNames[0]);
      }
    }
  }, [existingPolicyDocuments, activePolicyAccordionKey]);
  
  // Generate year options (current year and next 5 years)
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = 0; i <= 5; i++) {
    years.push(currentYear + i);
  }

  // Quarter options
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];

  // Add a new sample
  const addSample = () => {
    const newId = Math.max(...samples.map(s => s.id), 0) + 1;
    setSamples([...samples, { id: newId, name: '', files: [], policyFlags: {} }]);
  };

  // Remove a sample (only if more than 1)
  const removeSample = (sampleId) => {
    if (samples.length > 1) {
      setSamples(samples.filter(s => s.id !== sampleId));
    }
  };

  // Update sample name
  const updateSampleName = (sampleId, name) => {
    setSamples(samples.map(s => s.id === sampleId ? { ...s, name } : s));
  };

  // Handle file selection for a sample
  const handleSampleFileChange = (sampleId, e) => {
    const files = Array.from(e.target.files);
    setSamples(samples.map(s => {
      if (s.id === sampleId) {
        const policyFlags = {};
        files.forEach((file, index) => {
          policyFlags[index] = false;
        });
        return { ...s, files, policyFlags };
      }
      return s;
    }));
  };

  // Update policy flag for a file in a sample
  const updatePolicyFlag = (sampleId, fileIndex, isPolicy) => {
    setSamples(samples.map(s => {
      if (s.id === sampleId) {
        return {
          ...s,
          policyFlags: { ...s.policyFlags, [fileIndex]: isPolicy }
        };
      }
      return s;
    }));
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{mode === 'edit' ? 'Edit Evidence (PBC)' : 'Create New Evidence (PBC)'}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={(e) => {
        e.preventDefault();
        // Build form data with samples
        const formData = new FormData();
        formData.append('client_id', form.client_id);
        formData.append('control_id', form.control_id);
        formData.append('evidence_name', form.evidence_name);
        formData.append('testing_status', form.testing_status);
        formData.append('year', form.year);
        formData.append('quarter', form.quarter);
        
        // Append files with sample names and policy flags
        samples.forEach((sample) => {
          if (sample.files && sample.files.length > 0) {
            sample.files.forEach((file, fileIndex) => {
              formData.append('documents', file);
              formData.append('sample_names', sample.name || '');
              const isPolicy = sample.policyFlags[fileIndex] || false;
            formData.append('is_policy_document', isPolicy);
            });
          }
        });
        
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

          <Form.Group className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <Form.Label className="mb-0">
                <strong>Samples</strong> {mode === 'create' && <span className="text-danger">*</span>}
                {mode === 'edit' && (<span className="text-muted ms-2">(Optional - You will have to re-test the newly uploaded document(s))</span>)}
              </Form.Label>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={addSample}
                disabled={loading}
                type="button"
              >
                <i className="fas fa-plus me-1"></i> Add Sample
              </Button>
            </div>
            <Form.Text className="text-muted d-block mb-3">
              {mode === 'create' 
                ? 'Add samples with their documents. Each sample can have multiple documents.'
                : 'Optionally add new samples with documents. You can also use "Add Documents to This Sample" button for existing samples.'}
            </Form.Text>
            
            {samples.map((sample, sampleIndex) => (
              <Card key={sample.id} className="mb-3" style={{ border: '1px solid #dee2e6' }}>
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <Form.Label className="mb-0 fw-bold">Sample {sampleIndex + 1}</Form.Label>
                    {samples.length > 1 && (
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => removeSample(sample.id)}
                        disabled={loading}
                        type="button"
                      >
                        <i className="fas fa-trash"></i> Remove
                      </Button>
                    )}
                  </div>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Sample Name {mode === 'create' && <span className="text-danger">*</span>}</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g., Sample 1, Q1 Sample, etc."
                      value={sample.name}
                      onChange={(e) => updateSampleName(sample.id, e.target.value)}
                      disabled={loading}
                      required={mode === 'create'}
                    />
                  </Form.Group>
                  
                  <Form.Group>
                    <Form.Label>Upload Document(s)</Form.Label>
            <Form.Control 
              type="file" 
                      onChange={(e) => handleSampleFileChange(sample.id, e)}
              multiple
              disabled={loading}
            />
            <Form.Text className="text-muted">
                      Select multiple files for this sample.
            </Form.Text>
            
                    {/* Show selected files for this sample */}
                    {sample.files.length > 0 && (
              <div className="mt-3">
                <Form.Label className="fw-bold">Mark as Policy Document:</Form.Label>
                <ListGroup>
                          {sample.files.map((file, fileIndex) => (
                            <ListGroup.Item key={fileIndex} className="d-flex justify-content-between align-items-center">
                      <span>
                        <i className="fas fa-file me-2"></i>
                        {file.name}
                      </span>
                      <Form.Check
                        type="switch"
                                id={`policy-doc-${sample.id}-${fileIndex}`}
                                checked={sample.policyFlags[fileIndex] || false}
                                onChange={(e) => updatePolicyFlag(sample.id, fileIndex, e.target.checked)}
                        label="Policy Document"
                      />
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </div>
            )}
                  </Form.Group>
                </Card.Body>
              </Card>
            ))}
          </Form.Group>

          {mode === 'edit' && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Existing Evidence Documents</Form.Label>
                {loadingDocuments ? (
                  <div className="text-center py-2">
                    <Spinner animation="border" size="sm" /> Loading documents...
                  </div>
                ) : existingDocuments.length > 0 ? (() => {
                  // Group documents by sample_name
                  const groupedBySample = existingDocuments.reduce((acc, doc) => {
                    const sampleName = doc.sample_name || 'No Sample';
                    if (!acc[sampleName]) {
                      acc[sampleName] = [];
                    }
                    acc[sampleName].push(doc);
                    return acc;
                  }, {});

                  const sampleNames = Object.keys(groupedBySample);

                  return (
                    <Accordion activeKey={activeAccordionKey} onSelect={(key) => setActiveAccordionKey(key)}>
                      {sampleNames.map((sampleName) => {
                        const sampleDocs = groupedBySample[sampleName];
                        return (
                          <Accordion.Item eventKey={sampleName} key={sampleName}>
                            <Accordion.Header>
                              <div className="d-flex justify-content-between align-items-center w-100 me-3">
                                <div>
                                  <strong>{sampleName}</strong> <span className="ms-2 text-muted">({sampleDocs.length} document{sampleDocs.length !== 1 ? 's' : ''})</span>
                                </div>
                                {onDeleteSample && (
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="text-danger p-0 ms-2"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteSample(sampleName);
                                    }}
                                    disabled={loading}
                                    title="Delete entire sample"
                                  >
                                    <i className="fas fa-trash"></i>
                                  </Button>
                                )}
                              </div>
                            </Accordion.Header>
                            <Accordion.Body>
                              {mode === 'edit' && evidenceId && (
                                <div className="mb-3">
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedSampleForUpload(sampleName);
                                      setShowAddDocumentsModal(true);
                                    }}
                                    disabled={loading}
                                  >
                                    <i className="fas fa-plus me-1"></i>
                                    Add Documents to This Sample
                                  </Button>
                                </div>
                              )}
                  <ListGroup>
                                {sampleDocs.map((doc) => {
                      // Extract base URL (without /api) for serving static files
                      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
                      const baseUrl = apiUrl.replace('/api', '');
                      const documentUrl = `${baseUrl}/uploads/${doc.artifact_url}`;
                                  const fileName = doc.artifact_url.split('/').pop() || `Document`;
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
                            </Accordion.Body>
                          </Accordion.Item>
                        );
                      })}
                    </Accordion>
                  );
                })() : (
                  <Form.Text className="text-muted">No evidence documents uploaded yet.</Form.Text>
                )}
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Existing Policy Documents</Form.Label>
                {loadingDocuments ? (
                  <div className="text-center py-2">
                    <Spinner animation="border" size="sm" /> Loading documents...
                  </div>
                ) : existingPolicyDocuments.length > 0 ? (() => {
                  // Group documents by sample_name
                  const groupedBySample = existingPolicyDocuments.reduce((acc, doc) => {
                    const sampleName = doc.sample_name || 'No Sample';
                    if (!acc[sampleName]) {
                      acc[sampleName] = [];
                    }
                    acc[sampleName].push(doc);
                    return acc;
                  }, {});

                  const sampleNames = Object.keys(groupedBySample);

                  return (
                    <Accordion activeKey={activePolicyAccordionKey} onSelect={(key) => setActivePolicyAccordionKey(key)}>
                      {sampleNames.map((sampleName) => {
                        const sampleDocs = groupedBySample[sampleName];
                        return (
                          <Accordion.Item eventKey={sampleName} key={sampleName}>
                            <Accordion.Header>
                              <div className="d-flex justify-content-between align-items-center w-100 me-3">
                                <div>
                                  <strong>{sampleName}</strong> <span className="ms-2 text-muted">({sampleDocs.length} document{sampleDocs.length !== 1 ? 's' : ''})</span>
                                </div>
                                {onDeleteSample && (
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="text-danger p-0 ms-2"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteSample(sampleName);
                                    }}
                                    disabled={loading}
                                    title="Delete entire sample"
                                  >
                                    <i className="fas fa-trash"></i>
                                  </Button>
                                )}
                              </div>
                            </Accordion.Header>
                            <Accordion.Body>
                              {mode === 'edit' && evidenceId && (
                                <div className="mb-3">
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedSampleForUpload(sampleName);
                                      setShowAddDocumentsModal(true);
                                    }}
                                    disabled={loading}
                                  >
                                    <i className="fas fa-plus me-1"></i>
                                    Add Documents to This Sample
                                  </Button>
                                </div>
                              )}
                  <ListGroup>
                                {sampleDocs.map((doc) => {
                      // Extract base URL (without /api) for serving static files
                      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
                      const baseUrl = apiUrl.replace('/api', '');
                      const documentUrl = `${baseUrl}/uploads/${doc.artifact_url}`;
                                  const fileName = doc.artifact_url.split('/').pop() || `Document`;
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
                            </Accordion.Body>
                          </Accordion.Item>
                        );
                      })}
                    </Accordion>
                  );
                })() : (
                  <Form.Text className="text-muted">No policy documents uploaded yet.</Form.Text>
                )}
              </Form.Group>
            </>
          )}

          {/* Add Documents Modal */}
          {mode === 'edit' && evidenceId && (
            <AddEvidenceDocumentsModal
              show={showAddDocumentsModal}
              onHide={() => {
                setShowAddDocumentsModal(false);
                setSelectedSampleForUpload(null);
                // Don't close the main modal - let user continue adding documents to other samples
              }}
              evidenceId={evidenceId}
              existingSamples={existingSampleNames}
              defaultSampleName={selectedSampleForUpload}
              onSuccess={async () => {
                // Refresh documents after successful upload
                if (onRefreshDocuments) {
                  await onRefreshDocuments();
                }
                // Modal will close itself via onHide, but main modal stays open
              }}
            />
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

