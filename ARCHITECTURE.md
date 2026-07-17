# Architecture Documentation - Supabase Migration

## Project Overview

Green Tomorrow Initiative has been migrated from a localStorage-based system to a production-grade Supabase backend. This document explains the architectural changes, module structure, and design decisions.

## System Architecture

### Before (localStorage)
```
User Browser
    ↓
HTML/CSS/JavaScript
    ↓
localStorage
    ↓
Static data stored locally
```

### After (Supabase)
```
User Browser
    ↓
HTML/CSS/JavaScript Modules
    ↓
Supabase SDK (REST API)
    ↓
Supabase Backend
    ├─ PostgreSQL Database
    ├─ Authentication (Auth)
    ├─ Storage (S3-compatible)
    └─ Row Level Security
```

## Module Structure

### 1. supabase.js - Configuration & Initialization
**Purpose**: Centralized Supabase client configuration
**Exports**:
- `supabase` - Configured Supabase client
- `TABLES` - Table name constants
- `STORAGE_CONFIG` - Storage configuration
- `SupabaseError` - Custom error class
- `handleSupabaseError()` - Error handling utility
- `initializeAuth()` - Auth initialization

**Key Design Decision**: All Supabase operations use this client, ensuring consistent error handling and configuration management.

### 2. auth.js - Authentication Module
**Purpose**: Handle user registration, login, logout, and profile management
**Key Functions**:
- `registerUser(fullName, email, password)` - Creates auth user + profile
- `loginUser(email, password)` - Authenticates user
- `logoutUser()` - Signs out user
- `getCurrentUser()` - Fetches authenticated user + profile
- `isAuthenticated()` - Checks if user has active session
- `isAdmin()` - Checks user role
- `onAuthStateChange(callback)` - Watches auth state changes

**Flow**:
```
Registration:
1. Create Supabase auth user
2. Create profile record
3. Return user object

Login:
1. Authenticate with Supabase auth
2. Fetch user profile from database
3. Return combined user + profile object

Logout:
1. Sign out from Supabase auth
2. Clear session
```

**Security**: Uses Supabase's built-in email/password authentication with secure hashing

### 3. api.js - Database Operations Module
**Purpose**: Handle all CRUD operations for database tables
**Key Sections**:

#### Events API
- `getEvents(filters)` - Fetch events with optional filtering
- `getEventById(eventId)` - Fetch single event
- `createEvent(eventData)` - Admin only
- `updateEvent(eventId, updates)` - Admin only
- `deleteEvent(eventId)` - Admin only

#### Volunteer Registrations
- `getVolunteerRegistrations(userId)` - Get user's registrations
- `joinEvent(eventId)` - Register user for event
  - Prevents duplicates
  - Reduces available spots
- `leaveEvent(eventId)` - Unregister from event
  - Increases available spots

#### Donations
- `getDonations(userId)` - Get donation history
- `createDonation(amount, paymentReference)` - Record donation

#### Green Challenge
- `getChallengeEntry(userId)` - Get user's entry (if exists)
- `getAllChallengeEntries(filters)` - Admin only
- `createChallengeEntry(entryData)` - Create new entry
  - Prevents duplicate entries per user
- `updateChallengeEntry(entryId, updates)` - Update entry
- `updateChallengeStatus(entryId, status)` - Admin only

#### News
- `getNews(limit)` - Fetch news articles
- `createNewsArticle(title, content, imageUrl)` - Admin only
- `deleteNewsArticle(articleId)` - Admin only

#### Storage (File Uploads)
- `uploadProposalFile(file)` - Upload competition proposal
  - Validates file type (.pdf, .doc, .docx)
  - Validates file size (< 10MB)
  - Generates unique filename
  - Returns public URL
- `deleteProposalFile(filePath)` - Delete uploaded file

**Design Decision**: Each function handles its own error management, using try-catch and the `handleSupabaseError` utility.

### 4. dashboard.js - Dashboard Logic
**Purpose**: Manage member dashboard rendering and data loading
**Key Functions**:
- `initializeDashboard()` - Main initialization
  - Checks authentication
  - Loads user data
  - Populates dashboard
- `updateMemberName(fullName)` - Update greeting
- `loadDashboardData(userProfile)` - Load all dashboard sections
  - Challenge entry status
  - Volunteer events
  - Donation history
- `setupLogoutHandler()` - Setup logout button

**Flow**:
```
Page Load:
1. Check if user authenticated
2. If not → redirect to login
3. Fetch current user from Supabase
4. Load challenge entry (if exists)
5. Load volunteer events (if any)
6. Load donation history (if any)
7. Update UI with data
```

