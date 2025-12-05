import React, { useState, useEffect } from 'react';
import { Button, Spinner, Form, Card } from 'react-bootstrap';
import Swal from 'sweetalert2';
import { useAuth } from '../../context/AuthContext';
import DynamicTable from '../../components/DynamicTable';
import { getUsers, getUserById, createUser, updateUser, deleteUser, getRoles, getAllTenants } from '../../services/api';
import UserModal from '../../modals/User/UserModal';

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.roleId === 1;
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [selectedTenantFilter, setSelectedTenantFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    if (isSuperAdmin) {
      fetchTenants();
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    if (selectedTenantFilter) {
      setFilteredUsers(users.filter(user => user.tenant_id === parseInt(selectedTenantFilter)));
    } else {
      setFilteredUsers(users);
    }
  }, [selectedTenantFilter, users]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await getUsers();
      setUsers(response.data);
    } catch (err) {
      if (err.response?.status !== 401) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.response?.data?.message || 'Failed to fetch users.',
          confirmButtonColor: '#286070'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await getRoles();
      setRoles(response.data);
    } catch (err) {
      if (err.response?.status !== 401) {
        console.error('Failed to fetch roles:', err);
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

  const handleModalOpen = async (mode = 'create', user = null) => {
    if (mode === 'edit' && user) {
      // Fetch full user data for editing
      try {
        const response = await getUserById(user.user_id);
        setSelectedUser(response.data);
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.response?.data?.message || 'Failed to fetch user details.',
          confirmButtonColor: '#286070'
        });
        return;
      }
    } else {
      setSelectedUser(null);
    }
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedUser(null);
  };

  const handleSubmit = async (formData) => {
    setLoading(true);
    try {
      if (selectedUser) {
        await updateUser(selectedUser.user_id, formData);
        await Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'User updated successfully.',
          confirmButtonColor: '#286070'
        });
      } else {
        await createUser(formData);
        await Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'User created successfully.',
          confirmButtonColor: '#286070'
        });
      }
      fetchUsers();
      handleModalClose();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || 'Failed to save user.',
        confirmButtonColor: '#286070'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Are you sure you want to delete this user?',
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
      await deleteUser(userId);
      await Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: 'User has been deleted successfully.',
        confirmButtonColor: '#286070'
      });
      fetchUsers();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || 'Failed to delete user.',
        confirmButtonColor: '#286070'
      });
    } finally {
      setLoading(false);
    }
  };

  // Format data for table display - hide tenant_name for non-super admin
  const tableData = filteredUsers.map(user => {
    const data = {
      user_id: user.user_id,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role_name: user.role_name || 'N/A',
      is_active: user.is_active ? 'Active' : 'Inactive'
    };
    // Only include tenant_name if user is super admin
    if (isSuperAdmin) {
      data.tenant_name = user.tenant_name || 'N/A';
    }
    return data;
  });

  // Build column header map conditionally
  const columnHeaderMap = {
    user_id: 'ID',
    username: 'Username',
    first_name: 'First Name',
    last_name: 'Last Name',
    email: 'Email',
    role_name: 'Role',
    is_active: 'Status'
  };
  if (isSuperAdmin) {
    columnHeaderMap.tenant_name = 'Tenant/Client';
  }

  // Build filterable columns conditionally
  const filterableColumns = ['username', 'first_name', 'last_name', 'email', 'role_name'];
  if (isSuperAdmin) {
    filterableColumns.push('tenant_name');
  }

  return (
    <div id="user-management-page">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">User Management</h4>
        <Button 
          variant="primary" 
          onClick={() => handleModalOpen('create')}
          id="add-user-button"
        >
          <i className="fas fa-plus"></i> Add User
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
      
      {loading && users.length === 0 ? (
        <Spinner animation="border" />
      ) : (
        <DynamicTable 
          data={tableData} 
          title="Users" 
          tableId="users-table"
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
                onClick={() => handleDelete(row.user_id)}
                style={{ cursor: 'pointer', fontSize: '14px' }}
                title="Delete"
              />
            </>
          )}
        />
      )}

      <UserModal
        show={showModal}
        onHide={handleModalClose}
        onSubmit={handleSubmit}
        user={selectedUser}
        roles={roles}
        tenants={tenants}
        loading={loading}
      />
    </div>
  );
};

export default UserManagement;

