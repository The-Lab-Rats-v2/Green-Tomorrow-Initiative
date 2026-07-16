# Supabase Migration Guide - Green Tomorrow Initiative

## Overview

This guide explains how to migrate the Green Tomorrow Initiative website from localStorage to Supabase. The migration includes:

- Complete user authentication
- Database management for all data types
- File storage for proposal uploads
- Admin dashboard
- Row Level Security (RLS) policies

## Prerequisites

- A Supabase account (free tier available at https://supabase.com)
- Node.js (optional, for local testing)
- Git for version control

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose a project name (e.g., "green-tomorrow-initiative")
4. Select a region closest to your users
5. Choose a strong database password
6. Wait for project to initialize (2-3 minutes)

## Step 2: Retrieve API Keys

1. Go to **Settings > API** in your Supabase dashboard
2. Copy the following:
   - **Project URL**: `https://dtveimgtouemaoucetxw.supabase.co`
   - **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0dmVpbWd0b3VlbWFvdWNldHh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxOTQ1NzgsImV4cCI6MjA5OTc3MDU3OH0.QHHVo9NGtSv2d6LCps9zK8EOuQtD4XSDiVPA_E7jS8M` (starts with "eyJ")
   - **Service Role Key**: Keep this secret, don't commit to GitHub

3. Update `assets/js/supabase.js`:
   ```javascript
   const SUPABASE_URL = 'https://dtveimgtouemaoucetxw.supabase.co';
   const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0dmVpbWd0b3VlbWFvdWNldHh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxOTQ1NzgsImV4cCI6MjA5OTc3MDU3OH0.QHHVo9NGtSv2d6LCps9zK8EOuQtD4XSDiVPA_E7jS8M';
   ```

## Step 3: Create Database Schema

1. In Supabase, go to **SQL Editor**
2. Create a new query
3. Copy the entire contents of `sql-schema.sql`
4. Paste into the SQL editor
5. Click "Run"

Wait for all tables to be created successfully.

## Step 4: Create Storage Bucket

1. Go to **Storage** in Supabase dashboard
2. Click **Create a new bucket**
3. Name it: `competition-proposals`
4. Set to **PRIVATE** (not public)
5. Click **Create bucket**

## Step 5: Enable RLS and Create Policies

1. Go to **SQL Editor**
2. Copy the entire contents of `sql-rls-policies.sql`
3. Paste into SQL editor
4. Click "Run"

This enables Row Level Security on all tables.

## Step 6: Create Storage Policies

1. Go to **Storage > competition-proposals**
2. Click **Policies**
3. Copy contents from `sql-storage-setup.sql`
4. Paste into SQL editor under Storage section
5. Click "Run"

## Step 7: Enable Email Auth

1. Go to **Authentication > Providers**
2. Ensure **Email** is enabled (it should be by default)
3. Go to **Email Templates**
4. Verify "Confirm signup" and "Reset password" templates exist

## Step 8: Update HTML Files

Update the following files to import Supabase modules:

### login.html
```html
<script type="module" src="assets/js/supabase.js"></script>
<script type="module" src="assets/js/auth.js"></script>
<script defer src="assets/js/login-page.js"></script>
```

### register.html
```html
<script type="module" src="assets/js/supabase.js"></script>
<script type="module" src="assets/js/auth.js"></script>
<script defer src="assets/js/register-page.js"></script>
```

### dashboard.html
```html
<script type="module" src="assets/js/supabase.js"></script>
<script type="module" src="assets/js/auth.js"></script>
<script type="module" src="assets/js/api.js"></script>
<script type="module" src="assets/js/dashboard.js"></script>
<script defer src="assets/js/dashboard-init.js"></script>
```

### competition.html
```html
<script type="module" src="assets/js/supabase.js"></script>
<script type="module" src="assets/js/auth.js"></script>
<script type="module" src="assets/js/api.js"></script>
<script defer src="assets/js/competition-page.js"></script>
```

### index.html (and all public pages)
```html
<script type="module" src="assets/js/supabase.js"></script>
<script type="module" src="assets/js/auth.js"></script>
<script defer src="assets/js/navbar-init.js"></script>
```

### admin.html (NEW)
```html
<script type="module" src="assets/js/supabase.js"></script>
<script type="module" src="assets/js/auth.js"></script>
<script type="module" src="assets/js/api.js"></script>
<script type="module" src="assets/js/admin.js"></script>
<script defer src="assets/js/admin-init.js"></script>
```

## Step 9: Create Page-Specific JavaScript Files

Create `assets/js/login-page.js`:
```javascript
import { loginUser } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const status = document.getElementById('loginStatus');
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
      status.textContent = 'Logging in...';
      status.className = 'form-status is-success';

      await loginUser(email, password);

      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 500);
    } catch (error) {
      status.textContent = error.message || 'Login failed';
      status.className = 'form-status is-error';
    }
  });
});
```

Create `assets/js/register-page.js`:
```javascript
import { registerUser } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registerForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const status = document.getElementById('registerStatus');
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
      status.textContent = 'Passwords do not match';
      status.className = 'form-status is-error';
      return;
    }

    try {
      status.textContent = 'Creating your account...';
      status.className = 'form-status is-success';

      await registerUser(fullName, email, password);

      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 500);
    } catch (error) {
      status.textContent = error.message || 'Registration failed';
      status.className = 'form-status is-error';
    }
  });
});
```

Create `assets/js/dashboard-init.js`:
```javascript
import { initializeDashboard, setupLogoutHandler } from './dashboard.js';

