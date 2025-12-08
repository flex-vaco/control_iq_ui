import React, { useState, useEffect, useCallback, useRef, useImperativeHandle } from 'react';
import { Stage, Layer, Rect, Text, Image as KonvaImage } from 'react-konva';
import { PDFDocument, rgb } from 'pdf-lib';

const PDFEditor = React.forwardRef(({ pdfUrl, onSave, onCancel, loading, onChanges, readOnly = false }, ref) => {
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
  const [pdfImage, setPdfImage] = useState(null);
  const [pdfDimensions, setPdfDimensions] = useState(null);
  const [pdfJsLoaded, setPdfJsLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState(null);
  const stageRef = useRef();
  const canvasContainerRef = useRef();
  const initialRectanglesRef = useRef([]);
  const pdfBytesRef = useRef(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.async = true;
    script.onload = () => {
      if (window['pdfjs-dist/build/pdf']) {
        window['pdfjs-dist/build/pdf'].GlobalWorkerOptions.workerSrc = 
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        setPdfJsLoaded(true);
      }
    };
    script.onerror = () => {
      setLoadingError('Failed to load PDF.js library');
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

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
    const loadPdf = async () => {
      if (!pdfUrl || !pdfJsLoaded) {
        return;
      }

      try {
        setLoadingError(null);
        setPdfImage(null);
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

        const pdfResponse = await fetch(pdfUrl);
        if (!pdfResponse.ok) {
          throw new Error(`Failed to fetch PDF: ${pdfResponse.statusText}`);
        }
        const arrayBuffer = await pdfResponse.arrayBuffer();
        const pdfBytes = new Uint8Array(arrayBuffer);
        pdfBytesRef.current = Array.from(pdfBytes);
        
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const pages = pdfDoc.getPages();
        if (pages.length === 0) {
          throw new Error('PDF has no pages');
        }
        
        const firstPage = pages[0];
        const { width, height } = firstPage.getSize();
        setPdfDimensions({ width, height });
        
        const pdfjsLib = window['pdfjs-dist/build/pdf'];
        
        const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);
        
        const containerWidth = canvasSize.width;
        const containerHeight = canvasSize.height;
        
        const pdfAspect = width / height;
        const containerAspect = containerWidth / containerHeight;
        
        let renderScale;
        if (containerAspect > pdfAspect) {
          renderScale = (containerHeight * 0.95) / height;
        } else {
          renderScale = (containerWidth * 0.95) / width;
        }
        
        const viewport = page.getViewport({ scale: renderScale });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;
        
        const img = new window.Image();
        img.src = canvas.toDataURL();
        img.onload = () => {
          setPdfImage(img);
        };
        
      } catch (error) {
        console.error('Error loading PDF:', error);
        setLoadingError(error.message || 'Failed to load PDF');
        setPdfImage(null);
        setPdfDimensions(null);
        pdfBytesRef.current = null;
      }
    };

    loadPdf();
  }, [pdfUrl, pdfJsLoaded, canvasSize.width, canvasSize.height, onChanges]);

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
    if (!isDrawing || readOnly) return;
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
    if (!isDrawing || !newRect || readOnly) return;
    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();
    const transform = stage.getAbsoluteTransform().copy().invert();
    const pos = transform.point(pointer);

    const width = pos.x - newRect.x;
    const height = pos.y - newRect.y;
    setNewRect({ ...newRect, width, height });
  };

  const handleMouseUp = () => {
    if (readOnly) {
      setNewRect(null);
      return;
    }
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
    if (!pdfBytesRef.current || !pdfDimensions || !pdfImage) {
      console.error('No PDF loaded in memory or dimensions not available');
      return;
    }

    try {
      const pdfBytesArray = pdfBytesRef.current;
      const pdfBytes = new Uint8Array(pdfBytesArray);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();
      if (pages.length === 0) {
        throw new Error('PDF has no pages');
      }
      const firstPage = pages[0];
      
      const { width: pageWidth, height: pageHeight } = firstPage.getSize();
      
      const displayWidth = pdfImage.width;
      const displayHeight = pdfImage.height;
      
      const scaleX = pageWidth / displayWidth;
      const scaleY = pageHeight / displayHeight;
      
      let helveticaBoldFont;
      try {
        helveticaBoldFont = await pdfDoc.embedFont('Helvetica-Bold');
      } catch (fontError) {
        helveticaBoldFont = await pdfDoc.embedFont('Helvetica');
      }
      
      for (const rect of rectangles) {
        try {
          const normalizedX = rect.width >= 0 ? rect.x : rect.x + rect.width;
          const normalizedY = rect.height >= 0 ? rect.y : rect.y + rect.height;
          const normalizedWidth = Math.abs(rect.width);
          const normalizedHeight = Math.abs(rect.height);

          const pdfX = normalizedX * scaleX;
          const pdfY = pageHeight - (normalizedY + normalizedHeight) * scaleY;
          const pdfWidth = normalizedWidth * scaleX;
          const pdfHeight = normalizedHeight * scaleY;
          
          let rectColorRgb;
          const colorHex = rect.color || '#ff0000';
          const hex = colorHex.startsWith('#') ? colorHex.substring(1) : colorHex;
          if (hex.length === 6) {
            rectColorRgb = rgb(
              parseInt(hex.substring(0, 2), 16) / 255,
              parseInt(hex.substring(2, 4), 16) / 255,
              parseInt(hex.substring(4, 6), 16) / 255
            );
          } else {
            rectColorRgb = rgb(1, 0, 0);
          }
          
          firstPage.drawRectangle({
            x: pdfX,
            y: pdfY,
            width: pdfWidth,
            height: pdfHeight,
            borderColor: rectColorRgb,
            borderWidth: 2,
          });
          
          if (rect.label && rect.label.trim()) {
            const labelPdfX = rect.badgeX * scaleX;
            const labelPdfY = pageHeight - rect.badgeY * scaleY;
            const labelPdfWidth = (rect.labelWidth || 40) * scaleX;
            const labelPdfHeight = (rect.labelHeight || 16) * scaleY;
            
            firstPage.drawRectangle({
              x: labelPdfX,
              y: labelPdfY - labelPdfHeight / 2,
              width: labelPdfWidth,
              height: labelPdfHeight,
              color: rectColorRgb,
            });
            
            const textHex = textColor || '#ffffff';
            const hex = textHex.startsWith('#') ? textHex.substring(1) : textHex;
            let textColorRgb;
            if (hex.length === 6) {
              textColorRgb = rgb(
                parseInt(hex.substring(0, 2), 16) / 255,
                parseInt(hex.substring(2, 4), 16) / 255,
                parseInt(hex.substring(4, 6), 16) / 255
              );
            } else {
              textColorRgb = rgb(1, 1, 1);
            }
            
            const fontSize = 11 * Math.min(scaleX, scaleY);
            const textWidth = helveticaBoldFont.widthOfTextAtSize(rect.label, fontSize);
            
            firstPage.drawText(rect.label, {
              x: labelPdfX + (labelPdfWidth - textWidth) / 2,
              y: labelPdfY - labelPdfHeight / 2 + fontSize / 3,
              size: fontSize,
              color: textColorRgb,
              font: helveticaBoldFont,
            });
          }
        } catch (rectError) {
          console.warn('Error drawing rectangle:', rectError, rect);
        }
      }
      
      const modifiedPdfBytes = await pdfDoc.save();
      const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });

      initialRectanglesRef.current = JSON.parse(JSON.stringify(rectangles));
      
      if (onSave) {
        onSave(blob, rectangles, 'application/pdf');
      }
    } catch (error) {
      console.error('Error saving PDF with annotations:', error);
    }
  };

  useImperativeHandle(ref, () => ({
    handleSave
  }));

  const displayWidth = pdfImage ? pdfImage.width : canvasSize.width;
  const displayHeight = pdfImage ? pdfImage.height : canvasSize.height;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {!readOnly && (
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
      )}

      <div 
        ref={canvasContainerRef}
        style={{ 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
          backgroundColor: '#525659'
        }}
      >
        {loadingError ? (
          <div style={{ textAlign: 'center', color: '#ff6b6b', padding: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <p>{loadingError}</p>
          </div>
        ) : pdfImage ? (
          <Stage
            width={displayWidth}
            height={displayHeight}
            style={{ background: 'white' }}
            ref={stageRef}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <Layer>
              <KonvaImage
                image={pdfImage}
                width={displayWidth}
                height={displayHeight}
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
          <div style={{ textAlign: 'center', color: '#fff', padding: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
            <p>Loading PDF...</p>
            {!pdfJsLoaded && <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Loading PDF.js library...</p>}
          </div>
        )}
      </div>
    </div>
  );
});

PDFEditor.displayName = 'PDFEditor';

export default PDFEditor;