import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Modal, Button } from 'react-bootstrap';
import Swal from 'sweetalert2';
import { api, updateTestExecutionEvidenceResult, checkTestExecutionEvidence } from '../../services/api';
import ImageEditor from '../../components/PeriodicTesting/ImageEditor';
import PDFEditor from '../../components/PeriodicTesting/PDFEditor';

const MarkEvidenceFileModal = ({ show, onHide, documentData, testExecution, rcmDetails, existingTestResult, onResultsSaved }) => {
  const [expandedSections, setExpandedSections] = useState({
    evidenceDetails: true,
    testResults: false
  });
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [editedTestResults, setEditedTestResults] = useState(null);
  const [savingResults, setSavingResults] = useState(false);
  const processedRef = useRef(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isRightDivCollapsed, setIsRightDivCollapsed] = useState(false);
  
  const [editorHasChanges, setEditorHasChanges] = useState(false);
  const editorRef = useRef(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const fileInputRef = useRef(null); 

  // Helper function to get document URL
  const getDocumentUrl = () => {
    if (!documentData) return null;
    
      if (existingTestResult && existingTestResult.result_artifact_url) {
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const baseUrl = apiUrl.replace('/api', '');
        const resultUrl = existingTestResult.result_artifact_url;
        if (resultUrl.startsWith('uploads/')) {
        return `${baseUrl}/${resultUrl}`;
        } else if (resultUrl.startsWith('executionevidence/')) {
        return `${baseUrl}/uploads/${resultUrl}`;
        } else {
        return `${baseUrl}/uploads/${resultUrl}`;
        }
      } else if (documentData.display_artifact_url) {
      return documentData.display_artifact_url;
    }
    
    return null;
  };

  // Helper function to detect file type
  const getFileType = () => {
    const url = getDocumentUrl();
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
    const artifactUrl = documentData?.artifact_url || '';
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
    
    return 'image'; // default to image
  };

  const fileType = getFileType();
  const documentUrl = getDocumentUrl();

  // ----- DOWNLOAD -----
  // const handleDownload = () => {
  //   if (!stageRef.current) return;
  //   const uri = stageRef.current.toDataURL({ pixelRatio: 2 });
  //   const link = document.createElement("a");
  //   link.download = "annotated-image.png";
  //   link.href = uri;
  //   document.body.appendChild(link);
  //   link.click();
  //   document.body.removeChild(link);
  // };

  const compareAttributes = useCallback(async () => {
    if (!documentData || !testExecution) return;
    
    setLoading(true);
    try {
      const response = await api.post('/data/compare-attributes', {
        evidence_document_id: documentData.document_id,
        rcm_id: testExecution.rcm_id,
        test_execution_id: testExecution.test_execution_id,
        client_id: testExecution.client_id
      });
      
      // Set test results from the response
      if (response.data && response.data.results) {
        setTestResults(response.data.results);
        setEditedTestResults(JSON.parse(JSON.stringify(response.data.results))); // Deep copy for editing
      }
    } catch (error) {
      console.error('Error comparing attributes:', error);
    } finally {
      setLoading(false);
    }
  }, [documentData, testExecution]);

  const fetchEvidenceAIDetails = useCallback(async () => {
    if (!documentData || !documentData.document_id) return;
    
    setLoading(true);
    try {
      await api.post('/data/evidence-ai-details', {
        evidence_document_id: documentData.document_id,
        evidence_url: documentData.artifact_url
      });
      
      await compareAttributes();
    } catch (error) {
      console.error('Error fetching evidence AI details:', error);
      setLoading(false);
    }
  }, [documentData, compareAttributes]);

  useEffect(() => {
    if (!show || !documentData) {
      processedRef.current = null; // Reset when modal closes
      setTestResults(null);
      setEditedTestResults(null);
      return;
    }
    
    if (existingTestResult && existingTestResult.results) {
      const results = existingTestResult.results;
      setTestResults(results);
      setEditedTestResults(JSON.parse(JSON.stringify(results))); // Deep copy for editing
      processedRef.current = documentData.document_id;
      return;
    }
    
    if (testResults) {
      processedRef.current = documentData.document_id;
      return;
    }
    
    const documentId = documentData.document_id;
    if (processedRef.current === documentId) {
      return; // Already processed this document
    }
    
    processedRef.current = documentId;
    
    if (!documentData.evidence_ai_details || 
        (typeof documentData.evidence_ai_details === 'object' && Object.keys(documentData.evidence_ai_details).length === 0)) {
      fetchEvidenceAIDetails();
    } else {
      compareAttributes();
    }
  }, [show, documentData, existingTestResult, fetchEvidenceAIDetails, compareAttributes, testResults]);

  useEffect(() => {
    if (testResults && !editedTestResults) {
      setEditedTestResults(JSON.parse(JSON.stringify(testResults))); // Deep copy when testResults changes
    }
  }, [testResults]);

  const toggleSection = (section) => {
    setExpandedSections(prev => {
      const newState = {
        evidenceDetails: false,
        testResults: false
      };
      if (!prev[section]) {
        newState[section] = true;
      }
      return newState;
    });
  };

  const handleEditorSave = async (blob, rectangles, mimeType = 'image/png') => {
    if (!testExecution || !documentData) {
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
      
      if (!controlId && testExecution && testExecution.rcm_details && testExecution.rcm_details.control_id) {
        controlId = String(testExecution.rcm_details.control_id).trim();
      }
      
      if (!controlId || controlId === '' || controlId === 'undefined') {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Unable to save: Control ID not found. Please check the test execution data.',
          confirmButtonColor: '#286070'
        });
        console.error('Control ID missing. testExecution:', testExecution, 'rcmDetails:', rcmDetails);
        setLoading(false);
        return;
      }

      const timestamp = Date.now();
      const fileExtension = mimeType === 'application/pdf' ? 'pdf' : 'png';
      const filename = `${String(controlId).trim()}-${timestamp}.${fileExtension}`;

      const formData = new FormData();
      // Use 'image' field name for both images and PDFs (backend accepts both)
      formData.append('image', blob, filename);
      formData.append('test_execution_id', testExecution.test_execution_id);
      formData.append('evidence_document_id', documentData.document_id);
      formData.append('control_id', String(controlId));

      await api.post('/data/save-annotated-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setEditorHasChanges(false);

      const fileTypeFromMime = mimeType === 'application/pdf' ? 'pdf' : 'image';
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: fileTypeFromMime === 'pdf' ? 'PDF with annotations saved successfully!' : 'Image with annotations saved successfully!',
        confirmButtonColor: '#286070'
      });
      
      // Reset editor changes
      if (editorRef.current) {
        editorRef.current = null;
      }
      onHide();
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

  const handleSave = async () => {
    // If it's a doc/xlsx file and a file is uploaded, save the uploaded file
    if ((fileType === 'doc' || fileType === 'xlsx') && uploadedFile) {
      await handleDocXlsxSave();
    } else if (editorRef.current && editorRef.current.handleSave) {
      editorRef.current.handleSave();
    }
  };

  const handleDocXlsxSave = async () => {
    if (!testExecution || !documentData || !uploadedFile) {
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
      
      if (!controlId && testExecution && testExecution.rcm_details && testExecution.rcm_details.control_id) {
        controlId = String(testExecution.rcm_details.control_id).trim();
      }
      
      if (!controlId || controlId === '' || controlId === 'undefined') {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Unable to save: Control ID not found. Please check the test execution data.',
          confirmButtonColor: '#286070'
        });
        console.error('Control ID missing. testExecution:', testExecution, 'rcmDetails:', rcmDetails);
        setLoading(false);
        return;
      }

      const timestamp = Date.now();
      const fileExtension = uploadedFile.name.toLowerCase().split('.').pop() || (fileType === 'doc' ? 'doc' : 'xlsx');
      const filename = `${String(controlId).trim()}-${timestamp}.${fileExtension}`;

      const formData = new FormData();
      formData.append('image', uploadedFile, filename);
      formData.append('test_execution_id', testExecution.test_execution_id);
      formData.append('evidence_document_id', documentData.document_id);
      formData.append('control_id', String(controlId));

      await api.post('/data/save-annotated-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setEditorHasChanges(false);
      setUploadedFile(null);

      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'File uploaded and saved successfully!',
        confirmButtonColor: '#286070'
      });
      
      onHide();
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
      // Validate file type
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
    const url = getDocumentUrl();
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = documentData.document_name || `document.${fileType === 'doc' ? 'doc' : 'xlsx'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleCancel = () => {
    setExpandedSections({
      evidenceDetails: true,
      testResults: false
    });
    setIsSidebarCollapsed(false);
    setIsRightDivCollapsed(false);
    setEditedTestResults(null);
    setEditorHasChanges(false);
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onHide();
  };

  const handleAttributeResultChange = (index, newValue) => {
    if (!editedTestResults || !editedTestResults.attributes_results) return;
    
    const updated = JSON.parse(JSON.stringify(editedTestResults));
    const oldAttr = updated.attributes_results[index];
    const oldValue = oldAttr.attribute_final_result !== undefined ? oldAttr.attribute_final_result : oldAttr.result;
    
    // Convert string to appropriate value (true, false, or null for NA)
    let parsedValue = null;
    if (newValue === 'true') {
      parsedValue = true;
    } else if (newValue === 'false') {
      parsedValue = false;
    } else {
      parsedValue = null; // NA
    }
    
    // Check if result is changing from pass to fail or fail to pass (excluding NA)
    const isChanging = (oldValue === true && parsedValue === false) || (oldValue === false && parsedValue === true);
    
    updated.attributes_results[index].attribute_final_result = parsedValue;
    
    // If changing result, require comment (clear existing if not changing)
    if (isChanging) {
      // Show comment input - comment will be required on save
      if (!updated.attributes_results[index].attribute_result_change_comment) {
        updated.attributes_results[index].attribute_result_change_comment = '';
      }
    } else {
      // Clear comment if not changing
      updated.attributes_results[index].attribute_result_change_comment = '';
    }
    
    // Recalculate totals (only count true/false, exclude null/NA)
    const passed = updated.attributes_results.filter(attr => attr.attribute_final_result === true).length;
    const failed = updated.attributes_results.filter(attr => attr.attribute_final_result === false).length;
    updated.total_attributes_passed = passed;
    updated.total_attributes_failed = failed;
    updated.final_result = failed === 0; // All passed = true
    updated.manual_final_result = updated.manual_final_result !== undefined ? updated.manual_final_result : updated.final_result;
    
    setEditedTestResults(updated);
  };

  const handleAttributeCommentChange = (index, comment) => {
    if (!editedTestResults || !editedTestResults.attributes_results) return;
    
    const updated = JSON.parse(JSON.stringify(editedTestResults));
    updated.attributes_results[index].attribute_result_change_comment = comment;
    setEditedTestResults(updated);
  };

  const handleManualFinalResultChange = (newValue) => {
    if (!editedTestResults) return;
    
    const updated = JSON.parse(JSON.stringify(editedTestResults));
    const oldValue = updated.manual_final_result !== undefined ? updated.manual_final_result : updated.final_result;
    
    // Check if result is changing from pass to fail or fail to pass
    const isChanging = (oldValue === true && newValue === false) || (oldValue === false && newValue === true);
    
    updated.manual_final_result = newValue;
    
    // If changing result, require comment (clear existing if not changing)
    if (isChanging) {
      // Show comment input - comment will be required on save
      if (!updated.evidence_result_change_comment) {
        updated.evidence_result_change_comment = '';
      }
    } else {
      // Clear comment if not changing
      updated.evidence_result_change_comment = '';
    }
    
    setEditedTestResults(updated);
  };

  const handleEvidenceCommentChange = (comment) => {
    if (!editedTestResults) return;
    
    const updated = JSON.parse(JSON.stringify(editedTestResults));
    updated.evidence_result_change_comment = comment;
    setEditedTestResults(updated);
  };

  const handleSummaryChange = (summary) => {
    if (!editedTestResults) return;
    
    const updated = JSON.parse(JSON.stringify(editedTestResults));
    updated.summary = summary;
    setEditedTestResults(updated);
  };

  const handleSaveResults = async () => {
    if (!editedTestResults || !testExecution || !documentData) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Unable to save: Missing required data.',
        confirmButtonColor: '#286070'
      });
      return;
    }

    // Check if test execution is completed
    if (testExecution.status === 'completed') {
      Swal.fire({
        icon: 'error',
        title: 'Cannot Update',
        text: 'Cannot update results when test execution is completed.',
        confirmButtonColor: '#286070'
      });
      return;
    }

    // Validate comments for attribute result changes
    if (editedTestResults.attributes_results && Array.isArray(editedTestResults.attributes_results)) {
      for (let i = 0; i < editedTestResults.attributes_results.length; i++) {
        const attr = editedTestResults.attributes_results[i];
        const oldAttr = testResults?.attributes_results?.[i];
        
        if (oldAttr) {
          const oldValue = oldAttr.attribute_final_result !== undefined ? oldAttr.attribute_final_result : oldAttr.result;
          const newValue = attr.attribute_final_result;
          
          // Check if result changed from pass to fail or fail to pass (excluding NA/null)
          if (oldValue !== newValue && 
              oldValue !== null && oldValue !== undefined && 
              newValue !== null && newValue !== undefined &&
              (oldValue === true || oldValue === false) && 
              (newValue === true || newValue === false)) {
            // Require comment when changing result
            if (!attr.attribute_result_change_comment || attr.attribute_result_change_comment.trim() === '') {
              Swal.fire({
                icon: 'warning',
                title: 'Comment Required',
                text: `Please provide a reason for changing the result for attribute "${attr.attribute_name || 'Unknown'}".`,
                confirmButtonColor: '#286070'
              });
              return;
            }
          }
        }
      }
    }

    // Validate comment for overall evidence result change
    if (testResults) {
      const oldManualResult = testResults.manual_final_result !== undefined ? testResults.manual_final_result : testResults.final_result;
      const newManualResult = editedTestResults.manual_final_result;
      
      // Check if result changed from pass to fail or fail to pass
      if (oldManualResult !== newManualResult && (oldManualResult === true || oldManualResult === false) && (newManualResult === true || newManualResult === false)) {
        // Require comment when changing result
        if (!editedTestResults.evidence_result_change_comment || editedTestResults.evidence_result_change_comment.trim() === '') {
          Swal.fire({
            icon: 'warning',
            title: 'Comment Required',
            text: 'Please provide a reason for changing the overall evidence result.',
            confirmButtonColor: '#286070'
          });
          return;
        }
      }
    }

    setSavingResults(true);
    try {
      await updateTestExecutionEvidenceResult({
        test_execution_id: testExecution.test_execution_id,
        evidence_document_id: documentData.document_id,
        updated_result: editedTestResults
      });

      // Refresh the data from the backend to get updated status
      const refreshResponse = await checkTestExecutionEvidence(
        testExecution.test_execution_id,
        documentData.document_id
      );

      let updatedData = null;
      let parsedResult = null;
      
      if (refreshResponse.data.exists) {
        updatedData = refreshResponse.data.data;
        try {
          if (typeof updatedData.result === 'string') {
            parsedResult = JSON.parse(updatedData.result);
          } else {
            parsedResult = updatedData.result;
          }
        } catch (parseError) {
          console.error('Error parsing result JSON:', parseError);
        }

        // Update both testResults and editedTestResults with fresh data
        if (parsedResult) {
          setTestResults(parsedResult);
          setEditedTestResults(JSON.parse(JSON.stringify(parsedResult)));
        } else {
          // Fallback: use edited results
          setTestResults(JSON.parse(JSON.stringify(editedTestResults)));
        }
      } else {
        // Fallback: use edited results
        setTestResults(JSON.parse(JSON.stringify(editedTestResults)));
      }

      // Notify parent component to refresh data
      if (onResultsSaved && updatedData) {
        onResultsSaved(updatedData);
      }

      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Results updated successfully!',
        confirmButtonColor: '#286070'
      });
    } catch (error) {
      console.error('Error saving results:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to save results. Please try again.',
        confirmButtonColor: '#286070'
      });
    } finally {
      setSavingResults(false);
    }
  };

  const isTestExecutionCompleted = testExecution?.status === 'completed';

  const renderEvidenceDetails = (data) => {
    if (!data) return <p style={{ margin: 0, fontSize: '0.9rem', color: '#6c757d' }}>N/A</p>;
    
    // Parse if it's a string
    let parsedData;
    try {
      parsedData = typeof data === 'string' ? JSON.parse(data) : data;
    } catch (e) {
      // If parsing fails, display as plain text
      return <p style={{ margin: 0, fontSize: '0.9rem', color: '#6c757d' }}>{data}</p>;
    }

    // Recursive function to render nested objects
    const renderNestedObject = (obj, level = 0) => {
      if (typeof obj !== 'object' || obj === null) {
        return (
          <span style={{ color: '#495057', fontSize: '0.85rem' }}>{String(obj)}</span>
        );
      }

      return Object.entries(obj).map(([key, value], index) => {
        const isNestedObject = typeof value === 'object' && value !== null && !Array.isArray(value);
        const indent = level * 16;
        
        return (
          <div key={index} style={{ marginBottom: level === 0 ? '0.75rem' : '0.5rem', marginLeft: `${indent}px` }}>
            <div style={{ 
              fontWeight: level === 0 ? '600' : level === 1 ? '500' : '400',
              fontSize: level === 0 ? '0.95rem' : level === 1 ? '0.9rem' : '0.85rem',
              color: level === 0 ? '#212529' : level === 1 ? '#495057' : '#6c757d',
              marginBottom: isNestedObject ? '0.25rem' : '0',
              paddingBottom: isNestedObject ? '0.25rem' : '0',
              borderBottom: level === 0 ? '1px solid #dee2e6' : 'none',
              paddingTop: level === 0 && index > 0 ? '0.5rem' : '0'
            }}>
              {key}
              {!isNestedObject && (
                <span style={{ 
                  marginLeft: '0.5rem', 
                  color: '#495057',
                  fontWeight: 'normal'
                }}>
                  : {renderNestedObject(value, level + 1)}
                </span>
              )}
            </div>
            {isNestedObject && (
              <div style={{ marginTop: '0.25rem' }}>
                {renderNestedObject(value, level + 1)}
              </div>
            )}
          </div>
        );
      });
    };

    return (
      <div style={{ fontSize: '0.9rem' }}>
        {renderNestedObject(parsedData)}
      </div>
    );
  };

  return (
    <Modal 
      show={show} 
      onHide={handleCancel} 
      centered
      dialogClassName="mark-evidence-file-modal"
      style={{ width: '99%', maxWidth: 'none' }}
    >
      <Modal.Header closeButton>
        <Modal.Title>Test & Mark Evidence</Modal.Title>
      </Modal.Header>
      
      <Modal.Body style={{ padding: 0, height: 'calc(90vh - 120px)' }}>
        <div style={{ height: '100%', position: 'relative', display: 'flex', width: '100%' }}>
          {/* Left Sidebar */}
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
              {/* Evidence Details - Full Width Tab */}
              <div style={{ marginBottom: '1rem' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    backgroundColor: expandedSections.evidenceDetails ? '#e9ecef' : 'white',
                    border: '1px solid #dee2e6',
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                    width: '100%'
                  }}
                  onClick={() => toggleSection('evidenceDetails')}
                >
                  <span style={{ fontWeight: '500' }}>Details from Evidence</span>
                  <i
                    className={`fas fa-chevron-${expandedSections.evidenceDetails ? 'up' : 'down'}`}
                    style={{ fontSize: '0.875rem' }}
                  ></i>
                </div>
                
                {expandedSections.evidenceDetails && documentData && (
                  <div style={{ padding: '0.75rem', backgroundColor: 'white', border: '1px solid #dee2e6', borderTop: 'none', borderRadius: '0 0 0.25rem 0.25rem', maxHeight: '50vh', overflowY: 'auto' }}>
                    {renderEvidenceDetails(documentData.evidence_ai_details)}
                  </div>
                )}
              </div>

              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    backgroundColor: expandedSections.testResults ? '#e9ecef' : 'white',
                    border: '1px solid #dee2e6',
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                    width: '100%'
                  }}
                  onClick={() => toggleSection('testResults')}
                >
                  <span style={{ fontWeight: '500' }}>Test Results</span>
                  <i
                    className={`fas fa-chevron-${expandedSections.testResults ? 'up' : 'down'}`}
                    style={{ fontSize: '0.875rem' }}
                  ></i>
                </div>
                
                {expandedSections.testResults && (
                  <div style={{ padding: '0.75rem', backgroundColor: 'white', border: '1px solid #dee2e6', borderTop: 'none', borderRadius: '0 0 0.25rem 0.25rem', maxHeight: '50vh', overflowY: 'auto' }}>
                    {loading ? (
                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#6c757d' }}>Loading test results...</p>
                    ) : editedTestResults ? (
                      <div>
                        {editedTestResults.attributes_results && editedTestResults.attributes_results.length > 0 ? (
                          <div>
                            {editedTestResults.attributes_results.map((attr, index) => {
                              const displayResult = attr.attribute_final_result !== undefined ? attr.attribute_final_result : attr.result;
                              const isNA = displayResult === null || displayResult === undefined;
                              const isPass = displayResult === true;
                              const isFail = displayResult === false;
                              
                              // Get display value for select
                              let selectValue = 'na';
                              if (attr.attribute_final_result !== undefined) {
                                if (attr.attribute_final_result === true) {
                                  selectValue = 'true';
                                } else if (attr.attribute_final_result === false) {
                                  selectValue = 'false';
                                } else {
                                  selectValue = 'na';
                                }
                              } else if (attr.result !== undefined) {
                                selectValue = attr.result ? 'true' : 'false';
                              }
                              
                              return (
                              <div key={index} style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '0.25rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                  <strong style={{ fontSize: '0.9rem' }}>{attr.attribute_name || 'N/A'}</strong>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <span style={{ 
                                    fontSize: '0.8rem', 
                                    padding: '0.25rem 0.5rem', 
                                    borderRadius: '0.25rem',
                                        backgroundColor: isNA ? '#e9ecef' : (isPass ? '#d4edda' : '#f8d7da'),
                                        color: isNA ? '#495057' : (isPass ? '#155724' : '#721c24')
                                  }}>
                                        {isNA ? 'NA' : (isPass ? 'Pass' : 'Fail')}
                                  </span>
                                      {!isTestExecutionCompleted && (
                                        <select
                                          value={selectValue}
                                          onChange={(e) => handleAttributeResultChange(index, e.target.value)}
                                          style={{
                                            fontSize: '0.8rem',
                                            padding: '0.25rem 0.5rem',
                                            border: '1px solid #dee2e6',
                                            borderRadius: '0.25rem',
                                            cursor: 'pointer'
                                          }}
                                        >
                                          <option value="true">Pass</option>
                                          <option value="false">Fail</option>
                                          <option value="na">NA</option>
                                        </select>
                                      )}
                                    </div>
                                </div>
                                {attr.attribute_description && (
                                  <p style={{ margin: '0.25rem 0', fontSize: '0.85rem', color: '#6c757d' }}>
                                    {attr.attribute_description}
                                  </p>
                                )}
                                {attr.test_steps && (
                                  <p style={{ margin: '0.25rem 0', fontSize: '0.85rem', color: '#6c757d' }}>
                                    <strong>Test Steps:</strong> {attr.test_steps}
                                  </p>
                                )}
                                {attr.reason && (
                                  <p style={{ margin: '0.25rem 0', fontSize: '0.85rem', color: '#6c757d', fontStyle: 'italic' }}>
                                    {attr.reason}
                                  </p>
                                )}
                                {/* Show comment input if result is being changed (pass to fail or fail to pass, excluding NA) */}
                                {!isTestExecutionCompleted && (() => {
                                  const oldAttr = testResults?.attributes_results?.[index];
                                  const oldValue = oldAttr?.attribute_final_result !== undefined ? oldAttr.attribute_final_result : oldAttr?.result;
                                  const newValue = attr.attribute_final_result;
                                  // Only require comment when changing between pass and fail (not when changing to/from NA)
                                  const isChanging = oldValue !== undefined && oldValue !== null && newValue !== undefined && newValue !== null &&
                                                    oldValue !== newValue && 
                                                    (oldValue === true || oldValue === false) && 
                                                    (newValue === true || newValue === false);
                                  
                                  if (isChanging) {
                                    return (
                                      <div style={{ marginTop: '0.5rem' }}>
                                        <label style={{ fontSize: '0.8rem', fontWeight: '500', display: 'block', marginBottom: '0.25rem' }}>
                                          Reason for changing result <span style={{ color: '#dc3545' }}>*</span>
                                        </label>
                                        <textarea
                                          value={attr.attribute_result_change_comment || ''}
                                          onChange={(e) => handleAttributeCommentChange(index, e.target.value)}
                                          placeholder="Please provide a reason for changing the result..."
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
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                              );
                            })}
                            <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#e9ecef', borderRadius: '0.25rem' }}>
                              <div style={{ marginBottom: '0.5rem' }}>
                                <strong>Overall Summary:</strong>
                              </div>
                              {!isTestExecutionCompleted ? (
                                <textarea
                                  value={editedTestResults.summary || ''}
                                  onChange={(e) => handleSummaryChange(e.target.value)}
                                  placeholder="Enter overall summary..."
                                  style={{
                                    width: '100%',
                                    fontSize: '0.9rem',
                                    padding: '0.5rem',
                                    border: '1px solid #dee2e6',
                                    borderRadius: '0.25rem',
                                    minHeight: '100px',
                                    resize: 'vertical',
                                    fontFamily: 'inherit'
                                  }}
                                />
                              ) : (
                                editedTestResults.summary ? (
                                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{editedTestResults.summary}</p>
                                ) : (
                                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#6c757d', fontStyle: 'italic' }}>
                                    No summary available.
                                  </p>
                                )
                              )}
                            </div>
                            {(editedTestResults.total_attributes !== undefined || editedTestResults.total_attributes_passed !== undefined || editedTestResults.total_attributes_failed !== undefined) && (
                              <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#6c757d' }}>
                                <p style={{ margin: '0.25rem 0' }}>
                                  Total Attributes: {editedTestResults.total_attributes || 0} | 
                                  Passed: {editedTestResults.total_attributes_passed || 0} | 
                                  Failed: {editedTestResults.total_attributes_failed || 0}
                                </p>
                                <div style={{ marginTop: '0.5rem' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <p style={{ margin: '0.25rem 0', fontWeight: 'bold', color: (editedTestResults.manual_final_result !== undefined ? editedTestResults.manual_final_result : editedTestResults.final_result) ? '#155724' : '#721c24' }}>
                                      Final Result: {(editedTestResults.manual_final_result !== undefined ? editedTestResults.manual_final_result : editedTestResults.final_result) ? 'Pass' : 'Fail'}
                                    </p>
                                    {!isTestExecutionCompleted && (
                                      <select
                                        value={editedTestResults.manual_final_result !== undefined ? (editedTestResults.manual_final_result ? 'true' : 'false') : (editedTestResults.final_result ? 'true' : 'false')}
                                        onChange={(e) => handleManualFinalResultChange(e.target.value === 'true')}
                                        style={{
                                          fontSize: '0.8rem',
                                          padding: '0.25rem 0.5rem',
                                          border: '1px solid #dee2e6',
                                          borderRadius: '0.25rem',
                                          cursor: 'pointer'
                                        }}
                                      >
                                        <option value="true">Pass</option>
                                        <option value="false">Fail</option>
                                      </select>
                                    )}
                                  </div>
                                  {/* Show comment input if overall evidence result is being changed */}
                                  {!isTestExecutionCompleted && (() => {
                                    const oldManualResult = testResults?.manual_final_result !== undefined ? testResults.manual_final_result : testResults?.final_result;
                                    const newManualResult = editedTestResults.manual_final_result;
                                    const isChanging = oldManualResult !== undefined && oldManualResult !== newManualResult && 
                                                      (oldManualResult === true || oldManualResult === false) && 
                                                      (newManualResult === true || newManualResult === false);
                                    
                                    if (isChanging) {
                                      return (
                                        <div style={{ marginTop: '0.5rem' }}>
                                          <label style={{ fontSize: '0.8rem', fontWeight: '500', display: 'block', marginBottom: '0.25rem' }}>
                                            Reason for changing overall evidence result <span style={{ color: '#dc3545' }}>*</span>
                                          </label>
                                          <textarea
                                            value={editedTestResults.evidence_result_change_comment || ''}
                                            onChange={(e) => handleEvidenceCommentChange(e.target.value)}
                                            placeholder="Please provide a reason for changing the overall evidence result..."
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
                                        </div>
                                      );
                                    }
                                    return null;
                                  })()}
                                </div>
                              </div>
                            )}
                            {!isTestExecutionCompleted && (
                              <div style={{ marginTop: '1rem' }}>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={handleSaveResults}
                                  disabled={savingResults}
                                  style={{ width: '100%' }}
                                >
                                  {savingResults ? 'Saving...' : 'Save Results'}
                                </Button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p style={{ margin: 0, fontSize: '0.9rem', color: '#6c757d' }}>No test results available</p>
                        )}
                      </div>
                    ) : (
                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#6c757d' }}>Test results will be displayed here after processing</p>
                    )}
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
                hover: {
                  backgroundColor: '#f8f9fa'
                }
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
              title={isSidebarCollapsed ? 'Show evidence details' : 'Hide evidence details and expand Evidence Editor'}
            >
              <i
                className={`fas fa-chevron-${isSidebarCollapsed ? 'right' : 'left'}`}
                style={{
                  fontSize: '0.75rem',
                  color: '#495057'
                }}
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
                hover: {
                  backgroundColor: '#f8f9fa'
                }
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
              title={isRightDivCollapsed ? 'Show Evidence Editor' : 'Hide Evidence Editor and expand Evidence Details'}
            >
              <i
                className={`fas fa-chevron-${isRightDivCollapsed ? 'left' : 'right'}`}
                style={{
                  fontSize: '0.75rem',
                  color: '#495057'
                }}
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
                      {documentData.document_name || `Document.${fileType === 'doc' ? 'doc' : 'xlsx'}`}
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
                  <i className="fas fa-file" style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}></i>
                <p>No document available</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={handleCancel} disabled={loading}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSave} 
          disabled={loading || isTestExecutionCompleted || (editorHasChanges === false && !((fileType === 'doc' || fileType === 'xlsx') && uploadedFile))}
        >
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default MarkEvidenceFileModal;

