import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import './assets/App.css';

// --- UPDATED IMPORT PATHS ---
import Login from './views/Login/Login';
import Dashboard from './views/Dashboard/Dashboard';
import RCM from './views/RCM/RCM';
import PBC from './views/PBC/PBC';
import Attributes from './views/Attributes/Attributes';
import Client from './views/Client/Client';
import PeriodicTesting from './views/PeriodicTesting/PeriodicTesting';
import TestExecutionDetails from './views/PeriodicTesting/TestExecutionDetails';
import UserManagement from './views/UserManagement/UserManagement';
import RoleManagement from './views/RoleManagement/RoleManagement';
import AccessControl from './views/AccessControl/AccessControl';
// --- END OF UPDATES ---

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* Protected Routes Wrapper */}
      <Route element={<PrivateRoute />}>
        {/* Layout includes Sidebar and main content area */}
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/rcm" element={<RCM />} />
          <Route path="/pbc" element={<PBC />} />
          <Route path="/attributes" element={<Attributes />} />
          <Route path="/client" element={<Client />} />
          <Route path="/periodic-testing" element={<PeriodicTesting />} />
          <Route path="/periodic-testing/:id" element={<TestExecutionDetails />} />
          <Route path="/user-management" element={<UserManagement />} />
          <Route path="/role-management" element={<RoleManagement />} />
          <Route path="/access-control" element={<AccessControl />} />
        </Route>
      </Route>

      {/* Fallback for unknown routes */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;