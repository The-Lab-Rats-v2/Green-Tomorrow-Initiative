import { registerUser } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registerForm');
  if (!form) {
    console.warn('Register form not found');
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const statusEl = document.getElementById('registerStatus');
    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    if (!fullNameInput || !emailInput || !passwordInput || !confirmPasswordInput) {
      console.error('Form inputs not found');
      return;
    }

    const fullName = fullNameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // Validation
    if (!fullName || !email || !password) {
      if (statusEl) {
        statusEl.textContent = 'Please fill in all fields';
        statusEl.className = 'form-status is-error';
      }
      return;
    }

    if (password !== confirmPassword) {
      if (statusEl) {
        statusEl.textContent = 'Passwords do not match';
        statusEl.className = 'form-status is-error';
      }
      return;
    }

    if (password.length < 8) {
      if (statusEl) {
        statusEl.textContent = 'Password must be at least 8 characters';
        statusEl.className = 'form-status is-error';
      }
      return;
    }

    try {
      if (statusEl) {
        statusEl.textContent = 'Creating your account...';
        statusEl.className = 'form-status is-success';
      }

      const { session } = await registerUser(fullName, email, password);

      if (session) {
        window.location.href = 'dashboard.html';
      } else if (statusEl) {
        statusEl.textContent = 'Account created. Please check your email to confirm your account before logging in.';
        statusEl.className = 'form-status is-success';
        form.reset();
      }
    } catch (error) {
      if (statusEl) {
        statusEl.textContent = error.message || 'Registration failed. Please try again.';
        statusEl.className = 'form-status is-error';
      }
      console.error('Registration error:', error);
    }
  });
});
