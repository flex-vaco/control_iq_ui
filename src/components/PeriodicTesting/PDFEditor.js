import React, { useState, useEffect, useCallback, useRef, useImperativeHandle } from 'react';
import { Stage, Layer, Rect, Text } from 'react-konva';
import { PDFDocument, rgb } from 'pdf-lib';

const PDFEditor = React.forwardRef(({ pdfUrl, onSave, onCancel, loading, onChanges }, ref) => {
  const [rectangles, setRectangles] = useState([]);
  const [newRect, setNewRect] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [boxColor, setBoxColor] = useState("#ff0000");
  const [textColor, setTextColor] = useState("#ffffff");
  const [scale, setScale] = useState(1);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const stageRef = useRef();
  const canvasContainerRef = useRef();
  const pdfIframeRef = useRef();
  const initialRectanglesRef = useRef([]);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (pdfUrl) {
      setPdfLoaded(false);
      // Reset rectangles when PDF URL changes
      setRectangles([]);
      setNewRect(null);
      setUndoStack([]);
      setRedoStack([]);
      setScale(1);
      setStagePosition({ x: 0, y: 0 });
      initialRectanglesRef.current = [];
      if (onChanges) {
        onChanges(false);
      }
    }
  }, [pdfUrl, onChanges]);

  const handleIframeLoad = () => {
    setPdfLoaded(true);
  };

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
    setRedoStack([]);
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
        const padding = 6;
        const labelWidth = textWidth + padding * 2;
        const labelHeight = 16;
        
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
        pushHistory();
        const nextRects = [...rectangles, rect];
        setRectangles(nextRects);
      }
    }
    setNewRect(null);
  };

  // Track changes and notify parent
  useEffect(() => {
    const hasChanges = rectangles.length !== initialRectanglesRef.current.length ||
      JSON.stringify(rectangles.sort((a, b) => (a.id || '').localeCompare(b.id || ''))) !== 
      JSON.stringify(initialRectanglesRef.current.sort((a, b) => (a.id || '').localeCompare(b.id || '')));
    if (onChanges) {
      onChanges(hasChanges);
    }
  }, [rectangles, onChanges]);

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

  const handleSave = async () => {
    if (!pdfUrl) {
      return;
    }

    try {
      // Fetch the original PDF file
      const pdfResponse = await fetch(pdfUrl);
      if (!pdfResponse.ok) {
        throw new Error(`Failed to fetch PDF: ${pdfResponse.statusText}`);
      }
      const pdfBytes = await pdfResponse.arrayBuffer();
      
      // Load the PDF document
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();
      if (pages.length === 0) {
        throw new Error('PDF has no pages');
      }
      const firstPage = pages[0];
      
      // Get page dimensions for coordinate conversion
      const { width: pageWidth, height: pageHeight } = firstPage.getSize();
      
      // Get actual iframe dimensions if available, otherwise use canvas size
      let displayWidth = canvasSize.width;
      let displayHeight = canvasSize.height;
      
      if (pdfIframeRef.current) {
        try {
          const iframe = pdfIframeRef.current;
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeDoc) {
            const pdfViewer = iframeDoc.querySelector('embed') || iframeDoc.body;
            if (pdfViewer) {
              displayWidth = pdfViewer.clientWidth || canvasSize.width;
              displayHeight = pdfViewer.clientHeight || canvasSize.height;
            }
          }
        } catch (e) {
          // Cross-origin or other iframe access issues - use canvas size
          console.warn('Could not access iframe dimensions, using canvas size:', e);
        }
      }
      
      // Calculate scale factors to convert from canvas coordinates to PDF coordinates
      // Account for the actual display size vs PDF page size
      const scaleX = pageWidth / displayWidth;
      const scaleY = pageHeight / displayHeight;
      
      // Embed fonts for text rendering with error handling
      let helveticaBoldFont;
      try {
        helveticaBoldFont = await pdfDoc.embedFont('Helvetica-Bold');
      } catch (fontError) {
        console.warn('Failed to embed Helvetica-Bold, using standard font:', fontError);
        // Fallback to standard font
        helveticaBoldFont = await pdfDoc.embedFont('Helvetica');
      }
      
      // Draw annotations on the PDF
      for (const rect of rectangles) {
        try {
          // Convert canvas coordinates to PDF coordinates
          // PDF coordinates start from bottom-left, canvas from top-left
          // Account for scale and position transformations
          const pdfX = Math.max(0, Math.min(pageWidth, rect.x * scaleX));
          const pdfY = Math.max(0, Math.min(pageHeight, pageHeight - (rect.y + rect.height) * scaleY));
          const pdfWidth = Math.max(1, Math.min(pageWidth - pdfX, Math.abs(rect.width) * scaleX));
          const pdfHeight = Math.max(1, Math.min(pageHeight - pdfY, Math.abs(rect.height) * scaleY));
          
          // Convert hex color to RGB with validation
          let rectColorRgb;
          try {
            const colorHex = rect.color || '#ff0000';
            const hex = colorHex.startsWith('#') ? colorHex.substring(1) : colorHex;
            if (hex.length === 6) {
              rectColorRgb = rgb(
                parseInt(hex.substring(0, 2), 16) / 255,
                parseInt(hex.substring(2, 4), 16) / 255,
                parseInt(hex.substring(4, 6), 16) / 255
              );
            } else {
              rectColorRgb = rgb(1, 0, 0); // Default red
            }
          } catch (colorError) {
            console.warn('Invalid color, using default red:', colorError);
            rectColorRgb = rgb(1, 0, 0);
          }
          
          // Draw rectangle border
          firstPage.drawRectangle({
            x: pdfX,
            y: pdfY,
            width: pdfWidth,
            height: pdfHeight,
            borderColor: rectColorRgb,
            borderWidth: Math.max(0.5, 2 * Math.min(scaleX, scaleY)),
          });
          
          // Draw label if present
          if (rect.label && rect.label.trim()) {
            const labelPdfX = Math.max(0, Math.min(pageWidth, rect.badgeX * scaleX));
            const labelPdfY = Math.max(0, Math.min(pageHeight, pageHeight - rect.badgeY * scaleY));
            const labelPdfWidth = Math.max(20, (rect.labelWidth || 40) * scaleX);
            const labelPdfHeight = Math.max(10, (rect.labelHeight || 16) * scaleY);
            
            // Draw label background
            firstPage.drawRectangle({
              x: labelPdfX,
              y: labelPdfY - labelPdfHeight / 2,
              width: labelPdfWidth,
              height: labelPdfHeight,
              color: rectColorRgb,
            });
            
            // Draw label text
            let textColorRgb;
            try {
              const textHex = textColor || '#ffffff';
              const hex = textHex.startsWith('#') ? textHex.substring(1) : textHex;
              if (hex.length === 6) {
                textColorRgb = rgb(
                  parseInt(hex.substring(0, 2), 16) / 255,
                  parseInt(hex.substring(2, 4), 16) / 255,
                  parseInt(hex.substring(4, 6), 16) / 255
                );
              } else {
                textColorRgb = rgb(1, 1, 1); // Default white
              }
            } catch (colorError) {
              textColorRgb = rgb(1, 1, 1); // Default white
            }
            
            const fontSize = Math.max(8, Math.min(20, 11 * Math.min(scaleX, scaleY)));
            
            try {
              // Calculate text width for centering
              const textWidth = helveticaBoldFont.widthOfTextAtSize(rect.label, fontSize);
              
              // Center text horizontally and vertically in the label box
              firstPage.drawText(rect.label, {
                x: labelPdfX + (labelPdfWidth - textWidth) / 2, // Center horizontally
                y: labelPdfY - labelPdfHeight / 2 + fontSize / 3, // Adjust vertical position
                size: fontSize,
                color: textColorRgb,
                font: helveticaBoldFont,
              });
            } catch (textError) {
              console.warn('Error drawing text label:', textError);
              // Continue without text if drawing fails
            }
          }
        } catch (rectError) {
          console.warn('Error drawing rectangle:', rectError, rect);
          // Continue with next rectangle
        }
      }
      
      // Save the modified PDF
      const modifiedPdfBytes = await pdfDoc.save();
      const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });

      initialRectanglesRef.current = JSON.parse(JSON.stringify(rectangles));
      
      if (onSave) {
        // Save as PDF with annotations embedded
        onSave(blob, rectangles, 'application/pdf');
      }
    } catch (error) {
      console.error('Error saving PDF with annotations:', error);
      // Fallback: if PDF editing fails, save as image
      try {
        const tempStage = new window.Konva.Stage({
          container: document.createElement('div'),
          width: canvasSize.width,
          height: canvasSize.height,
        });

        const tempLayer = new window.Konva.Layer();
        tempStage.add(tempLayer);

        // White background
        const bgRect = new window.Konva.Rect({
          x: 0,
          y: 0,
          width: canvasSize.width,
          height: canvasSize.height,
          fill: 'white',
        });
        tempLayer.add(bgRect);

        // Draw rectangles and labels
        rectangles.forEach((rect) => {
          try {
            const tempRect = new window.Konva.Rect({
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
              stroke: rect.color || '#ff0000',
              strokeWidth: 2,
            });
            tempLayer.add(tempRect);

            if (rect.label) {
              const labelBg = new window.Konva.Rect({
                x: rect.badgeX,
                y: rect.badgeY - (rect.labelHeight || 16) / 2,
                width: rect.labelWidth || 40,
                height: rect.labelHeight || 16,
                fill: rect.color || '#ff0000',
                cornerRadius: 3,
                stroke: 'white',
                strokeWidth: 1,
              });
              tempLayer.add(labelBg);

              const labelText = new window.Konva.Text({
                x: rect.badgeX,
                y: rect.badgeY - (rect.labelHeight || 16) / 2 + 2,
                text: rect.label,
                fontSize: 11,
                fill: textColor || '#ffffff',
                fontStyle: 'bold',
                align: 'center',
                width: rect.labelWidth || 40,
                verticalAlign: 'middle',
                height: rect.labelHeight || 16,
              });
              tempLayer.add(labelText);
            }
          } catch (rectError) {
            console.warn('Error drawing rectangle in fallback:', rectError);
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

        if (onSave) {
          onSave(blob, rectangles, 'image/png');
        }
      } catch (fallbackError) {
        console.error('Error in fallback save:', fallbackError);
        // Re-throw the original error
        throw new Error(`Failed to save PDF: ${error.message}. Fallback also failed: ${fallbackError.message}`);
      }
    }
  };

  useImperativeHandle(ref, () => ({
    handleSave
  }));

  return (
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
      </div>

      {/* PDF Viewer with Overlay Canvas */}
      <div 
        ref={canvasContainerRef}
        style={{ 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
          backgroundColor: '#f5f5f5'
        }}
      >
        {pdfUrl ? (
          <>
            {/* PDF iframe */}
            <iframe
              ref={pdfIframeRef}
              src={`${pdfUrl}#toolbar=0`}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: 1
              }}
              onLoad={handleIframeLoad}
              title="PDF Viewer"
            />
            
            {/* Overlay canvas for drawing */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 2,
                pointerEvents: isDrawing ? 'auto' : 'none'
              }}
            >
              <Stage
                width={canvasSize.width}
                height={canvasSize.height}
                style={{ background: 'transparent' }}
                ref={stageRef}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
              >
                <Layer>
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
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', color: '#6c757d', padding: '2rem' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}></i>
            <p>Loading PDF...</p>
          </div>
        )}
      </div>
    </div>
  );
});

PDFEditor.displayName = 'PDFEditor';

export default PDFEditor;

