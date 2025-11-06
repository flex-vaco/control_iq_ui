import React, { useState, useEffect } from 'react';
import { Button, Alert, Spinner } from 'react-bootstrap';
import DynamicTable from '../../components/DynamicTable';
import { getClients, createClient, updateClient, deleteClient } from '../../services/api';
import ClientModal from '../../modals/Client/ClientModal';

const Client = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [selectedClient, setSelectedClient] = useState(null);
  const [form, setForm] = useState({
    client_name: '',
    industry: '',
    region: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    status: 'active',
  });
  const [submissionStatus, setSubmissionStatus] = useState(null);

  // --- Data Fetching ---
  const fetchClients = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getClients();
      const filteredData = response.data.map(item => ({
        client_id: item.client_id || null, // Keep id for edit/delete
        client_name: item.client_name || '',
        industry: item.industry || '',
        region: item.region || '',
        contact_name: item.contact_name || '',
        contact_email: item.contact_email || '',
        contact_phone: item.contact_phone || '',
        status: item.status || 'active',
      }));
      setClients(filteredData);
    } catch (err) {
      setError('Failed to fetch clients.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // --- Form Handlers ---
  const handleModalOpen = (mode = 'create', client = null) => {
    if (mode === 'edit' && client) {
      
      setSelectedClient(client);
      setForm({
        client_name: client.client_name || '',
        industry: client.industry || '',
        region: client.region || '',
        contact_name: client.contact_name || '',
        contact_email: client.contact_email || '',
        contact_phone: client.contact_phone || '',
        status: client.status || 'active',
      });
    } else {
      setSelectedClient(null);
      setForm({
        client_name: '',
        industry: '',
        region: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        status: 'active',
      });
    }
    setModalMode(mode);
    setSubmissionStatus(null);
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSubmissionStatus(null);
    setError('');

    try {
      if (modalMode === 'edit' && selectedClient) {
        console.log(selectedClient);
        await updateClient(selectedClient.client_id, form);
        setSubmissionStatus({ message: 'Client updated successfully.', variant: 'success' });
      } else {
        await createClient(form);
        setSubmissionStatus({ message: 'Client created successfully.', variant: 'success' });
      }
      
      fetchClients(); // Refresh the table
      setTimeout(() => {
        setShowModal(false); // Close modal after success
      }, 1000);
    } catch (err) {
      console.error('Client Submission Error:', err.response || err);
      const errorMessage = err.response?.data?.message || 'Failed to save client due to an unknown error.';
      setSubmissionStatus({ 
        message: errorMessage, 
        variant: 'danger' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (clientId) => {
    if (!window.confirm('Are you sure you want to delete this client?')) {
      return;
    }

    setLoading(true);
    setError('');
    try {
      await deleteClient(clientId);
      fetchClients(); // Refresh the table
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete client.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- Component Render ---
  return (
    <div id="client-page">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Clients</h4>
        <Button 
          variant="primary" 
          onClick={() => handleModalOpen('create')}
          id="add-client-button"
        >
          <i className="fas fa-plus"></i> Add Client
        </Button>
      </div>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      {loading && clients.length === 0 ? (
        <Spinner animation="border" />
      ) : (
        <DynamicTable 
          data={clients} 
          title="Clients" 
          tableId="client-table"
          filterableColumns={['client_name', 'industry', 'region', 'status']}
          renderActions={(row) => (
            <>
              <i
                className="fas fa-edit text-warning"
                onClick={() => handleModalOpen('edit',row)}
                style={{ cursor: 'pointer', marginRight: '5px', fontSize: '14px' }}
                title="Edit"
              />
              <i
                className="fas fa-trash text-danger"
                onClick={() => handleDelete(row.client_id)}
                style={{ cursor: 'pointer', fontSize: '14px' }}
                title="Delete"
              />
            </>
          )}
        />
      )}

      {/* Client Create/Edit Modal */}
      <ClientModal
        show={showModal}
        onHide={() => setShowModal(false)}
        form={form}
        onChange={handleChange}
        onSubmit={handleSubmit}
        loading={loading}
        submissionStatus={submissionStatus}
        mode={modalMode}
      />
    </div>
  );
};

export default Client;

