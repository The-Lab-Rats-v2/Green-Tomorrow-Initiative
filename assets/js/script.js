// ---------- Auth guards (runs before page loads) ----------
(function() {
    // Get the current page filename more reliably
    let currentPage = '';
    const pathname = window.location.pathname;
    
    if (pathname.includes('dashboard.html')) {
        currentPage = 'dashboard.html';
    } else if (pathname.includes('login.html')) {
        currentPage = 'login.html';
    } else if (pathname.includes('register.html')) {
        currentPage = 'register.html';
    }
    // All other pages (index, about, programmes, competition, etc.) are public
    
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    // Redirect to login if trying to access dashboard without being logged in
    if (currentPage === 'dashboard.html' && !isLoggedIn) {
        window.location.href = 'login.html';
        return;
    }
    
    // Redirect to dashboard if already logged in and trying to access login/register
    if ((currentPage === 'login.html' || currentPage === 'register.html') && isLoggedIn) {
        window.location.href = 'dashboard.html';
        return;
    }
    
    // Public pages preserve login state - no redirects here
})();

// ---------- Update navbar based on login state ----------
document.addEventListener('DOMContentLoaded', () => {
    const navbarAuth = document.querySelector('.navbar-auth');
    if (!navbarAuth) return;
    
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const currentUser = localStorage.getItem('currentUser');
    
    if (isLoggedIn && currentUser) {
        // Show Dashboard and Logout for logged-in users
        navbarAuth.innerHTML = `
            <a href="dashboard.html" class="navbar-link">Dashboard</a>
            <a href="#" class="donate-btn" onclick="localStorage.removeItem('isLoggedIn'); localStorage.removeItem('currentUser'); window.location.href='index.html'; return false;">Log Out</a>
        `;
    } else {
        // Show Login and Donate for non-logged-in users
        navbarAuth.innerHTML = `
            <a href="login.html" class="navbar-link">Login</a>
            <a href="contact.html" class="donate-btn">Donate</a>
        `;
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const status = document.getElementById('loginStatus');
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            // Get users from localStorage
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            
            // Find user with matching email
            const user = users.find(u => u.email === email);
            
            if (!user) {
                status.textContent = 'Email not found. Please register first.';
                status.className = 'form-status is-error';
                return;
            }
            
            if (user.password !== password) {
                status.textContent = 'Incorrect password.';
                status.className = 'form-status is-error';
                return;
            }

            status.textContent = 'Logging in...';
            status.className = 'form-status is-success';

            // Save login state and current user info
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('currentUser', JSON.stringify({
                fullName: user.fullName,
                email: user.email
            }));

            // TODO: replace with real fetch('/api/login', { method: 'POST', body: new FormData(loginForm) })
            // once backend auth is ready.
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 700);
        });
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const status = document.getElementById('registerStatus');
            const fullName = document.getElementById('fullName').value;
            const email = document.getElementById('email').value;
            const pw = document.getElementById('password').value;
            const confirmPw = document.getElementById('confirmPassword').value;

            if (pw !== confirmPw) {
                status.textContent = 'Passwords do not match.';
                status.className = 'form-status is-error';
                return;
            }

            // Get existing users from localStorage
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            
            // Check if email already exists
            if (users.some(u => u.email === email)) {
                status.textContent = 'This email is already registered.';
                status.className = 'form-status is-error';
                return;
            }

            // Add new user
            users.push({
                fullName: fullName,
                email: email,
                password: pw
            });

            // Save users to localStorage
            localStorage.setItem('users', JSON.stringify(users));

            status.textContent = 'Creating your account...';
            status.className = 'form-status is-success';

            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('currentUser', JSON.stringify({
                fullName: fullName,
                email: email
            }));

            // TODO: replace with real fetch('/api/register', { method: 'POST', body: new FormData(registerForm) })
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 700);
        });
    }
});

const EVENT_DETAILS = {
    'beach-cleanup-aug15': { title: 'Community Beach Clean-up', date: '15 August', location: 'Muizenberg' },
    'tree-planting-jul25': { title: 'Community Tree Planting', date: '25 July', location: 'Green Point Park' },
    'recycling-walk-aug08': { title: 'Recycling Awareness Walk', date: '8 August', location: 'Sea Point Promenade' }
};

