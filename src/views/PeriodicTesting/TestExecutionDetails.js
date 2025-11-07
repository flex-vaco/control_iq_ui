import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Tabs, Tab, Table, Button, Alert, Spinner } from 'react-bootstrap';
import { getTestExecutionById, checkTestExecutionEvidence, getTestExecutionEvidenceDocuments } from '../../services/api';
import { api } from '../../services/api';
import MarkEvidenceFileModal from '../../modals/PeriodicTesting/MarkEvidenceFileModal';
import ReportModal from '../../modals/PeriodicTesting/ReportModal';

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
   // eslint-disable-next-line no-unused-vars
  const [checkingExisting, setCheckingExisting] = useState(false);
  const [processingDocumentId, setProcessingDocumentId] = useState(null); // Track which document is being processed
  const [evidenceStatusMap, setEvidenceStatusMap] = useState({}); // Map of document_id to status info
  const [reportData, setReportData] = useState([]); // Data for Report tab
  const [showReportModal, setShowReportModal] = useState(false); // State for Report modal

  useEffect(() => {
    const fetchDetails = async () => {
      if (!id) return;
      
      setLoading(true);
      setError('');
      
      try {
        const response = await getTestExecutionById(id);
        setTestExecution(response.data.test_execution);
        setRcmDetails(response.data.rcm_details);
        const evidenceDocs = response.data.evidence_documents || [];
        setEvidenceDocuments(evidenceDocs);
        setTestAttributes(response.data.test_attributes || []);
        
        // Check status for each evidence document
        if (response.data.test_execution && evidenceDocs.length > 0) {
          const statusMap = {};
          await Promise.all(
            evidenceDocs.map(async (doc) => {
              try {
                const statusResponse = await checkTestExecutionEvidence(
                  response.data.test_execution.test_execution_id,
                  doc.document_id
                );
                if (statusResponse.data.exists) {
                  const statusValue = statusResponse.data.data.status;
                  // Status is stored as tinyint(1): 1 = Pass, 0 = Fail, NULL = not set
                  // Debug: log the actual value to see what we're getting
                  if (statusValue === null || statusValue === undefined) {
                    console.log(`Warning: Document ${doc.document_id} has record but status is ${statusValue}`, statusResponse.data.data);
                  }
                  statusMap[doc.document_id] = {
                    exists: true,
                    status: statusValue // This will be 1, 0, or null
                  };
                } else {
                  statusMap[doc.document_id] = {
                    exists: false,
                    status: null
                  };
                }
              } catch (err) {
                console.error(`Error checking status for document ${doc.document_id}:`, err);
                statusMap[doc.document_id] = {
                  exists: false,
                  status: null
                };
              }
            })
          );
          setEvidenceStatusMap(statusMap);
        }

        // Fetch report data (test execution evidence documents)
        if (response.data.test_execution) {
          try {
            const reportResponse = await getTestExecutionEvidenceDocuments(
              response.data.test_execution.test_execution_id
            );
            setReportData(reportResponse.data.data || []);
          } catch (err) {
            console.error('Error fetching report data:', err);
            setReportData([]);
          }
        }
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
    
    setProcessingDocumentId(doc.document_id); // Set which document is being processed
    setCheckingExisting(true);
    try {
      // Check if test_execution_evidence_documents has records
      const response = await checkTestExecutionEvidence(
        testExecution.test_execution_id,
        doc.document_id
      );
      
      if (response.data.exists) {
        // Record exists, set the existing result and open modal
        const existingData = response.data.data;
        setExistingTestResult(existingData);
        
        // Update status map
        setEvidenceStatusMap(prev => ({
          ...prev,
          [doc.document_id]: {
            exists: true,
            status: existingData.status
          }
        }));
        
        // If result_artifact_url exists, use it instead of the original artifact_url
        if (existingData.result_artifact_url) {
          documentData.display_artifact_url = getDocumentUrl(existingData.result_artifact_url);
        }
        
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
            const aiDetailsResponse = await api.post('/data/evidence-ai-details', {
              evidence_document_id: doc.document_id,
              evidence_url: doc.artifact_url
            });
            // Update documentData with the fetched evidence_ai_details
            if (aiDetailsResponse.data && aiDetailsResponse.data.extracted_text) {
              documentData.evidence_ai_details = aiDetailsResponse.data.extracted_text;
              // Also update the evidenceDocuments state so the data stays in sync
              setEvidenceDocuments(prevDocs => 
                prevDocs.map(prevDoc => 
                  prevDoc.document_id === doc.document_id 
                    ? { ...prevDoc, evidence_ai_details: aiDetailsResponse.data.extracted_text }
                    : prevDoc
                )
              );
            }
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
          let existingResultData = null;
          if (newRecordResponse.data.exists && compareResponse.data && compareResponse.data.results) {
            existingResultData = {
              ...newRecordResponse.data.data,
              results: compareResponse.data.results
            };
          } else if (compareResponse.data && compareResponse.data.results) {
            // Fallback: use results even if record fetch failed
            existingResultData = {
              results: compareResponse.data.results
            };
            // If we have the record data, check for result_artifact_url
            if (newRecordResponse.data.exists && newRecordResponse.data.data) {
              existingResultData = {
                ...newRecordResponse.data.data,
                ...existingResultData
              };
            }
          } else if (newRecordResponse.data.exists) {
            existingResultData = newRecordResponse.data.data;
          }
          
          // Update status map
          if (newRecordResponse.data.exists && newRecordResponse.data.data) {
            setEvidenceStatusMap(prev => ({
              ...prev,
              [doc.document_id]: {
                exists: true,
                status: newRecordResponse.data.data.status
              }
            }));
          }
          
          setExistingTestResult(existingResultData);
          
          // If result_artifact_url exists, use it instead of the original artifact_url
          if (existingResultData && existingResultData.result_artifact_url) {
            documentData.display_artifact_url = getDocumentUrl(existingResultData.result_artifact_url);
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
      setProcessingDocumentId(null); // Clear processing state
    }
  };

  if (loading) {
    return (
      <Container>
        <div className="text-center">
          <Spinner animation="border" />
          <p className="mt-3">Loading test execution details...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert variant="danger">{error}</Alert>
        <Button variant="secondary" onClick={() => navigate('/periodic-testing')}>
          Back to Periodic Testing
        </Button>
      </Container>
    );
  }

  if (!testExecution || !rcmDetails) {
    return (
      <Container>
        <Alert variant="warning">Test execution not found.</Alert>
        <Button variant="secondary" onClick={() => navigate('/periodic-testing')}>
          Back to Periodic Testing
        </Button>
      </Container>
    );
  }

  return (
    <Container>
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
          <h6 className="mb-0">Test Execution Details</h6>
        </Card.Header>
        <Card.Body className="pt-1 pb-1 pl-4 pr-4">
          <Row>
            <Col md={2} className="pl-0">
              <strong><i className="fas fa-building"></i></strong> {testExecution.client_name || '-'}
            </Col>
            <Col md={2} className="pl-0">
              <strong><i className="fas fa-key"></i></strong> {testExecution.control_id || '-'}
            </Col>
            <Col md={2} className="pl-0">
              <strong><i className="fas fa-calendar-alt"></i></strong> {testExecution.year || '-'} - {testExecution.quarter || '-'}
            </Col>
            <Col md={3} className="pl-0">
              <strong><i className="fas fa-project-diagram"></i></strong> {testExecution.process || '-'}
            </Col>
            <Col md={3} className="pl-0">
              <strong><i className="fas fa-shield-alt"></i></strong> {rcmDetails.classification || '-'}
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
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {evidenceDocuments.map((doc) => {
                        const statusInfo = evidenceStatusMap[doc.document_id];
                        const hasRecord = statusInfo?.exists || false;
                        const status = statusInfo?.status;
                        let statusDisplay = 'Pending Test';
                        if (hasRecord) {
                          if (status === 1 || status === true || status === '1' || status === 'true') {
                            statusDisplay = 'Pass';
                          } else if (status === 0 || status === false || status === '0' || status === 'false') {
                            statusDisplay = 'Fail';
                          } else {
                            statusDisplay = 'Pending Test';
                          }
                        }
                        
                        return (
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
                              {statusDisplay}
                            </td>
                            <td>
                              <Button 
                                variant="outline-primary" 
                                size="sm"
                                onClick={() => handleMarkEvidenceFile(doc)}
                                disabled={processingDocumentId !== null}
                              >
                                {processingDocumentId === doc.document_id ? (
                                  <>
                                    <Spinner
                                      as="span"
                                      animation="border"
                                      size="sm"
                                      role="status"
                                      aria-hidden="true"
                                      className="me-2"
                                    />
                                    Getting Analysis Details
                                  </>
                                ) : (
                                  hasRecord ? 'Mark' : 'Test & Mark'
                                )}
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
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
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">Test Execution Report</h5>
                  <Button variant="primary" onClick={() => setShowReportModal(true)}>
                    View Report
                  </Button>
                </div>
                {reportData.length > 0 ? (
                  <Table striped bordered hover responsive>
                    <thead>
                      <tr>
                        <th>Evidence Name</th>
                        <th>Summary</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.map((record) => {
                        // Parse status: 1 = Pass, 0 = Fail, null = Pending
                        let statusDisplay = 'Pending';
                        let statusClass = 'text-warning';
                        if (record.status === 1 || record.status === true || record.status === '1' || record.status === 'true') {
                          statusDisplay = 'Pass';
                          statusClass = 'text-success';
                        } else if (record.status === 0 || record.status === false || record.status === '0' || record.status === 'false') {
                          statusDisplay = 'Fail';
                          statusClass = 'text-danger';
                        }

                        // Get summary from result_parsed
                        const summary = record.result_parsed?.summary || '-';

                        return (
                          <tr key={record.id}>
                            <td>{record.evidence_name || '-'}</td>
                            <td>{summary}</td>
                            <td className={statusClass}>
                              <strong>{statusDisplay}</strong>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                ) : (
                  <Alert variant="info">No test execution evidence documents found. Complete testing on evidence documents to see results here.</Alert>
                )}
              </div>
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>

      <MarkEvidenceFileModal
        show={showMarkEvidenceFileModal}
        onHide={() => {
          const currentDocId = selectedDocument?.document_id;
          setShowMarkEvidenceFileModal(false);
          setSelectedDocument(null);
          setExistingTestResult(null);
          if (currentDocId && testExecution) {
            checkTestExecutionEvidence(
              testExecution.test_execution_id,
              currentDocId
            ).then(response => {
              if (response.data.exists) {
                setEvidenceStatusMap(prev => ({
                  ...prev,
                  [currentDocId]: {
                    exists: true,
                    status: response.data.data.status
                  }
                }));
              }
            }).catch(err => console.error('Error refreshing status:', err));
            
            // Refresh report data
            getTestExecutionEvidenceDocuments(testExecution.test_execution_id)
              .then(reportResponse => {
                setReportData(reportResponse.data.data || []);
              })
              .catch(err => console.error('Error refreshing report data:', err));
          }
        }}
        documentData={selectedDocument}
        testExecution={testExecution}
        rcmDetails={rcmDetails}
        existingTestResult={existingTestResult}
      />

      <ReportModal
        show={showReportModal}
        onHide={() => setShowReportModal(false)}
        testExecution={testExecution}
        rcmDetails={rcmDetails}
        testAttributes={testAttributes}
        evidenceDocuments={evidenceDocuments}
      />
    </Container>
  );
};

export default TestExecutionDetails;

