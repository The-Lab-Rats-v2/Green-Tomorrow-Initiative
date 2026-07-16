// =============================================
// LOGIN PAGE SCRIPT
// =============================================
// This script handles the login form submission

import { loginUser } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  if (!form) {
    console.warn('Login form not found');
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const statusEl = document.getElementById('loginStatus');
    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');

    if (!emailInput || !passwordInput) {
      console.error('Form inputs not found');
      return;
    }

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      if (statusEl) {
        statusEl.textContent = 'Please enter email and password';
        statusEl.className = 'form-status is-error';
      }
      return;
    }

    try {
      if (statusEl) {
        statusEl.textContent = 'Logging in...';
        statusEl.className = 'form-status is-success';
      }

      await loginUser(email, password);

      // Redirect after successful login
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 500);
    } catch (error) {
      if (statusEl) {
        statusEl.textContent = error.message || 'Login failed. Please try again.';
        statusEl.className = 'form-status is-error';
      }
      console.error('Login error:', error);
    }
  });
});