document.addEventListener('DOMContentLoaded', () => {
  initializeDashboard();
  setupLogoutHandler();
});
```

Create `assets/js/navbar-init.js`:
```javascript
import { isAuthenticated, getCurrentUser, logoutUser } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
  const navbarAuth = document.querySelector('.navbar-auth');
  if (!navbarAuth) return;

  const authenticated = await isAuthenticated();

  if (authenticated) {
    const user = await getCurrentUser();
    navbarAuth.innerHTML = `
      <a href="dashboard.html" class="navbar-link">Dashboard</a>
      <a href="#" class="donate-btn" onclick="handleLogout(event)">Log Out</a>
    `;

    window.handleLogout = async (e) => {
      e.preventDefault();
      try {
        await logoutUser();
        window.location.href = 'index.html';
      } catch (error) {
        console.error('Logout error:', error);
        window.location.href = 'index.html';
      }
    };
  } else {
    navbarAuth.innerHTML = `
      <a href="login.html" class="navbar-link">Login</a>
      <a href="contact.html" class="donate-btn">Donate</a>
    `;
  }
});
```

Create `assets/js/competition-page.js`:
```javascript
import { isAuthenticated, getCurrentUser } from './auth.js';
import { createChallengeEntry, getChallengeEntry, uploadProposalFile } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('competitionForm');
  if (!form) return;

  const authenticated = await isAuthenticated();
  const formSection = form.closest('.section-copy');

  if (!authenticated) {
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

  const user = await getCurrentUser();
  const existing = await getChallengeEntry(user.profile.id);

  if (existing) {
    const statusText = {
      'pending': 'Under Review',
      'approved': 'Approved ✓',
      'rejected': 'Rejected'
    }[existing.status] || 'Unknown';

    formSection.innerHTML = `
      <span class="eyebrow">Your Entry</span>
      <h2>You've already entered the Green Challenge</h2>
      <div class="entry-status-card">
        <p><strong>${existing.team_name}</strong> &mdash; "${existing.project_title}"</p>
        <p>University: ${existing.university}</p>
        <p>Status: <span class="status-pill status-${existing.status}">${statusText}</span></p>
      </div>
    `;
    form.style.display = 'none';
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const status = document.getElementById('formStatus');

    try {
      status.textContent = 'Submitting your entry...';
      status.className = 'form-status is-success';

      let proposalUrl = null;
      const proposalFile = document.getElementById('proposalFile').files[0];

      if (proposalFile) {
        const uploadResult = await uploadProposalFile(proposalFile);
        proposalUrl = uploadResult.publicUrl;
      }

      const entryData = {
        team_name: document.getElementById('teamName').value,
        university: document.getElementById('university').value,
        project_title: document.getElementById('projectTitle').value,
        project_summary: document.getElementById('projectSummary').value,
        team_lead_name: document.getElementById('teamLeadName').value,
        team_lead_email: document.getElementById('teamLeadEmail').value,
        team_lead_student_number: document.getElementById('teamLeadStudentNumber').value,
        team_members: document.getElementById('teamMembers').value,
        team_size: parseInt(document.getElementById('teamSize').value),
        proposal_file_url: proposalUrl
      };

      await createChallengeEntry(entryData);

      status.textContent = 'Entry submitted successfully!';
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1000);
    } catch (error) {
      status.textContent = error.message || 'Submission failed';
      status.className = 'form-status is-error';
    }
  });
});
```

Create `assets/js/admin-init.js`:
```javascript
import { initializeAdminDashboard } from './admin.js';

