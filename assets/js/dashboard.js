// =============================================
// DASHBOARD MODULE
// =============================================
import { getCurrentUser, isAuthenticated } from './auth.js';
import { 
  getVolunteerRegistrations, 
  getChallengeEntry
} from './api.js';

// =============================================
// INITIALIZE DASHBOARD
// =============================================

export async function initializeDashboard() {
  try {
    // Check authentication
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      window.location.href = 'login.html';
      return;
    }

    // Load user data
    const user = await getCurrentUser();
    if (!user || !user.profile) {
      throw new Error('Failed to load user profile');
    }

    // Update member name
    updateMemberName(user.profile.full_name);

    // Load dashboard data
    await loadDashboardData(user.profile);
  } catch (error) {
    console.error('Dashboard initialization error:', error);
    showErrorMessage(error.message || 'Failed to load your profile. Please try again.');
  }
}

// =============================================
// UPDATE UI ELEMENTS
// =============================================

function updateMemberName(fullName) {
  const memberNameEl = document.getElementById('memberName');
  if (memberNameEl) {
    memberNameEl.textContent = fullName;
  }

  const profileInitialsEl = document.getElementById('profileInitials');
  if (profileInitialsEl) {
    profileInitialsEl.textContent = fullName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  }
}

function showErrorMessage(message) {
  const dashboard = document.querySelector('main');
  if (dashboard) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'form-status is-error';
    errorDiv.style.maxWidth = '760px';
    errorDiv.style.margin = '2rem auto';
    errorDiv.textContent = message;
    dashboard.insertBefore(errorDiv, dashboard.firstChild);
  }
}

// =============================================
// LOAD DASHBOARD DATA
// =============================================

async function loadDashboardData(userProfile) {
  try {
    // Load Green Challenge entry
    await loadChallengeEntry(userProfile.id);

    // Load volunteer events
    await loadVolunteerEvents(userProfile.id);

  } catch (error) {
    console.error('Error loading dashboard data:', error);
  }
}

// =============================================
// LOAD CHALLENGE ENTRY
// =============================================

async function loadChallengeEntry(userId) {
  try {
    const entry = await getChallengeEntry(userId);
    const formSection = document.querySelector('.dashboard-form-section .section-copy');

    if (!formSection) return;

    if (!entry) {
      formSection.innerHTML = `
        <span class="eyebrow">Green Challenge</span>
        <h2>Your team entry</h2>
        <div class="entry-status-card">
          <p>You haven't entered the Green Challenge yet.</p>
          <a href="competition.html" class="btn">Enter Now</a>
        </div>
      `;
      return;
    }

    const statusText = getStatusText(entry.status);
    const statusClass = `status-${entry.status}`;

    formSection.innerHTML = `
      <span class="eyebrow">Your Entry</span>
      <h2>You've entered the Green Challenge</h2>
      <div class="entry-status-card">
        <p><strong>${entry.team_name}</strong> &mdash; "${entry.project_title}"</p>
        <p>University: ${entry.university}</p>
        <p>Status: <span class="status-pill ${statusClass}">${statusText}</span></p>
        ${entry.proposal_file_url ? `<p><a href="${entry.proposal_file_url}" target="_blank" rel="noopener">View Proposal</a></p>` : ''}
      </div>
    `;
  } catch (error) {
    console.error('Error loading challenge entry:', error);
  }
}

function getStatusText(status) {
  const statusMap = {
    'pending': 'Under Review',
    'approved': 'Approved ✓',
    'rejected': 'Rejected'
  };
  return statusMap[status] || 'Unknown';
}

// =============================================
// LOAD VOLUNTEER EVENTS
// =============================================

async function loadVolunteerEvents(userId) {
  try {
    const registrations = await getVolunteerRegistrations(userId);
    const list = document.getElementById('myEventsList');
    const emptyMsg = document.getElementById('noEventsMessage');

    if (!list) return;

    // Clear list
    list.innerHTML = '';

    if (registrations.length === 0) {
      if (emptyMsg) emptyMsg.style.display = 'block';
      return;
    }

    if (emptyMsg) emptyMsg.style.display = 'none';

    registrations.forEach((registration) => {
      if (!registration.event) return;

      const event = registration.event;
      const eventDate = new Date(event.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

      const card = document.createElement('div');
      card.className = 'project-card';
      card.innerHTML = `
        <div class="project-card-body">
          <h3>${event.title}</h3>
          <p>${eventDate} &middot; ${event.location}</p>
        </div>
      `;
      list.appendChild(card);
    });
  } catch (error) {
    console.error('Error loading volunteer events:', error);
  }
}
