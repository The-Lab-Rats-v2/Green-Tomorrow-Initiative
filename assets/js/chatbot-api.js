import { getCurrentUser } from './auth.js';
import { getAllChallengeEntries, getDonations, getEvents, getVolunteerRegistrations, getChallengeEntry } from './api.js';

const money = (value) => `$${Number(value || 0).toFixed(2)}`;
const date = (value) => new Intl.DateTimeFormat('en-ZA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

export async function getChatUser() { return getCurrentUser(); }

export async function getMemberAnswer(kind, user) {
  if (!user?.profile) return { response: 'Please sign in first so I can securely check your personal information.', actions: [{ label: 'Login', href: 'login.html' }] };
  const userId = user.profile.id;
  if (kind === 'challenge-status') {
    const entry = await getChallengeEntry(userId);
    return entry ? { response: `Your Green Challenge entry, “${entry.project_title}”, is currently ${entry.status}.`, actions: [{ label: 'View Green Challenge', href: 'competition.html' }] } : { response: 'You have not submitted a Green Challenge entry yet.', actions: [{ label: 'Enter the Challenge', href: 'competition.html' }] };
  }
  if (kind === 'donations') {
    const donations = await getDonations(userId);
    const completed = donations.filter((item) => item.status === 'completed');
    return { response: completed.length ? `You have made ${completed.length} completed donation${completed.length === 1 ? '' : 's'}, totalling ${money(completed.reduce((sum, item) => sum + Number(item.amount), 0))}.` : 'I could not find any completed donations on your account.', actions: [{ label: 'Donate', href: 'contact.html' }] };
  }
  const registrations = await getVolunteerRegistrations(userId);
  const joined = registrations.filter((item) => item.status === 'joined');
  if (kind === 'next-event') {
    const upcoming = joined.filter((item) => item.event?.date && new Date(item.event.date) >= new Date()).sort((a, b) => new Date(a.event.date) - new Date(b.event.date))[0];
    return upcoming ? { response: `Your next event is ${upcoming.event.title} on ${date(upcoming.event.date)} at ${upcoming.event.location}.`, actions: [{ label: 'View Programmes', href: 'programmes.html' }] } : { response: 'You do not have an upcoming event registration yet.', actions: [{ label: 'Find an Event', href: 'programmes.html' }] };
  }
  return { response: joined.length ? `You have joined ${joined.length} event${joined.length === 1 ? '' : 's'}: ${joined.slice(0, 3).map((item) => item.event?.title || 'an event').join(', ')}.` : 'You have not joined any events yet.', actions: [{ label: 'Find Events', href: 'programmes.html' }] };
}

export async function getAdminAnswer(kind) {
  if (kind === 'volunteers') { const rows = await getVolunteerRegistrations(); return { response: `There are ${rows.filter((row) => row.status === 'joined').length} active volunteer event registration${rows.length === 1 ? '' : 's'}.` }; }
  if (kind === 'donations') { const rows = await getDonations(); return { response: `Donations total ${money(rows.filter((row) => row.status === 'completed').reduce((sum, row) => sum + Number(row.amount), 0))} across ${rows.length} record${rows.length === 1 ? '' : 's'}.` }; }
  if (kind === 'challenges') { const rows = await getAllChallengeEntries({ status: 'pending' }); return { response: `There are ${rows.length} pending Green Challenge entr${rows.length === 1 ? 'y' : 'ies'}.` }; }
  const events = await getEvents({ upcoming: true }); return { response: `There are ${events.length} upcoming event${events.length === 1 ? '' : 's'}.`, actions: [{ label: 'Open Admin Dashboard', href: 'admin.html' }] };
}
