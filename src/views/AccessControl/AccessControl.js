import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Spinner, Alert } from 'react-bootstrap';
import Swal from 'sweetalert2';
import { useAuth } from '../../context/AuthContext';
import { getRoles, getPermissionsByRole, updatePermissions, getAvailableResources, getAllTenants } from '../../services/api';

const AccessControl = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState([]);
  const [resources, setResources] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const isSuperAdmin = user?.roleId === 1;

  useEffect(() => {
    fetchRoles();
    fetchResources();
    if (isSuperAdmin) {
      fetchTenants();
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    if (selectedRoleId) {
      fetchPermissions(selectedRoleId);
    } else {
      setPermissions({});
    }
  }, [selectedRoleId, selectedTenantId]);

  const fetchRoles = async () => {
    try {
      const response = await getRoles();
      setRoles(response.data);
    } catch (err) {
      if (err.response?.status !== 401) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.response?.data?.message || 'Failed to fetch roles.',
          confirmButtonColor: '#286070'
        });
      }
    }
  };

  const fetchResources = async () => {
    try {
      const response = await getAvailableResources();
      setResources(response.data);
    } catch (err) {
      if (err.response?.status !== 401) {
        console.error('Failed to fetch resources:', err);
      }
    }
  };

  const fetchTenants = async () => {
    try {
      const response = await getAllTenants();
      setTenants(response.data);
    } catch (err) {
      if (err.response?.status !== 401) {
        console.error('Failed to fetch tenants:', err);
      }
    }
  };

  const fetchPermissions = async (roleId) => {
    setLoading(true);
    try {
      const tenantId = isSuperAdmin && selectedTenantId ? parseInt(selectedTenantId) : null;
      const response = await getPermissionsByRole(roleId, tenantId);
      // Convert array to object keyed by resource
      const permissionsObj = {};
      response.data.forEach(perm => {
        permissionsObj[perm.resource] = {
          can_view: perm.can_view === 1,
          can_create: perm.can_create === 1,
          can_update: perm.can_update === 1,
          can_delete: perm.can_delete === 1
        };
      });
      setPermissions(permissionsObj);
    } catch (err) {
      if (err.response?.status !== 401) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.response?.data?.message || 'Failed to fetch permissions.',
          confirmButtonColor: '#286070'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (resource, permissionType, value) => {
    setPermissions(prev => ({
      ...prev,
      [resource]: {
        ...(prev[resource] || {}),
        [permissionType]: value
      }
    }));
  };

  const handleSelectAll = (permissionType, value) => {
    const newPermissions = { ...permissions };
    resources.forEach(resource => {
      newPermissions[resource.resource] = {
        ...(newPermissions[resource.resource] || {}),
        [permissionType]: value
      };
    });
    setPermissions(newPermissions);
  };

  const handleSave = async () => {
    if (!selectedRoleId) {
      Swal.fire({
        icon: 'warning',
        title: 'No Role Selected',
        text: 'Please select a role first.',
        confirmButtonColor: '#286070'
      });
      return;
    }

    if (isSuperAdmin && !selectedTenantId) {
      Swal.fire({
        icon: 'warning',
        title: 'No Tenant Selected',
        text: 'Please select a tenant/client first.',
        confirmButtonColor: '#286070'
      });
      return;
    }

    setSaving(true);
    try {
      // Convert permissions object to array
      const permissionsArray = resources.map(resource => ({
        resource: resource.resource,
        can_view: permissions[resource.resource]?.can_view || false,
        can_create: permissions[resource.resource]?.can_create || false,
        can_update: permissions[resource.resource]?.can_update || false,
        can_delete: permissions[resource.resource]?.can_delete || false
      }));

      const tenantId = isSuperAdmin && selectedTenantId ? parseInt(selectedTenantId) : null;
      await updatePermissions(selectedRoleId, permissionsArray, tenantId);
      await Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Permissions updated successfully.',
        confirmButtonColor: '#286070'
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || 'Failed to update permissions.',
        confirmButtonColor: '#286070'
      });
    } finally {
      setSaving(false);
    }
  };

  const selectedRole = roles.find(r => r.role_id === parseInt(selectedRoleId));

  return (
    <div id="access-control-page">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Access Control</h4>
        {selectedRoleId && (
          <Button 
            variant="primary" 
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Saving...
              </>
            ) : (
              <>
                <i className="fas fa-save me-2"></i>
                Save Permissions
              </>
            )}
          </Button>
        )}
      </div>

      <Card className="mb-3">
        <Card.Body>
          {isSuperAdmin && (
            <Form.Group className="mb-3">
              <Form.Label><strong>Select Tenant/Client</strong> <span className="text-danger">*</span></Form.Label>
              <Form.Select
                value={selectedTenantId}
                onChange={(e) => {
                  setSelectedTenantId(e.target.value);
                  setSelectedRoleId(''); // Reset role when tenant changes
                  setPermissions({});
                }}
              >
                <option value="">-- Select a tenant/client --</option>
                {tenants.map(tenant => (
                  <option key={tenant.tenant_id} value={tenant.tenant_id}>
                    {tenant.tenant_name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          )}
          <Form.Group>
            <Form.Label><strong>Select Role</strong> <span className="text-danger">*</span></Form.Label>
            <Form.Select
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              disabled={isSuperAdmin && !selectedTenantId}
            >
              <option value="">-- Select a role --</option>
              {roles
                .filter(role => !isSuperAdmin || !selectedTenantId || role.tenant_id === parseInt(selectedTenantId))
                .map(role => (
                  <option key={role.role_id} value={role.role_id}>
                    {role.role_name} 
                    {role.tenant_name ? ` (${role.tenant_name})` : ''}
                    {role.description ? ` - ${role.description}` : ''}
                  </option>
                ))}
            </Form.Select>
          </Form.Group>
        </Card.Body>
      </Card>

      {isSuperAdmin && !selectedTenantId ? (
        <Alert variant="info">
          Please select a tenant/client first, then select a role to manage its permissions.
        </Alert>
      ) : !selectedRoleId ? (
        <Alert variant="info">
          Please select a role to manage its permissions.
        </Alert>
      ) : loading ? (
        <div className="text-center">
          <Spinner animation="border" />
        </div>
      ) : (
        <Card>
          <Card.Header>
            <h5 className="mb-0">
              Permissions for: <strong>{selectedRole?.role_name}</strong>
            </h5>
          </Card.Header>
          <Card.Body>
            <div className="table-responsive">
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th style={{ width: '25%' }}>Resource</th>
                    <th style={{ width: '18.75%' }} className="text-center">
                      View
                      <br />
                      <Form.Check
                        type="checkbox"
                        className="mt-1"
                        onChange={(e) => handleSelectAll('can_view', e.target.checked)}
                      />
                    </th>
                    <th style={{ width: '18.75%' }} className="text-center">
                      Create
                      <br />
                      <Form.Check
                        type="checkbox"
                        className="mt-1"
                        onChange={(e) => handleSelectAll('can_create', e.target.checked)}
                      />
                    </th>
                    <th style={{ width: '18.75%' }} className="text-center">
                      Update
                      <br />
                      <Form.Check
                        type="checkbox"
                        className="mt-1"
                        onChange={(e) => handleSelectAll('can_update', e.target.checked)}
                      />
                    </th>
                    <th style={{ width: '18.75%' }} className="text-center">
                      Delete
                      <br />
                      <Form.Check
                        type="checkbox"
                        className="mt-1"
                        onChange={(e) => handleSelectAll('can_delete', e.target.checked)}
                      />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {resources.map(resource => (
                    <tr key={resource.resource}>
                      <td><strong>{resource.label || resource.resource}</strong></td>
                      <td className="text-center">
                        <Form.Check
                          type="checkbox"
                          checked={permissions[resource.resource]?.can_view || false}
                          onChange={(e) => handlePermissionChange(resource.resource, 'can_view', e.target.checked)}
                        />
                      </td>
                      <td className="text-center">
                        <Form.Check
                          type="checkbox"
                          checked={permissions[resource.resource]?.can_create || false}
                          onChange={(e) => handlePermissionChange(resource.resource, 'can_create', e.target.checked)}
                        />
                      </td>
                      <td className="text-center">
                        <Form.Check
                          type="checkbox"
                          checked={permissions[resource.resource]?.can_update || false}
                          onChange={(e) => handlePermissionChange(resource.resource, 'can_update', e.target.checked)}
                        />
                      </td>
                      <td className="text-center">
                        <Form.Check
                          type="checkbox"
                          checked={permissions[resource.resource]?.can_delete || false}
                          onChange={(e) => handlePermissionChange(resource.resource, 'can_delete', e.target.checked)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default AccessControl;

