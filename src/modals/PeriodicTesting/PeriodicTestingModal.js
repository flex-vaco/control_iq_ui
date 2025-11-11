import React, { useState } from 'react';
import { Modal, Button, Form, Row, Col, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { updateTestExecutionRemarks, createTestExecution } from '../../services/api';

const PeriodicTestingModal = ({
  show,
  onHide,
  form,
  onChange,
  onSubmit,
  clients,
  uniqueProcesses,
  controlIds,
  loading,
  onRemarksSaved,
  duplicateError,
  checkingDuplicate
}) => {
  const navigate = useNavigate();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [comments, setComments] = useState('');
  const [saving, setSaving] = useState(false);
  const [testingStatus, setTestingStatus] = useState(null);
  const [pendingTestExecutionId, setPendingTestExecutionId] = useState(null);

  // Generate year options (current year and next 5 years)
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = 0; i <= 5; i++) {
    years.push(currentYear + i);
  }

  // Quarter options
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];

  // Reset modal state when closed
  const handleClose = () => {
    setShowConfirmation(false);
    setComments('');
    setSaving(false);
    setTestingStatus(null);
    setPendingTestExecutionId(null);
    onHide();
  };

  // Handle form submission - Save directly
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent submission if duplicate exists
    if (duplicateError) {
      return;
    }
    
    // Validate form
    if (!form.client_id || !form.year || !form.quarter || !form.process || !form.control_id) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Please fill in all required fields.',
        confirmButtonColor: '#286070'
      });
      return;
    }

    setSaving(true);
    
    try {
      // Create the test execution directly
      const createResponse = await createTestExecution({
        control_id: form.control_id,
        client_id: form.client_id,
        year: parseInt(form.year),
        quarter: form.quarter
      });
      
      const newTestExecutionId = createResponse.data.test_execution_id;
      const status = createResponse.data.testing_status;
      
      setTestingStatus(status);
      
      // Check if status is "not received" or "pending" - show confirmation
      const statusLower = status ? status.toLowerCase() : '';
      const requiresComments = statusLower === 'not received' || statusLower === 'pending';
      
      if (requiresComments) {
        // Store the test execution ID and show confirmation modal
        setPendingTestExecutionId(newTestExecutionId);
        setShowConfirmation(true);
        setSaving(false);
      } else {
        // For other statuses, navigate directly to details page
        setSaving(false);
        
        // Notify parent to refresh data
        if (onRemarksSaved) {
          onRemarksSaved();
        }
        
        // Close modal and navigate to details page
        handleClose();
        navigate(`/periodic-testing/${newTestExecutionId}`);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to create test execution.';
      const errorCode = err.response?.data?.code;
      
      // If no evidence found, show SweetAlert
      if (errorCode === 'NO_EVIDENCE_FOUND' || errorMessage.includes('No PBC found')) {
        Swal.fire({
          icon: 'warning',
          title: 'No PBC Found',
          text: 'No PBC found with given Period and control. Please choose a different set.',
          confirmButtonText: 'OK',
          confirmButtonColor: '#286070'
        });
      } else {
        // For other errors, show SweetAlert
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: errorMessage,
          confirmButtonColor: '#286070'
        });
      }
      console.error(err);
      setSaving(false);
    }
  };

  const isFormValid = form.client_id && form.year && form.quarter && form.process && form.control_id;

  // Handle saving remarks after confirmation
  const handleSaveRemarks = async () => {
    if (!comments || !comments.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Comments are required.',
        confirmButtonColor: '#286070'
      });
      return;
    }

    if (!pendingTestExecutionId) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Test execution ID is missing.',
        confirmButtonColor: '#286070'
      });
      return;
    }

    setSaving(true);
    
    try {
      // Save remarks
      await updateTestExecutionRemarks({
        test_execution_id: pendingTestExecutionId,
        remarks: comments.trim()
      });
      
      setShowConfirmation(false);
      setComments('');
      
      // Notify parent to refresh data
      if (onRemarksSaved) {
        onRemarksSaved();
      }
      
      // Close modal and navigate to details page
      handleClose();
      navigate(`/periodic-testing/${pendingTestExecutionId}`);
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || 'Failed to save remarks.',
        confirmButtonColor: '#286070'
      });
      console.error(err);
    } finally {
      setSaving(false);
    }
  };


  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Add Periodic Testing</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Row className="mb-3">
            <Col md={12}>
              <Form.Group controlId="clientSelect">
                <Form.Label>Client <span className="text-danger">*</span></Form.Label>
                <Form.Control 
                  as="select" 
                  name="client_id"
                  value={form.client_id}
                  onChange={onChange}
                  required
                >
                  <option value="" disabled>Select a client...</option>
                  {clients.map((client) => (
                    <option key={client.client_id} value={client.client_id}>
                      {client.client_name}
                    </option>
                  ))}
                </Form.Control>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group controlId="yearSelect">
                <Form.Label>Year <span className="text-danger">*</span></Form.Label>
                <Form.Control 
                  as="select" 
                  name="year"
                  value={form.year}
                  onChange={onChange}
                  required
                >
                  <option value="" disabled>Select a year...</option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </Form.Control>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="quarterSelect">
                <Form.Label>Quarter <span className="text-danger">*</span></Form.Label>
                <Form.Control 
                  as="select" 
                  name="quarter"
                  value={form.quarter}
                  onChange={onChange}
                  required
                >
                  <option value="" disabled>Select a quarter...</option>
                  {quarters.map((quarter) => (
                    <option key={quarter} value={quarter}>
                      {quarter}
                    </option>
                  ))}
                </Form.Control>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={12}>
              <Form.Group controlId="processSelect">
                <Form.Label>Process <span className="text-danger">*</span></Form.Label>
                <Form.Control 
                  as="select" 
                  name="process"
                  value={form.process}
                  onChange={onChange}
                  required
                  disabled={!form.client_id || uniqueProcesses.length === 0}
                >
                  <option value="" disabled>
                    {!form.client_id ? 'Select a client first...' : uniqueProcesses.length === 0 ? 'No processes available' : 'Select a process...'}
                  </option>
                  {uniqueProcesses.map((process, index) => (
                    <option key={index} value={process}>
                      {process}
                    </option>
                  ))}
                </Form.Control>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={12}>
              <Form.Group controlId="controlIdSelect">
                <Form.Label>Control ID <span className="text-danger">*</span></Form.Label>
                <Form.Control 
                  as="select" 
                  name="control_id"
                  value={form.control_id}
                  onChange={onChange}
                  required
                  disabled={!form.process || controlIds.length === 0}
                >
                  <option value="" disabled>
                    {!form.process ? 'Select a process first...' : controlIds.length === 0 ? 'No controls available' : 'Select a control ID...'}
                  </option>
                  {controlIds.map((control, index) => (
                    <option key={index} value={control.control_id}>
                      {control.control_id}
                    </option>
                  ))}
                </Form.Control>
              </Form.Group>
            </Col>
          </Row>

          {/* Duplicate error message at bottom above button */}
          {duplicateError && (
            <Alert variant="danger" className="mt-3 mb-0">{duplicateError}</Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={saving || loading}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            type="submit"
            disabled={!isFormValid || saving || checkingDuplicate || duplicateError}
          >
            {saving ? 'Saving...' : checkingDuplicate ? 'Checking...' : 'Process Testing'}
          </Button>
        </Modal.Footer>
      </Form>

      {/* Confirmation Modal for Adding Remarks */}
      <Modal show={showConfirmation} onHide={() => {
        setShowConfirmation(false);
      }}>
        <Modal.Header closeButton>
          <Modal.Title>Add Remarks</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning">
              PBC pending is "{testingStatus}". Please provide comments (mandatory).
          </Alert>
          <Form.Group className="mb-3">
            <Form.Label>Comments <span className="text-danger">*</span></Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Enter your comments..."
              required
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => {
              setShowConfirmation(false);
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSaveRemarks}
            disabled={!comments.trim() || saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Modal>
  );
};

export default PeriodicTestingModal;

