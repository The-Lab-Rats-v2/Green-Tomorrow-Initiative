import { createChatbotUI } from './chatbot-ui.js';
import { QUICK_ACTIONS, matchIntent } from './chatbot-intents.js';
import { getAdminAnswer, getChatUser, getMemberAnswer } from './chatbot-api.js';

const memberKinds = {
  'challenge-status': ['challenge status', 'my challenge', 'entry status'],
  donations: ['my donation', 'how much have i donated', 'donation history'],
  'next-event': ['next event', 'when is my next'],
  events: ['my events', 'volunteer history', 'joined any events']
};

const adminKinds = {
  challenges: ['pending challenge', 'pending approval', 'approved challenge'],
  volunteers: ['how many volunteers', 'volunteers'],
  donations: ['total donations', 'donations'],
  events: ['upcoming events', 'admin events', 'add event', 'open admin dashboard']
};

let knowledgePromise;

const includesAny = (text, phrases) => phrases.some((phrase) => text.includes(phrase));
const actions = (items) => items.map(([label, query]) => ({
  label,
  onClick: () => {
    ui.addMessage(query, 'user');
    handleMessage(query);
  }
}));

function loadKnowledge() {
  knowledgePromise ??= fetch('assets/data/chatbot-knowledge.json')
    .then((response) => response.ok ? response.json() : null)
    .catch(() => null);
  return knowledgePromise;
}

async function searchSite(query) {
  const knowledge = await loadKnowledge();
  if (!knowledge) return null;

  const terms = query.toLowerCase().split(/\s+/).filter((term) => term.length > 2);
  const match = knowledge.pages
    .map((page) => ({
      page,
      score: page.keywords.reduce((score, keyword) => score + (terms.some((term) => keyword.includes(term) || term.includes(keyword)) ? 1 : 0), 0)
    }))
    .sort((first, second) => second.score - first.score)[0];

  return match?.score
    ? { response: `The most relevant place to look is ${match.page.title}.`, actions: [{ label: `Open ${match.page.title}`, href: match.page.url }] }
    : null;
}

let ui;
let history = [];

async function handleMessage(text) {
  const query = text.toLowerCase();
  history = [...history, text].slice(-6);
  ui.typing(true);

  try {
    const memberKind = Object.entries(memberKinds).find(([, phrases]) => includesAny(query, phrases))?.[0];
    const adminKind = Object.entries(adminKinds).find(([, phrases]) => includesAny(query, phrases))?.[0];
    let answer;

    if (memberKind || adminKind) {
      const user = await getChatUser().catch(() => null);
      if (adminKind && user?.profile?.role === 'admin') answer = await getAdminAnswer(adminKind);
      else if (memberKind) answer = await getMemberAnswer(memberKind, user);
      else answer = { response: 'That command is available to Green Tomorrow administrators after signing in.', actions: [{ label: 'Login', href: 'login.html' }] };
    } else {
      const intent = matchIntent(text, history.slice(0, -1).join(' '));
      answer = intent
        ? { response: intent.response, actions: intent.actions }
        : await searchSite(text) || { response: "I'm not completely sure about that. Would you like to search the website or contact Green Tomorrow?", actions: [{ label: 'Contact Us', href: 'contact.html' }, { label: 'Browse Website', href: 'index.html' }] };
    }

    ui.typing(false);
    ui.addMessage(answer.response, 'bot', answer.actions);
  } catch {
    ui.typing(false);
    ui.addMessage('I could not retrieve that information right now. Please try again or visit your dashboard.', 'bot', [{ label: 'Dashboard', href: 'dashboard.html' }]);
  }
}

function start() {
  ui = createChatbotUI({ onSend: handleMessage });
  ui.addMessage(
    "Hi! \u{1F44B} I'm GreenBot. I can help with Green Tomorrow, programmes, volunteering, donations, the Green Challenge, and website navigation.",
    'bot',
    actions(QUICK_ACTIONS)
  );
}

window.addEventListener('load', () => window.setTimeout(start, 0), { once: true });
