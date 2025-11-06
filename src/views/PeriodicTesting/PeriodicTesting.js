import React, { useState, useEffect } from 'react';
import { Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import DynamicTable from '../../components/DynamicTable';
import { getClients, getRcmData, getTestExecutions, createTestExecution } from '../../services/api';
import PeriodicTestingModal from '../../modals/PeriodicTesting/PeriodicTestingModal';

const PeriodicTesting = () => {
  const navigate = useNavigate();
  const [testingData, setTestingData] = useState([]);
  const [clients, setClients] = useState([]);
  const [rcmData, setRcmData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    client_id: '',
    year: '',
    quarter: '',
    process: '',
    control_id: '',
  });

  // --- Data Fetching ---
  const fetchClients = async () => {
    try {
      const response = await getClients();
      setClients(response.data);
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    }
  };

  const fetchRcmData = async (clientId) => {
    if (!clientId) return;
    try {
      const response = await getRcmData(clientId);
      setRcmData(response.data);
    } catch (err) {
      console.error('Failed to fetch RCM data:', err);
    }
  };

  const fetchTestingData = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch test executions without filtering by client initially
      const response = await getTestExecutions();
      const filteredData = response.data.map(item => ({
        control_id: item.control_id || '',
        client_name: item.client_name || '',
        auditor: item.user_name || '',
        process: item.process || '',
        year: item.year || '',
        quarter: item.quarter || '',
        status: item.status || '',
        result: item.result || '',
        test_execution_id: item.test_execution_id || null // Include ID for navigation
      }));
      setTestingData(filteredData || []);
    } catch (err) {
      setError('Failed to fetch test executions.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
    fetchTestingData();
    // RCM data will be fetched when a client is selected
  }, []);

  // Get unique processes from RCM data
  const getUniqueProcesses = () => {
    const processes = [...new Set(rcmData.map(item => item.process).filter(Boolean))];
    return processes.sort();
  };

  // Get control IDs filtered by selected process
  const getControlIdsByProcess = (process) => {
    if (!process) return [];
    return rcmData
      .filter(item => item.process === process)
      .map(item => ({
        control_id: item.control_id,
        control_description: item.control_description
      }));
  };

  // --- Form Handlers ---
  const handleModalOpen = () => {
    setForm({
      client_id: '',
      year: '',
      quarter: '',
      process: '',
      control_id: '',
    });
    setRcmData([]); // Reset RCM data when opening modal
    setShowModal(true);
  };

  const handleSave = async (formData, onSuccess) => {
    setLoading(true);
    setError('');
    try {
      const response = await createTestExecution({
        control_id: formData.control_id,
        client_id: formData.client_id,
        year: parseInt(formData.year),
        quarter: formData.quarter
      });
      
      // Call success callback with the response data
      if (onSuccess) {
        onSuccess(response.data);
      }
      
      // Refresh test executions data
      await fetchTestingData();
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
        // For other errors, show in error state
        setError(errorMessage);
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = async (e) => {
    const { name, value } = e.target;
    
    // Fetch RCM data when client is selected
    if (name === 'client_id' && value) {
      await fetchRcmData(value);
      // Reset process and control_id when client changes
      setForm(prev => ({
        ...prev,
        [name]: value,
        process: '',
        control_id: ''
      }));
    } else {
      setForm(prev => {
        // Reset control_id when process changes
        if (name === 'process') {
          return { ...prev, [name]: value, control_id: '' };
        }
        return { ...prev, [name]: value };
      });
    }
  };

  // --- Component Render ---
  return (
    <div id="periodic-testing-page">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Periodic Testing</h3>
        <Button 
          variant="primary" 
          onClick={handleModalOpen}
          id="add-testing-button"
        >
          <i class="fas fa-plus"></i> Add Testing
        </Button>
      </div>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      {loading && testingData.length === 0 ? (
        <Spinner animation="border" />
      ) : (
        <DynamicTable 
          data={testingData} 
          title="Periodic Testing" 
          tableId="periodic-testing-table"
          filterableColumns={['client_name', 'control_id', 'auditor']}
          renderActions={(row) => (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                if (row.test_execution_id) {
                  navigate(`/periodic-testing/${row.test_execution_id}`);
                }
              }}
              disabled={!row.test_execution_id}
            >
              View Details
            </Button>
          )}
        />
      )}

      {/* Periodic Testing Modal */}
      <PeriodicTestingModal
        show={showModal}
        onHide={() => {
          setShowModal(false);
          setError('');
        }}
        form={form}
        onChange={handleChange}
        onSubmit={handleSave}
        clients={clients}
        uniqueProcesses={getUniqueProcesses()}
        controlIds={getControlIdsByProcess(form.process)}
        loading={loading}
        onRemarksSaved={fetchTestingData}
      />
    </div>
  );
};

export default PeriodicTesting;