**Status Display**:
- Challenge Entry:
  - Not submitted: "You haven't entered yet"
  - Pending: "Under Review"
  - Approved: "Approved ✓"
  - Rejected: "Rejected"

### 5. admin.js - Admin Dashboard
**Purpose**: Provide admin interface for managing platform data
**Key Functions**:
- `requireAdmin()` - Authorization check
- `initializeAdminDashboard()` - Initialize admin interface
- `loadStatistics()` - Calculate and display statistics
- `loadTabContent(tabName)` - Load tab-specific content
- Tab loaders:
  - `loadChallengesTab()` - Manage challenge entries
  - `loadEventsTab()` - Manage events
  - `loadDonationsTab()` - View donations
  - `loadVolunteersTab()` - View registrations
  - `loadNewsTab()` - Manage news articles

**Admin Features**:
- Statistics dashboard (total users, events, challenges, etc.)
- Challenge approval/rejection
- Event creation/deletion
- News publication/deletion
- Donation tracking
- Volunteer registration viewing

**Authorization**: Checked via user role in profile table

### 6. Page-Specific Modules
Created separate modules for each page to handle page-specific logic:

**login-page.js**
- Form submission handler
- Email/password validation
- Redirect to dashboard on success

**register-page.js**
- Registration form handler
- Password confirmation validation
- Account creation

**dashboard-init.js**
- Initialize dashboard on page load

**navbar-init.js**
- Update navbar based on authentication state
- Show Dashboard + Logout if authenticated
- Show Login + Donate if not authenticated

**competition-page.js**
- Handle challenge form submission
- File upload for proposals
- Show existing entry if user already submitted

**admin-init.js**
- Initialize admin dashboard on page load

## Database Schema

### tables
1. **profiles**
   - Stores user profile information
   - Links to Supabase auth users via auth_user_id
   - Role-based access control (member/admin)

2. **events**
   - Community events and volunteer opportunities
   - Tracks available spots
   - Created by admin users

3. **volunteer_registrations**
   - User + Event association
   - Prevents duplicate registrations
   - Tracks registration status

4. **donations**
   - Financial contributions
   - Tracks amount, date, payment reference
   - Status tracking

5. **green_challenge_entries**
   - Competition entries per user
   - One entry per user (unique constraint)
   - Proposal file URL storage
   - Status workflow (pending → approved/rejected)

6. **news**
   - Articles and updates
   - Admin-created content
   - Published timestamp

## Row Level Security (RLS) Policies

### Policy Structure
Each table has RLS policies implementing:

**Members can access their own data**:
- Read own profile, donations, registrations, challenge entry
- Write to own profile only

**Admins can access all data**:
- Read all records
- Write/delete as needed

**Public access (events, news)**:
- Everyone can read
- Admins can create/edit/delete

### Policy Examples

**User Profile - Read Own**:
```sql
-- User can read own profile
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
USING (auth.uid() = auth_user_id);

-- Admin can read all
CREATE POLICY "Admins can read all profiles"
ON profiles FOR SELECT
USING (
  EXISTS (SELECT 1 FROM profiles p 
          WHERE p.auth_user_id = auth.uid() 
          AND p.role = 'admin')
);
```

**Challenge Entries - Update Status**:
```sql
-- Admin only can update status
CREATE POLICY "Admins can update challenge entries"
ON green_challenge_entries FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM profiles p 
          WHERE p.auth_user_id = auth.uid() 
          AND p.role = 'admin')
);
```

## Authentication Flow

### Registration Flow
```
1. User enters: name, email, password
2. registerUser() called
3. Create Supabase auth user (email/password stored securely)
4. Create profile record with auth_user_id reference
5. Redirect to dashboard
6. User automatically logged in
```

### Login Flow
```
1. User enters: email, password
2. loginUser() called
3. Supabase validates credentials
4. Session token created
5. Fetch user profile from database
6. Store session in Supabase session store
7. Redirect to dashboard
```

### Session Management
```
- Supabase stores session in browser (via supabase-auth token)
- Session persists across page refreshes
- Session expires based on Supabase configuration (default 1 hour)
- User automatically logged out on expiration
```

## File Upload & Storage

### Upload Process
```
1. User selects file (proposal PDF/DOC/DOCX)
2. Validate:
   - File type (extension check)
   - File size (< 10MB)
3. Generate unique filename: `{userId}/{timestamp}-{filename}`
4. Upload to Supabase Storage bucket
5. Get public URL
6. Store URL in database
```

