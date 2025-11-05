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
export const getRcmData = (clientId = null) => {
  const params = clientId ? { client_id: clientId } : {};
  return api.get('/data/rcm', { params });
};

export const getAttributesData = (clientId = null) => {
  const params = clientId ? { client_id: clientId } : {};
  return api.get('/data/attributes', { params });
};

// --- PBC/Evidence Services ---
export const getPbcData = (clientId = null) => {
  const params = clientId ? { client_id: clientId } : {};
  return api.get('/data/pbc', { params });
};

export const getRcmControls = (clientId) => {
  return api.get('/data/rcm-controls', { params: { client_id: clientId } });
};

export const createPbcRequest = (formData) => {
  return api.post('/data/pbc', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

// --- Client Services (formerly Company) ---
export const getClients = () => {
  return api.get('/data/clients');
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

export const getTestExecutions = () => {
  return api.get('/data/test-executions');
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

// Legacy exports for backward compatibility during migration
export const getCompanies = getClients;
export const getCompanyById = getClientById;
export const createCompany = createClient;
export const updateCompany = updateClient;
export const deleteCompany = deleteClient;