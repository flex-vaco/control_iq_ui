import React, { useState, useEffect } from 'react';
import { Button, Alert, Spinner } from 'react-bootstrap';
import DynamicTable from '../../components/DynamicTable';
import { getPbcData, getRcmControls, createPbcRequest, getClientsForDropdown, api } from '../../services/api';
import PbcCreateModal from '../../modals/PBC/PbcCreateModal';

const PBC = () => {
  const [pbcData, setPbcData] = useState([]);
  const [rcmControls, setRcmControls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clients, setClients] = useState([]);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedPbc, setSelectedPbc] = useState(null);
  const [fullData, setFullData] = useState([]);
  const [form, setForm] = useState({
    client_id: '',
    control_id: '',
    evidence_name: '',
    testing_status: 'Pending',
    year: '',
    quarter: '',
    documents: null,
  });
  const [currentDescription, setCurrentDescription] = useState('');
  const [submissionStatus, setSubmissionStatus] = useState(null);

  // --- Data Fetching ---
  const fetchClients = async () => {
    try {
      const response = await getClientsForDropdown();
      setClients(response.data);
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    }
  };

  const fetchPbcData = async (clientId = null) => {
    setLoading(true);
    setError('');
    try {
      const response = await getPbcData(clientId);
      // Store full data for edit/delete operations
      setFullData(response.data);
      // Filter to only show the required columns in order: client, name, status, control, documents count
      // Keep evidence_id in data for edit/delete operations (but won't be displayed)
      const filteredData = response.data.map(item => ({
        evidence_id: item.evidence_id || null, // Keep id for edit/delete
        control_id: item.control_id || '',
        client_name: item.client_name || '',
        evidence_name: item.evidence_name || '',
        testing_status: item.testing_status || '',
        year: item.year || '',
        quarter: item.quarter || '',
        document_count: item.document_count || 0
      }));
      setPbcData(filteredData);
    } catch (err) {
      setError('Failed to fetch PBC data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRcmControls = async (clientId) => {
    if (!clientId) return;
    try {
      const response = await getRcmControls(clientId);
      setRcmControls(response.data);
    } catch (err) {
      console.error('Failed to fetch RCM controls:', err);
    }
  };

  useEffect(() => {
    fetchClients();
    fetchPbcData(); // Fetch all data by default
  }, []);

  // --- Form Handlers ---

  const handleModalOpen = (mode = 'create', pbcItem = null) => {
    if (mode === 'edit' && pbcItem) {
      setSelectedPbc(pbcItem);
      // Find full item from fullData to get all fields
      const fullItem = fullData.find(item => item.evidence_id === pbcItem.evidence_id);
      setForm({
        client_id: fullItem?.client_id || pbcItem.client_id || '',
        control_id: fullItem?.control_id || pbcItem.control_id || '',
        evidence_name: fullItem?.evidence_name || pbcItem.evidence_name || '',
        testing_status: fullItem?.testing_status || pbcItem.testing_status || 'Pending',
        year: fullItem?.year || pbcItem.year || '',
        quarter: fullItem?.quarter || pbcItem.quarter || '',
        documents: null,
      });
      if (fullItem?.client_id || pbcItem.client_id) {
        fetchRcmControls(fullItem?.client_id || pbcItem.client_id);
      }
      setModalMode('edit');
    } else {
      setSelectedPbc(null);
      setForm({
        client_id: '',
        control_id: '',
        evidence_name: '',
        testing_status: 'Pending',
        year: '',
        quarter: '',
        documents: null,
      });
      setRcmControls([]);
      setModalMode('create');
    }
    setCurrentDescription('');
    setSubmissionStatus(null);
    setShowModal(true);
  };

  const handleChange = async (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));

    if (name === 'client_id') {
      // Fetch RCM controls when client is selected
      if (value) {
        await fetchRcmControls(value);
      } else {
        setRcmControls([]);
      }
    }

    if (name === 'control_id') {
      // Find and display the corresponding control description
      const selectedControl = rcmControls.find(c => c.control_id === value);
      setCurrentDescription(selectedControl ? selectedControl.control_description : '');
    }
  };

  const handleFileChange = (e) => {
    // Stores the FileList object
    setForm(prev => ({ ...prev, documents: e.target.files }));
  };


  const handleDelete = async (evidenceId) => {
    if (!window.confirm('Are you sure you want to delete this PBC evidence?')) {
      return;
    }

    setLoading(true);
    setError('');
    try {
      // We'll need to add deletePbc API function
      await api.delete(`/data/pbc/${evidenceId}`);
      setError('');
      fetchPbcData(); // Refresh the table
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete PBC evidence.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSubmissionStatus(null);
    setError('');

    const formData = new FormData();
    formData.append('client_id', form.client_id);
    formData.append('control_id', form.control_id);
    formData.append('evidence_name', form.evidence_name);
    formData.append('testing_status', form.testing_status);
    formData.append('year', form.year);
    formData.append('quarter', form.quarter);

    // Append multiple files
    if (form.documents) {
      for (let i = 0; i < form.documents.length; i++) {
        // 'documents' must match the name used in multer.array('documents') in the controller
        formData.append('documents', form.documents[i]); 
      }
    }

    try {
      let response;
      if (modalMode === 'edit' && selectedPbc) {
        // Update existing PBC
        formData.append('_method', 'PUT');
        response = await api.put(`/data/pbc/${selectedPbc.evidence_id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        setSubmissionStatus({ message: 'PBC evidence updated successfully.', variant: 'success' });
      } else {
        // Create new PBC
        response = await createPbcRequest(formData);
        setSubmissionStatus({ message: response.data.message, variant: 'success' });
      }
      // Refresh the table (fetch all data)
      fetchPbcData();
      setTimeout(() => {
        setShowModal(false); // Close modal on success
      }, 1000);
    } catch (err) {
      console.error('PBC Submission Error:', err.response || err);
      // Determine the error message
      const errorMessage = err.response?.data?.message || 'Failed to create PBC request due to an unknown error.';
      setSubmissionStatus({ 
        message: errorMessage, 
        variant: 'danger' 
      });
    } finally {
      setLoading(false);
    }
  };

  // --- Component Render ---

  // Data is already filtered in fetchPbcData to only include required columns
  const tableData = pbcData;

  return (
    <div id="pbc-page">
      <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="mb-0">PBC (Provided By Company)</h4>
          <Button 
          variant="primary" 
          onClick={handleModalOpen}
          id="add-pbc-button"
        >
          <i className="fas fa-plus"></i> Add PBC
        </Button>
      </div>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      {loading && pbcData.length === 0 ? (
        <Spinner animation="border" />
      ) : (
        <DynamicTable 
          data={tableData} 
          title="Evidences (Provided By Company)" 
          tableId="pbc-table"
          filterableColumns={['client_name', 'control_id', 'evidence_name']}
          renderActions={(row) => (
            <>
              <i
                className="fas fa-edit text-warning"
                onClick={() => handleModalOpen('edit', row)}
                style={{ cursor: 'pointer', marginRight: '5px', fontSize: '14px' }}
                title="Edit"
              />
              <i
                className="fas fa-trash text-danger"
                onClick={() => handleDelete(row.evidence_id)}
                style={{ cursor: 'pointer', fontSize: '14px' }}
                title="Delete"
              />
            </>
          )}
        />
      )}

      {/* PBC Creation Modal */}
      <PbcCreateModal
        show={showModal}
        onHide={() => setShowModal(false)}
        form={form}
        onChange={handleChange}
        onFileChange={handleFileChange}
        onSubmit={handleSubmit}
        rcmControls={rcmControls}
        currentDescription={currentDescription}
        loading={loading}
        submissionStatus={submissionStatus}
        clients={clients}
        selectedClientId={form.client_id}
        onClientChange={() => {}}
        mode={modalMode}
      />
    </div>
  );
};

export default PBC;
