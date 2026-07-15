document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const status = document.getElementById('loginStatus');
            status.textContent = 'Logging in...';
            status.className = 'form-status is-success';

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
            const pw = document.getElementById('password').value;
            const confirmPw = document.getElementById('confirmPassword').value;

            if (pw !== confirmPw) {
                status.textContent = 'Passwords do not match.';
                status.className = 'form-status is-error';
                return;
            }

            status.textContent = 'Creating your account...';
            status.className = 'form-status is-success';

            // TODO: replace with real fetch('/api/register', { method: 'POST', body: new FormData(registerForm) })
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 700);
        });
    }
});