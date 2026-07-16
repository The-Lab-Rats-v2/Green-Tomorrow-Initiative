# Quick Start Guide - Supabase Integration

## 5-Minute Setup

### Step 1: Get Supabase Credentials
1. Create a Supabase project at supabase.com
2. Go to Settings > API
3. Copy: **Project URL** and **Anon Key**

### Step 2: Update Configuration
Edit `assets/js/supabase.js`:
```javascript
const SUPABASE_URL = 'YOUR_PROJECT_URL'; // https://xxx.supabase.co
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY'; // eyJ...
```

### Step 3: Create Database Tables
1. In Supabase SQL Editor, paste `sql-schema.sql` and run
2. Paste `sql-rls-policies.sql` and run
3. Paste `sql-storage-setup.sql` and run

### Step 4: Create Storage Bucket
1. Go to Storage in Supabase
2. Create new bucket named `competition-proposals`
3. Set to PRIVATE

### Step 5: Test the Setup
1. Open `register.html`
2. Create test account
3. Check Supabase Auth section to confirm user created

**Done!** The application is now connected to Supabase.

---

## Module Quick Reference

### Import Pattern
```javascript
// Import modules
import { loginUser, getCurrentUser } from './assets/js/auth.js';
import { getEvents, joinEvent } from './assets/js/api.js';
import { initializeDashboard } from './assets/js/dashboard.js';

// Use in your code
const user = await getCurrentUser();
const events = await getEvents();
```

### Common Operations

#### User Authentication
```javascript
// Register
import { registerUser } from './assets/js/auth.js';
await registerUser('John Doe', 'john@example.com', 'password123');

// Login
import { loginUser } from './assets/js/auth.js';
const user = await loginUser('john@example.com', 'password123');

// Check if logged in
import { isAuthenticated } from './assets/js/auth.js';
const loggedIn = await isAuthenticated();

// Logout
import { logoutUser } from './assets/js/auth.js';
await logoutUser();
```

#### Working with Events
```javascript
import { getEvents, joinEvent, leaveEvent } from './assets/js/api.js';

// Get all events
const events = await getEvents();

// Get events with filter
const events = await getEvents({ 
  year: new Date().getFullYear() 
});

// Join event
await joinEvent('event-id-123');

// Leave event
await leaveEvent('event-id-123');
```

#### Working with Challenge Entries
```javascript
import { 
  getChallengeEntry,
  createChallengeEntry,
  uploadProposalFile
} from './assets/js/api.js';

// Get current user's entry (or null)
const entry = await getChallengeEntry(userId);

// Upload proposal file
const result = await uploadProposalFile(fileObject);
console.log(result.publicUrl); // Use to store in database

// Create challenge entry
await createChallengeEntry({
  team_name: 'Team Green',
  university: 'UCT',
  project_title: 'Solar Energy',
  project_summary: 'Description...',
  team_lead_name: 'Jane Doe',
  team_lead_email: 'jane@example.com',
  team_lead_student_number: '2024-001',
  team_members: 'John, Sarah, Mike',
  team_size: 3,
  proposal_file_url: 'https://...' // From uploadProposalFile
});
```

#### Admin Operations
```javascript
import { 
  updateChallengeStatus,
  getAllChallengeEntries,
  createEvent,
  deleteEvent
} from './assets/js/api.js';

// Check if admin
import { isAdmin } from './assets/js/auth.js';
const admin = await isAdmin();

// Approve challenge entry
await updateChallengeStatus('entry-id', 'approved');

// Reject challenge entry
await updateChallengeStatus('entry-id', 'rejected');

// Get all challenges
const entries = await getAllChallengeEntries();

// Create event
await createEvent({
  title: 'Beach Cleanup',
  description: 'Help clean up...',
  location: 'Clifton Beach',
  date: '2024-12-15T10:00',
  available_spots: 20
});

// Delete event
await deleteEvent('event-id');
```

---

## HTML Integration Checklist

For each HTML file, ensure it has:

### Public Pages (index, about, programmes, etc.)
```html
<script type="module" src="assets/js/supabase.js"></script>
<script type="module" src="assets/js/auth.js"></script>
<script defer src="assets/js/navbar-init.js"></script>
```

Result: Dynamic navbar with Login/Dashboard or Log Out buttons based on auth state.

### Login Page
```html
<script type="module" src="assets/js/supabase.js"></script>
<script type="module" src="assets/js/auth.js"></script>
<script defer src="assets/js/login-page.js"></script>
```

Result: Login form submits to `loginUser()` and redirects to dashboard.

### Register Page
```html
<script type="module" src="assets/js/supabase.js"></script>
<script type="module" src="assets/js/auth.js"></script>
<script defer src="assets/js/register-page.js"></script>
```

Result: Registration form creates account via `registerUser()`.

### Dashboard
```html
<script type="module" src="assets/js/supabase.js"></script>
<script type="module" src="assets/js/auth.js"></script>
<script type="module" src="assets/js/api.js"></script>
<script type="module" src="assets/js/dashboard.js"></script>
<script defer src="assets/js/dashboard-init.js"></script>
```

Result: Dashboard loads user data on initialization.

### Competition
```html
<script type="module" src="assets/js/supabase.js"></script>
<script type="module" src="assets/js/auth.js"></script>
<script type="module" src="assets/js/api.js"></script>
<script defer src="assets/js/competition-page.js"></script>
```

Result: Form submits to `createChallengeEntry()` with file upload.

### Admin
```html
<script type="module" src="assets/js/supabase.js"></script>
<script type="module" src="assets/js/auth.js"></script>
<script type="module" src="assets/js/api.js"></script>
<script type="module" src="assets/js/admin.js"></script>
<script defer src="assets/js/admin-init.js"></script>
```

