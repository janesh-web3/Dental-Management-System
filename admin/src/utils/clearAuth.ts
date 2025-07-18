// Utility to clear all authentication data
export const clearAuthData = () => {
  // Clear session storage
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('doctorToken');
  sessionStorage.removeItem('patientToken');
  sessionStorage.removeItem('user');
  sessionStorage.removeItem('admin');
  sessionStorage.removeItem('doctor');
  sessionStorage.removeItem('patient');
  
  // Clear local storage
  localStorage.removeItem('token');
  localStorage.removeItem('doctorToken');
  localStorage.removeItem('patientToken');
  localStorage.removeItem('user');
  localStorage.removeItem('admin');
  localStorage.removeItem('doctor');
  localStorage.removeItem('patient');
  
  // Clear all storage
  sessionStorage.clear();
  localStorage.clear();
  
  console.log('All authentication data cleared');
};

// Function to check if user is truly authenticated
export const isAuthenticated = () => {
  const token = sessionStorage.getItem('token');
  if (!token) {
    return false;
  }
  
  try {
    // Basic token validation (check if it's not expired)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Date.now() / 1000;
    return payload.exp > now;
  } catch (error) {
    console.error('Token validation failed:', error);
    return false;
  }
};

// Function to redirect to login if not authenticated
export const redirectToLogin = () => {
  clearAuthData();
  window.location.href = '/auth/signin';
};