import React, { useState, useEffect } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';

const UserModal = ({ show, onHide, onSubmit, user, roles, tenants, loading }) => {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.roleId === 1;
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    role_id: '',
    password: '',
    is_active: true,
    tenant_id: isSuperAdmin ? '' : (currentUser?.tenantId || '')
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const isEditMode = !!user;

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        role_id: user.role_id || '',
        password: '', // Don't populate password
        is_active: user.is_active !== undefined ? user.is_active : true,
        tenant_id: user.tenant_id || (isSuperAdmin ? '' : (currentUser?.tenantId || ''))
      });
      setShowPassword(false);
    } else {
      setFormData({
        username: '',
        first_name: '',
        last_name: '',
        email: '',
        role_id: '',
        password: '',
        is_active: true,
        tenant_id: isSuperAdmin ? '' : (currentUser?.tenantId || '')
      });
      setShowPassword(true);
    }
    setErrors({});
  }, [user, show, isSuperAdmin, currentUser]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };
      // Reset role_id when tenant changes (for super admin)
      if (name === 'tenant_id' && isSuperAdmin) {
        newData.role_id = '';
      }
      return newData;
    });
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
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }
    
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }
    
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!formData.role_id) {
      newErrors.role_id = 'Role is required';
    }
    
    if (isSuperAdmin && !formData.tenant_id) {
      newErrors.tenant_id = 'Tenant is required';
    }
    
    if (!isEditMode && !formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      const submitData = { ...formData };
      // Only include password if it's provided (for edit) or required (for create)
      if (isEditMode && !submitData.password) {
        delete submitData.password;
      }
      onSubmit(submitData);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{isEditMode ? 'Edit User' : 'Create User'}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Username <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              isInvalid={!!errors.username}
            />
            <Form.Control.Feedback type="invalid">{errors.username}</Form.Control.Feedback>
          </Form.Group>

          <div className="row">
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>First Name <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                isInvalid={!!errors.first_name}
              />
              <Form.Control.Feedback type="invalid">{errors.first_name}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3 col-md-6">
              <Form.Label>Last Name <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                isInvalid={!!errors.last_name}
              />
              <Form.Control.Feedback type="invalid">{errors.last_name}</Form.Control.Feedback>
            </Form.Group>
          </div>

          <Form.Group className="mb-3">
            <Form.Label>Email <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              isInvalid={!!errors.email}
            />
            <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
          </Form.Group>

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
            <Form.Label>Role <span className="text-danger">*</span></Form.Label>
            <Form.Select
              name="role_id"
              value={formData.role_id}
              onChange={handleChange}
              isInvalid={!!errors.role_id}
              disabled={isSuperAdmin && !formData.tenant_id}
            >
              <option value="">Select a role</option>
              {roles
                .filter(role => !isSuperAdmin || !formData.tenant_id || role.tenant_id === parseInt(formData.tenant_id))
                .map(role => (
                  <option key={role.role_id} value={role.role_id}>
                    {role.role_name}
                  </option>
                ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid">{errors.role_id}</Form.Control.Feedback>
            {isSuperAdmin && !formData.tenant_id && (
              <Form.Text className="text-muted">
                Please select a tenant first to see available roles
              </Form.Text>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>
              Password {isEditMode ? '(leave blank to keep current)' : <span className="text-danger">*</span>}
            </Form.Label>
            <div className="d-flex">
              <Form.Control
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                isInvalid={!!errors.password}
                placeholder={isEditMode ? 'Enter new password (optional)' : 'Enter password'}
              />
              <Button
                variant="outline-secondary"
                onClick={() => setShowPassword(!showPassword)}
                type="button"
                style={{ marginLeft: '5px' }}
              >
                <i className={`fas fa-eye${showPassword ? '-slash' : ''}`}></i>
              </Button>
            </div>
            <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
            {isEditMode && (
              <Form.Text className="text-muted">
                Leave blank to keep the current password
              </Form.Text>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              name="is_active"
              label="Active"
              checked={formData.is_active}
              onChange={handleChange}
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

export default UserModal;

