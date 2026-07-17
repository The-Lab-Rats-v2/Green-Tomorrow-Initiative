// =============================================
// NAVBAR INITIALIZATION SCRIPT
// =============================================
// This script updates the navbar based on authentication state

import { getCurrentUser, logoutUser } from './auth.js';
import { openDonationModal } from './donation-modal.js';

function getInitials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'ME';
}

document.addEventListener('DOMContentLoaded', async () => {
  const navbarAuth = document.querySelector('.navbar-auth');
  
  if (!navbarAuth) {
    console.warn('Navbar auth section not found');
    return;
  }

  try {
    const user = await getCurrentUser();

    if (user) {
      const fullName = user.profile?.full_name || user.user_metadata?.full_name || 'My profile';
      navbarAuth.innerHTML = `
        <a href="dashboard.html" class="profile-link" aria-label="My profile" title="${fullName}">
          <span class="profile-avatar" aria-hidden="true">${getInitials(fullName)}</span>
        </a>
        ${user.profile?.role === 'admin' ? '<span class="nav-auth-divider" aria-hidden="true"></span><a href="admin.html" class="navbar-link admin-link">Admin</a>' : ''}
        <a href="#" class="donate-btn" id="donateBtn">Donate</a>
        <a href="#" class="navbar-link logout-link" id="logoutBtn">Log Out</a>
      `;

      const logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
          e.preventDefault();
          try {
            await logoutUser();
            window.location.href = 'index.html';
          } catch (error) {
            console.error('Logout error:', error);
            window.location.href = 'index.html';
          }
        });
      }
      document.getElementById('donateBtn').addEventListener('click', (event) => {
        event.preventDefault();
        openDonationModal(true);
      });
    } else {
      navbarAuth.innerHTML = `
        <a href="login.html" class="navbar-link">Login</a>
        <a href="#" class="donate-btn" id="donateBtn">Donate</a>
      `;
      document.getElementById('donateBtn').addEventListener('click', (event) => {
        event.preventDefault();
        openDonationModal(false);
      });
    }
  } catch (error) {
    console.error('Error checking authentication:', error);
    navbarAuth.innerHTML = `
      <a href="login.html" class="navbar-link">Login</a>
      <a href="#" class="donate-btn" id="donateBtn">Donate</a>
    `;
    document.getElementById('donateBtn').addEventListener('click', (event) => {
      event.preventDefault();
      openDonationModal(false);
    });
  }
});