### Storage Security
```
- Bucket is PRIVATE (not public)
- Storage policies control who can download
- Users can only download their own files
- Admins can download any file
- Files are immutable (no modification)
```

## Error Handling

### Error Types Handled
1. **Authentication Errors** (401/403)
   - Redirect to login
   - Display "Unauthorized" message

2. **Conflict Errors** (409)
   - Duplicate email, duplicate registration
   - Display "Already exists" message

3. **Not Found Errors** (404)
   - Record doesn't exist
   - Display "Not found" message

4. **Network Errors**
   - Connection failures
   - Timeout handling
   - Retry logic (optional)

### Error Display
```javascript
try {
  // Operation
} catch (error) {
  // User-friendly message shown in UI
  status.textContent = error.message;
  status.className = 'form-status is-error';
}
```

## Data Validation

### Client-Side Validation
- Email format (built-in)
- Password length (min 8 characters)
- Required fields (built-in)
- File type/size (custom)

### Server-Side Validation (via RLS)
- Email uniqueness
- User role verification
- Data ownership verification
- Referential integrity

## Performance Considerations

### Queries Optimized
```javascript
// Efficient: Load user + profile in one query
SELECT *, created_by(*) FROM events

// Prevent N+1 queries: Load related data
SELECT *, event:event_id(*), user:user_id(*) 
FROM volunteer_registrations
```

### Caching Strategy
- No localStorage caching (always fetch fresh)
- Browser cache for static assets
- Supabase session stored in secure cookie

### Database Indexes
- Created on:
  - auth_user_id (fast user lookups)
  - email (fast email checks)
  - user_id (fast user-specific queries)
  - event_id (fast event lookups)
  - status (fast status filtering)

## Deployment Considerations

### GitHub Pages Compatibility
- Supabase SDK works on static sites
- No backend server needed
- All auth handled by Supabase
- CORS configured in Supabase

### Environment Variables
```javascript
// Read from GitHub Secrets
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fallback for development
const SUPABASE_URL = 'https://project.supabase.co';
const SUPABASE_KEY = 'public_anon_key';
```

### Security in Production
1. Credentials via GitHub Secrets
2. Supabase API key restrictions
3. RLS policies enforced server-side
4. HTTPS enforced (GitHub Pages default)
5. CORS headers configured

## Migration Path from localStorage

### Data Migration (if needed)
```sql
-- Export data from old system
-- Import into Supabase tables
-- Test integrity
-- Verify RLS policies work
-- Switch over
```

### User Communication
1. Users keep existing passwords initially
2. Reset password available if needed
3. Migration transparent to users

## Future Enhancements

1. **Email Notifications**
   - Challenge approval notifications
   - Event reminder emails
   - Donation receipts

2. **Admin Features**
   - Bulk export to CSV
   - Advanced filtering
   - Analytics dashboard

3. **User Features**
   - Profile customization
   - Preference management
   - Notification settings

4. **Scalability**
   - Database optimization
   - Read replicas
   - CDN for storage

## Troubleshooting Guide

### Common Issues

**"Auth not initialized"**
- Ensure supabase.js loads first
- Check SUPABASE_URL and SUPABASE_ANON_KEY
- Clear browser cache

**"RLS policy error"**
- User not authenticated
- User doesn't have required role
- Policy not created

**"File upload fails"**
- Storage bucket doesn't exist
- Bucket policies not created
- File too large or wrong type

**"Session expires too quickly"**
- Check Supabase auth settings
- Increase JWT expiry if needed
- Check browser cookie settings

## Testing Checklist

- [ ] User registration works
- [ ] Email validation works
- [ ] User login works
- [ ] Session persists on page refresh
- [ ] Logout works
- [ ] Dashboard loads user data
- [ ] Challenge submission works
- [ ] File upload works
- [ ] Event joining works
- [ ] Event leaving works
- [ ] Donation tracking works
- [ ] Admin dashboard loads
- [ ] Admin can approve challenge
- [ ] Admin can create event
- [ ] RLS policies prevent unauthorized access
- [ ] File permissions enforced
- [ ] Error messages display
- [ ] Mobile responsive

## Code Quality

### Best Practices Implemented
1. **Modular Design**: Each module has single responsibility
2. **Error Handling**: Consistent error handling across all modules
3. **Reusability**: API functions used across multiple pages
4. **Security**: RLS policies, validation, error messages
5. **Documentation**: Comments on complex functions
6. **Configuration**: Centralized configuration in supabase.js

### Code Standards
- Consistent naming conventions
- Descriptive function names
- Proper error messages
- Commented code where needed
