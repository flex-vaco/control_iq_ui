import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Spinner } from 'react-bootstrap';
import Swal from 'sweetalert2';
import { api, checkTestExecutionEvidence } from '../../services/api';
import ImageEditor from '../../components/PeriodicTesting/ImageEditor';
import PDFEditor from '../../components/PeriodicTesting/PDFEditor';

const EvaluateAllModal = ({ show, onHide, testExecution, rcmDetails, testAttributes, evidenceDocuments, evaluateAllResults, evaluatingAll = false }) => {
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [existingTestResult, setExistingTestResult] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isRightDivCollapsed, setIsRightDivCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editorHasChanges, setEditorHasChanges] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);

  const getDocumentUrl = (artifactUrl) => {
    if (!artifactUrl) return '';
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const baseUrl = apiUrl.replace('/api', '');
    if (artifactUrl.startsWith('uploads/')) {
      return `${baseUrl}/${artifactUrl}`;
    } else if (artifactUrl.startsWith('evidences/')) {
      return `${baseUrl}/uploads/${artifactUrl}`;
    } else if (artifactUrl.startsWith('executionevidence/')) {
      return `${baseUrl}/uploads/${artifactUrl}`;
    } else {
      return `${baseUrl}/uploads/${artifactUrl}`;
    }
  };

  // Get document URL with priority: result_artifact_url > original artifact_url
  const getDocumentUrlForDisplay = () => {
    if (!selectedEvidence) return null;
    
    if (existingTestResult && existingTestResult.result_artifact_url) {
      return getDocumentUrl(existingTestResult.result_artifact_url);
    } else if (selectedEvidence.display_artifact_url) {
      return selectedEvidence.display_artifact_url;
    } else if (selectedEvidence.artifact_url) {
      return getDocumentUrl(selectedEvidence.artifact_url);
    }
    
    return null;
  };

  // Helper function to detect file type
  const getFileType = () => {
    const url = getDocumentUrlForDisplay();
    if (!url) return null;
    
    const urlLower = url.toLowerCase();
    if (urlLower.endsWith('.pdf')) {
      return 'pdf';
    } else if (urlLower.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/)) {
      return 'image';
    } else if (urlLower.match(/\.(doc|docx)$/)) {
      return 'doc';
    } else if (urlLower.match(/\.(xls|xlsx)$/)) {
      return 'xlsx';
    }
    
    // Check from artifact_url if available
    const artifactUrl = selectedEvidence?.artifact_url || '';
    const artifactLower = artifactUrl.toLowerCase();
    if (artifactLower.endsWith('.pdf')) {
      return 'pdf';
    } else if (artifactLower.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/)) {
      return 'image';
    } else if (artifactLower.match(/\.(doc|docx)$/)) {
      return 'doc';
    } else if (artifactLower.match(/\.(xls|xlsx)$/)) {
      return 'xlsx';
    }
    
    return 'image'; // default
  };

  const handleEvidenceClick = async (evidence) => {
    const doc = evidenceDocuments?.find(d => d.document_id === evidence.document_id);
    if (!doc || !testExecution) return;

    setLoading(true);
    try {
      // Check if test_execution_evidence_documents has records
      const response = await checkTestExecutionEvidence(
        testExecution.test_execution_id,
        doc.document_id
      );
      
      const documentData = {
        ...doc,
        display_artifact_url: getDocumentUrl(doc.artifact_url)
      };

      if (response.data.exists) {
        // Record exists, use result_artifact_url if available
        const existingData = response.data.data;
        setExistingTestResult(existingData);
        
        // If result_artifact_url exists, use it instead of the original artifact_url
        if (existingData.result_artifact_url) {
          documentData.display_artifact_url = getDocumentUrl(existingData.result_artifact_url);
        }
      } else {
        setExistingTestResult(null);
      }
      
      setSelectedEvidence(documentData);
    } catch (error) {
      console.error('Error checking existing test result:', error);
      setExistingTestResult(null);
      const documentData = {
        ...doc,
        display_artifact_url: getDocumentUrl(doc.artifact_url)
      };
      setSelectedEvidence(documentData);
    } finally {
      setLoading(false);
    }
  };

  // Reset selected evidence when modal closes
  useEffect(() => {
    if (!show) {
      setSelectedEvidence(null);
      setExistingTestResult(null);
      setEditorHasChanges(false);
      setUploadedFile(null);
      setIsSidebarCollapsed(false);
      setIsRightDivCollapsed(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [show]);

  const handleEditorSave = async (blob, rectangles, mimeType = 'image/png') => {
    if (!testExecution || !selectedEvidence) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Unable to save: Missing required data.',
        confirmButtonColor: '#286070'
      });
      return;
    }

    setLoading(true);
    try {
      let controlId = '';
      
      if (testExecution && testExecution.control_id) {
        controlId = String(testExecution.control_id).trim();
      }
      
      if (!controlId && rcmDetails && rcmDetails.control_id) {
        controlId = String(rcmDetails.control_id).trim();
      }
      
      if (!controlId || controlId === '' || controlId === 'undefined') {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Unable to save: Control ID not found. Please check the test execution data.',
          confirmButtonColor: '#286070'
        });
        setLoading(false);
        return;
      }

      const timestamp = Date.now();
      const fileExtension = mimeType === 'application/pdf' ? 'pdf' : 'png';
      const filename = `${String(controlId).trim()}-${timestamp}.${fileExtension}`;

      const formData = new FormData();
      formData.append('image', blob, filename);
      formData.append('test_execution_id', testExecution.test_execution_id);
      formData.append('evidence_document_id', selectedEvidence.document_id);
      formData.append('control_id', String(controlId));

      await api.post('/data/save-annotated-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setEditorHasChanges(false);

      // Refresh the existing test result to get updated result_artifact_url
      if (testExecution && selectedEvidence) {
        try {
          const refreshResponse = await checkTestExecutionEvidence(
            testExecution.test_execution_id,
            selectedEvidence.document_id
          );
          if (refreshResponse.data.exists) {
            const updatedData = refreshResponse.data.data;
            setExistingTestResult(updatedData);
            if (updatedData.result_artifact_url) {
              setSelectedEvidence(prev => ({
                ...prev,
                display_artifact_url: getDocumentUrl(updatedData.result_artifact_url)
              }));
            }
          }
        } catch (err) {
          console.error('Error refreshing test result:', err);
        }
      }

      const fileTypeFromMime = mimeType === 'application/pdf' ? 'pdf' : 'image';
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: fileTypeFromMime === 'pdf' ? 'PDF with annotations saved successfully!' : 'Image with annotations saved successfully!',
        confirmButtonColor: '#286070'
      });
    } catch (error) {
      console.error('Error saving file:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to save file. Please try again.',
        confirmButtonColor: '#286070'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDocXlsxSave = async () => {
    if (!testExecution || !selectedEvidence || !uploadedFile) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Unable to save: Missing required data.',
        confirmButtonColor: '#286070'
      });
      return;
    }

    setLoading(true);
    try {
      let controlId = '';
      
      if (testExecution && testExecution.control_id) {
        controlId = String(testExecution.control_id).trim();
      }
      
      if (!controlId && rcmDetails && rcmDetails.control_id) {
        controlId = String(rcmDetails.control_id).trim();
      }
      
      if (!controlId || controlId === '' || controlId === 'undefined') {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Unable to save: Control ID not found. Please check the test execution data.',
          confirmButtonColor: '#286070'
        });
        setLoading(false);
        return;
      }

      const timestamp = Date.now();
      const fileExtension = uploadedFile.name.toLowerCase().split('.').pop() || (getFileType(selectedEvidence.artifact_url) === 'doc' ? 'doc' : 'xlsx');
      const filename = `${String(controlId).trim()}-${timestamp}.${fileExtension}`;

      const formData = new FormData();
      formData.append('image', uploadedFile, filename);
      formData.append('test_execution_id', testExecution.test_execution_id);
      formData.append('evidence_document_id', selectedEvidence.document_id);
      formData.append('control_id', String(controlId));

      await api.post('/data/save-annotated-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setEditorHasChanges(false);
      setUploadedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Refresh the existing test result to get updated result_artifact_url
      if (testExecution && selectedEvidence) {
        try {
          const refreshResponse = await checkTestExecutionEvidence(
            testExecution.test_execution_id,
            selectedEvidence.document_id
          );
          if (refreshResponse.data.exists) {
            const updatedData = refreshResponse.data.data;
            setExistingTestResult(updatedData);
            if (updatedData.result_artifact_url) {
              setSelectedEvidence(prev => ({
                ...prev,
                display_artifact_url: getDocumentUrl(updatedData.result_artifact_url)
              }));
            }
          }
        } catch (err) {
          console.error('Error refreshing test result:', err);
        }
      }

      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'File uploaded and saved successfully!',
        confirmButtonColor: '#286070'
      });
    } catch (error) {
      console.error('Error saving file:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to save file. Please try again.',
        confirmButtonColor: '#286070'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const fileName = file.name.toLowerCase();
      const isValidType = fileName.endsWith('.doc') || 
                         fileName.endsWith('.docx') || 
                         fileName.endsWith('.xls') || 
                         fileName.endsWith('.xlsx');
      
      if (!isValidType) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid File Type',
          text: 'Please upload a .doc, .docx, .xls, or .xlsx file.',
          confirmButtonColor: '#286070'
        });
        return;
      }
      
      setUploadedFile(file);
      setEditorHasChanges(true);
    }
  };

  const handleDownload = () => {
    const url = getDocumentUrlForDisplay();
    if (url && selectedEvidence) {
      const link = document.createElement('a');
      link.href = url;
      const fileType = getFileType();
      link.download = selectedEvidence.document_name || `document.${fileType === 'doc' ? 'doc' : fileType === 'xlsx' ? 'xlsx' : fileType === 'pdf' ? 'pdf' : 'png'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleSave = async () => {
    if (!selectedEvidence) return;
    
    const fileType = getFileType();
    // If it's a doc/xlsx file and a file is uploaded, save the uploaded file
    if ((fileType === 'doc' || fileType === 'xlsx') && uploadedFile) {
      await handleDocXlsxSave();
    } else if (editorRef.current && editorRef.current.handleSave) {
      editorRef.current.handleSave();
    }
  };

  const handleCancel = () => {
    setSelectedEvidence(null);
    setExistingTestResult(null);
    setEditorHasChanges(false);
    setUploadedFile(null);
    setIsSidebarCollapsed(false);
    setIsRightDivCollapsed(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isTestExecutionCompleted = testExecution?.status === 'completed';
  const documentUrl = getDocumentUrlForDisplay();
  const fileType = getFileType();

  // Show loader if evaluating or no results yet
  const isLoading = evaluatingAll || !evaluateAllResults;

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      centered
      dialogClassName="evaluate-all-modal"
      style={{ width: '99%', maxWidth: 'none' }}
      size="xl"
    >
      <Modal.Header closeButton>
        <Modal.Title>Evaluate All - Overall Results</Modal.Title>
      </Modal.Header>
      
      <Modal.Body style={{ padding: 0, height: 'calc(90vh - 120px)' }}>
        {isLoading ? (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            padding: '3rem'
          }}>
            <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem', marginBottom: '1.5rem' }} />
            <h5 style={{ color: '#286070', marginBottom: '0.5rem' }}>Evaluating All Evidences</h5>
            <p style={{ color: '#6c757d', fontSize: '0.9rem' }}>Please wait while we process all evidence documents...</p>
          </div>
        ) : (
          <div style={{ height: '100%', position: 'relative', display: 'flex', width: '100%' }}>
            {/* Left Sidebar - Attribute Results */}
            <div
              style={{ 
                borderRight: (isSidebarCollapsed || isRightDivCollapsed) ? 'none' : '1px solid #dee2e6', 
                backgroundColor: '#f8f9fa',
                overflowY: 'auto',
                height: '100%',
                transition: 'all 0.3s ease-in-out',
                padding: 0,
                width: isRightDivCollapsed ? '100%' : (isSidebarCollapsed ? '0' : '25%'),
                minWidth: isRightDivCollapsed ? '100%' : (isSidebarCollapsed ? '0' : '25%'),
                maxWidth: isRightDivCollapsed ? '100%' : (isSidebarCollapsed ? '0' : '25%'),
                flexShrink: 0,
                opacity: isSidebarCollapsed ? 0 : 1,
                overflow: isSidebarCollapsed ? 'hidden' : 'auto',
                visibility: isSidebarCollapsed ? 'hidden' : 'visible'
              }}
            >
              <div style={{ padding: '1rem', width: '100%' }}>
                <div>
                  <h5 style={{ fontWeight: '600', marginBottom: '1rem', color: '#212529' }}>
                    Attribute Results - Evidence Matching
                  </h5>
                  {evaluateAllResults?.attribute_results && evaluateAllResults.attribute_results.length > 0 ? (
                <div>
                  {evaluateAllResults.attribute_results.map((attr, index) => (
                    <div 
                      key={attr.attribute_id || index}
                      style={{
                        marginBottom: '1.5rem',
                        padding: '1rem',
                        backgroundColor: '#fff',
                        borderRadius: '0.5rem',
                        border: '1px solid #dee2e6',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}
                    >
                      <div style={{ marginBottom: '0.75rem' }}>
                        <h6 style={{ 
                          fontWeight: '600', 
                          marginBottom: '0.25rem',
                          color: '#212529',
                          fontSize: '1rem'
                        }}>
                          Attribute {index + 1}: {attr.attribute_name}
                        </h6>
                        {attr.attribute_description && (
                          <p style={{ fontSize: '0.875rem', color: '#6c757d', margin: '0.25rem 0' }}>
                            {attr.attribute_description}
                          </p>
                        )}
                        {attr.test_steps && (
                          <p style={{ fontSize: '0.875rem', color: '#495057', margin: '0.25rem 0', fontStyle: 'italic' }}>
                            <strong>Test Steps:</strong> {attr.test_steps}
                          </p>
                        )}
                      </div>

                      {/* Matching Evidences - Only Names */}
                      {attr.matching_evidences && attr.matching_evidences.length > 0 ? (
                        <div style={{ marginBottom: '0.75rem' }}>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            marginBottom: '0.5rem',
                            color: '#28a745',
                            fontWeight: '600',
                            fontSize: '0.875rem'
                          }}>
                            <i className="fas fa-check-circle me-2"></i>
                            Matching Evidences ({attr.matching_evidences.length})
                          </div>
                          <div style={{ 
                            padding: '0.75rem',
                            backgroundColor: '#d4edda',
                            borderRadius: '0.25rem',
                            border: '1px solid #c3e6cb'
                          }}>
                            {attr.matching_evidences.map((evidence, evIndex) => {
                              const doc = evidenceDocuments?.find(d => d.document_id === evidence.document_id);
                              const evidenceName = evidence.document_name || doc?.document_name || `Document ${evIndex + 1}`;
                              return (
                                <div 
                                  key={evIndex}
                                  onClick={() => handleEvidenceClick(evidence)}
                                  style={{ 
                                    marginBottom: evIndex < attr.matching_evidences.length - 1 ? '0.5rem' : '0',
                                    paddingBottom: evIndex < attr.matching_evidences.length - 1 ? '0.5rem' : '0',
                                    borderBottom: evIndex < attr.matching_evidences.length - 1 ? '1px solid #c3e6cb' : 'none',
                                    cursor: 'pointer',
                                    padding: '0.25rem 0'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c3e6cb'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                  <strong style={{ fontSize: '0.875rem', color: '#155724' }}>
                                    {evidenceName}
                                  </strong>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div style={{ marginBottom: '0.75rem' }}>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            marginBottom: '0.5rem',
                            color: '#28a745',
                            fontWeight: '600',
                            fontSize: '0.875rem'
                          }}>
                            <i className="fas fa-check-circle me-2"></i>
                            Matching Evidences
                          </div>
                          <div style={{ 
                            padding: '0.75rem',
                            backgroundColor: '#fff3cd',
                            borderRadius: '0.25rem',
                            border: '1px solid #ffeaa7',
                            color: '#856404',
                            fontSize: '0.875rem'
                          }}>
                            No evidences matched
                          </div>
                        </div>
                      )}

                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ 
                  padding: '1rem',
                  backgroundColor: '#fff3cd',
                  borderRadius: '0.5rem',
                  border: '1px solid #ffeaa7',
                  color: '#856404'
                }}>
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  No attribute results available.
                </div>
              )}
              </div>
            </div>
          </div>

          {/* Toggle Buttons Container - Both icons stacked vertically in the middle */}
          <div
            style={{
              position: 'absolute',
              left: isRightDivCollapsed ? 'calc(100% - 45px)' : (isSidebarCollapsed ? '15px' : 'calc(25% - 15px)'),
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              alignItems: 'center'
            }}
          >
            {/* Toggle Button for Left Sidebar - Top Icon */}
            <div
              onClick={() => {
                setIsSidebarCollapsed(!isSidebarCollapsed);
                if (!isSidebarCollapsed) {
                  setIsRightDivCollapsed(false); // Reset right div when collapsing left
                }
              }}
              style={{
                backgroundColor: '#fff',
                border: '1px solid #dee2e6',
                borderRadius: '50%',
                cursor: 'pointer',
                width: '30px',
                height: '30px',
                display: isRightDivCollapsed ? 'none' : 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                transition: 'all 0.3s ease-in-out',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e9ecef';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#fff';
              }}
            >
              <i 
                className={`fas fa-chevron-${isSidebarCollapsed ? 'right' : 'left'}`}
                style={{ fontSize: '0.75rem', color: '#495057' }}
              ></i>
            </div>

            {/* Toggle Button for Right Div - Bottom Icon */}
            <div
              onClick={() => {
                setIsRightDivCollapsed(!isRightDivCollapsed);
                if (!isRightDivCollapsed) {
                  setIsSidebarCollapsed(false); // Reset left sidebar when collapsing right
                }
              }}
              style={{
                backgroundColor: '#fff',
                border: '1px solid #dee2e6',
                borderRadius: '50%',
                cursor: 'pointer',
                width: '30px',
                height: '30px',
                display: isSidebarCollapsed ? 'none' : 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                transition: 'all 0.3s ease-in-out',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e9ecef';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#fff';
              }}
            >
              <i 
                className={`fas fa-chevron-${isRightDivCollapsed ? 'left' : 'right'}`}
                style={{ fontSize: '0.75rem', color: '#495057' }}
              ></i>
            </div>
          </div>

          {/* Right Column - Document Editor (Image or PDF) */}
          <div
            style={{ 
              backgroundColor: 'white',
              overflow: 'hidden',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              padding: '0.2rem',
              transition: 'all 0.3s ease-in-out',
              flex: '1 1 0',
              minWidth: 0,
              position: 'relative',
              width: isSidebarCollapsed ? '100%' : (isRightDivCollapsed ? '0' : '75%'),
              opacity: isRightDivCollapsed ? 0 : 1,
              overflow: isRightDivCollapsed ? 'hidden' : 'auto',
              visibility: isRightDivCollapsed ? 'hidden' : 'visible'
            }}
          >
            {documentUrl ? (
              fileType === 'pdf' ? (
                <PDFEditor
                  ref={editorRef}
                  pdfUrl={documentUrl}
                  onSave={handleEditorSave}
                  onCancel={handleCancel}
                  loading={loading}
                  onChanges={setEditorHasChanges}
                  readOnly={isTestExecutionCompleted}
                />
              ) : fileType === 'doc' || fileType === 'xlsx' ? (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  height: '100%',
                  padding: '2rem',
                  gap: '2rem'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <i className={`fas fa-file-${fileType === 'doc' ? 'word' : 'excel'}`} style={{ fontSize: '4rem', marginBottom: '1rem', color: '#286070' }}></i>
                    <h5 style={{ marginBottom: '0.5rem' }}>
                      {selectedEvidence.document_name || `Document.${fileType === 'doc' ? 'doc' : 'xlsx'}`}
                    </h5>
                    <p style={{ color: '#6c757d', marginBottom: '1.5rem' }}>
                      {fileType === 'doc' ? 'Word Document' : 'Excel Spreadsheet'}
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '400px' }}>
                    <Button 
                      variant="outline-primary" 
                      onClick={handleDownload}
                      style={{ width: '100%' }}
                    >
                      <i className="fas fa-download" style={{ marginRight: '0.5rem' }}></i>
                      Download File
                    </Button>
                    
                    {!isTestExecutionCompleted && (
                      <div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept={fileType === 'doc' ? '.doc,.docx' : '.xls,.xlsx'}
                          onChange={handleFileUpload}
                          style={{ display: 'none' }}
                        />
                        <Button 
                          variant="primary" 
                          onClick={() => fileInputRef.current?.click()}
                          style={{ width: '100%' }}
                        >
                          <i className="fas fa-upload" style={{ marginRight: '0.5rem' }}></i>
                          {uploadedFile ? `Replace File (${uploadedFile.name})` : 'Upload New File'}
                        </Button>
                        {uploadedFile && (
                          <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#28a745', textAlign: 'center' }}>
                            <i className="fas fa-check-circle" style={{ marginRight: '0.25rem' }}></i>
                            {uploadedFile.name} selected
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <ImageEditor
                  ref={editorRef}
                  imageUrl={documentUrl}
                  onSave={handleEditorSave}
                  onCancel={handleCancel}
                  loading={loading}
                  onChanges={setEditorHasChanges}
                  readOnly={isTestExecutionCompleted}
                />
              )
            ) : (
              <div style={{ textAlign: 'center', color: '#6c757d', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <div>
                  <i className="fas fa-mouse-pointer" style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}></i>
                  <p>Select evidence</p>
                  <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Click on any evidence document from the left side to view and edit</p>
                </div>
              </div>
            )}
          </div>
        </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={handleCancel} disabled={loading || isLoading}>
          Cancel
        </Button>
        {!isLoading && (
          <Button 
            variant="primary" 
            onClick={handleSave} 
            disabled={loading || isTestExecutionCompleted || !selectedEvidence || (editorHasChanges === false && !((fileType === 'doc' || fileType === 'xlsx') && uploadedFile))}
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default EvaluateAllModal;

