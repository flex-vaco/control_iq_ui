import React from 'react';
import { Modal, Button, Form, Alert, Spinner, Table } from 'react-bootstrap';

const AttributesImportModal = ({
  show,
  onHide,
  onFileChange,
  onFileUpload,
  onSubmit,
  file,
  parseLoading,
  loading,
  uploadStatus,
  showPreviewTable,
  parsedData,
  onInputChange,
  clients,
  selectedClientId,
  onClientChange
}) => {
  return (
    <Modal show={show} onHide={onHide} size="xl">
      <Modal.Header closeButton>
        <Modal.Title>Import Test Attributes</Modal.Title>
      </Modal.Header>
      <Form onSubmit={onFileUpload}>
        <Modal.Body>
          {uploadStatus && <Alert variant={uploadStatus.variant}>{uploadStatus.message}</Alert>}
          
          {!showPreviewTable && (
            <>
              <Alert variant="info">
                Upload the file first to preview the data before submitting.
              </Alert>
            </>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Select Client <span className="text-danger">*</span></Form.Label>
            <Form.Control 
              as="select" 
              value={selectedClientId || ''}
              onChange={onClientChange}
              required
              disabled={parseLoading || loading || showPreviewTable}
            >
              <option value="" disabled>Choose a Client...</option>
              {clients.map((client) => (
                <option key={client.client_id} value={client.client_id}>
                  {client.client_name}
                </option>
              ))}
            </Form.Control>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Select File (.csv, .xlsx)</Form.Label>
            <Form.Control 
              type="file" 
              accept=".csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              onChange={onFileChange} 
              disabled={parseLoading || loading}
              id="attributes-file-input"
            />
          </Form.Group>

          {showPreviewTable && parsedData.length > 0 && (
            <div className="mt-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0">Preview Data ({parsedData.length} records)</h6>
                <Button 
                  variant="success" 
                  onClick={onSubmit} 
                  disabled={loading || parsedData.length === 0}
                  id="submit-button"
                >
                  {loading ? <><Spinner as="span" animation="border" size="sm" /> Saving...</> : 'Submit'}
                </Button>
              </div>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <Table striped bordered hover size="sm">
                  <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 10 }}>
                    <tr>
                      <th>Control UID</th>
                      <th>Attribute Name</th>
                      <th>Attribute Description</th>
                      <th>Test Steps</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.map((row, index) => (
                      <tr key={index}>
                        <td>{row.control_uid || ''}</td>
                        <td>{row.attribute_name || ''}</td>
                        <td style={{ whiteSpace: 'pre-wrap' }}>{row.attribute_description || ''}</td>
                        <td style={{ whiteSpace: 'pre-wrap' }}>{row.test_steps || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              <Alert variant="info" className="mt-2">
                <small>Review the data above. Click Submit to save all records. Control UID will be validated against RCM records on submit.</small>
              </Alert>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            Close
          </Button>
          {!showPreviewTable ? (
            <Button 
              variant="primary" 
              type="submit" 
              disabled={parseLoading || !file || loading}
              id="upload-parse-button"
            >
              {parseLoading ? <><Spinner as="span" animation="border" size="sm" /> Parsing...</> : 'Parse File'}
            </Button>
          ) : (
            <Button 
              variant="success" 
              onClick={onSubmit} 
              disabled={loading || parsedData.length === 0}
              id="submit-button-footer"
            >
              {loading ? <><Spinner as="span" animation="border" size="sm" /> Saving...</> : 'Submit'}
            </Button>
          )}
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default AttributesImportModal;

