import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Tabs, Tab, Table, Button, Alert, Spinner } from 'react-bootstrap';
import { getTestExecutionById, checkTestExecutionEvidence } from '../../services/api';
import { api } from '../../services/api';
import MarkEvidenceFileModal from '../../modals/PeriodicTesting/MarkEvidenceFileModal';

const TestExecutionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('desc');
  const [testExecution, setTestExecution] = useState(null);
  const [rcmDetails, setRcmDetails] = useState(null);
  const [evidenceDocuments, setEvidenceDocuments] = useState([]);
  const [testAttributes, setTestAttributes] = useState([]);
  const [showMarkEvidenceFileModal, setShowMarkEvidenceFileModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [existingTestResult, setExistingTestResult] = useState(null);
  const [checkingExisting, setCheckingExisting] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!id) return;
      
      setLoading(true);
      setError('');
      
      try {
        const response = await getTestExecutionById(id);
        setTestExecution(response.data.test_execution);
        setRcmDetails(response.data.rcm_details);
        setEvidenceDocuments(response.data.evidence_documents || []);
        setTestAttributes(response.data.test_attributes || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch test execution details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  const getDocumentUrl = (artifactUrl) => {
    if (!artifactUrl) return '';
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const baseUrl = apiUrl.replace('/api', '');
    if (artifactUrl.startsWith('uploads/')) {
      return `${baseUrl}/${artifactUrl}`;
    } else if (artifactUrl.startsWith('evidences/')) {
      return `${baseUrl}/uploads/${artifactUrl}`;
    } else {
      return `${baseUrl}/uploads/${artifactUrl}`;
    }
  };

  const handleMarkEvidenceFile = async (doc) => {
    // Get full document URL
    const documentData = {
      ...doc,
      display_artifact_url: getDocumentUrl(doc.artifact_url)
    };
    
    setCheckingExisting(true);
    try {
      // Check if test_execution_evidence_documents has records
      const response = await checkTestExecutionEvidence(
        testExecution.test_execution_id,
        doc.document_id
      );
      
      if (response.data.exists) {
        // Record exists, set the existing result and open modal
        setExistingTestResult(response.data.data);
        setSelectedDocument(documentData);
        setShowMarkEvidenceFileModal(true);
      } else {
        // Record doesn't exist, do fetchEvidenceAIDetails and compareAttributes before opening popup
        try {
          // Step 1: Fetch Evidence AI Details (if needed)
          // Check if evidence_ai_details is missing or empty
          const needsAIDetails = !doc.evidence_ai_details || 
              (typeof doc.evidence_ai_details === 'string' && doc.evidence_ai_details.trim() === '') ||
              (typeof doc.evidence_ai_details === 'object' && Object.keys(doc.evidence_ai_details).length === 0);
          
          if (needsAIDetails) {
            await api.post('/data/evidence-ai-details', {
              evidence_document_id: doc.document_id,
              evidence_url: doc.artifact_url
            });
            // Small delay to ensure database update is committed
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
          // Step 2: Compare Attributes (this will create the record in test_execution_evidence_documents)
          // The API fetches evidence_ai_details from DB, so we pass empty string if not available
          // The backend will validate from the database value, not the request body
          const compareResponse = await api.post('/data/compare-attributes', {
            evidence_document_id: doc.document_id,
            rcm_id: testExecution.rcm_id,
            test_execution_id: testExecution.test_execution_id,
            client_id: testExecution.client_id
          });
          
          // Step 3: Get the newly created record to have complete data
          const newRecordResponse = await checkTestExecutionEvidence(
            testExecution.test_execution_id,
            doc.document_id
          );
          
          // Use the results from compareAttributes response and combine with record data
          if (newRecordResponse.data.exists && compareResponse.data && compareResponse.data.results) {
            setExistingTestResult({
              ...newRecordResponse.data.data,
              results: compareResponse.data.results
            });
          } else if (compareResponse.data && compareResponse.data.results) {
            // Fallback: use results even if record fetch failed
            setExistingTestResult({
              results: compareResponse.data.results
            });
          } else {
            setExistingTestResult(null);
          }
          
          // Step 4: Open modal with the results
          setSelectedDocument(documentData);
          setShowMarkEvidenceFileModal(true);
        } catch (error) {
          console.error('Error processing evidence:', error);
          // On error, still open modal but without existing result
          setExistingTestResult(null);
          setSelectedDocument(documentData);
          setShowMarkEvidenceFileModal(true);
        }
      }
    } catch (error) {
      console.error('Error checking existing test result:', error);
      // On error, still open modal but without existing result
      setExistingTestResult(null);
      setSelectedDocument(documentData);
      setShowMarkEvidenceFileModal(true);
    } finally {
      setCheckingExisting(false);
    }
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <Spinner animation="border" />
          <p className="mt-3">Loading test execution details...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error}</Alert>
        <Button variant="secondary" onClick={() => navigate('/periodic-testing')}>
          Back to Periodic Testing
        </Button>
      </Container>
    );
  }

  if (!testExecution || !rcmDetails) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">Test execution not found.</Alert>
        <Button variant="secondary" onClick={() => navigate('/periodic-testing')}>
          Back to Periodic Testing
        </Button>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Row className="mb-3">
        <Col>
          <Button variant="secondary" onClick={() => navigate('/periodic-testing')}>
            ← Back to Periodic Testing
          </Button>
        </Col>
      </Row>

      {/* Consolidated Information Section */}
      <Card className="mb-4">
        <Card.Header>
          <h4 className="mb-0">Test Execution Details</h4>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={2} className="mb-2">
              <strong>Client:</strong> {testExecution.client_name || '-'}
            </Col>
            <Col md={2} className="mb-2">
              <strong>Year:</strong> {testExecution.year || '-'}
            </Col>
            <Col md={2} className="mb-2">
              <strong>Quarter:</strong> {testExecution.quarter || '-'}
            </Col>
            <Col md={2} className="mb-2">
              <strong>Process:</strong> {testExecution.process || '-'}
            </Col>
            <Col md={2} className="mb-2">
              <strong>Classification:</strong> {rcmDetails.classification || '-'}
            </Col>
            <Col md={2} className="mb-2">
              <strong>Control ID:</strong> {testExecution.control_id || '-'}
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Tabs Section */}
      <Card>
        <Card.Body>
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-3"
          >
            {/* Desc Tab */}
            <Tab eventKey="desc" title="Description">
              <div className="mt-3">
                <h5>Control Description</h5>
                <p className="text-muted">
                  {rcmDetails.control_description || 'No control description available.'}
                </p>
              </div>
            </Tab>

            {/* Policy Tab */}
            <Tab eventKey="policy" title="Policy">
              <div className="mt-3">
                <Alert variant="info">Policy data will be displayed here.</Alert>
              </div>
            </Tab>

            {/* Attributes Tab */}
            <Tab eventKey="attributes" title="Attributes">
              <div className="mt-3">
                <h5>Test Attributes</h5>
                {testAttributes.length > 0 ? (
                  <Table striped bordered hover responsive>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Test Steps</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testAttributes.map((attr) => (
                        <tr key={attr.attribute_id}>
                          <td>{attr.attribute_name}</td>
                          <td>{attr.attribute_description || '-'}</td>
                          <td>{attr.test_steps || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <Alert variant="info">No test attributes found for this control.</Alert>
                )}
              </div>
            </Tab>

            {/* Evidences Tab */}
            <Tab eventKey="evidences" title="Evidences">
              <div className="mt-3">
                <h5>Evidence Documents</h5>
                {evidenceDocuments.length > 0 ? (
                  <Table striped bordered hover responsive>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Document Link</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {evidenceDocuments.map((doc) => (
                        <tr key={doc.document_id}>
                          <td>{doc.evidence_name || '-'}</td>
                          <td>
                            <a 
                              href={getDocumentUrl(doc.artifact_url)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary"
                            >
                              <i className="fas fa-external-link-alt me-2"></i>
                              View Document
                            </a>
                          </td>
                          <td>
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              onClick={() => handleMarkEvidenceFile(doc)}
                              disabled={checkingExisting}
                            >
                              {checkingExisting ? 'Checking...' : 'Test & Mark'}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <Alert variant="info">
                    No evidence documents found for this control, year, and quarter.
                  </Alert>
                )}
              </div>
            </Tab>

            {/* Report Tab */}
            <Tab eventKey="report" title="Report">
              <div className="mt-3">
                <Alert variant="info">Report data will be displayed here.</Alert>
              </div>
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>

      <MarkEvidenceFileModal
        show={showMarkEvidenceFileModal}
        onHide={() => {
          setShowMarkEvidenceFileModal(false);
          setSelectedDocument(null);
          setExistingTestResult(null);
        }}
        documentData={selectedDocument}
        testExecution={testExecution}
        existingTestResult={existingTestResult}
      />
    </Container>
  );
};

export default TestExecutionDetails;

