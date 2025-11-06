import React, { useState, useEffect } from 'react';
import { Button, Alert, Spinner } from 'react-bootstrap';
import * as XLSX from 'xlsx';
import DynamicTable from '../../components/DynamicTable';
import { getRcmData, api, getClientsForDropdown } from '../../services/api';
import RcmDetailsModal from '../../modals/RCM/RcmDetailsModal';
import RcmImportModal from '../../modals/RCM/RcmImportModal';
import RcmCreateModal from '../../modals/RCM/RcmCreateModal';

const RCM = () => {
  const [fullData, setFullData] = useState([]); // Store full RCM data
  const [data, setData] = useState([]); // Table display data
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRcm, setSelectedRcm] = useState(null);
  const [modalMode, setModalMode] = useState('create');
  const [rcmForm, setRcmForm] = useState({
    client_id: '',
    control_id: '',
    process: '',
    sub_process: '',
    risk_id: '',
    risk_description: '',
    control_description: '',
    classification: '',
    frequency: '',
    automated_manual: '',
    preventive_detective: '',
    significance: '',
    risk_rating: '',
    summary: '',
    owners: '',
    mitigates: '',
    location: '',
    key_reports: '',
    it_systems: ''
  });
  const [rcmSubmissionStatus, setRcmSubmissionStatus] = useState(null);
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [showPreviewTable, setShowPreviewTable] = useState(false);
  const [parseLoading, setParseLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState('');

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
      const response = await getRcmData(clientId);
      // Store full data with all fields from API
      setFullData(response.data);
      // Create table data with view details button (only show selected columns in table)
      // Keep rcm_id in data for edit/delete operations (but won't be displayed)
      const filteredData = response.data.map((item, index) => ({
        rcm_id: item.rcm_id || null, // Keep id for edit/delete
        control_id: item.control_id || '',
        client_name: item.client_name || '',
        process : item.process || '',
        sub_process: item.sub_process || '',
        classification: item.classification || '',
        automated_manual: item.automated_manual || '',
        preventive_detective: item.preventive_detective || '',
        significance: item.significance || '',
        _viewDetails: index, // Store index to reference full data
      }));
      setData(filteredData);
    } catch (err) {
      setError('Failed to fetch RCM data. Your session may have expired.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
    fetchData(); // Fetch all data by default
  }, []);

  // Common header mapping function for RCM
  const mapHeaders = (headers) => {
    const headerMap = {
      'Control UID': 'control_id',
      'Process': 'process',
      'Sub Process': 'sub_process',
      'Risk ID': 'risk_id',
      'Risk Description': 'risk_description',
      'Classification': 'classification',
      'Control Description': 'control_description',
      'Summary': 'summary',
      'Frequency': 'frequency',
      'Automated/Manual': 'automated_manual',
      'Preventive/Detective': 'preventive_detective',
      'Significance': 'significance',
      'Risk Rating': 'risk_rating',
      'Owners': 'owners',
      'Mitigates': 'mitigates',
      'Location': 'location',
      'Key Reports': 'key_reports',
      'IT Systems': 'it_systems',
    };

    return headers.map(header => {
      const normalized = header.toLowerCase().trim();
      // Check exact match first
      if (headerMap[header]) return headerMap[header];
      // Check normalized match
      for (const [key, value] of Object.entries(headerMap)) {
        if (key.toLowerCase() === normalized) return value;
      }
      // Return the normalized key (with underscores replacing spaces)
      return normalized.replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
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

          // Prepare data for display
          const displayData = parsedRows.map((row, index) => ({
            control_id: row.control_id || row.control_uid || '',
            process: row.process || '',
            sub_process: row.sub_process || '',
            risk_id: row.risk_id || '',
            risk_description: row.risk_description || '',
            classification: row.classification || '',
            control_description: row.control_description || '',
            summary: row.summary || '',
            frequency: row.frequency || '',
            automated_manual: row.automated_manual || row['automated/manual'] || '',
            preventive_detective: row.preventive_detective || row['preventive/detective'] || '',
            significance: row.significance || '',
            risk_rating: row.risk_rating || '',
            owners: row.owners || '',
            mitigates: row.mitigates || '',
            location: row.location || '',
            key_reports: row.key_reports || '',
            it_systems: row.it_systems || '',
            status: 'pending',
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

  const handleViewDetails = (index) => {
    const rcmData = fullData[index];
    setSelectedRcm(rcmData);
    setShowDetailsModal(true);
  };

  const handleEdit = (row) => {
    const rcmData = fullData.find(item => item.rcm_id === row.rcm_id);
    if (rcmData) {
      setRcmForm({
        client_id: rcmData.client_id || '',
        control_id: rcmData.control_id || '',
        process: rcmData.process || '',
        sub_process: rcmData.sub_process || '',
        risk_id: rcmData.risk_id || '',
        risk_description: rcmData.risk_description || '',
        control_description: rcmData.control_description || '',
        classification: rcmData.classification || '',
        frequency: rcmData.frequency || '',
        automated_manual: rcmData.automated_manual || '',
        preventive_detective: rcmData.preventive_detective || '',
        significance: rcmData.significance || '',
        risk_rating: rcmData.risk_rating || '',
        summary: rcmData.summary || '',
        owners: rcmData.owners || '',
        mitigates: rcmData.mitigates || '',
        location: rcmData.location || '',
        key_reports: rcmData.key_reports || '',
        it_systems: rcmData.it_systems || ''
      });
      setSelectedRcm(rcmData);
      setModalMode('edit');
      setRcmSubmissionStatus(null);
      setShowCreateModal(true);
    }
  };

  const handleRcmFormChange = (e) => {
    const { name, value } = e.target;
    setRcmForm(prev => ({ ...prev, [name]: value }));
  };

  const handleRcmSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setRcmSubmissionStatus(null);
    setError('');

    try {
      if (modalMode === 'edit' && selectedRcm) {
        await api.put(`/data/rcm/${selectedRcm.rcm_id}`, rcmForm);
        setRcmSubmissionStatus({ message: 'RCM record updated successfully.', variant: 'success' });
      } else {
        // Create new - need to use bulk save endpoint with single record
        await api.post('/data/rcm/save', {
          data: [rcmForm],
          client_id: rcmForm.client_id
        });
        setRcmSubmissionStatus({ message: 'RCM record created successfully.', variant: 'success' });
      }
      fetchData();
      setTimeout(() => {
        setShowCreateModal(false);
      }, 1000);
    } catch (err) {
      console.error('RCM Submission Error:', err.response || err);
      const errorMessage = err.response?.data?.message || 'Failed to save RCM record.';
      setRcmSubmissionStatus({ 
        message: errorMessage, 
        variant: 'danger' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRcm = async (rcmId) => {
    if (!window.confirm('Are you sure you want to delete this RCM record?')) {
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.delete(`/data/rcm/${rcmId}`);
      setError('');
      fetchData(); // Refresh the table
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete RCM record.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedClientId) {
      return setUploadStatus({ message: 'Please select a client.', variant: 'warning' });
    }
    if (!parsedData || parsedData.length === 0) {
      return setUploadStatus({ message: 'No data to submit.', variant: 'warning' });
    }

    // Prepare data for submission
    const submitData = parsedData.map(row => ({
      control_id: row.control_id || '',
      process: row.process || '',
      sub_process: row.sub_process || '',
      risk_id: row.risk_id || '',
      risk_description: row.risk_description || '',
      classification: row.classification || '',
      control_description: row.control_description || '',
      summary: row.summary || '',
      frequency: row.frequency || '',
      automated_manual: row.automated_manual || '',
      preventive_detective: row.preventive_detective || '',
      significance: row.significance || '',
      risk_rating: row.risk_rating || '',
      owners: row.owners || '',
      mitigates: row.mitigates || '',
      location: row.location || '',
      key_reports: row.key_reports || '',
      it_systems: row.it_systems || ''
    }));

    setLoading(true);
    setUploadStatus(null);

    try {
      const response = await api.post('/data/rcm/save', {
        data: submitData,
        client_id: selectedClientId
      });
      
      setUploadStatus({ 
        message: `Save Successful: ${response.data.inserted} records saved.`, 
        variant: 'success' 
      });
      
      // Refresh the RCM table data (fetch all data)
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
        message: err.response?.data?.message || 'Failed to save RCM data.', 
        variant: 'danger' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="rcm-page">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">RCM (Risk Control Matrix)</h3>
        <div className="d-flex gap-2">
          <Button 
            variant="success" 
            onClick={() => {
              setShowCreateModal(true);
              setRcmForm({
                client_id: '',
                control_id: '',
                process: '',
                sub_process: '',
                risk_id: '',
                risk_description: '',
                control_description: '',
                classification: '',
                frequency: '',
                automated_manual: '',
                preventive_detective: '',
                significance: '',
                risk_rating: '',
                summary: '',
                owners: '',
                mitigates: '',
                location: '',
                key_reports: '',
                it_systems: ''
              });
              setRcmSubmissionStatus(null);
              setModalMode('create');
            }}
            id="add-rcm-button"
          >
            <i className="fas fa-plus"></i> Add RCM
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
            id="import-rcm-button"
          >
            <i className="fas fa-file-upload"></i> Import RCM
          </Button>
        </div>
      </div>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      {loading && data.length === 0 ? (
        <Spinner animation="border" />
      ) : (
        <DynamicTable 
          data={data} 
          title="RCM Data" 
          tableId="rcm-table"
          filterableColumns={['client_name', 'control_id', 'process', 'sub_process', 'classification', 'automated_manual', 'preventive_detective', 'significance']}
          renderActions={(row) => (
            <>
              <i
                className="fas fa-eye text-primary"
                onClick={() => handleViewDetails(row._viewDetails)}
                style={{ cursor: 'pointer', marginRight: '5px', fontSize: '14px' }}
                title="View Details"
              />
              <i
                className="fas fa-edit text-warning"
                onClick={() => handleEdit(row)}
                style={{ cursor: 'pointer', marginRight: '5px', fontSize: '14px' }}
                title="Edit"
              />
              <i
                className="fas fa-trash text-danger"
                onClick={() => handleDeleteRcm(row.rcm_id)}
                style={{ cursor: 'pointer', fontSize: '14px' }}
                title="Delete"
              />
            </>
          )}
        />
      )}

      {/* RCM Create/Edit Modal */}
      <RcmCreateModal
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        form={rcmForm}
        onChange={handleRcmFormChange}
        onSubmit={handleRcmSubmit}
        loading={loading}
        submissionStatus={rcmSubmissionStatus}
        clients={clients}
        mode={modalMode}
      />

      {/* RCM Details Modal */}
      <RcmDetailsModal
        show={showDetailsModal}
        onHide={() => setShowDetailsModal(false)}
        rcmData={selectedRcm}
      />

      {/* RCM Import Modal */}
      <RcmImportModal
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

export default RCM;