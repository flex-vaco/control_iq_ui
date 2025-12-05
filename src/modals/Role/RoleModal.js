import React, { useState, useEffect } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';

const RoleModal = ({ show, onHide, onSubmit, role, tenants, loading }) => {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.roleId === 1;
  const [formData, setFormData] = useState({
    role_name: '',
    description: '',
    tenant_id: isSuperAdmin ? '' : (currentUser?.tenantId || '')
  });
  const [errors, setErrors] = useState({});

  const isEditMode = !!role;

  useEffect(() => {
    if (role) {
      setFormData({
        role_name: role.role_name || '',
        description: role.description || '',
        tenant_id: role.tenant_id || (isSuperAdmin ? '' : (currentUser?.tenantId || ''))
      });
    } else {
      setFormData({
        role_name: '',
        description: '',
        tenant_id: isSuperAdmin ? '' : (currentUser?.tenantId || '')
      });
    }
    setErrors({});
  }, [role, show, isSuperAdmin, currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.role_name.trim()) {
      newErrors.role_name = 'Role name is required';
    }
    
    if (isSuperAdmin && !formData.tenant_id) {
      newErrors.tenant_id = 'Tenant is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{isEditMode ? 'Edit Role' : 'Create Role'}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {isSuperAdmin && (
            <Form.Group className="mb-3">
              <Form.Label>Tenant/Client <span className="text-danger">*</span></Form.Label>
              <Form.Select
                name="tenant_id"
                value={formData.tenant_id}
                onChange={handleChange}
                isInvalid={!!errors.tenant_id}
              >
                <option value="">Select a tenant/client</option>
                {tenants && tenants.map(tenant => (
                  <option key={tenant.tenant_id} value={tenant.tenant_id}>
                    {tenant.tenant_name}
                  </option>
                ))}
              </Form.Select>
              <Form.Control.Feedback type="invalid">{errors.tenant_id}</Form.Control.Feedback>
            </Form.Group>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Role Name <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="text"
              name="role_name"
              value={formData.role_name}
              onChange={handleChange}
              isInvalid={!!errors.role_name}
              placeholder="e.g., Admin, Manager, Viewer"
            />
            <Form.Control.Feedback type="invalid">{errors.role_name}</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter role description..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Saving...' : isEditMode ? 'Update' : 'Create'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default RoleModal;

