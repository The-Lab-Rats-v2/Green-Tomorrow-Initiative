export const QUICK_ACTIONS = [['Volunteer', 'volunteer'], ['Donate', 'donation'], ['Programmes', 'programmes'], ['Green Challenge', 'challenge'], ['News', 'news'], ['Contact', 'contact']];
const actions = (items) => items.map(([label, href]) => ({ label, href }));
export const INTENTS = [
  { name: 'greeting', keywords: ['hello', 'hi', 'hey', 'good morning', 'good afternoon'], response: "Hello! I'm GreenBot. How can I help you make a greener tomorrow?" },
  { name: 'about', keywords: ['about', 'mission', 'vision', 'who are you', 'what is green tomorrow'], response: 'Green Tomorrow Initiative builds greener communities through sustainability, education and environmental action.', actions: actions([['About Green Tomorrow', 'about.html']]) },
  { name: 'programmes', keywords: ['programme', 'program', 'recycling', 'tree planting', 'renewable energy', 'sustainability'], response: 'Our programmes turn environmental learning into practical local action, including recycling, tree planting and renewable-energy awareness.', actions: actions([['View Programmes', 'programmes.html']]) },
  { name: 'volunteer', keywords: ['volunteer', 'help out', 'join an event', 'community event'], response: 'You can volunteer by joining one of our community events. Visit the Programmes page to see available opportunities.', actions: actions([['View Programmes', 'programmes.html']]) },
  { name: 'events', keywords: ['event', 'next one', 'next event', 'upcoming', 'when is'], response: 'You can find upcoming community activities and sign-up details on our Programmes & Events page.', actions: actions([['View Events', 'programmes.html']]) },
  { name: 'challenge', keywords: ['green challenge', 'challenge', 'competition', 'proposal', 'team entry'], response: "The Green Challenge is where teams submit ideas for a more sustainable future. You'll need an account to submit an entry.", actions: actions([['Green Challenge', 'competition.html'], ['Register', 'register.html']]) },
  { name: 'donation', keywords: ['donate', 'donation', 'give', 'contribute', 'support us'], response: 'Thank you for supporting Green Tomorrow. You can use the donation option on our Contact page to make a contribution.', actions: actions([['Donate', 'contact.html']]) },
  { name: 'contact', keywords: ['contact', 'email', 'phone', 'address', 'location', 'reach you'], response: "You can contact Green Tomorrow at info@greentomorrow.org. We're based in Cape Town, South Africa.", actions: actions([['Contact Us', 'contact.html']]) },
  { name: 'news', keywords: ['news', 'update', 'article', 'latest'], response: 'Browse our News page for the latest stories and updates from Green Tomorrow.', actions: actions([['Read News', 'news.html']]) },
  { name: 'register', keywords: ['register', 'sign up', 'signup', 'create account', 'join green tomorrow'], response: 'Create a free member account to join events, submit a Green Challenge entry, and view your dashboard.', actions: actions([['Register', 'register.html']]) },
  { name: 'login', keywords: ['login', 'log in', 'sign in', 'password'], response: 'You can sign in to access your Green Tomorrow dashboard.', actions: actions([['Login', 'login.html']]) },
  { name: 'dashboard', keywords: ['dashboard', 'my account', 'my profile'], response: 'Your dashboard brings together your events, donations and Green Challenge entry.', actions: actions([['Open Dashboard', 'dashboard.html']]) }
];
const normalise = (text) => text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
export function matchIntent(message, context = '') {
  const currentQuery = normalise(message);
  const isFollowUp = currentQuery.split(' ').length <= 5 && /\b(it|that|there|one|them|more|next)\b/.test(currentQuery);
  const query = isFollowUp ? normalise(`${message} ${context}`) : currentQuery;
  let best = null;
  INTENTS.forEach((intent) => { const score = intent.keywords.reduce((total, keyword) => total + (query.includes(keyword) ? keyword.split(' ').length : 0), 0); if (!best || score > best.score) best = { ...intent, score }; });
  return best?.score > 0 ? best : null;
}
