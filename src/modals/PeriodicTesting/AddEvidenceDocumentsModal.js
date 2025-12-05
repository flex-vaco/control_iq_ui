import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Spinner, ListGroup } from 'react-bootstrap';
import { api } from '../../services/api';

const AddEvidenceDocumentsModal = ({
  show,
  onHide,
  evidenceId,
  onSuccess,
  loading = false
}) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [policyDocumentFlags, setPolicyDocumentFlags] = useState({});
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!show) {
      setSelectedFiles([]);
      setPolicyDocumentFlags({});
    }
  }, [show]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
    // Initialize policy flags to false for all files
    const flags = {};
    files.forEach((file, index) => {
      flags[index] = false;
    });
    setPolicyDocumentFlags(flags);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedFiles.length === 0) {
      setError('Please select at least one file to upload.');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      
      // Append all selected files and policy flags
      selectedFiles.forEach((file, index) => {
        formData.append('documents', file);
        // Append policy flag for each file
        const isPolicy = policyDocumentFlags[index] || false;
        formData.append('is_policy_document', isPolicy);
      });
      // eslint-disable-next-line no-unused-vars
      const response = await api.post(`/data/pbc/${evidenceId}/add-documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Reset form
      setSelectedFiles([]);
      setError('');
      
      // Call success callback to refresh data
      if (onSuccess) {
        onSuccess();
      }
      
      // Close modal
      onHide();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred while uploading documents.');
      console.error('Error uploading documents:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setSelectedFiles([]);
      setError('');
      onHide();
    }
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Add Evidence Documents</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && (
            <Alert variant="danger" className="mb-3">
              {error}
            </Alert>
          )}

          <Form.Group controlId="documentUpload">
            <Form.Label>Upload Document(s) <span className="text-danger">*</span></Form.Label>
            <Form.Control 
              type="file" 
              onChange={handleFileChange} 
              multiple
              disabled={uploading || loading}
              required
            />
            <Form.Text className="text-muted">
              You can select multiple files to attach to this evidence. Accepted file types: All file types.
            </Form.Text>
          </Form.Group>

          {selectedFiles.length > 0 && (
            <div className="mt-3">
              <Form.Label className="fw-bold">Mark as Policy Document:</Form.Label>
              <ListGroup>
                {selectedFiles.map((file, index) => (
                  <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                    <span>
                      <i className="fas fa-file me-2"></i>
                      {file.name}
                    </span>
                    <Form.Check
                      type="switch"
                      id={`policy-doc-${index}`}
                      checked={policyDocumentFlags[index] || false}
                      onChange={(e) => {
                        setPolicyDocumentFlags(prev => ({
                          ...prev,
                          [index]: e.target.checked
                        }));
                      }}
                      label="Policy Document"
                    />
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={handleClose} 
            disabled={uploading || loading}
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            type="submit" 
            disabled={uploading || loading || selectedFiles.length === 0}
          >
            {uploading ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Uploading...
              </>
            ) : (
              'Upload Documents'
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default AddEvidenceDocumentsModal;

