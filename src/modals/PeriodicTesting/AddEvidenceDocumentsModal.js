import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Spinner, ListGroup } from 'react-bootstrap';
import Swal from 'sweetalert2';
import { api } from '../../services/api';

const AddEvidenceDocumentsModal = ({
  show,
  onHide,
  evidenceId,
  onSuccess,
  loading = false,
  existingSamples = [],
  defaultSampleName = null
}) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [policyDocumentFlags, setPolicyDocumentFlags] = useState({});
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSampleName, setSelectedSampleName] = useState(defaultSampleName || '');
  const [useExistingSample, setUseExistingSample] = useState(!!defaultSampleName);

  useEffect(() => {
    if (!show) {
      setSelectedFiles([]);
      setPolicyDocumentFlags({});
      setSelectedSampleName(defaultSampleName || '');
      setUseExistingSample(!!defaultSampleName);
    } else if (defaultSampleName) {
      setSelectedSampleName(defaultSampleName);
      setUseExistingSample(true);
    }
  }, [show, defaultSampleName]);

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
      
      // Append all selected files, policy flags, and sample names
      selectedFiles.forEach((file, index) => {
        formData.append('documents', file);
        // Append policy flag for each file
        const isPolicy = policyDocumentFlags[index] || false;
        formData.append('is_policy_document', isPolicy);
        // Append sample_name for each file (use selected sample name if using existing sample)
        const sampleName = useExistingSample && selectedSampleName ? selectedSampleName : '';
        formData.append('sample_names', sampleName);
      });
      // eslint-disable-next-line no-unused-vars
      const response = await api.post(`/data/pbc/${evidenceId}/add-documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Show success message
      await Swal.fire({
        icon: 'success',
        title: 'Documents Uploaded!',
        text: `${selectedFiles.length} document(s) uploaded successfully. You can continue adding documents to other samples.`,
        confirmButtonColor: '#286070',
        timer: 2000,
        timerProgressBar: true
      });

      // Reset form
      setSelectedFiles([]);
      setPolicyDocumentFlags({});
      setError('');
      
      // Call success callback to refresh data
      if (onSuccess) {
        await onSuccess();
      }
      
      // Close only this modal (not the parent modal)
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

          {existingSamples.length > 0 && (
            <Form.Group className="mb-3">
              <Form.Label>Add to Existing Sample</Form.Label>
              <Form.Check
                type="switch"
                id="useExistingSample"
                label="Upload to an existing sample"
                checked={useExistingSample}
                onChange={(e) => {
                  setUseExistingSample(e.target.checked);
                  if (!e.target.checked) {
                    setSelectedSampleName('');
                  }
                }}
                disabled={uploading || loading}
              />
              {useExistingSample && (
                <Form.Select
                  value={selectedSampleName}
                  onChange={(e) => setSelectedSampleName(e.target.value)}
                  disabled={uploading || loading}
                  className="mt-2"
                >
                  <option value="">Select a sample...</option>
                  {existingSamples.map((sample) => (
                    <option key={sample} value={sample}>
                      {sample}
                    </option>
                  ))}
                </Form.Select>
              )}
            </Form.Group>
          )}

          {!useExistingSample && (
            <Form.Group className="mb-3">
              <Form.Label>Sample Name (Optional)</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter sample name for new sample"
                value={selectedSampleName}
                onChange={(e) => setSelectedSampleName(e.target.value)}
                disabled={uploading || loading}
              />
              <Form.Text className="text-muted">
                Leave empty to create documents without a sample name.
              </Form.Text>
            </Form.Group>
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

