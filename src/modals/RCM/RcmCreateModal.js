import React from 'react';
import { Modal, Button, Form, Spinner, Row, Col } from 'react-bootstrap';

const RcmCreateModal = ({
  show,
  onHide,
  form,
  onChange,
  onSubmit,
  loading,
  clients,
  mode = 'create' // 'create' or 'edit'
}) => {
  return (
    <Modal show={show} onHide={onHide} size="xl">
      <Modal.Header closeButton>
        <Modal.Title>{mode === 'edit' ? 'Edit RCM Record' : 'Create New RCM Record'}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={onSubmit}>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <div className="rcm-details-container">
            {/* Client Selection */}
            <div className="rcm-details-section">
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
            </div>

            {/* Control Information Section */}
            <div className="rcm-details-section">
              <h5 className="rcm-section-title">Control Information</h5>
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group controlId="controlIdInput">
                    <Form.Label>Control ID <span className="text-danger">*</span></Form.Label>
                    <Form.Control 
                      type="text" 
                      name="control_id"
                      value={form.control_id || ''}
                      onChange={onChange}
                      required
                      disabled={loading}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={12}>
                  <Form.Group controlId="controlDescriptionInput">
                    <Form.Label>Control Description</Form.Label>
                    <Form.Control 
                      as="textarea" 
                      rows={3}
                      name="control_description"
                      value={form.control_description || ''}
                      onChange={onChange}
                      disabled={loading}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>

            {/* Process Information Section */}
            <div className="rcm-details-section">
              <h5 className="rcm-section-title">Process Information</h5>
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group controlId="processInput">
                    <Form.Label>Process</Form.Label>
                    <Form.Control 
                      type="text" 
                      name="process"
                      value={form.process || ''}
                      onChange={onChange}
                      disabled={loading}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="subProcessInput">
                    <Form.Label>Sub Process</Form.Label>
                    <Form.Control 
                      type="text" 
                      name="sub_process"
                      value={form.sub_process || ''}
                      onChange={onChange}
                      disabled={loading}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>

            {/* Risk Information Section */}
            <div className="rcm-details-section">
              <h5 className="rcm-section-title">Risk Information</h5>
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group controlId="riskIdInput">
                    <Form.Label>Risk ID</Form.Label>
                    <Form.Control 
                      type="text" 
                      name="risk_id"
                      value={form.risk_id || ''}
                      onChange={onChange}
                      disabled={loading}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="riskRatingInput">
                    <Form.Label>Risk Rating</Form.Label>
                    <Form.Control 
                      type="text" 
                      name="risk_rating"
                      value={form.risk_rating || ''}
                      onChange={onChange}
                      disabled={loading}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={12}>
                  <Form.Group controlId="riskDescriptionInput">
                    <Form.Label>Risk Description</Form.Label>
                    <Form.Control 
                      as="textarea" 
                      rows={3}
                      name="risk_description"
                      value={form.risk_description || ''}
                      onChange={onChange}
                      disabled={loading}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>

            {/* Control Characteristics Section */}
            <div className="rcm-details-section">
              <h5 className="rcm-section-title">Control Characteristics</h5>
              <Row className="mb-3">
                <Col md={4}>
                  <Form.Group controlId="classificationInput">
                    <Form.Label>Classification</Form.Label>
                    <Form.Control 
                      type="text" 
                      name="classification"
                      value={form.classification || ''}
                      onChange={onChange}
                      disabled={loading}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group controlId="frequencyInput">
                    <Form.Label>Frequency</Form.Label>
                    <Form.Control 
                      type="text" 
                      name="frequency"
                      value={form.frequency || ''}
                      onChange={onChange}
                      disabled={loading}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group controlId="automatedManualInput">
                    <Form.Label>Automated/Manual</Form.Label>
                    <Form.Control 
                      type="text" 
                      name="automated_manual"
                      value={form.automated_manual || ''}
                      onChange={onChange}
                      disabled={loading}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group controlId="preventiveDetectiveInput">
                    <Form.Label>Preventive/Detective</Form.Label>
                    <Form.Control 
                      type="text" 
                      name="preventive_detective"
                      value={form.preventive_detective || ''}
                      onChange={onChange}
                      disabled={loading}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="significanceInput">
                    <Form.Label>Significance</Form.Label>
                    <Form.Control 
                      type="text" 
                      name="significance"
                      value={form.significance || ''}
                      onChange={onChange}
                      disabled={loading}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>

            {/* Additional Information Section */}
            <div className="rcm-details-section">
              <h5 className="rcm-section-title">Additional Information</h5>
              <Row className="mb-3">
                <Col md={12}>
                  <Form.Group controlId="summaryInput">
                    <Form.Label>Summary</Form.Label>
                    <Form.Control 
                      as="textarea" 
                      rows={3}
                      name="summary"
                      value={form.summary || ''}
                      onChange={onChange}
                      disabled={loading}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group controlId="ownersInput">
                    <Form.Label>Owners</Form.Label>
                    <Form.Control 
                      type="text" 
                      name="owners"
                      value={form.owners || ''}
                      onChange={onChange}
                      disabled={loading}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="locationInput">
                    <Form.Label>Location</Form.Label>
                    <Form.Control 
                      type="text" 
                      name="location"
                      value={form.location || ''}
                      onChange={onChange}
                      disabled={loading}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group controlId="mitigatesInput">
                    <Form.Label>Mitigates</Form.Label>
                    <Form.Control 
                      type="text" 
                      name="mitigates"
                      value={form.mitigates || ''}
                      onChange={onChange}
                      disabled={loading}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="itSystemsInput">
                    <Form.Label>IT Systems</Form.Label>
                    <Form.Control 
                      type="text" 
                      name="it_systems"
                      value={form.it_systems || ''}
                      onChange={onChange}
                      disabled={loading}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={12}>
                  <Form.Group controlId="keyReportsInput">
                    <Form.Label>Key Reports</Form.Label>
                    <Form.Control 
                      as="textarea" 
                      rows={2}
                      name="key_reports"
                      value={form.key_reports || ''}
                      onChange={onChange}
                      disabled={loading}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>
          </div>

        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            Cancel
          </Button>
          <Button 
            variant="success" 
            type="submit" 
            disabled={loading || !form.control_id || !form.client_id}
          >
            {loading ? <><Spinner as="span" animation="border" size="sm" /> Saving...</> : mode === 'edit' ? 'Update RCM' : 'Create RCM'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default RcmCreateModal;

