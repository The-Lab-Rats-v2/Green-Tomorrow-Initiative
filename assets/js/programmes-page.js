import { getEvents, getEventParticipantCount, getVolunteerRegistrations, joinEvent } from './api.js';
import { getCurrentUser } from './auth.js';

const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
})[character]);

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long' });
}

async function renderEvents() {
  const list = document.getElementById('eventsList');
  if (!list) return;

  const [events, user] = await Promise.all([getEvents({ upcoming: true }), getCurrentUser()]);
  const registrations = user?.profile ? await getVolunteerRegistrations(user.profile.id) : [];
  const joinedIds = new Set(registrations.filter((item) => item.status === 'joined').map((item) => item.event_id));

  if (!events.length) {
    list.innerHTML = '<p class="events-empty">No upcoming events are scheduled yet. Please check back soon.</p>';
    return;
  }

  const cards = await Promise.all(events.map(async (event) => {
    // The event itself is public. A missing/old attendee-count RPC must not
    // prevent people from seeing or joining public events.
    let participantCount = 0;
    try {
      participantCount = await getEventParticipantCount(event.id);
    } catch (error) {
      console.warn('Could not load attendee count for event:', event.id, error);
    }
    const joined = joinedIds.has(event.id);
    const spacesLeft = Math.max(0, event.available_spots - participantCount);
    return `
      <article class="project-card event-card" data-event-id="${event.id}">
        <div class="project-card-body">
          <span class="programme-tag">Community event</span>
          <h3>${escapeHtml(event.title)}</h3>
          <p>${formatDate(event.date)} &middot; ${escapeHtml(event.location)} &middot; ${spacesLeft} spots left</p>
          <p class="event-participants"><strong>${participantCount}</strong> ${participantCount === 1 ? 'person has' : 'people have'} joined this event.</p>
          <button class="btn join-event-btn" ${joined || spacesLeft === 0 ? 'disabled' : ''}>
            ${joined ? 'Joined' : spacesLeft === 0 ? 'Event Full' : 'Join Event'}
          </button>
        </div>
      </article>`;
  }));

  list.innerHTML = cards.join('');
  list.querySelectorAll('.join-event-btn:not([disabled])').forEach((button) => {
    button.addEventListener('click', async () => {
      if (!user?.profile) {
        window.location.href = 'login.html';
        return;
      }
      button.disabled = true;
      button.textContent = 'Joining...';
      try {
        await joinEvent(button.closest('[data-event-id]').dataset.eventId);
        await renderEvents();
      } catch (error) {
        button.disabled = false;
        button.textContent = 'Join Event';
        alert(error.message || 'Unable to join this event.');
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderEvents().catch((error) => {
    console.error('Unable to load events:', error);
    const list = document.getElementById('eventsList');
    if (list) list.innerHTML = '<p class="events-empty">Events are unavailable right now. Please try again shortly.</p>';
  });
});
