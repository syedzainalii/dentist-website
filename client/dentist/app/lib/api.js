const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Get authentication token from localStorage
 * Unified token key for admin dashboard
 */
function getToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token'); // unified token
  }
  return null;
}

/**
 * Make authenticated API request (JSON)
 */
async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = 'API request failed';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        errorMessage = response.statusText || `HTTP ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        'Network error: Unable to connect to server. Please check if the backend is running.'
      );
    }
    throw error;
  }
}

/**
 * Make authenticated API request with FormData (file uploads)
 */
async function formDataRequest(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    ...options.headers,
  };

  // DO NOT set Content-Type for FormData
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = 'API request failed';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        errorMessage = response.statusText || `HTTP ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        'Network error: Unable to connect to server. Please check if the backend is running.'
      );
    }
    throw error;
  }
}

/* ===================== DENTAL CLINIC APIs ===================== */

// Authentication
export const authAPI = {
  register: (data) =>
    apiRequest('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) =>
    apiRequest('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  verifyEmail: (data) =>
    apiRequest('/api/auth/verify-email', { method: 'POST', body: JSON.stringify(data) }),
  resendCode: (data) =>
    apiRequest('/api/auth/resend-code', { method: 'POST', body: JSON.stringify(data) }),
};

// Users
export const userAPI = {
  getAll: () => apiRequest('/api/users'),
  updateRole: (userId, role) =>
    apiRequest(`/api/users/${userId}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
  updateProfile: (data) =>
    apiRequest('/api/users/profile', { method: 'PUT', body: JSON.stringify(data) }),
  changePassword: (data) =>
    apiRequest('/api/users/change-password', { method: 'PUT', body: JSON.stringify(data) }),
};

// Appointments
export const appointmentAPI = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return apiRequest(`/api/appointments${params ? `?${params}` : ''}`);
  },
  getMyAppointments: () => apiRequest('/api/appointments/my-appointments'),
  create: (data) => apiRequest('/api/appointments', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (appointmentId, status) =>
    apiRequest(`/api/appointments/${appointmentId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  cancel: (appointmentId) =>
    apiRequest(`/api/appointments/${appointmentId}/cancel`, { method: 'PATCH' }),
};

// Services (Dental services)
export const serviceAPI = {
  // Public: active=true by default, admin can override
  getAll: (activeOnly = true) =>
    apiRequest(`/api/services${activeOnly ? '?active=true' : '?active=false'}`),
  create: (data) => apiRequest('/api/services', { method: 'POST', body: JSON.stringify(data) }),
  update: (serviceId, data) => apiRequest(`/api/services/${serviceId}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (serviceId) => apiRequest(`/api/services/${serviceId}`, { method: 'DELETE' }),
};

// Dentists/Staff
export const dentistAPI = {
  getAll: (activeOnly = true) =>
    apiRequest(`/api/dentists${activeOnly ? '?active=true' : '?active=false'}`),
  create: (formData) => formDataRequest('/api/dentists', { method: 'POST', body: formData }),
  update: (dentistId, formData) => formDataRequest(`/api/dentists/${dentistId}`, { method: 'PUT', body: formData }),
  delete: (dentistId) => apiRequest(`/api/dentists/${dentistId}`, { method: 'DELETE' }),
};

// Content Management
export const contentAPI = {
  getAll: (key = null) => apiRequest(`/api/content${key ? `?key=${key}` : ''}`),
  create: (data) => apiRequest('/api/content', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/api/content/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  createFormData: (formData) => formDataRequest('/api/content', { method: 'POST', body: formData }),
  updateFormData: (id, formData) => formDataRequest(`/api/content/${id}`, { method: 'PUT', body: formData }),
  updateJSON: (id, data) => apiRequest(`/api/content/${id}/json`, { method: 'PUT', body: JSON.stringify(data) }),
};

// Dashboard Analytics
export const dashboardAPI = {
  getSummary: () => apiRequest('/api/dashboard/summary'),
  getCharts: (range = '7d') => apiRequest(`/api/dashboard/charts?range=${range}`),
};

// Available Time Slots
export const timeSlotsAPI = {
  getAvailable: (date, dentistId = null) => {
    const params = new URLSearchParams({ date });
    if (dentistId) params.append('dentist_id', dentistId);
    return apiRequest(`/api/time-slots/available?${params.toString()}`);
  },
};

// Patient Records
export const patientAPI = {
  getHistory: () => apiRequest('/api/patients/history'),
  updateMedicalInfo: (data) => apiRequest('/api/patients/medical-info', { method: 'PUT', body: JSON.stringify(data) }),
};
