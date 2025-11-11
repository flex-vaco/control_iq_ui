import React, { useState, useEffect } from 'react';
import { Button, Spinner } from 'react-bootstrap';
import Swal from 'sweetalert2';
import DynamicTable from '../../components/DynamicTable';
import { getPbcData, getRcmControls, createPbcRequest, getClientsForDropdown, api, checkDuplicatePbc, getEvidenceDocuments } from '../../services/api';
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
  const [duplicateError, setDuplicateError] = useState(null);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [existingDocuments, setExistingDocuments] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);

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
    if (!clientId) return null;
    try {
      const response = await getRcmControls(clientId);
      setRcmControls(response.data);
      return response.data;
    } catch (err) {
      console.error('Failed to fetch RCM controls:', err);
      return null;
    }
  };

  useEffect(() => {
    fetchClients();
    fetchPbcData(); // Fetch all data by default
  }, []);

  // --- Form Handlers ---

  const handleModalOpen = async (mode = 'create', pbcItem = null) => {
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
        const clientId = fullItem?.client_id || pbcItem.client_id;
        const controlsData = await fetchRcmControls(clientId);
        // Set the control description for the selected control_id
        const selectedControlId = fullItem?.control_id || pbcItem.control_id;
        if (selectedControlId && controlsData) {
          const selectedControl = controlsData.find(c => c.control_id === selectedControlId);
          if (selectedControl) {
            setCurrentDescription(selectedControl.control_description || '');
          }
        }
      }
      setModalMode('edit');
      
      // Fetch existing documents
      const evidenceId = pbcItem.evidence_id;
      if (evidenceId) {
        setLoadingDocuments(true);
        try {
          const response = await getEvidenceDocuments(evidenceId);
          setExistingDocuments(response.data || []);
        } catch (err) {
          console.error('Failed to fetch evidence documents:', err);
          setExistingDocuments([]);
        } finally {
          setLoadingDocuments(false);
        }
      }
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
      setExistingDocuments([]);
      setCurrentDescription('');
    }
    setDuplicateError(null);
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
      // Reset duplicate error when client changes
      setDuplicateError(null);
    }

    if (name === 'control_id') {
      // Find and display the corresponding control description
      const selectedControl = rcmControls.find(c => c.control_id === value);
      setCurrentDescription(selectedControl ? selectedControl.control_description : '');
      // Reset duplicate error when control changes
      setDuplicateError(null);
    }

    // Reset duplicate error when year or quarter changes
    if (name === 'year' || name === 'quarter') {
      setDuplicateError(null);
    }
  };

  // Check for duplicate when all three fields (control_id, year, quarter) are filled
  useEffect(() => {
    const checkDuplicate = async () => {
      // Only check if all three fields are filled and we have a client_id
      if (form.control_id && form.year && form.quarter && form.client_id) {
        setCheckingDuplicate(true);
        try {
          const response = await checkDuplicatePbc(
            form.control_id,
            form.year,
            form.quarter,
            form.client_id,
            modalMode === 'edit' && selectedPbc ? selectedPbc.evidence_id : null
          );
          
          if (response.data.exists) {
            setDuplicateError(response.data.message);
            // Also show SweetAlert for duplicate error
            Swal.fire({
              icon: 'warning',
              title: 'Duplicate Found',
              text: response.data.message,
              confirmButtonColor: '#286070'
            });
          } else {
            setDuplicateError(null);
          }
        } catch (err) {
          console.error('Error checking duplicate:', err);
          // Don't set error on API failure, just log it
          setDuplicateError(null);
        } finally {
          setCheckingDuplicate(false);
        }
      } else {
        // Clear duplicate error if not all fields are filled
        setDuplicateError(null);
      }
    };

    // Debounce the check to avoid too many API calls
    const timeoutId = setTimeout(() => {
      checkDuplicate();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [form.control_id, form.year, form.quarter, form.client_id, modalMode, selectedPbc]);

  const handleFileChange = (e) => {
    // Stores the FileList object
    setForm(prev => ({ ...prev, documents: e.target.files }));
  };


  const handleDelete = async (evidenceId) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Are you sure you want to delete this PBC evidence?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) {
      return;
    }

    setLoading(true);
    try {
      await api.delete(`/data/pbc/${evidenceId}`);
      await Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: 'PBC evidence has been deleted successfully.',
        confirmButtonColor: '#286070'
      });
      fetchPbcData(); // Refresh the table
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || 'Failed to delete PBC evidence.',
        confirmButtonColor: '#286070'
      });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent submission if duplicate exists
    if (duplicateError) {
      return;
    }
    
    setLoading(true);

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
        
        // Refresh existing documents after update
        const evidenceId = selectedPbc.evidence_id;
        if (evidenceId) {
          try {
            const docResponse = await getEvidenceDocuments(evidenceId);
            setExistingDocuments(docResponse.data || []);
          } catch (err) {
            console.error('Failed to refresh evidence documents:', err);
          }
        }
      } else {
        // Create new PBC
        response = await createPbcRequest(formData);
      }
      // Show success message
      await Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: modalMode === 'edit' ? 'PBC evidence updated successfully.' : response.data.message || 'PBC evidence created successfully.',
        confirmButtonColor: '#286070'
      });
      // Refresh the table (fetch all data)
      fetchPbcData();
      setShowModal(false); // Close modal on success
    } catch (err) {
      console.error('PBC Submission Error:', err.response || err);
      // Determine the error message
      const errorMessage = err.response?.data?.message || 'Failed to create PBC request due to an unknown error.';
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage,
        confirmButtonColor: '#286070'
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
        clients={clients}
        selectedClientId={form.client_id}
        onClientChange={() => {}}
        mode={modalMode}
        duplicateError={duplicateError}
        checkingDuplicate={checkingDuplicate}
        existingDocuments={existingDocuments}
        loadingDocuments={loadingDocuments}
      />
    </div>
  );
};

export default PBC;
