// =============================================
// ADMIN MODULE
// =============================================

import { isAdmin } from './auth.js';
import { 
  getAllChallengeEntries,
  updateChallengeStatus,
  getEvents,
  deleteEvent,
  createEvent,
  updateEvent,
  getNews,
  createNewsArticle,
  deleteNewsArticle,
  getDonations,
  getVolunteerRegistrations,
  deleteProposalFile
} from './api.js';

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[character]);

const formatDate = (date) => new Date(date).toLocaleDateString('en-ZA', {
  day: 'numeric', month: 'short', year: 'numeric'
});

function challengeActions(entry) {
  if (entry.status !== 'pending') return '<span class="challenge-complete">Decision recorded</span>';
  return `<button onclick="approveChallenge('${entry.id}')" class="btn btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.85rem;">Approve</button>
    <button onclick="rejectChallenge('${entry.id}')" class="btn btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.85rem; margin-left: 0.5rem;">Reject</button>`;
}

function showAdminNotice(message, type = 'success') {
  const content = document.getElementById('admin-content');
  if (!content) return;
  const existing = content.querySelector('.admin-notice');
  if (existing) existing.remove();
  const notice = document.createElement('div');
  notice.className = `admin-notice ${type === 'error' ? 'is-error' : ''}`;
  notice.setAttribute('role', 'status');
  notice.textContent = message;
  content.prepend(notice);
}

// =============================================
// ADMIN AUTHORIZATION CHECK
// =============================================

export async function requireAdmin() {
  const admin = await isAdmin();
  if (!admin) {
    window.location.href = 'index.html';
    return false;
  }
  return true;
}

// =============================================
// INITIALIZE ADMIN DASHBOARD
// =============================================

export async function initializeAdminDashboard() {
  try {
    // Check admin authorization
    const admin = await requireAdmin();
    if (!admin) return;

    // Load statistics
    await loadStatistics();

    // Setup tabs
    setupTabNavigation();

    // Load initial tab content
    await loadTabContent('statistics');
  } catch (error) {
    console.error('Admin dashboard initialization error:', error);
    showAdminError('Failed to load admin dashboard');
  }
}

// =============================================
// LOAD STATISTICS
// =============================================

async function loadStatistics() {
  try {
    const [events, challenges, donations, registrations] = await Promise.all([
      getEvents(),
      getAllChallengeEntries(),
      getDonations(),
      getVolunteerRegistrations()
    ]);

    const statistics = {
      events: events.length,
      users: new Set(challenges.map(c => c.user_id)).size,
      challenges: challenges.length,
      volunteers: registrations.length,
      donations: donations.length,
      donationAmount: donations.reduce((sum, d) => sum + parseFloat(d.amount), 0)
    };
    updateStatCard('total-events', statistics.events);
    updateStatCard('total-users', new Set(challenges.map(c => c.user_id)).size);
    updateStatCard('total-challenges', challenges.length);
    updateStatCard('total-volunteers', registrations.length);
    updateStatCard('total-donations', donations.length);
    updateStatCard('total-donation-amount', `$${donations.reduce((sum, d) => sum + parseFloat(d.amount), 0).toFixed(2)}`);
    return statistics;
  } catch (error) {
    console.error('Error loading statistics:', error);
  }
}

function updateStatCard(id, value) {
  const card = document.getElementById(id);
  if (card) {
    const numEl = card.querySelector('.stat-num');
    if (numEl) numEl.textContent = value;
  }
}

// =============================================
// TAB NAVIGATION
// =============================================

function setupTabNavigation() {
  const tabButtons = document.querySelectorAll('[data-tab]');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', async (e) => {
      e.preventDefault();
      const tabName = button.dataset.tab;
      
      // Update active button
      tabButtons.forEach(b => b.classList.remove('active'));
      button.classList.add('active');
      
      // Load tab content
      await loadTabContent(tabName);
    });
  });
}

// =============================================
// LOAD TAB CONTENT
// =============================================

