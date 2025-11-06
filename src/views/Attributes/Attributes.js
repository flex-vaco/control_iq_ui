import React, { useState, useEffect } from 'react';
import { Button, Alert, Spinner } from 'react-bootstrap';
import * as XLSX from 'xlsx';
import DynamicTable from '../../components/DynamicTable';
import { getAttributesData, api, getClientsForDropdown } from '../../services/api';
import AttributesImportModal from '../../modals/Attributes/AttributesImportModal';
import AttributesCreateModal from '../../modals/Attributes/AttributesCreateModal';

const Attributes = () => {
  const [data, setData] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [showPreviewTable, setShowPreviewTable] = useState(false);
  const [parseLoading, setParseLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [attributeForm, setAttributeForm] = useState({
    client_id: '',
    control_id: '',
    attribute_name: '',
    attribute_description: '',
    test_steps: ''
  });
  const [attributeSubmissionStatus, setAttributeSubmissionStatus] = useState(null);
  const [fullAttributesData, setFullAttributesData] = useState([]);
  const [selectedAttribute, setSelectedAttribute] = useState(null);

  const fetchClients = async () => {
    try {
      const response = await getClientsForDropdown();
      setClients(response.data);
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    }
  };

  const fetchData = async (clientId = null) => {
    setLoading(true);
    setError('');
    try {
      const response = await getAttributesData(clientId);
      // Store full data for edit operations
      setFullAttributesData(response.data);
      // Filter to only show the required columns in the order: client, name, description, test steps, control id
      // Keep attribute_id in data for edit/delete operations (but won't be displayed)
      const filteredData = response.data.map(row => ({
        attribute_id: row.attribute_id || null, // Keep id for edit/delete
        control_id: row.control_id || '',
        client_name: row.client_name || '',
        attribute_name: row.attribute_name || '',
        attribute_description: row.attribute_description || '',
        test_steps: row.test_steps || '',
      }));
      setData(filteredData);
    } catch (err) {
      setError('Failed to fetch Attributes data. Your session may have expired.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
    fetchData(); // Fetch all data by default
  }, []);

  // Common header mapping function
  const mapHeaders = (headers) => {
    const headerMap = {
      'Control UID': 'control_uid',
      'Attribute Name': 'attribute_name',
      'Attribute Description': 'attribute_description',
      'Test Steps': 'test_steps',
    };

    return headers.map(header => {
      const normalized = header.toLowerCase().trim();
      return headerMap[header] || headerMap[normalized] || null;
    });
  };

  // CSV parsing function
  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];

    // Parse header row
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    
    // Create normalized header map
    const normalizedHeaders = mapHeaders(headers);

    // Parse data rows
    const parsedRows = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Simple CSV parsing (handles quoted fields)
      const values = [];
      let currentValue = '';
      let inQuotes = false;

      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(currentValue.trim());
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      values.push(currentValue.trim()); // Add last value

      // Map values to normalized headers
      const row = {};
      headers.forEach((header, index) => {
        const normalizedKey = normalizedHeaders[index];
        if (normalizedKey) {
          row[normalizedKey] = values[index] || '';
        }
      });

      parsedRows.push(row);
    }

    return parsedRows;
  };

  // XLSX parsing function
  const parseXLSX = (data) => {
    try {
      const workbook = XLSX.read(data, { type: 'binary' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
      
      if (jsonData.length === 0) return [];

      // First row is headers
      const headers = jsonData[0].map(h => String(h).trim());
      const normalizedHeaders = mapHeaders(headers);

      // Parse data rows
      const parsedRows = [];
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        const rowObj = {};
        
        headers.forEach((header, index) => {
          const normalizedKey = normalizedHeaders[index];
          if (normalizedKey) {
            rowObj[normalizedKey] = row[index] ? String(row[index]).trim() : '';
          }
        });

        parsedRows.push(rowObj);
      }

      return parsedRows;
    } catch (error) {
      console.error('XLSX parse error:', error);
      throw new Error('Failed to parse XLSX file');
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setShowPreviewTable(false);
    setParsedData([]);
    setUploadStatus(null);
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) return setUploadStatus({ message: 'Please select a CSV or XLSX file.', variant: 'warning' });

    setParseLoading(true);
    setUploadStatus(null);

    try {
      // Detect file type
      const fileName = file.name.toLowerCase();
      const isXLSX = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
      const isCSV = fileName.endsWith('.csv');

      if (!isCSV && !isXLSX) {
        setUploadStatus({ 
          message: 'Unsupported file format. Please upload a CSV or XLSX file.', 
          variant: 'warning' 
        });
        setParseLoading(false);
        return;
      }

      // Read file using FileReader
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          let parsedRows = [];

          if (isXLSX) {
            // Parse XLSX file
            parsedRows = parseXLSX(event.target.result);
          } else {
            // Parse CSV file
            const text = event.target.result;
            parsedRows = parseCSV(text);
          }

          if (parsedRows.length === 0) {
            setUploadStatus({ 
              message: 'No data found in file.', 
              variant: 'warning' 
            });
            setParseLoading(false);
            return;
          }

          // Prepare data for display (server will validate Control UID on submit)
          const displayData = parsedRows.map((row, index) => ({
            control_uid: row.control_uid || '',
            attribute_name: row.attribute_name || '',
            attribute_description: row.attribute_description || '',
            test_steps: row.test_steps || '',
            status: 'pending', // Will be validated on submit
            reason: '',
            _originalIndex: index
          }));

          setParsedData(displayData);
          setShowPreviewTable(true);
          setUploadStatus({ 
            message: `File parsed successfully. ${displayData.length} records loaded. Review and edit the data before submitting.`, 
            variant: 'success' 
          });
          setParseLoading(false);
        } catch (parseError) {
          console.error("Parse error:", parseError);
          setUploadStatus({ 
            message: parseError.message || 'Failed to parse file. Please check the file format.', 
            variant: 'danger' 
          });
          setShowPreviewTable(false);
          setParseLoading(false);
        }
      };

      reader.onerror = () => {
        setUploadStatus({ 
          message: 'Failed to read file.', 
          variant: 'danger' 
        });
        setShowPreviewTable(false);
        setParseLoading(false);
      };

      // Read file based on type
      if (isXLSX) {
        reader.readAsBinaryString(file);
      } else {
        reader.readAsText(file);
      }

    } catch (err) {
      console.error("File upload error:", err);
      setUploadStatus({ 
        message: 'Failed to process file.', 
        variant: 'danger' 
      });
      setShowPreviewTable(false);
      setParseLoading(false);
    }
  };

  const handleInputChange = (index, field, value) => {
    const updatedData = [...parsedData];
    updatedData[index][field] = value;
    setParsedData(updatedData);
  };

  const handleSubmit = async () => {
    if (!selectedClientId) {
      return setUploadStatus({ message: 'Please select a client.', variant: 'warning' });
    }
    if (!parsedData || parsedData.length === 0) {
      return setUploadStatus({ message: 'No data to submit.', variant: 'warning' });
    }

    // Prepare data for submission (only include fields needed, server will re-validate)
    const submitData = parsedData.map(row => ({
      control_uid: row.control_uid,
      attribute_name: row.attribute_name,
      attribute_description: row.attribute_description || '',
      test_steps: row.test_steps || ''
    }));

    setLoading(true);
    setUploadStatus(null);

    try {
      const response = await api.post('/data/attributes/save', {
        data: submitData,
        client_id: selectedClientId
      });
      
      setUploadStatus({ 
        message: `Save Successful: ${response.data.inserted} records saved.`, 
        variant: 'success' 
      });
      
      // Refresh the Attributes table data (fetch all data)
      fetchData();
      
      // Reset form after successful save
      setTimeout(() => {
        setShowModal(false);
        setParsedData([]);
        setShowPreviewTable(false);
        setFile(null);
        setUploadStatus(null);
        setSelectedClientId('');
      }, 2000);

    } catch (err) {
      console.error("Save error:", err.response || err);
      setUploadStatus({ 
        message: err.response?.data?.message || 'Failed to save attributes.', 
        variant: 'danger' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditAttribute = (row) => {
    const attributeData = fullAttributesData.find(item => item.attribute_id === row.attribute_id);
    if (attributeData) {
      setSelectedAttribute(attributeData);
      setAttributeForm({
        client_id: attributeData.client_id || '',
        control_id: attributeData.control_id || '',
        attribute_name: attributeData.attribute_name || '',
        attribute_description: attributeData.attribute_description || '',
        test_steps: attributeData.test_steps || ''
      });
      setModalMode('edit');
      setAttributeSubmissionStatus(null);
      setShowCreateModal(true);
    }
  };

  const handleAttributeFormChange = (e) => {
    const { name, value } = e.target;
    setAttributeForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAttributeSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAttributeSubmissionStatus(null);
    setError('');

    try {
      if (modalMode === 'edit' && selectedAttribute) {
        await api.put(`/data/attributes/${selectedAttribute.attribute_id}`, {
          rcm_id: selectedAttribute.rcm_id,
          attribute_name: attributeForm.attribute_name,
          attribute_description: attributeForm.attribute_description,
          test_steps: attributeForm.test_steps
        });
        setAttributeSubmissionStatus({ message: 'Attribute updated successfully.', variant: 'success' });
      } else {
        // Create new - need to get rcm_id from control_id
        await api.post('/data/attributes/save', {
          data: [{
            control_uid: attributeForm.control_id,
            attribute_name: attributeForm.attribute_name,
            attribute_description: attributeForm.attribute_description,
            test_steps: attributeForm.test_steps
          }],
          client_id: attributeForm.client_id
        });
        setAttributeSubmissionStatus({ message: 'Attribute created successfully.', variant: 'success' });
      }
      fetchData();
      setTimeout(() => {
        setShowCreateModal(false);
      }, 1000);
    } catch (err) {
      console.error('Attribute Submission Error:', err.response || err);
      const errorMessage = err.response?.data?.message || 'Failed to save attribute.';
      setAttributeSubmissionStatus({ 
        message: errorMessage, 
        variant: 'danger' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAttribute = async (attributeId) => {
    if (!window.confirm('Are you sure you want to delete this attribute?')) {
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.delete(`/data/attributes/${attributeId}`);
      setError('');
      fetchData(); // Refresh the table
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete attribute.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="attributes-page">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Test Attributes</h4> 
        <div className="d-flex gap-2">
          <Button 
            variant="success" 
            onClick={() => {
              setShowCreateModal(true);
              setSelectedAttribute(null);
              setAttributeForm({
                client_id: '',
                control_id: '',
                attribute_name: '',
                attribute_description: '',
                test_steps: ''
              });
              setAttributeSubmissionStatus(null);
              setModalMode('create');
            }}
            id="add-attributes-button"
          >
            <i className="fas fa-plus"></i> Add Attribute
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              setShowModal(true);
              setUploadStatus(null);
              setFile(null);
              setParsedData([]);
              setShowPreviewTable(false);
              setSelectedClientId('');
            }}
            id="import-attributes-button"
          >
            <i className="fas fa-file-upload"></i> Import Attributes
          </Button>
        </div>
      </div>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      {loading && data.length === 0 ? (
        <Spinner animation="border" />
      ) : (
        <DynamicTable 
          data={data} 
          title="Test Attributes" 
          tableId="attributes-table"
          filterableColumns={['client_name', 'attribute_name', 'control_id']}
          renderActions={(row) => (
            <>
              <i
                className="fas fa-edit text-warning"
                onClick={() => handleEditAttribute(row)}
                style={{ cursor: 'pointer', marginRight: '5px', fontSize: '14px' }}
                title="Edit"
              />
              <i
                className="fas fa-trash text-danger"
                onClick={() => handleDeleteAttribute(row.attribute_id)}
                style={{ cursor: 'pointer', fontSize: '14px' }}
                title="Delete"
              />
            </>
          )}
        />
      )}

      {/* Attributes Create/Edit Modal */}
      <AttributesCreateModal
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        form={attributeForm}
        onChange={handleAttributeFormChange}
        onSubmit={handleAttributeSubmit}
        loading={loading}
        submissionStatus={attributeSubmissionStatus}
        clients={clients}
        mode={modalMode}
      />

      {/* Attributes Import Modal */}
      <AttributesImportModal
        show={showModal}
        onHide={() => setShowModal(false)}
        onFileChange={handleFileChange}
        onFileUpload={handleFileUpload}
        onSubmit={handleSubmit}
        file={file}
        parseLoading={parseLoading}
        loading={loading}
        uploadStatus={uploadStatus}
        showPreviewTable={showPreviewTable}
        parsedData={parsedData}
        onInputChange={handleInputChange}
        clients={clients}
        selectedClientId={selectedClientId}
        onClientChange={(e) => setSelectedClientId(e.target.value)}
      />
    </div>
  );
};

export default Attributes;