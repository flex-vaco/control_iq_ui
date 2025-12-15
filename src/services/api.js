import axios from 'axios';

// Create an axios instance
export const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Function to set the auth token on the api instance
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = token;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// --- Auth Service ---
export const loginUser = (credentials) => {
  return api.post('/auth/login', credentials);
};

// --- Data Services ---
export const getRcmData = (clientId = null, tenantId = null) => {
  const params = {};
  if (clientId) params.client_id = clientId;
  if (tenantId) params.tenant_id = tenantId;
  return api.get('/data/rcm', { params });
};

export const getAttributesData = (clientId = null, tenantId = null) => {
  const params = {};
  if (clientId) params.client_id = clientId;
  if (tenantId) params.tenant_id = tenantId;
  return api.get('/data/attributes', { params });
};

// --- PBC/Evidence Services ---
export const getPbcData = (clientId = null, tenantId = null) => {
  const params = {};
  if (clientId) params.client_id = clientId;
  if (tenantId) params.tenant_id = tenantId;
  return api.get('/data/pbc', { params });
};

export const getRcmControls = (clientId) => {
  return api.get('/data/rcm-controls', { params: { client_id: clientId } });
};

export const checkDuplicatePbc = (controlId, year, quarter, clientId, evidenceId = null) => {
  const params = { control_id: controlId, year, quarter, client_id: clientId };
  if (evidenceId) {
    params.evidence_id = evidenceId;
  }
  return api.get('/data/pbc/check-duplicate', { params });
};

export const getEvidenceDocuments = (evidenceId) => {
  return api.get(`/data/pbc/${evidenceId}/documents`);
};

export const getPolicyDocuments = (evidenceId) => {
  return api.get(`/data/pbc/${evidenceId}/policy-documents`);
};

export const deleteEvidenceDocument = (documentId) => {
  return api.delete(`/data/pbc/documents/${documentId}`);
};

export const createPbcRequest = (formData) => {
  return api.post('/data/pbc', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

// --- Client Services (formerly Company) ---
export const getClients = (tenantId = null) => {
  const params = {};
  if (tenantId) params.tenant_id = tenantId;
  return api.get('/data/clients', { params });
};

export const getClientsForDropdown = () => {
  return api.get('/data/clients/dropdown');
};

export const getClientById = (id) => {
  return api.get(`/data/clients/${id}`);
};

export const createClient = (clientData) => {
  return api.post('/data/clients', clientData);
};

export const updateClient = (id, clientData) => {
  return api.put(`/data/clients/${id}`, clientData);
};

export const deleteClient = (id) => {
  return api.delete(`/data/clients/${id}`);
};

// Test Executions Services
export const createTestExecution = (data) => {
  return api.post('/data/test-executions', data);
};

export const checkDuplicateTestExecution = (controlId, year, quarter, clientId) => {
  const params = { control_id: controlId, year, quarter, client_id: clientId };
  return api.get('/data/test-executions/check-duplicate', { params });
};

export const getTestExecutions = (clientId = null, tenantId = null) => {
  const params = {};
  if (clientId) params.client_id = clientId;
  if (tenantId) params.tenant_id = tenantId;
  return api.get('/data/test-executions', { params });
};

export const getTestExecutionById = (id) => {
  return api.get(`/data/test-executions/${id}`);
};

export const getTestExecutionData = (controlId) => {
  return api.get('/data/test-executions/data', { params: { control_id: controlId } });
};

export const getEvidenceDataForTesting = (controlId, year, quarter, clientId) => {
  return api.get('/data/test-executions/preview', { 
    params: { control_id: controlId, year, quarter, client_id: clientId } 
  });
};

export const updateTestExecutionRemarks = (data) => {
  return api.put('/data/test-executions/remarks', data);
};

export const checkTestExecutionEvidence = (testExecutionId, evidenceDocumentId) => {
  return api.get('/data/check-test-execution-evidence', { 
    params: { test_execution_id: testExecutionId, evidence_document_id: evidenceDocumentId } 
  });
};

export const getTestExecutionEvidenceDocuments = (testExecutionId) => {
  return api.get('/data/test-execution-evidence-documents', { 
    params: { test_execution_id: testExecutionId } 
  });
};

export const updateTestExecutionEvidenceResult = (data) => {
  return api.put('/data/test-execution-evidence-result', data);
};

export const updateTestExecutionStatusAndResult = (data) => {
  return api.put('/data/test-executions/status-result', data);
};

export const evaluateAllEvidences = (data) => {
  return api.post('/data/evaluate-all-evidences', data);
};

// Legacy exports for backward compatibility during migration
export const getCompanies = getClients;
export const getCompanyById = getClientById;
export const createCompany = createClient;
export const updateCompany = updateClient;
export const deleteCompany = deleteClient;

// User Management Services
export const getUsers = () => {
  return api.get('/data/users');
};

export const getUserById = (id) => {
  return api.get(`/data/users/${id}`);
};

export const createUser = (userData) => {
  return api.post('/data/users', userData);
};

export const updateUser = (id, userData) => {
  return api.put(`/data/users/${id}`, userData);
};

export const deleteUser = (id) => {
  return api.delete(`/data/users/${id}`);
};

// Role Management Services
export const getRoles = () => {
  return api.get('/data/roles');
};

export const getRoleById = (id) => {
  return api.get(`/data/roles/${id}`);
};

export const createRole = (roleData) => {
  return api.post('/data/roles', roleData);
};

export const updateRole = (id, roleData) => {
  return api.put(`/data/roles/${id}`, roleData);
};

export const deleteRole = (id) => {
  return api.delete(`/data/roles/${id}`);
};

// Permission/Access Control Services
export const getPermissionsByRole = (roleId, tenantId = null) => {
  const params = tenantId ? { tenant_id: tenantId } : {};
  return api.get(`/data/permissions/role/${roleId}`, { params });
};

export const getMyPermissions = () => {
  return api.get('/data/permissions/my-permissions');
};

export const updatePermissions = (roleId, permissions, tenantId = null) => {
  const body = { permissions };
  if (tenantId) {
    body.tenant_id = tenantId;
  }
  return api.put(`/data/permissions/role/${roleId}`, body);
};

export const getAvailableResources = () => {
  return api.get('/data/permissions/resources');
};

export const getAllTenants = () => {
  return api.get('/data/permissions/tenants');
};

// AI Prompts Services
export const getAiPrompts = (clientId, tenantId = null) => {
  const params = { client_id: clientId };
  if (tenantId) params.tenant_id = tenantId;
  return api.get('/data/ai-prompts', { params });
};

export const getAiPromptById = (id) => {
  return api.get(`/data/ai-prompts/${id}`);
};

export const createAiPrompt = (promptData) => {
  return api.post('/data/ai-prompts', promptData);
};

export const updateAiPrompt = (id, promptData) => {
  return api.put(`/data/ai-prompts/${id}`, promptData);
};

export const deleteAiPrompt = (id) => {
  return api.delete(`/data/ai-prompts/${id}`);
};