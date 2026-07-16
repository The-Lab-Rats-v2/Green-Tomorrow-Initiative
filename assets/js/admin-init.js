import { initializeAdminDashboard } from './admin.js';

document.addEventListener('DOMContentLoaded', () => {
  try {
    initializeAdminDashboard();
  } catch (error) {
    console.error('Admin dashboard initialization error:', error);
  }
});
