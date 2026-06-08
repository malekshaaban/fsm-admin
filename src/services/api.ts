import axios from 'axios';



const api = axios.create({
 // baseURL: 'http://localhost:8080/api/v1', // Update  port is different
  baseURL: 'https://fsm-backend-8bxb.onrender.com/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. The Request Interceptor (The "Exit Guard")
api.interceptors.request.use(
  (config) => {
    // Look in the browser's localStorage for a saved token
    const token = localStorage.getItem('fsm_admin_token');
    
    // If a token exists, attach it to the Authorization header
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
// 3. The Response Interceptor (The "Entry Guard")
api.interceptors.response.use(
  (response) => {
    // If the server responds with a success status (2xx), just pass the data through
    return response;
  },
  (error) => {
    // Check if the error is 401 Unauthorized
    if (error.response && error.response.status === 401) {
      
      // EXCEPTION: If the 401 came from the login form, just pass the error 
      // down to the component so it can show the red text, do NOT reload the page.
      if (error.config && error.config.url && error.config.url.includes('/auth/login')) {
          return Promise.reject(error);
      }

      // If it wasn't the login form, it means a real logged-in user's token expired.
      console.error('Session expired or unauthorized. Redirecting to login...');
      localStorage.removeItem('fsm_admin_token');
      window.location.href = '/';
    }
    
    return Promise.reject(error);
  }
);

export default api;