function getJoinedEvents() {
    const raw = localStorage.getItem('joinedEvents');
    return raw ? JSON.parse(raw) : [];
}

function saveJoinedEvents(events) {
    localStorage.setItem('joinedEvents', JSON.stringify(events));
}

document.addEventListener('DOMContentLoaded', () => {
    const joined = getJoinedEvents();

    document.querySelectorAll('.join-event-btn').forEach((btn) => {
        const card = btn.closest('[data-event-id]');
        const eventId = card.dataset.eventId;

        if (joined.includes(eventId)) {
            btn.textContent = 'Joined ✓';
            btn.classList.add('btn-secondary');
            btn.disabled = true;
        }

        btn.addEventListener('click', () => {
            const current = getJoinedEvents();
            if (!current.includes(eventId)) {
                current.push(eventId);
                saveJoinedEvents(current);
            }
            btn.textContent = 'Joined ✓';
            btn.classList.add('btn-secondary');
            btn.disabled = true;
        });
    });
});

// ---------- Render joined events on the dashboard ----------
document.addEventListener('DOMContentLoaded', () => {
    const list = document.getElementById('myEventsList');
    const emptyMsg = document.getElementById('noEventsMessage');
    if (!list) return; // not on the dashboard page

    const joined = getJoinedEvents();

    if (joined.length === 0) {
        emptyMsg.style.display = 'block';
        return;
    }

    joined.forEach((eventId) => {
        const details = EVENT_DETAILS[eventId];
        if (!details) return;

        const card = document.createElement('div');
        card.className = 'project-card';
        card.innerHTML = `
            <div class="project-card-body">
                <h3>${details.title}</h3>
                <p>${details.date} &middot; ${details.location}</p>
            </div>
        `;
        list.appendChild(card);
    });
});

// ---------- Populate member name on dashboard ----------
document.addEventListener('DOMContentLoaded', () => {
    const memberNameEl = document.getElementById('memberName');
    if (!memberNameEl) return; // not on dashboard page

    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        const user = JSON.parse(currentUser);
        memberNameEl.textContent = user.fullName;
    }
});
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('competitionForm');
    if (!form) return; // not on the competition page

    const formSection = form.closest('.section-copy');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

    if (!isLoggedIn) {
        formSection.innerHTML = `
            <span class="eyebrow">Enter the Challenge</span>
            <h2>Log in to submit your team entry</h2>
            <p>You'll need a member account to register your team for the Green Challenge.</p>
            <div style="display:flex; gap:12px; margin-top:1.2rem;">
                <a href="login.html" class="btn">Log In</a>
                <a href="register.html" class="btn btn-secondary">Create Account</a>
            </div>
        `;
        return;
    }

    const existing = localStorage.getItem('competitionEntry');
    if (existing) {
        const entry = JSON.parse(existing);
        formSection.innerHTML = `
            <span class="eyebrow">Your Entry</span>
            <h2>You've already entered the Green Challenge</h2>
            <div class="entry-status-card">
                <p><strong>${entry.teamName}</strong> &mdash; "${entry.projectTitle}"</p>
                <p>University: ${entry.university}</p>
                <p>Status: <span class="status-pill status-pending">${entry.status}</span></p>
            </div>
            <p style="margin-top: 1.2rem; color: var(--muted);">
                Need to make changes? <a href="#" id="editEntryLink" style="color: var(--leaf); font-weight: 650;">Edit your entry</a>
            </p>
        `;
        document.getElementById('editEntryLink').addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('competitionEntry');
            location.reload();
        });
        return;
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const status = document.getElementById('formStatus');

        const entry = {
            teamName: document.getElementById('teamName').value,
            university: document.getElementById('university').value,
            projectTitle: document.getElementById('projectTitle').value,
            projectSummary: document.getElementById('projectSummary').value,
            teamLeadName: document.getElementById('teamLeadName').value,
            teamLeadEmail: document.getElementById('teamLeadEmail').value,
            status: 'Under Review'
        };

        // TODO: replace with real fetch('/api/competition-entries', { method: 'POST', body: new FormData(form) })
        localStorage.setItem('competitionEntry', JSON.stringify(entry));

        status.textContent = 'Thanks! Your team entry has been received.';
        status.className = 'form-status is-success';

        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 900);
    });
});