document.addEventListener('DOMContentLoaded', () => {
  initializeAdminDashboard();
});
```

## Step 10: Create admin.html

Create `admin.html` with admin dashboard UI. See admin-dashboard.html template in project files.

## Step 11: Deploy to GitHub Pages

1. Commit all changes:
   ```bash
   git add .
   git commit -m "Migrate to Supabase backend"
   git push origin main
   ```

2. GitHub Pages will automatically build and deploy (if configured)

## Step 12: Set Supabase Environment

For security, set environment variables in your GitHub repository:

1. Go to **GitHub Repository > Settings > Secrets and variables > Actions**
2. Add:
   - `VITE_SUPABASE_URL`: Your Supabase URL
   - `VITE_SUPABASE_ANON_KEY`: Your Anon key

Update `assets/js/supabase.js` to read from environment:

```javascript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your_key';
```

## Testing Checklist

- [ ] User registration works
- [ ] User login works
- [ ] Dashboard displays user data
- [ ] Volunteer event joining works
- [ ] Challenge submission works
- [ ] File upload works
- [ ] Admin dashboard accessible only to admins
- [ ] Challenge status updates work
- [ ] Donation tracking works
- [ ] News management works
- [ ] Logout works
- [ ] Page refresh preserves authentication

## Troubleshooting

### "Project not initialized" error
- Wait 2-3 minutes after creating project
- Refresh the browser
- Check Supabase dashboard status

### Authentication fails
- Verify API keys are correct
- Check browser console for CORS errors
- Ensure email auth is enabled

### File upload fails
- Check storage bucket exists
- Verify bucket is PRIVATE
- Check file size < 10MB
- Verify file extension (.pdf, .doc, .docx)

### RLS errors
- Ensure RLS policies are created
- Check authentication token is present
- Verify user has appropriate role

## Security Notes

1. **Never commit API keys**: Use environment variables
2. **Keep Service Role Key secret**: Only use on backend
3. **Test RLS policies**: Ensure users can only access their data
4. **Enable HTTPS**: GitHub Pages uses HTTPS by default
5. **Validate uploads**: Server-side validation in place

## Files Modified

- `assets/js/supabase.js` (NEW)
- `assets/js/auth.js` (NEW)
- `assets/js/api.js` (NEW)
- `assets/js/dashboard.js` (NEW)
- `assets/js/admin.js` (NEW)
- `assets/js/login-page.js` (NEW)
- `assets/js/register-page.js` (NEW)
- `assets/js/dashboard-init.js` (NEW)
- `assets/js/navbar-init.js` (NEW)
- `assets/js/competition-page.js` (NEW)
- `assets/js/admin-init.js` (NEW)
- `login.html` (UPDATED - added script tags)
- `register.html` (UPDATED - added script tags)
- `dashboard.html` (UPDATED - added script tags)
- `competition.html` (UPDATED - added script tags)
- `index.html` (UPDATED - added script tags)
- `about.html` (UPDATED - added script tags)
- `programmes.html` (UPDATED - added script tags)
- `contact.html` (UPDATED - added script tags)
- `news.html` (UPDATED - added script tags)
- `admin.html` (NEW)

## Support

For issues with:
- **Supabase**: [Supabase Docs](https://supabase.com/docs)
- **Auth**: [Supabase Auth](https://supabase.com/docs/guides/auth)
- **Storage**: [Supabase Storage](https://supabase.com/docs/guides/storage)
- **RLS**: [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)

## Next Steps

1. Create default admin user via SQL
2. Set up email notification templates
3. Configure custom domain (optional)
4. Set up monitoring and alerts
5. Configure backups