Result: Admin dashboard with full data management.

---

## Error Handling

### Try-Catch Pattern
```javascript
try {
  const result = await loginUser(email, password);
  console.log('Success:', result);
} catch (error) {
  console.error('Error:', error);
  // Display to user
  statusDiv.textContent = error.message;
  statusDiv.className = 'form-status is-error';
}
```

### Common Errors
| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid credentials" | Wrong email/password | Check credentials |
| "Email already exists" | User registered before | Use login instead |
| "User not found" | Account doesn't exist | Register new account |
| "Unauthorized" | Not admin, no auth | Login/check permissions |
| "File too large" | > 10MB | Upload smaller file |

---

## Testing

### Manual Tests
```javascript
// Test 1: Authentication
await registerUser('test@example.com', 'pass', 'Test User');
// Check: User created in Auth section of Supabase

// Test 2: Dashboard
const user = await getCurrentUser();
console.log(user); // Should show user + profile data
// Check: Profile table has record

// Test 3: Event Joining
await joinEvent('event-id-123');
// Check: Record in volunteer_registrations table

// Test 4: File Upload
const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
const result = await uploadProposalFile(file);
console.log(result.publicUrl); // Should be accessible URL
// Check: File in storage bucket
```

### Console Testing
Open browser DevTools > Console and test:
```javascript
// Check if Supabase is initialized
import { supabase } from './assets/js/supabase.js';
console.log(supabase); // Should show client object

// Check authentication
import { isAuthenticated } from './assets/js/auth.js';
console.log(await isAuthenticated()); // true/false

// Check user data
import { getCurrentUser } from './assets/js/auth.js';
console.log(await getCurrentUser()); // User object
```

---

## Debugging Tips

### Check Network Requests
1. Open DevTools > Network tab
2. Filter for "supabase" or "api"
3. Check request/response bodies
4. Verify status codes (200 = success, 401 = auth error, 409 = conflict)

### Check Browser Storage
1. DevTools > Application tab
2. Check "Cookies" - should have `sb-*` tokens
3. Check "Local Storage" - should have auth state

### Check Supabase Logs
1. Go to Supabase dashboard
2. Menu > Logs
3. Look for errors in recent requests

### Enable Debug Mode
```javascript
// Add at top of supabase.js
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event, session);
});
```

---

## Common Gotchas

### Issue: "Cannot find module"
**Cause**: Wrong import path
```javascript
// ❌ Wrong
import { loginUser } from './auth.js';

// ✅ Correct
import { loginUser } from './assets/js/auth.js';
```

### Issue: "RLS policy error"
**Cause**: User not authenticated or insufficient permissions
```javascript
// ✅ Always check auth first
const authenticated = await isAuthenticated();
if (!authenticated) {
  window.location.href = 'login.html';
  return;
}
```

### Issue: "File upload fails silently"
**Cause**: Storage policies not created
```javascript
// Check: sql-storage-setup.sql was run in Supabase
// Check: Bucket exists and is PRIVATE
// Check: File size < 10MB
```

### Issue: "Session expires immediately"
**Cause**: Supabase session cookie settings
```javascript
// Check: Supabase project settings
// Settings > Auth > Session settings
// Should be 1 hour or longer
```

---

## Next Steps After Setup

1. **Add Navigation to Admin Panel**
   - Create link to admin.html (only visible to admins)
   - Add admin-only navbar visibility

2. **Add Email Notifications**
   - Set up email templates in Supabase
   - Trigger emails on challenge approval/rejection

3. **Create Initial Admin User**
   ```sql
   -- Run in Supabase SQL Editor
   UPDATE profiles SET role = 'admin' 
   WHERE email = 'admin@example.com';
   ```

4. **Configure Custom Domain**
   - (Optional) Set up custom domain with Supabase

5. **Set Up Monitoring**
   - Supabase > Logs to track errors
   - Set up alerts for critical issues

---

## File Locations Summary

| File | Purpose | Type |
|------|---------|------|
| `assets/js/supabase.js` | Supabase config | Module |
| `assets/js/auth.js` | Authentication | Module |
| `assets/js/api.js` | Database operations | Module |
| `assets/js/dashboard.js` | Member dashboard | Module |
| `assets/js/admin.js` | Admin panel | Module |
| `assets/js/login-page.js` | Login form handler | Script |
| `assets/js/register-page.js` | Register form handler | Script |
| `assets/js/dashboard-init.js` | Dashboard init | Script |
| `assets/js/navbar-init.js` | Navbar auth state | Script |
| `assets/js/competition-page.js` | Competition form handler | Script |
| `assets/js/admin-init.js` | Admin init | Script |
| `sql-schema.sql` | Database tables | SQL |
| `sql-rls-policies.sql` | Security policies | SQL |
| `sql-storage-setup.sql` | File storage config | SQL |
| `admin.html` | Admin dashboard page | HTML |
| `SUPABASE_MIGRATION_GUIDE.md` | Detailed setup guide | Doc |
| `ARCHITECTURE.md` | Technical documentation | Doc |

---

## Support & Resources

- **Supabase Docs**: https://supabase.com/docs
- **Authentication Guide**: https://supabase.com/docs/guides/auth
- **Database Guide**: https://supabase.com/docs/guides/database
- **Storage Guide**: https://supabase.com/docs/guides/storage
- **RLS Guide**: https://supabase.com/docs/guides/auth/row-level-security

---

## Rollback Plan

If you need to revert to localStorage:

1. Keep `script.js` backup with old localStorage logic
2. In HTML files, comment out Supabase modules
3. Uncomment old script imports
4. Restart browser

Or use git to revert commits:
```bash
git log --oneline
git revert <commit-hash>
```
