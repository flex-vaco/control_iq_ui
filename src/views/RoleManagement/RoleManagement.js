import React, { useState, useEffect } from 'react';
import { Button, Spinner, Form, Card } from 'react-bootstrap';
import Swal from 'sweetalert2';
import { useAuth } from '../../context/AuthContext';
import DynamicTable from '../../components/DynamicTable';
import { getRoles, createRole, updateRole, deleteRole, getAllTenants } from '../../services/api';
import RoleModal from '../../modals/Role/RoleModal';

const RoleManagement = () => {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.roleId === 1;
  const [roles, setRoles] = useState([]);
  const [filteredRoles, setFilteredRoles] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [selectedTenantFilter, setSelectedTenantFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  useEffect(() => {
    fetchRoles();
    if (isSuperAdmin) {
      fetchTenants();
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    if (selectedTenantFilter) {
      setFilteredRoles(roles.filter(role => role.tenant_id === parseInt(selectedTenantFilter)));
    } else {
      setFilteredRoles(roles);
    }
  }, [selectedTenantFilter, roles]);

  const fetchRoles = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
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

  const handleModalOpen = (mode = 'create', role = null) => {
    setSelectedRole(role);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedRole(null);
  };

  const handleSubmit = async (formData) => {
    setLoading(true);
    try {
      if (selectedRole) {
        await updateRole(selectedRole.role_id, formData);
        await Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Role updated successfully.',
          confirmButtonColor: '#286070'
        });
      } else {
        await createRole(formData);
        await Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Role created successfully.',
          confirmButtonColor: '#286070'
        });
      }
      fetchRoles();
      handleModalClose();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || 'Failed to save role.',
        confirmButtonColor: '#286070'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (roleId) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Are you sure you want to delete this role?',
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
      await deleteRole(roleId);
      await Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: 'Role has been deleted successfully.',
        confirmButtonColor: '#286070'
      });
      fetchRoles();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || 'Failed to delete role.',
        confirmButtonColor: '#286070'
      });
    } finally {
      setLoading(false);
    }
  };

  // Format data for table display - hide tenant_name for non-super admin
  const tableData = filteredRoles.map(role => {
    const data = {
      role_id: role.role_id,
      role_name: role.role_name,
      description: role.description || 'N/A',
      user_count: role.user_count || 0
    };
    // Only include tenant_name if user is super admin
    if (isSuperAdmin) {
      data.tenant_name = role.tenant_name || 'N/A';
    }
    return data;
  });

  // Build column header map conditionally
  const columnHeaderMap = {
    role_id: 'ID',
    role_name: 'Role Name',
    description: 'Description',
    user_count: 'Users'
  };
  if (isSuperAdmin) {
    columnHeaderMap.tenant_name = 'Tenant/Client';
  }

  // Build filterable columns conditionally
  const filterableColumns = ['role_name', 'description'];
  if (isSuperAdmin) {
    filterableColumns.push('tenant_name');
  }

  return (
    <div id="role-management-page">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Role Management</h4>
        <Button 
          variant="primary" 
          onClick={() => handleModalOpen('create')}
          id="add-role-button"
        >
          <i className="fas fa-plus"></i> Add Role
        </Button>
      </div>

      {isSuperAdmin && tenants.length > 0 && (
        <Card className="mb-3">
          <Card.Body>
            <Form.Group>
              <Form.Label><strong>Filter by Tenant/Client</strong></Form.Label>
              <Form.Select
                value={selectedTenantFilter}
                onChange={(e) => setSelectedTenantFilter(e.target.value)}
              >
                <option value="">All Tenants/Clients</option>
                {tenants.map(tenant => (
                  <option key={tenant.tenant_id} value={tenant.tenant_id}>
                    {tenant.tenant_name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Card.Body>
        </Card>
      )}
      
      {loading && roles.length === 0 ? (
        <Spinner animation="border" />
      ) : (
        <DynamicTable 
          data={tableData} 
          title="Roles" 
          tableId="roles-table"
          filterableColumns={filterableColumns}
          columnHeaderMap={columnHeaderMap}
          renderActions={(row) => (
            <>
              <i
                className="fas fa-edit text-warning"
                onClick={() => handleModalOpen('edit', row)}
                style={{ cursor: 'pointer', marginRight: '10px', fontSize: '14px' }}
                title="Edit"
              />
              <i
                className="fas fa-trash text-danger"
                onClick={() => handleDelete(row.role_id)}
                style={{ cursor: 'pointer', fontSize: '14px' }}
                title="Delete"
              />
            </>
          )}
        />
      )}

      <RoleModal
        show={showModal}
        onHide={handleModalClose}
        onSubmit={handleSubmit}
        role={selectedRole}
        tenants={tenants}
        loading={loading}
      />
    </div>
  );
};

export default RoleManagement;