async function loadTabContent(tabName) {
  const contentArea = document.getElementById('admin-content');
  if (!contentArea) return;

  try {
    switch (tabName) {
      case 'statistics':
        contentArea.innerHTML = '<p class="admin-loading">Loading your impact snapshot...</p>';
        const stats = await loadStatistics();
        contentArea.innerHTML = `<div class="admin-panel-heading"><div><span class="eyebrow">At a glance</span><h2>Impact snapshot</h2><p>A live view of activity across Green Tomorrow.</p></div></div>
          <div class="admin-stat-grid">
            <article><span>Scheduled events</span><strong>${stats.events}</strong></article>
            <article><span>Event sign-ups</span><strong>${stats.volunteers}</strong></article>
            <article><span>Challenge entries</span><strong>${stats.challenges}</strong></article>
            <article><span>Donations received</span><strong>${stats.donations}</strong><small>$${stats.donationAmount.toFixed(2)} total</small></article>
          </div>`;
        break;

      case 'challenges':
        await loadChallengesTab(contentArea);
        break;

      case 'events':
        await loadEventsTab(contentArea);
        break;

      case 'donations':
        await loadDonationsTab(contentArea);
        break;

      case 'volunteers':
        await loadVolunteersTab(contentArea);
        break;

      case 'news':
        await loadNewsTab(contentArea);
        break;

      default:
        contentArea.innerHTML = '<p>Tab not found</p>';
    }
  } catch (error) {
    console.error(`Error loading ${tabName} tab:`, error);
    contentArea.innerHTML = `<p class="form-status is-error">Error loading tab</p>`;
  }
}

// =============================================
// CHALLENGES TAB
// =============================================

