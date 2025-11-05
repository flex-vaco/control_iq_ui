import React from 'react';
import { Modal, Button, Row, Col } from 'react-bootstrap';

const RcmDetailsModal = ({ show, onHide, rcmData }) => {
  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>RCM Details - {rcmData?.control_id || 'N/A'}</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {rcmData && (
          <div className="rcm-details-container">
            {/* Control Information Section */}
            <div className="rcm-details-section">
              <h5 className="rcm-section-title">Control Information</h5>
              <Row className="mb-3">
                <Col md={6}>
                  <div className="rcm-detail-item">
                    <label>Control ID</label>
                    <div className="rcm-detail-value">{rcmData.control_id || 'N/A'}</div>
                  </div>
                </Col>
                
              </Row>
              <Row className="mb-3">
                <Col md={12}>
                  <div className="rcm-detail-item">
                    <label>Control Description</label>
                    <div className="rcm-detail-value">{rcmData.control_description || 'N/A'}</div>
                  </div>
                </Col>
              </Row>
            </div>

            {/* Process Information Section */}
            <div className="rcm-details-section">
              <h5 className="rcm-section-title">Process Information</h5>
              <Row className="mb-3">
                <Col md={6}>
                  <div className="rcm-detail-item">
                    <label>Process</label>
                    <div className="rcm-detail-value">{rcmData.process || 'N/A'}</div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="rcm-detail-item">
                    <label>Sub Process</label>
                    <div className="rcm-detail-value">{rcmData.sub_process || 'N/A'}</div>
                  </div>
                </Col>
              </Row>
            </div>

            {/* Risk Information Section */}
            <div className="rcm-details-section">
              <h5 className="rcm-section-title">Risk Information</h5>
              <Row className="mb-3">
                <Col md={6}>
                  <div className="rcm-detail-item">
                    <label>Risk ID</label>
                    <div className="rcm-detail-value">{rcmData.risk_id || 'N/A'}</div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="rcm-detail-item">
                    <label>Risk Rating</label>
                    <div className="rcm-detail-value">{rcmData.risk_rating || 'N/A'}</div>
                  </div>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={12}>
                  <div className="rcm-detail-item">
                    <label>Risk Description</label>
                    <div className="rcm-detail-value">{rcmData.risk_description || 'N/A'}</div>
                  </div>
                </Col>
              </Row>
            </div>

            {/* Control Characteristics Section */}
            <div className="rcm-details-section">
              <h5 className="rcm-section-title">Control Characteristics</h5>
              <Row className="mb-3">
                <Col md={4}>
                  <div className="rcm-detail-item">
                    <label>Classification</label>
                    <div className="rcm-detail-value">{rcmData.classification || 'N/A'}</div>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="rcm-detail-item">
                    <label>Frequency</label>
                    <div className="rcm-detail-value">{rcmData.frequency || 'N/A'}</div>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="rcm-detail-item">
                    <label>Automated/Manual</label>
                    <div className="rcm-detail-value">{rcmData.automated_manual || 'N/A'}</div>
                  </div>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <div className="rcm-detail-item">
                    <label>Preventive/Detective</label>
                    <div className="rcm-detail-value">{rcmData.preventive_detective || 'N/A'}</div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="rcm-detail-item">
                    <label>Significance</label>
                    <div className="rcm-detail-value">{rcmData.significance || 'N/A'}</div>
                  </div>
                </Col>
              </Row>
            </div>

            {/* Additional Information Section */}
            <div className="rcm-details-section">
              <h5 className="rcm-section-title">Additional Information</h5>
              <Row className="mb-3">
                <Col md={12}>
                  <div className="rcm-detail-item">
                    <label>Summary</label>
                    <div className="rcm-detail-value">{rcmData.summary || 'N/A'}</div>
                  </div>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <div className="rcm-detail-item">
                    <label>Owners</label>
                    <div className="rcm-detail-value">{rcmData.owners || 'N/A'}</div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="rcm-detail-item">
                    <label>Location</label>
                    <div className="rcm-detail-value">{rcmData.location || 'N/A'}</div>
                  </div>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <div className="rcm-detail-item">
                    <label>Mitigates</label>
                    <div className="rcm-detail-value">{rcmData.mitigates || 'N/A'}</div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="rcm-detail-item">
                    <label>IT Systems</label>
                    <div className="rcm-detail-value">{rcmData.it_systems || 'N/A'}</div>
                  </div>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={12}>
                  <div className="rcm-detail-item">
                    <label>Key Reports</label>
                    <div className="rcm-detail-value">{rcmData.key_reports || 'N/A'}</div>
                  </div>
                </Col>
              </Row>
            </div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default RcmDetailsModal;

