import axios from 'axios';

// Create API client instance - dynamically determine API URL
export const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  
  // Use environment variable if set, otherwise determine dynamically
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Default to localhost for development
  if (hostname === 'localhost') {
    return 'http://localhost:3001/api';
  }
  
  // For other hostnames, use the same hostname with port 3001
  return `http://${hostname}:3001/api`;
};

const API_BASE_URL = getApiBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Create base44-compatible API interface
export const base44 = {
  entities: {
    MembershipData: {
      list: async (sort) => {
        const response = await apiClient.get('/membership', {
          params: { sort }
        });
        return response.data;
      },
      findByPk: async (id) => {
        const response = await apiClient.get(`/membership/${id}`);
        return response.data;
      },
      create: async (data) => {
        const response = await apiClient.post('/membership', data);
        return response.data;
      },
      update: async (id, data) => {
        const response = await apiClient.put(`/membership/${id}`, data);
        return response.data;
      },
      destroy: async (id) => {
        await apiClient.delete(`/membership/${id}`);
      }
    },
    CallData: {
      list: async (sort) => {
        const response = await apiClient.get('/calls', {
          params: { sort }
        });
        return response.data;
      },
      findByPk: async (id) => {
        const response = await apiClient.get(`/calls/${id}`);
        return response.data;
      },
      create: async (data) => {
        const response = await apiClient.post('/calls', data);
        return response.data;
      },
      update: async (id, data) => {
        const response = await apiClient.put(`/calls/${id}`, data);
        return response.data;
      },
      destroy: async (id) => {
        await apiClient.delete(`/calls/${id}`);
      }
    },
    HeadcountData: {
      list: async (sort) => {
        const response = await apiClient.get('/headcount', {
          params: { sort }
        });
        return response.data;
      },
      findByPk: async (id) => {
        const response = await apiClient.get(`/headcount/${id}`);
        return response.data;
      },
      create: async (data) => {
        const response = await apiClient.post('/headcount', data);
        return response.data;
      },
      update: async (id, data) => {
        const response = await apiClient.put(`/headcount/${id}`, data);
        return response.data;
      },
      destroy: async (id) => {
        await apiClient.delete(`/headcount/${id}`);
      }
    },
    ForecastScenario: {
      list: async (sort) => {
        const response = await apiClient.get('/forecast', {
          params: { sort }
        });
        return response.data;
      },
      findByPk: async (id) => {
        const response = await apiClient.get(`/forecast/${id}`);
        return response.data;
      },
      create: async (data) => {
        const response = await apiClient.post('/forecast', data);
        return response.data;
      },
      update: async (id, data) => {
        const response = await apiClient.put(`/forecast/${id}`, data);
        return response.data;
      },
      destroy: async (id) => {
        await apiClient.delete(`/forecast/${id}`);
      }
    }
  },
  auth: {
    login: async (email, password) => {
      const response = await apiClient.post('/auth/login', { email, password });
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
      }
      return response.data;
    },
    register: async (userData) => {
      const response = await apiClient.post('/auth/register', userData);
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
      }
      return response.data;
    },
    logout: async () => {
      await apiClient.post('/auth/logout');
      localStorage.removeItem('authToken');
    },
    getProfile: async () => {
      const response = await apiClient.get('/auth/profile');
      return response.data;
    },
    updateProfile: async (userData) => {
      const response = await apiClient.put('/auth/profile', userData);
      return response.data;
    }
  },
  integrations: {
    Core: {
      InvokeLLM: async (prompt, options) => {
        const response = await apiClient.post('/integrations/llm/invoke', { prompt, options });
        return response.data;
      },
      SendEmail: async (to, subject, body, options) => {
        const response = await apiClient.post('/integrations/email/send', { to, subject, body, options });
        return response.data;
      },
      UploadFile: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post('/integrations/file/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
      },
      GenerateImage: async (prompt, options) => {
        const response = await apiClient.post('/integrations/image/generate', { prompt, options });
        return response.data;
      },
      ExtractDataFromUploadedFile: async (filePath) => {
        const response = await apiClient.post('/integrations/file/extract', { filePath });
        return response.data;
      }
    }
  }
};