async function loadChallengesTab(contentArea) {
  const entries = await getAllChallengeEntries();

  let html = `
    <h3>Challenge Entries</h3>
    <div style="margin-bottom: 1rem; display: flex; gap: 0.5rem;">
      <select id="challenge-filter" style="padding: 0.5rem; border-radius: 8px; border: 1px solid var(--line);">
        <option value="">All Status</option>
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
      </select>
    </div>
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="border-bottom: 2px solid var(--line);">
          <th style="padding: 1rem; text-align: left;">Team</th>
          <th style="padding: 1rem; text-align: left;">University</th>
          <th style="padding: 1rem; text-align: left;">Project</th>
          <th style="padding: 1rem; text-align: left;">Status</th>
          <th style="padding: 1rem; text-align: left;">Actions</th>
        </tr>
      </thead>
      <tbody>
  `;

  entries.forEach(entry => {
    html += `
      <tr style="border-bottom: 1px solid var(--line);">
        <td style="padding: 1rem;">${entry.team_name}</td>
        <td style="padding: 1rem;">${entry.university}</td>
        <td style="padding: 1rem;">${entry.project_title}</td>
        <td style="padding: 1rem;">
          <span class="status-pill status-${entry.status}">${entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}</span>
        </td>
        <td style="padding: 1rem;">
          ${challengeActions(entry)}
          ${entry.proposal_file_url ? `<a href="${entry.proposal_file_url}" target="_blank" class="btn btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.85rem; margin-left: 0.5rem;">View</a>` : ''}
        </td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  contentArea.innerHTML = html;

  // Setup filter
  const filterSelect = document.getElementById('challenge-filter');
  if (filterSelect) {
    filterSelect.addEventListener('change', async () => {
      const filtered = filterSelect.value ? 
        entries.filter(e => e.status === filterSelect.value) : 
        entries;
      
      // Reload with filtered data
      const tbody = contentArea.querySelector('tbody');
      if (tbody) {
        tbody.innerHTML = filtered.map(entry => `
          <tr style="border-bottom: 1px solid var(--line);">
            <td style="padding: 1rem;">${entry.team_name}</td>
            <td style="padding: 1rem;">${entry.university}</td>
            <td style="padding: 1rem;">${entry.project_title}</td>
            <td style="padding: 1rem;">
              <span class="status-pill status-${entry.status}">${entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}</span>
            </td>
            <td style="padding: 1rem;">
              ${challengeActions(entry)}
              ${entry.proposal_file_url ? `<a href="${entry.proposal_file_url}" target="_blank" class="btn btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.85rem; margin-left: 0.5rem;">View</a>` : ''}
            </td>
          </tr>
        `).join('');
      }
    });
  }
}

// =============================================
// EVENTS TAB
// =============================================

async function loadEventsTab(contentArea) {
  const [events, registrations] = await Promise.all([getEvents(), getVolunteerRegistrations()]);
  const registrationsByEvent = registrations.filter((item) => item.status === 'joined').reduce((groups, item) => {
    (groups[item.event_id] ||= []).push(item);
    return groups;
  }, {});
  const totalJoined = Object.values(registrationsByEvent).reduce((total, group) => total + group.length, 0);
  const totalCapacity = events.reduce((total, event) => total + Number(event.available_spots || 0), 0);
  const eventCards = events.map((event) => {
    const attendees = registrationsByEvent[event.id] || [];
    const capacity = Number(event.available_spots || 0);
    const percentage = capacity ? Math.min(100, Math.round((attendees.length / capacity) * 100)) : 0;
    const remaining = Math.max(0, capacity - attendees.length);
    const status = attendees.length >= capacity ? 'Full' : remaining <= 3 ? 'Almost full' : 'Open';
    const attendeesHtml = attendees.length
      ? attendees.map((item) => `<li><span class="attendee-avatar">${escapeHtml((item.user?.full_name || '?').trim().charAt(0).toUpperCase())}</span><span>${escapeHtml(item.user?.full_name || 'Unnamed member')}</span></li>`).join('')
      : '<li class="no-attendees">No registrations yet.</li>';
    return `<article class="event-admin-card">
      <div class="event-admin-card-top"><div><span class="event-status ${status === 'Full' ? 'is-full' : status === 'Almost full' ? 'is-nearly-full' : ''}">${status}</span><h3>${escapeHtml(event.title)}</h3><p class="event-meta">${formatDate(event.date)} <span>•</span> ${escapeHtml(event.location)}</p></div><button onclick="deleteEventClick('${event.id}')" class="icon-action" aria-label="Delete ${escapeHtml(event.title)}" title="Delete event">×</button></div>
      <div class="capacity-block"><div class="capacity-label"><strong>${attendees.length} <span>of ${capacity}</span></strong><span>${remaining} ${remaining === 1 ? 'spot' : 'spots'} left</span></div><div class="capacity-track" aria-label="${attendees.length} of ${capacity} spots filled"><span style="width: ${percentage}%"></span></div></div>
      <details class="attendee-details" ${attendees.length ? 'open' : ''}><summary><span>Attendees</span><strong>${attendees.length}</strong></summary><ul>${attendeesHtml}</ul></details>
    </article>`;
  }).join('');

  contentArea.innerHTML = `<div class="admin-panel-heading"><div><span class="eyebrow">Event management</span><h2>Events & registrations</h2><p>See who has joined each event and keep capacity in view.</p></div><button onclick="showAddEventForm()" class="btn">+ Add event</button></div>
    <div class="event-overview"><div><span>Scheduled events</span><strong>${events.length}</strong></div><div><span>People signed up</span><strong>${totalJoined}</strong></div><div><span>Total capacity</span><strong>${totalCapacity}</strong></div></div>
    <div class="event-admin-grid">${eventCards || '<p class="admin-empty">No events have been created yet.</p>'}</div>
    <div id="event-form" class="admin-form-card" hidden><h3>Add a new event</h3><form id="addEventForm"><div class="form-group"><label>Title</label><input type="text" id="event-title" required></div><div class="form-group"><label>Description</label><textarea id="event-description" required></textarea></div><div class="form-group"><label>Location</label><input type="text" id="event-location" required></div><div class="form-group"><label>Date</label><input type="datetime-local" id="event-date" required></div><div class="form-group"><label>Available spots</label><input type="number" id="event-spots" min="1" required></div><div class="form-actions"><button type="submit" class="btn">Create event</button><button type="button" onclick="cancelEventForm()" class="btn btn-secondary">Cancel</button></div></form></div>`;

  document.getElementById('addEventForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submit = event.submitter;
    submit.disabled = true;
    try {
      await createEvent({ title: document.getElementById('event-title').value.trim(), description: document.getElementById('event-description').value.trim(), location: document.getElementById('event-location').value.trim(), date: new Date(document.getElementById('event-date').value).toISOString(), available_spots: Number(document.getElementById('event-spots').value) });
      await loadTabContent('events');
    } catch (error) {
      alert(`Unable to create event: ${error.message}`);
      submit.disabled = false;
    }
  });
}

// =============================================
// DONATIONS TAB
// =============================================

async function loadDonationsTab(contentArea) {
  const donations = await getDonations();
  const totalDonations = donations.reduce((sum, d) => sum + parseFloat(d.amount), 0);

  const rows = donations.map((donation) => {
    const donationDate = new Date(donation.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
    const ref = donation.payment_reference || '';
    const method = ref.includes('paypal') ? 'PayPal' : ref.includes('card') ? 'Card' : '—';
    return `<tr data-search="${ref.toLowerCase()}">
      <td>${donationDate}</td>
      <td class="col-amount">R${parseFloat(donation.amount).toFixed(2)}</td>
      <td><span class="status-pill status-${donation.status}">${donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}</span></td>
      <td class="col-muted">${method}</td>
      <td class="col-muted">${ref || 'N/A'}</td>
    </tr>`;
  }).join('');

  contentArea.innerHTML = `<div class="admin-panel-heading"><div><span class="eyebrow">Fundraising</span><h2>Donations</h2><p>Track every contribution and its payment method.</p></div></div>
    <div class="admin-toolbar">
      <div class="admin-search"><input type="search" id="donationSearch" placeholder="Search by reference…" aria-label="Search donations"></div>
    </div>
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead><tr><th>Date</th><th>Amount</th><th>Status</th><th>Method</th><th>Reference</th></tr></thead>
        <tbody id="donationBody">${rows || '<tr class="admin-empty-row"><td colspan="5">No donations yet.</td></tr>'}</tbody>
      </table>
    </div>
    <p class="admin-total"><small>Total raised</small> R${totalDonations.toFixed(2)}</p>`;

  const search = document.getElementById('donationSearch');
  if (search) {
    search.addEventListener('input', () => {
      const term = search.value.trim().toLowerCase();
      contentArea.querySelectorAll('#donationBody tr').forEach((row) => {
        row.style.display = !term || row.dataset.search.includes(term) ? '' : 'none';
      });
    });
  }
}

// =============================================
// VOLUNTEERS TAB
// =============================================

async function loadVolunteersTab(contentArea) {
  const registrations = await getVolunteerRegistrations();

  const rows = registrations.map((reg) => {
    const eventDate = new Date(reg.event.date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
    const volunteerName = reg.user?.full_name || 'Unknown';
    return `<tr data-search="${volunteerName.toLowerCase()} ${reg.event.title.toLowerCase()}">
      <td>${volunteerName}</td>
      <td>${reg.event.title}</td>
      <td class="col-muted">${eventDate}</td>
      <td><span class="status-pill status-${reg.status}">${reg.status.charAt(0).toUpperCase() + reg.status.slice(1)}</span></td>
    </tr>`;
  }).join('');

  contentArea.innerHTML = `<div class="admin-panel-heading"><div><span class="eyebrow">People</span><h2>Volunteer Registrations</h2><p>Everyone signed up for your events.</p></div></div>
    <div class="admin-toolbar">
      <div class="admin-search"><input type="search" id="volunteerSearch" placeholder="Search by name or event…" aria-label="Search volunteers"></div>
    </div>
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead><tr><th>Volunteer</th><th>Event</th><th>Date</th><th>Status</th></tr></thead>
        <tbody id="volunteerBody">${rows || '<tr class="admin-empty-row"><td colspan="4">No volunteer registrations yet.</td></tr>'}</tbody>
      </table>
    </div>`;

  const search = document.getElementById('volunteerSearch');
  if (search) {
    search.addEventListener('input', () => {
      const term = search.value.trim().toLowerCase();
      contentArea.querySelectorAll('#volunteerBody tr').forEach((row) => {
        row.style.display = !term || row.dataset.search.includes(term) ? '' : 'none';
      });
    });
  }
}

// =============================================
// NEWS TAB
// =============================================

async function loadNewsTab(contentArea) {
  const newsArticles = await getNews(50);

  const cards = newsArticles.map((article) => {
    const publishDate = new Date(article.published_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
    const snippet = (article.content || '').substring(0, 140);
    return `<article class="admin-news-card" data-search="${article.title.toLowerCase()}">
      <h4>${article.title}</h4>
      <span class="news-meta">Published ${publishDate}</span>
      <p class="news-snip">${snippet}${article.content && article.content.length > 140 ? '…' : ''}</p>
      <div class="news-actions"><button onclick="deleteNewsClick('${article.id}')" class="btn btn-secondary" style="padding:.5rem 1rem;font-size:.85rem;">Delete</button></div>
    </article>`;
  }).join('');

  contentArea.innerHTML = `<div class="admin-panel-heading"><div><span class="eyebrow">Content</span><h2>News</h2><p>Publish updates and stories from the field.</p></div>
      <button onclick="showAddNewsForm()" class="btn">+ Add News</button></div>
    <div class="admin-toolbar">
      <div class="admin-search"><input type="search" id="newsSearch" placeholder="Search articles…" aria-label="Search news"></div>
    </div>
    <div id="news-articles" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;">${cards || '<p class="admin-empty">No articles yet. Click “Add News” to publish your first story.</p>'}</div>
    <div id="news-form" class="admin-form-card" hidden>
      <h3>Add News Article</h3>
      <form id="addNewsForm">
        <div class="form-group">
          <label>Title</label>
          <input type="text" id="news-title" required>
        </div>
        <div class="form-group">
          <label>Content</label>
          <textarea id="news-content" required style="min-height: 200px;"></textarea>
        </div>
        <div class="form-group">
          <label>Image URL (optional)</label>
          <input type="url" id="news-image">
        </div>
        <button type="submit" class="btn">Publish</button>
        <button type="button" onclick="cancelNewsForm()" class="btn btn-secondary" style="margin-left: 0.5rem;">Cancel</button>
      </form>
    </div>`;

  const search = document.getElementById('newsSearch');
  if (search) {
    search.addEventListener('input', () => {
      const term = search.value.trim().toLowerCase();
      contentArea.querySelectorAll('#news-articles .admin-news-card').forEach((card) => {
        card.style.display = !term || card.dataset.search.includes(term) ? '' : 'none';
      });
    });
  }
}

// =============================================
// HELPER FUNCTIONS
// =============================================

function showAdminError(message) {
  const content = document.getElementById('admin-content');
  if (content) {
    content.innerHTML = `<div class="form-status is-error">${message}</div>`;
  }
}

// Make these functions globally available
window.approveChallenge = async (entryId) => {
  try {
    await updateChallengeStatus(entryId, 'approved');
    const admin = await requireAdmin();
    if (admin) {
      await loadTabContent('challenges');
      showAdminNotice('Challenge entry approved. The team has been updated.');
    }
  } catch (error) {
    showAdminNotice(`Unable to approve this entry: ${error.message}`, 'error');
  }
};

window.rejectChallenge = async (entryId) => {
  try {
    await updateChallengeStatus(entryId, 'rejected');
    const admin = await requireAdmin();
    if (admin) {
      await loadTabContent('challenges');
      showAdminNotice('Challenge entry rejected. The team has been updated.');
    }
  } catch (error) {
    showAdminNotice(`Unable to reject this entry: ${error.message}`, 'error');
  }
};

window.deleteEventClick = async (eventId) => {
  if (confirm('Are you sure you want to delete this event?')) {
    try {
      await deleteEvent(eventId);
      alert('Event deleted');
      const admin = await requireAdmin();
      if (admin) await loadTabContent('events');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  }
};

window.showAddEventForm = () => {
  const form = document.getElementById('event-form');
  if (form) {
    form.hidden = false;
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

window.cancelEventForm = () => {
  const form = document.getElementById('event-form');
  if (form) form.hidden = true;
};

window.deleteNewsClick = async (articleId) => {
  if (confirm('Are you sure you want to delete this article?')) {
    try {
      await deleteNewsArticle(articleId);
      alert('Article deleted');
      const admin = await requireAdmin();
      if (admin) await loadTabContent('news');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  }
};

window.showAddNewsForm = () => {
  const form = document.getElementById('news-form');
  if (form) form.hidden = false;
  form?.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

window.cancelNewsForm = () => {
  const form = document.getElementById('news-form');
  if (form) form.hidden = true;
};
