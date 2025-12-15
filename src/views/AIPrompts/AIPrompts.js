import React, { useState, useEffect } from 'react';
import { Button, Spinner, Form } from 'react-bootstrap';
import Swal from 'sweetalert2';
import { useAuth } from '../../context/AuthContext';
import DynamicTable from '../../components/DynamicTable';
import { getAiPrompts, createAiPrompt, updateAiPrompt, deleteAiPrompt, getClientsForDropdown, getRcmControls, getMyPermissions } from '../../services/api';
import AIPromptsModal from '../../modals/AIPrompts/AIPromptsModal';

const AIPrompts = () => {
  const { user } = useAuth();
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [permissions, setPermissions] = useState({
    can_view: true,
    can_create: true,
    can_update: true,
    can_delete: true
  });
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [form, setForm] = useState({
    client_id: '',
    rcm_id: '',
    prompt_text: '',
  });

  // --- Data Fetching ---
  const fetchClients = async () => {
    try {
      const response = await getClientsForDropdown();
      setClients(response.data);
    } catch (err) {
      if (err.response?.status !== 401) {
        console.error('Failed to fetch clients:', err);
      }
    }
  };

  const fetchPrompts = async (clientId = null) => {
    if (!clientId) {
      setPrompts([]);
      return;
    }

    setLoading(true);
    try {
      const response = await getAiPrompts(clientId);
      const filteredData = response.data.map(item => ({
        ai_prompt_id: item.ai_prompt_id || null,
        client_name: item.client_name || '',
        control_id: item.control_id || 'Default',
        control_description: item.control_description || 'Default Prompt (for all RCMs)',
        prompt_text: item.prompt_text || '',
        is_default: item.is_default || 0,
      }));
      setPrompts(filteredData);
    } catch (err) {
      if (err.response?.status !== 401) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to fetch AI prompts.',
          confirmButtonColor: '#286070'
        });
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch user permissions
  const fetchPermissions = async () => {
    try {
      const response = await getMyPermissions();
      const aiPromptsPermission = response.data.find(p => p.resource === 'AI Prompts');
      if (aiPromptsPermission) {
        setPermissions({
          can_view: aiPromptsPermission.can_view === 1,
          can_create: aiPromptsPermission.can_create === 1,
          can_update: aiPromptsPermission.can_update === 1,
          can_delete: aiPromptsPermission.can_delete === 1
        });
      } else if (user?.roleId === 1) {
        // Super admin has all permissions
        setPermissions({
          can_view: true,
          can_create: true,
          can_update: true,
          can_delete: true
        });
      }
    } catch (err) {
      console.error('Failed to fetch permissions:', err);
      // Default to no permissions if fetch fails
      setPermissions({
        can_view: false,
        can_create: false,
        can_update: false,
        can_delete: false
      });
    }
  };

  useEffect(() => {
    fetchClients();
    fetchPermissions();
  }, []);

  useEffect(() => {
    if (selectedClientId && permissions.can_view) {
      fetchPrompts(selectedClientId);
    } else {
      setPrompts([]);
    }
  }, [selectedClientId, permissions.can_view]);

  // --- Form Handlers ---
  const handleModalOpen = (mode = 'create', prompt = null) => {
    if (mode === 'edit' && prompt) {
      setSelectedPrompt(prompt);
      setForm({
        client_id: selectedClientId || '',
        rcm_id: prompt.control_id !== 'Default' ? prompt.control_id : '',
        prompt_text: prompt.prompt_text || '',
      });
    } else {
      setSelectedPrompt(null);
      setForm({
        client_id: selectedClientId || '',
        rcm_id: '',
        prompt_text: '',
      });
    }
    setModalMode(mode);
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const promptData = {
        client_id: form.client_id,
        prompt_text: form.prompt_text,
      };

      // Only include control_id if it's selected (not empty)
      // Backend will look up rcm_id from control_id
      if (form.rcm_id) {
        promptData.control_id = form.rcm_id;
      }

      if (modalMode === 'edit' && selectedPrompt) {
        await updateAiPrompt(selectedPrompt.ai_prompt_id, { prompt_text: form.prompt_text });
      } else {
        await createAiPrompt(promptData);
      }
      
      await Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: modalMode === 'edit' ? 'AI prompt updated successfully.' : 'AI prompt created successfully.',
        confirmButtonColor: '#286070'
      });
      fetchPrompts(selectedClientId); // Refresh the table
      setShowModal(false);
    } catch (err) {
      console.error('Prompt Submission Error:', err.response || err);
      const errorMessage = err.response?.data?.message || 'Failed to save AI prompt due to an unknown error.';
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

  const handleDelete = async (promptId) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Are you sure you want to delete this AI prompt?',
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
      await deleteAiPrompt(promptId);
      await Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: 'AI prompt has been deleted successfully.',
        confirmButtonColor: '#286070'
      });
      fetchPrompts(selectedClientId);
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || 'Failed to delete AI prompt.',
        confirmButtonColor: '#286070'
      });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- Component Render ---
  return (
    <div id="ai-prompts-page">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">AI Prompts</h4>
        {permissions.can_create && (
          <Button 
            variant="primary" 
            onClick={() => handleModalOpen('create')}
            disabled={!selectedClientId}
            id="add-prompt-button"
          >
            <i className="fas fa-plus"></i> Add Prompt
          </Button>
        )}
      </div>

      {/* Client Filter */}
      <div className="mb-3">
        <Form.Group>
          <Form.Label>Filter by Client</Form.Label>
          <Form.Control 
            as="select" 
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
          >
            <option value="">Select a client...</option>
            {clients.map((client) => (
              <option key={client.client_id} value={client.client_id}>
                {client.client_name}
              </option>
            ))}
          </Form.Control>
        </Form.Group>
      </div>
      
      {!permissions.can_view ? (
        <div className="text-center text-muted p-4">
          <p>You do not have permission to view AI prompts.</p>
        </div>
      ) : !selectedClientId ? (
        <div className="text-center text-muted p-4">
          <p>Please select a client to view and manage AI prompts.</p>
        </div>
      ) : loading && prompts.length === 0 ? (
        <Spinner animation="border" />
      ) : (
        <DynamicTable 
          data={prompts} 
          title="AI Prompts" 
          tableId="ai-prompts-table"
          filterableColumns={['control_id', 'control_description']}
          renderActions={(row) => (
            <>
              {permissions.can_update && (
                <i
                  className="fas fa-edit text-warning"
                  onClick={() => handleModalOpen('edit', row)}
                  style={{ cursor: 'pointer', marginRight: '5px', fontSize: '14px' }}
                  title="Edit"
                />
              )}
              {permissions.can_delete && (
                <i
                  className="fas fa-trash text-danger"
                  onClick={() => handleDelete(row.ai_prompt_id)}
                  style={{ cursor: 'pointer', fontSize: '14px' }}
                  title="Delete"
                />
              )}
            </>
          )}
        />
      )}

      {/* AI Prompt Create/Edit Modal */}
      <AIPromptsModal
        show={showModal}
        onHide={() => setShowModal(false)}
        form={form}
        onChange={handleChange}
        onSubmit={handleSubmit}
        loading={loading}
        clients={clients}
        mode={modalMode}
      />
    </div>
  );
};

export default AIPrompts;

