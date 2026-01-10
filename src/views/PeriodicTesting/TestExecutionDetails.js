import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Tabs, Tab, Table, Button, Alert, Spinner, Accordion } from 'react-bootstrap';
import { getTestExecutionById, checkTestExecutionEvidence, getTestExecutionEvidenceDocuments, updateTestExecutionStatusAndResult, evaluateAllEvidences } from '../../services/api';
import { getPolicyDocuments } from '../../services/api';
import { api } from '../../services/api';
import Swal from 'sweetalert2';
import MarkEvidenceFileModal from '../../modals/PeriodicTesting/MarkEvidenceFileModal';
import ReportModal from '../../modals/PeriodicTesting/ReportModal';
import AddEvidenceDocumentsModal from '../../modals/PeriodicTesting/AddEvidenceDocumentsModal';
import EvaluateAllModal from '../../modals/PeriodicTesting/EvaluateAllModal';

const TestExecutionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('desc');
  const [testExecution, setTestExecution] = useState(null);
  const [rcmDetails, setRcmDetails] = useState(null);
  const [evidenceDocuments, setEvidenceDocuments] = useState([]);
  const [policyDocuments, setPolicyDocuments] = useState([]);
  const [evidenceDetails, setEvidenceDetails] = useState(null);
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
  const [showAddEvidenceModal, setShowAddEvidenceModal] = useState(false); // State for Add Evidence Documents modal
  const [showEvaluateAllModal, setShowEvaluateAllModal] = useState(false); // State for Evaluate All modal
  const [evaluateAllResults, setEvaluateAllResults] = useState(null); // Results from evaluate all
  const [evaluatingAll, setEvaluatingAll] = useState(false); // Loading state for evaluate all
  const [testResultChangeComment, setTestResultChangeComment] = useState(''); // Comment for test result change
  const [showTestResultComment, setShowTestResultComment] = useState(false); // Show comment input
  const [pendingTestResult, setPendingTestResult] = useState(null); // Store pending result change
  const [activeAccordionKey, setActiveAccordionKey] = useState(null); // Active accordion key for sample grouping
  const [evaluatingSample, setEvaluatingSample] = useState(null); // Track which sample is being evaluated

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
        const policyDocs = response.data.policy_documents || [];
        setPolicyDocuments(policyDocs);
        setTestAttributes(response.data.test_attributes || []);
        setEvidenceDetails(response.data.evidence_details || null);
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
                // Don't show error for 401 - interceptor handles it
                if (err.response?.status !== 401) {
                  console.error(`Error checking status for document ${doc.document_id}:`, err);
                }
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
            // Don't show error for 401 - interceptor handles it
            if (err.response?.status !== 401) {
              console.error('Error fetching report data:', err);
            }
            setReportData([]);
          }
        }
      } catch (err) {
        // Don't show error for 401 - interceptor handles it
        if (err.response?.status !== 401) {
          setError(err.response?.data?.message || 'Failed to fetch test execution details.');
          console.error(err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  // Set default active accordion key when evidence documents change
  useEffect(() => {
    if (evidenceDocuments.length > 0 && activeAccordionKey === null) {
      const groupedBySample = evidenceDocuments.reduce((acc, doc) => {
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
  }, [evidenceDocuments, activeAccordionKey]);

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

  const handleTestResultChange = async (newResult, comment) => {
    if (!testExecution) return;
    
    try {
      await updateTestExecutionStatusAndResult({
        test_execution_id: testExecution.test_execution_id,
        status: testExecution.status || 'pending',
        result: newResult,
        test_result_change_comment: comment
      });
      
      // Hide comment input and reset pending result
      setShowTestResultComment(false);
      setTestResultChangeComment('');
      setPendingTestResult(null);
      
      // Refresh the page data
      const response = await getTestExecutionById(id);
      setTestExecution(response.data.test_execution);
      
      // Refresh report data
      try {
        const reportResponse = await getTestExecutionEvidenceDocuments(testExecution.test_execution_id);
        setReportData(reportResponse.data.data || []);
      } catch (err) {
        console.error('Error refreshing report data:', err);
      }
      
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Test result updated successfully.',
        confirmButtonColor: '#286070'
      });
    } catch (error) {
      console.error('Error updating result:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to update result. Please try again.',
        confirmButtonColor: '#286070'
      });
    }
  };

  const handleEvaluateAll = async (sampleName = null) => {
    if (!testExecution || !evidenceDocuments || evidenceDocuments.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Evidence Documents',
        text: 'No evidence documents available to evaluate.',
        confirmButtonColor: '#286070'
      });
      return;
    }

    // Filter documents by sample if sampleName is provided
    const documentsToEvaluate = sampleName 
      ? evidenceDocuments.filter(doc => (doc.sample_name || 'No Sample') === sampleName)
      : evidenceDocuments;

    if (documentsToEvaluate.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Documents',
        text: `No evidence documents found for sample "${sampleName}".`,
        confirmButtonColor: '#286070'
      });
      return;
    }

    // Open modal immediately and show loader
    setShowEvaluateAllModal(true);
    setEvaluateAllResults(null);
    setEvaluatingAll(true);
    setEvaluatingSample(sampleName);
    setProcessingDocumentId('evaluate_all'); // Use special identifier
    
    try {
      // Call API to evaluate all evidences for this sample
      const response = await evaluateAllEvidences({
        test_execution_id: testExecution.test_execution_id,
        rcm_id: testExecution.rcm_id,
        client_id: testExecution.client_id,
        sample_name: sampleName || null
      });

      if (response.data && response.data.results) {
        setEvaluateAllResults(response.data.results);
      }
    } catch (error) {
      console.error('Error evaluating all evidences:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to evaluate all evidences. Please try again.',
        confirmButtonColor: '#286070'
      });
      // Close modal on error
      setShowEvaluateAllModal(false);
    } finally {
      setEvaluatingAll(false);
      setEvaluatingSample(null);
      setProcessingDocumentId(null);
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
          <div className="d-flex justify-content-between align-items-center">
            <h6 className="mb-0">Test Execution Details</h6>
            {testExecution.status !== 'completed' && (
              <div className="d-flex gap-2">
                <select
                  value={testExecution.status || 'pending'}
                  onChange={async (e) => {
                    if (e.target.value === 'completed') {
                      Swal.fire({
                        title: 'Confirm Status Change',
                        text: 'Are you sure you want to mark this test execution as completed? Once completed, you cannot change the results for attributes or the overall test. This action cannot be reverted.',
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#286070',
                        cancelButtonColor: '#6c757d',
                        confirmButtonText: 'Yes, mark as completed',
                        cancelButtonText: 'Cancel'
                      }).then(async (result) => {
                        if (result.isConfirmed) {
                          // Show result selection dialog
                          const { value: selectedResult } = await Swal.fire({
                            title: 'Select Final Result',
                            text: 'Please select the final result for this test execution. This cannot be changed once set.',
                            input: 'select',
                            inputOptions: {
                              'pass': 'Pass',
                              'fail': 'Fail',
                              'partial': 'Partial',
                              'na': 'N/A'
                            },
                            inputPlaceholder: 'Select result',
                            showCancelButton: true,
                            confirmButtonColor: '#286070',
                            cancelButtonColor: '#6c757d',
                            confirmButtonText: 'Confirm',
                            cancelButtonText: 'Cancel',
                            inputValidator: (value) => {
                              if (!value) {
                                return 'You need to select a result!';
                              }
                            }
                          });

                          if (selectedResult) {
                            try {
                              await updateTestExecutionStatusAndResult({
                                test_execution_id: testExecution.test_execution_id,
                                status: 'completed',
                                result: selectedResult
                              });
                              
                              Swal.fire({
                                icon: 'success',
                                title: 'Success!',
                                text: 'Test execution marked as completed.',
                                confirmButtonColor: '#286070'
                              });

                              // Refresh the page data
                              const response = await getTestExecutionById(id);
                              setTestExecution(response.data.test_execution);
                              
                              // Refresh report data
                              try {
                                const reportResponse = await getTestExecutionEvidenceDocuments(testExecution.test_execution_id);
                                setReportData(reportResponse.data.data || []);
                              } catch (err) {
                                console.error('Error refreshing report data:', err);
                              }
                            } catch (error) {
                              console.error('Error updating status:', error);
                              Swal.fire({
                                icon: 'error',
                                title: 'Error',
                                text: error.response?.data?.message || 'Failed to update status. Please try again.',
                                confirmButtonColor: '#286070'
                              });
                            }
                          }
                        }
                      });
                    } else {
                      // For non-completed status changes, just update directly
                      try {
                        await updateTestExecutionStatusAndResult({
                          test_execution_id: testExecution.test_execution_id,
                          status: e.target.value,
                          result: testExecution.result || 'na'
                        });
                        
                        // Refresh the page data
                        const response = await getTestExecutionById(id);
                        setTestExecution(response.data.test_execution);
                        
                        // Refresh report data
                        try {
                          const reportResponse = await getTestExecutionEvidenceDocuments(testExecution.test_execution_id);
                          setReportData(reportResponse.data.data || []);
                        } catch (err) {
                          console.error('Error refreshing report data:', err);
                        }
                      } catch (error) {
                        console.error('Error updating status:', error);
                        Swal.fire({
                          icon: 'error',
                          title: 'Error',
                          text: error.response?.data?.message || 'Failed to update status. Please try again.',
                          confirmButtonColor: '#286070'
                        });
                      }
                    }
                  }}
                  style={{
                    fontSize: '0.875rem',
                    padding: '0.25rem 0.5rem',
                    border: '1px solid #dee2e6',
                    borderRadius: '0.25rem',
                    cursor: 'pointer'
                  }}
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
                {testExecution.status !== 'completed' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <select
                      value={pendingTestResult !== null ? pendingTestResult : (testExecution.result || 'na')}
                      onChange={(e) => {
                        const newResult = e.target.value;
                        const oldResult = testExecution.result || 'na';
                        
                        // Check if result is changing from pass to fail or fail to pass
                        const isPassToFail = (oldResult === 'pass' && newResult === 'fail');
                        const isFailToPass = (oldResult === 'fail' && newResult === 'pass');
                        
                        if (isPassToFail || isFailToPass) {
                          // Show comment input and store pending result
                          setPendingTestResult(newResult);
                          setShowTestResultComment(true);
                          setTestResultChangeComment('');
                        } else {
                          // Hide comment input
                          setPendingTestResult(null);
                          setShowTestResultComment(false);
                          setTestResultChangeComment('');
                          // Update immediately if not changing pass/fail
                          handleTestResultChange(newResult, '');
                        }
                      }}
                      style={{
                        fontSize: '0.875rem',
                        padding: '0.25rem 0.5rem',
                        border: '1px solid #dee2e6',
                        borderRadius: '0.25rem',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="na">N/A</option>
                      <option value="pass">Pass</option>
                      <option value="fail">Fail</option>
                      <option value="partial">Partial</option>
                    </select>
                    {showTestResultComment && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: '500', display: 'block', marginBottom: '0.25rem' }}>
                          Reason for changing test result <span style={{ color: '#dc3545' }}>*</span>
                        </label>
                        <textarea
                          value={testResultChangeComment}
                          onChange={(e) => setTestResultChangeComment(e.target.value)}
                          placeholder="Please provide a reason for changing the test result..."
                          style={{
                            width: '100%',
                            fontSize: '0.8rem',
                            padding: '0.5rem',
                            border: '1px solid #dee2e6',
                            borderRadius: '0.25rem',
                            minHeight: '60px',
                            resize: 'vertical'
                          }}
                          required
                        />
                        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              if (pendingTestResult !== null) {
                                handleTestResultChange(pendingTestResult, testResultChangeComment);
                              }
                            }}
                            disabled={!testResultChangeComment || testResultChangeComment.trim() === ''}
                          >
                            Save
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setShowTestResultComment(false);
                              setTestResultChangeComment('');
                              setPendingTestResult(null);
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            {testExecution.status === 'completed' && (
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-success">Completed</span>
                <span className="badge bg-info">
                  Result: {testExecution.result ? testExecution.result.charAt(0).toUpperCase() + testExecution.result.slice(1) : 'N/A'}
                </span>
              </div>
            )}
          </div>
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
                <h5>Policy Documents</h5>
                {policyDocuments.length > 0 ? (
                  <Table striped bordered hover responsive>
                    <thead>
                      <tr>
                        <th>Document Name</th>
                        <th>Upload Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {policyDocuments.map((doc) => {
                        const documentUrl = getDocumentUrl(doc.artifact_url);
                        const fileName = doc.document_name || doc.artifact_url.split('/').pop() || 'Document';
                        return (
                          <tr key={doc.document_id}>
                            <td>
                              <a 
                                href={documentUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-decoration-none"
                              >
                                <i className="fas fa-file me-2"></i>
                                {fileName}
                              </a>
                            </td>
                            <td>
                              {doc.created_date 
                                ? new Date(doc.created_date).toLocaleDateString() 
                                : doc.created_at 
                                  ? new Date(doc.created_at).toLocaleDateString() 
                                  : '-'}
                            </td>
                            <td>
                              <Button
                                variant="link"
                                size="sm"
                                href={documentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <i className="fas fa-external-link-alt"></i> View
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                ) : (
                  <Alert variant="info">No policy documents available.</Alert>
                )}
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
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">{evidenceDetails.evidence_name} - Evidence Documents</h5>
                  <div className="d-flex gap-2">
                    <Button 
                      variant="primary" 
                      size="sm"
                      onClick={() => setShowAddEvidenceModal(true)}
                    >
                      <i className="fas fa-plus me-2"></i>
                      Add Evidences
                    </Button>
                  </div>
                </div>
                {evidenceDocuments.length > 0 ? (() => {
                  // Group documents by sample_name
                  const groupedBySample = evidenceDocuments.reduce((acc, doc) => {
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
                      {sampleNames.map((sampleName, index) => {
                        const sampleDocs = groupedBySample[sampleName];
                        return (
                          <Accordion.Item eventKey={sampleName} key={sampleName}>
                            <Accordion.Header>
                              <strong>{sampleName}</strong> <span className="ms-2 text-muted">({sampleDocs.length} document{sampleDocs.length !== 1 ? 's' : ''})</span>
                            </Accordion.Header>
                            <Accordion.Body>
                              <div className="d-flex justify-content-end mb-3">
                                <Button 
                                  variant="success" 
                                  size="sm"
                                  onClick={() => handleEvaluateAll(sampleName)}
                                  disabled={processingDocumentId !== null || evaluatingSample === sampleName}
                                >
                                  {evaluatingSample === sampleName ? (
                                    <>
                                      <Spinner
                                        as="span"
                                        animation="border"
                                        size="sm"
                                        role="status"
                                        aria-hidden="true"
                                        className="me-2"
                                      />
                                      Evaluating...
                                    </>
                                  ) : (
                                    <>
                                      <i className="fas fa-check-double me-2"></i>
                                      Evaluate All
                                    </>
                                  )}
                                </Button>
                              </div>
                              <Table striped bordered hover responsive>
                                <thead>
                                  <tr>
                                    <th>Document Name</th>
                                    <th>Document Link</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {sampleDocs.map((doc) => {
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
                                        <td>{doc.document_name || '-'}</td>
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
                            </Accordion.Body>
                          </Accordion.Item>
                        );
                      })}
                    </Accordion>
                  );
                })() : (
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
                // Update existingTestResult if modal is still open
                setExistingTestResult(response.data.data);
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
        onResultsSaved={async (updatedData) => {
          // Refresh data immediately after save
          const currentDocId = selectedDocument?.document_id;
          if (currentDocId && testExecution) {
            try {
              // Update existingTestResult with fresh data
              setExistingTestResult(updatedData);
              
              // Refresh evidence status map
              setEvidenceStatusMap(prev => ({
                ...prev,
                [currentDocId]: {
                  exists: true,
                  status: updatedData.status
                }
              }));
              
              // Refresh report data
              const reportResponse = await getTestExecutionEvidenceDocuments(testExecution.test_execution_id);
              setReportData(reportResponse.data.data || []);
            } catch (err) {
              console.error('Error refreshing data after save:', err);
            }
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

      <AddEvidenceDocumentsModal
        show={showAddEvidenceModal}
        onHide={() => setShowAddEvidenceModal(false)}
        evidenceId={evidenceDetails?.evidence_id}
        onSuccess={async () => {
          // Refresh evidence documents after successful upload
          try {
            const response = await getTestExecutionById(id);
            const evidenceDocs = response.data.evidence_documents || [];
            setEvidenceDocuments(evidenceDocs);
            
            // Refresh status map for new documents
            if (response.data.test_execution && evidenceDocs.length > 0) {
              const statusMap = { ...evidenceStatusMap };
              await Promise.all(
                evidenceDocs.map(async (doc) => {
                  // Only check if not already in status map
                  if (!statusMap[doc.document_id]) {
                    try {
                      const statusResponse = await checkTestExecutionEvidence(
                        response.data.test_execution.test_execution_id,
                        doc.document_id
                      );
                      if (statusResponse.data.exists) {
                        statusMap[doc.document_id] = {
                          exists: true,
                          status: statusResponse.data.data.status
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
                  }
                })
              );
              setEvidenceStatusMap(statusMap);
            }
          } catch (err) {
            console.error('Error refreshing evidence documents:', err);
          }
        }}
      />

      <EvaluateAllModal
        show={showEvaluateAllModal}
        onHide={() => {
          setShowEvaluateAllModal(false);
          setEvaluateAllResults(null);
          setEvaluatingAll(false);
          // Refresh evidence status map and report data
          if (testExecution) {
            Promise.all(
              evidenceDocuments.map(async (doc) => {
                try {
                  const statusResponse = await checkTestExecutionEvidence(
                    testExecution.test_execution_id,
                    doc.document_id
                  );
                  if (statusResponse.data.exists) {
                    setEvidenceStatusMap(prev => ({
                      ...prev,
                      [doc.document_id]: {
                        exists: true,
                        status: statusResponse.data.data.status
                      }
                    }));
                  }
                } catch (err) {
                  console.error('Error refreshing status:', err);
                }
              })
            );
            
            // Refresh report data
            getTestExecutionEvidenceDocuments(testExecution.test_execution_id)
              .then(reportResponse => {
                setReportData(reportResponse.data.data || []);
              })
              .catch(err => console.error('Error refreshing report data:', err));
          }
        }}
        testExecution={testExecution}
        rcmDetails={rcmDetails}
        testAttributes={testAttributes}
        evidenceDocuments={evidenceDocuments}
        evaluateAllResults={evaluateAllResults}
        evaluatingAll={evaluatingAll}
        sampleName={evaluatingSample}
      />
    </Container>
  );
};

export default TestExecutionDetails;

