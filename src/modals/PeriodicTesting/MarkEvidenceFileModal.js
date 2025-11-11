import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Modal, Button, Row, Col } from 'react-bootstrap';
import Swal from 'sweetalert2';
import { Stage, Layer, Rect, Text, Image as KonvaImageComp } from 'react-konva';
import { api } from '../../services/api';

const MarkEvidenceFileModal = ({ show, onHide, documentData, testExecution, rcmDetails, existingTestResult }) => {
  const [expandedSections, setExpandedSections] = useState({
    evidenceDetails: true,
    testResults: false
  });
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const processedRef = useRef(null);
  
  const [rectangles, setRectangles] = useState([]);
  const [newRect, setNewRect] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [boxColor, setBoxColor] = useState("#ff0000");
  const [textColor, setTextColor] = useState("#ffffff");
  const [konvaImage, setKonvaImage] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [scale, setScale] = useState(1);
  // eslint-disable-next-line no-unused-vars
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const stageRef = useRef();
  const canvasContainerRef = useRef();
  const initialRectanglesRef = useRef([]); 

  useEffect(() => {
    if (!show) return;
    
    const updateCanvasSize = () => {
      if (canvasContainerRef.current) {
        const container = canvasContainerRef.current;
        setCanvasSize({
          width: container.clientWidth || 800,
          height: container.clientHeight || 600
        });
      }
    };

    const timeoutId = setTimeout(updateCanvasSize, 100);
    window.addEventListener('resize', updateCanvasSize);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [show]);

  const fitImageToScreen = useCallback(() => {
    if (!konvaImage || !stageRef.current || !canvasContainerRef.current) return;
    
    const stage = stageRef.current;
    const container = canvasContainerRef.current;
    const containerWidth = container.clientWidth || canvasSize.width;
    const containerHeight = container.clientHeight || canvasSize.height;
    
    const imageWidth = konvaImage.width;
    const imageHeight = konvaImage.height;
    
    if (imageWidth === 0 || imageHeight === 0) return;
    
    const padding = 20;
    const scaleX = (containerWidth - padding * 2) / imageWidth;
    const scaleY = (containerHeight - padding * 2) / imageHeight;
    const fitScale = Math.min(scaleX, scaleY, 1); 
    
    stage.scale({ x: 1, y: 1 });
    stage.position({ x: 0, y: 0 });
    
    // Calculate new position to center the scaled image
    const scaledWidth = imageWidth * fitScale;
    const scaledHeight = imageHeight * fitScale;
    const x = (containerWidth - scaledWidth) / 2;
    const y = (containerHeight - scaledHeight) / 2;
    
    stage.scale({ x: fitScale, y: fitScale });
    stage.position({ x, y });
    stage.batchDraw();
    setScale(fitScale);
    setStagePosition({ x, y });
  }, [konvaImage, canvasSize]);

  // ----- IMAGE LOADING -----
  useEffect(() => {
    let imageUrl = null;
    
    if (documentData) {
      if (existingTestResult && existingTestResult.result_artifact_url) {
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const baseUrl = apiUrl.replace('/api', '');
        const resultUrl = existingTestResult.result_artifact_url;
        if (resultUrl.startsWith('uploads/')) {
          imageUrl = `${baseUrl}/${resultUrl}`;
        } else if (resultUrl.startsWith('executionevidence/')) {
          imageUrl = `${baseUrl}/uploads/${resultUrl}`;
        } else {
          imageUrl = `${baseUrl}/uploads/${resultUrl}`;
        }
      } else if (documentData.display_artifact_url) {
        imageUrl = documentData.display_artifact_url;
      }
    }
    
    if (imageUrl) {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setKonvaImage(img);
      };
      img.onerror = () => {
        console.error('Failed to load image from:', imageUrl);
        setKonvaImage(null);
      };
      img.src = imageUrl;
    } else {
      setKonvaImage(null);
    }
    setRectangles([]);
    setNewRect(null);
    setUndoStack([]);
    setRedoStack([]);
    setScale(1);
    setStagePosition({ x: 0, y: 0 });
    initialRectanglesRef.current = []; // Reset initial state
  }, [documentData, existingTestResult]);

  useEffect(() => {
    if (konvaImage && canvasSize.width > 0 && canvasSize.height > 0) {
      setTimeout(() => {
        fitImageToScreen();
      }, 100);
      
      const timer = setTimeout(() => {
        if (initialRectanglesRef.current.length === 0) {
          initialRectanglesRef.current = JSON.parse(JSON.stringify(rectangles));
        }
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [konvaImage, canvasSize, fitImageToScreen, rectangles]);

  useEffect(() => {
    if (konvaImage && initialRectanglesRef.current.length === 0 && rectangles.length === 0) {
      initialRectanglesRef.current = [];
    } else if (konvaImage && initialRectanglesRef.current.length === 0 && rectangles.length > 0) {
      const timer = setTimeout(() => {
        initialRectanglesRef.current = JSON.parse(JSON.stringify(rectangles));
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [konvaImage, rectangles]);

  const rectanglesChanged = useCallback(() => {
    if (rectangles.length !== initialRectanglesRef.current.length) {
      return true;
    }
    
    const currentSorted = [...rectangles].sort((a, b) => (a.id || '').localeCompare(b.id || ''));
    const initialSorted = [...initialRectanglesRef.current].sort((a, b) => (a.id || '').localeCompare(b.id || ''));
    
    return JSON.stringify(currentSorted) !== JSON.stringify(initialSorted);
  }, [rectangles]);

  const hasChanges = rectanglesChanged();

  const pushHistory = () => {
    setUndoStack((prev) => [...prev, rectangles]);
    setRedoStack([]); // clear redo when new action happens
  };

  const handleUndo = () => {
    if (undoStack.length > 0) {
      const newUndo = [...undoStack];
      const previousState = newUndo.pop();
      setRedoStack((prev) => [...prev, rectangles]);
      setUndoStack(newUndo);
      setRectangles(previousState);
    }
  };

  const handleRedo = () => {
    if (redoStack.length > 0) {
      const newRedo = [...redoStack];
      const nextState = newRedo.pop();
      setUndoStack((prev) => [...prev, rectangles]);
      setRedoStack(newRedo);
      setRectangles(nextState);
    }
  };

  // ----- DRAWING -----
  const handleMouseDown = (e) => {
    if (!isDrawing) return;
    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();
    const transform = stage.getAbsoluteTransform().copy().invert();
    const pos = transform.point(pointer);

    setNewRect({
      x: pos.x,
      y: pos.y,
      width: 0,
      height: 0,
      id: `rect${rectangles.length + 1}`,
      label: "",
      color: boxColor,
    });
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !newRect) return;
    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();
    const transform = stage.getAbsoluteTransform().copy().invert();
    const pos = transform.point(pointer);

    const width = pos.x - newRect.x;
    const height = pos.y - newRect.y;
    setNewRect({ ...newRect, width, height });
  };

  const handleMouseUp = () => {
    if (newRect && Math.abs(newRect.width) > 10 && Math.abs(newRect.height) > 10) {
      const label = window.prompt("Enter label:", "");
      if (label) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.font = 'bold 11px Arial';
        const textWidth = ctx.measureText(label).width;
        const padding = 6; // Padding around text
        const labelWidth = textWidth + padding * 2;
        const labelHeight = 16; // Fixed height for label
        
      const centerY = newRect.y + newRect.height / 2;
      const rightX = newRect.x + newRect.width + 10;

      const rect = {
        ...newRect,
          label: label,
        badgeX: rightX,
        badgeY: centerY,
          labelWidth: labelWidth,
          labelHeight: labelHeight,
      };
      pushHistory(); // Save current state before making changes
      const nextRects = [...rectangles, rect];
      setRectangles(nextRects);
      }
    }
    setNewRect(null);
  };

  // ----- ZOOM -----
  const handleWheel = (e) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    const scaleBy = 1.05;
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = Math.max(0.1, Math.min(5, direction > 0 ? oldScale * scaleBy : oldScale / scaleBy));

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    stage.scale({ x: newScale, y: newScale });

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    stage.position(newPos);
    stage.batchDraw();
    setScale(newScale);
    setStagePosition(newPos);
  };

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
      return;
    }
    
    if (existingTestResult && existingTestResult.results) {
      setTestResults(existingTestResult.results);
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

  const handleSave = async () => {
    if (!stageRef.current || !testExecution || !documentData || !konvaImage) {
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

      const originalWidth = konvaImage.width;
      const originalHeight = konvaImage.height;

      const currentStage = stageRef.current;
      const imageLayer = currentStage.findOne('Image');
      if (!imageLayer) {
        throw new Error('Could not find image layer');
      }

      const displayedImageWidth = imageLayer.width();
      const displayedImageHeight = imageLayer.height();
      
      const scaleX = originalWidth / displayedImageWidth;
      const scaleY = originalHeight / displayedImageHeight;

      const tempStage = new window.Konva.Stage({
        container: document.createElement('div'),
        width: originalWidth,
        height: originalHeight,
      });

      const tempLayer = new window.Konva.Layer();
      tempStage.add(tempLayer);

      // Add original image at full size
      const tempImage = new window.Konva.Image({
        image: konvaImage,
        width: originalWidth,
        height: originalHeight,
      });
      tempLayer.add(tempImage);

      rectangles.forEach((rect) => {
        const origX = rect.x * scaleX;
        const origY = rect.y * scaleY;
        const origWidth = rect.width * scaleX;
        const origHeight = rect.height * scaleY;

        const tempRect = new window.Konva.Rect({
          x: origX,
          y: origY,
          width: origWidth,
          height: origHeight,
          stroke: rect.color,
          strokeWidth: 2 * scaleX, // Scale stroke width proportionally
        });
        tempLayer.add(tempRect);

        if (rect.label) {
          const labelOrigX = rect.badgeX * scaleX;
          const labelOrigY = rect.badgeY * scaleY;
          const labelWidth = (rect.labelWidth || 40) * scaleX;
          const labelHeight = (rect.labelHeight || 16) * scaleY;

          const labelBg = new window.Konva.Rect({
            x: labelOrigX,
            y: labelOrigY - labelHeight / 2,
            width: labelWidth,
            height: labelHeight,
            fill: rect.color,
            cornerRadius: 3 * scaleX,
            stroke: 'white',
            strokeWidth: 1 * scaleX,
          });
          tempLayer.add(labelBg);

          // Add label text
          const labelText = new window.Konva.Text({
            x: labelOrigX,
            y: labelOrigY - labelHeight / 2 + 2 * scaleX,
            text: rect.label,
            fontSize: 11 * scaleX,
            fill: textColor,
            fontStyle: 'bold',
            align: 'center',
            width: labelWidth,
            verticalAlign: 'middle',
            height: labelHeight,
          });
          tempLayer.add(labelText);
        }
      });

      const dataURL = tempStage.toDataURL({ 
        pixelRatio: 1, 
        mimeType: 'image/png',
        quality: 1
      });

      tempStage.destroy();

      const response = await fetch(dataURL);
      const blob = await response.blob();

      const formData = new FormData();
      formData.append('image', blob, 'annotated-image.png');
      formData.append('test_execution_id', testExecution.test_execution_id);
      formData.append('evidence_document_id', documentData.document_id);
      formData.append('control_id', String(controlId)); // Ensure it's a string

      await api.post('/data/save-annotated-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      initialRectanglesRef.current = JSON.parse(JSON.stringify(rectangles));

      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Image saved successfully!',
        confirmButtonColor: '#286070'
      });
      onHide();
    } catch (error) {
      console.error('Error saving image:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to save image. Please try again.',
        confirmButtonColor: '#286070'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setExpandedSections({
      evidenceDetails: true,
      testResults: false
    });
    onHide();
  };

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
        <Row className="g-0" style={{ height: '100%' }}>
          {/* Left Sidebar */}
          <Col md={3} style={{ 
            borderRight: '1px solid #dee2e6', 
            backgroundColor: '#f8f9fa',
            overflowY: 'auto',
            height: '100%'
          }}>
            <div style={{ padding: '1rem' }}>
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
                  <div style={{ padding: '0.75rem', backgroundColor: 'white', border: '1px solid #dee2e6', borderTop: 'none', borderRadius: '0 0 0.25rem 0.25rem' }}>
                    {loading ? (
                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#6c757d' }}>Loading test results...</p>
                    ) : testResults ? (
                      <div>
                        {testResults.attributes_results && testResults.attributes_results.length > 0 ? (
                          <div>
                            {testResults.attributes_results.map((attr, index) => (
                              <div key={index} style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '0.25rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                  <strong style={{ fontSize: '0.9rem' }}>{attr.attribute_name || 'N/A'}</strong>
                                  <span style={{ 
                                    fontSize: '0.8rem', 
                                    padding: '0.25rem 0.5rem', 
                                    borderRadius: '0.25rem',
                                    backgroundColor: attr.result ? '#d4edda' : '#f8d7da',
                                    color: attr.result ? '#155724' : '#721c24'
                                  }}>
                                    {attr.result ? 'Pass' : 'Fail'}
                                  </span>
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
                              </div>
                            ))}
                            {testResults.summary && (
                              <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#e9ecef', borderRadius: '0.25rem' }}>
                                <strong>Summary:</strong>
                                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>{testResults.summary}</p>
                              </div>
                            )}
                            {(testResults.total_attributes !== undefined || testResults.total_attributes_passed !== undefined || testResults.total_attributes_failed !== undefined) && (
                              <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#6c757d' }}>
                                <p style={{ margin: '0.25rem 0' }}>
                                  Total Attributes: {testResults.total_attributes || 0} | 
                                  Passed: {testResults.total_attributes_passed || 0} | 
                                  Failed: {testResults.total_attributes_failed || 0}
                                </p>
                                {testResults.final_result !== undefined && (
                                  <p style={{ margin: '0.25rem 0', fontWeight: 'bold', color: testResults.final_result ? '#155724' : '#721c24' }}>
                                    Final Result: {testResults.final_result ? 'Pass' : 'Fail'}
                                  </p>
                                )}
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
          </Col>

          {/* Right Column - Image with Drawing Canvas */}
          <Col md={9} style={{ 
            backgroundColor: 'white',
            overflow: 'hidden',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: '0.2rem'
          }}>
            {documentData && (documentData.display_artifact_url || (existingTestResult && existingTestResult.result_artifact_url)) ? (
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Drawing Controls */}
                <div style={{ 
                  padding: '0.5rem', 
                  borderBottom: '1px solid #dee2e6', 
                  backgroundColor: '#f8f9fa',
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}>
                  <button
                    onClick={() => setIsDrawing(!isDrawing)}
                    style={{ 
                      background: isDrawing ? "#b2f5ea" : "white",
                      cursor: "pointer",
                      padding: '0.375rem 0.75rem',
                      border: '1px solid #dee2e6', 
                      borderRadius: '0.25rem',
                      fontSize: '0.875rem'
                    }}
                  >
                    {isDrawing ? "Drawing: ON" : "Drawing: OFF"}
                  </button>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem' }}>
                    Box:
                    <input
                      type="color"
                      value={boxColor}
                      onChange={(e) => setBoxColor(e.target.value)}
                      style={{ width: '30px', height: '25px', cursor: 'pointer', border: '1px solid #dee2e6' }}
                    />
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem' }}>
                    Text:
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      style={{ width: '30px', height: '25px', cursor: 'pointer', border: '1px solid #dee2e6' }}
                    />
                  </label>

                  <button
                    onClick={handleUndo}
                    disabled={undoStack.length === 0}
                    style={{
                      background: undoStack.length === 0 ? "#ddd" : "#f1c40f",
                      padding: "0.375rem 0.75rem",
                      border: "none",
                      borderRadius: "0.25rem",
                      cursor: undoStack.length === 0 ? "not-allowed" : "pointer",
                      fontSize: '0.875rem'
                    }}
                  >
                    ↩️ Undo
                  </button>

                  <button
                    onClick={handleRedo}
                    disabled={redoStack.length === 0}
                    style={{
                      background: redoStack.length === 0 ? "#ddd" : "#3498db",
                      color: redoStack.length === 0 ? "#999" : "white",
                      padding: "0.375rem 0.75rem",
                      border: "none",
                      borderRadius: "0.25rem",
                      cursor: redoStack.length === 0 ? "not-allowed" : "pointer",
                      fontSize: '0.875rem'
                    }}
                  >
                    ↪️ Redo
                  </button>

                  <button
                    onClick={fitImageToScreen}
                    style={{
                      background: "#6c757d",
                      color: "white",
                      border: "none",
                      padding: "0.375rem 0.75rem",
                      cursor: "pointer",
                      borderRadius: "0.25rem",
                      fontSize: '0.875rem'
                    }}
                  >
                    🔍 Fit to Screen
                  </button>

                  {/* <button
                    onClick={handleDownload}
                    style={{
                      background: "#4CAF50",
                      color: "white",
                      border: "none",
                      padding: "0.375rem 0.75rem",
                      cursor: "pointer",
                      borderRadius: "0.25rem",
                      fontSize: '0.875rem'
                    }}
                  >
                    ⬇️ Download
                  </button> */}
                </div>

                {/* Konva Canvas */}
                <div 
                  ref={canvasContainerRef}
                  style={{ 
                    flex: 1, 
                    display: 'flex', 
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    position: 'relative'
                  }}
                >
                  {konvaImage ? (
                    <Stage
                      width={canvasSize.width}
                      height={canvasSize.height}
                      style={{ border: "1px solid #ccc", background: "#fff" }}
                      ref={stageRef}
                      onWheel={handleWheel}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                    >
                      <Layer>
                        <KonvaImageComp 
                          image={konvaImage} 
                          width={konvaImage.width} 
                          height={konvaImage.height} 
                        />

                        {rectangles.map((rect) => (
                          <React.Fragment key={rect.id}>
                            <Rect
                              x={rect.x}
                              y={rect.y}
                              width={rect.width}
                              height={rect.height}
                              stroke={rect.color}
                              strokeWidth={2}
                            />
                            {rect.label && (
                              <>
                                <Rect
                                  x={rect.badgeX}
                                  y={rect.badgeY - (rect.labelHeight || 16) / 2}
                                  width={rect.labelWidth || 40}
                                  height={rect.labelHeight || 16}
                                  fill={rect.color}
                                  cornerRadius={3}
                                  stroke="white"
                                  strokeWidth={1}
                                />
                                <Text
                                  x={rect.badgeX}
                                  y={rect.badgeY - (rect.labelHeight || 16) / 2 + 2}
                                  text={rect.label}
                                  fontSize={11}
                                  fill={textColor}
                                  fontStyle="bold"
                                  align="center"
                                  width={rect.labelWidth || 40}
                                  verticalAlign="middle"
                                  height={rect.labelHeight || 16}
                                />
                              </>
                            )}
                          </React.Fragment>
                        ))}

                        {newRect && (
                          <Rect
                            x={newRect.x}
                            y={newRect.y}
                            width={newRect.width}
                            height={newRect.height}
                            stroke={boxColor}
                            dash={[4, 4]}
                            strokeWidth={2}
                          />
                        )}
                      </Layer>
                    </Stage>
                  ) : (
                    <div style={{ textAlign: 'center', color: '#6c757d', padding: '2rem' }}>
                      <i className="fas fa-spinner fa-spin" style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}></i>
                      <p>Loading image...</p>
                      {documentData.artifact_url && (
                    <a 
                      href={documentData.artifact_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-primary"
                          style={{ marginTop: '1rem' }}
                    >
                      Open Document
                    </a>
                      )}
                  </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#6c757d', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <div>
                <i className="fas fa-image" style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}></i>
                <p>No document available</p>
                </div>
              </div>
            )}
          </Col>
        </Row>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={handleCancel} disabled={loading}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={loading || !hasChanges}>
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default MarkEvidenceFileModal;

