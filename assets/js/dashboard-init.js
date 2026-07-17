// =============================================
// DASHBOARD INITIALIZATION SCRIPT
// =============================================
// This script initializes the dashboard on page load

import { initializeDashboard } from './dashboard.js';

document.addEventListener('DOMContentLoaded', () => {
  try {
    // Initialize the authenticated profile page.
    initializeDashboard();
  } catch (error) {
    console.error('Dashboard initialization error:', error);
  }
});
