// =============================================
// COMPETITION PAGE SCRIPT
// =============================================
// This script handles the competition form submission and file uploads

import { isAuthenticated, getCurrentUser } from './auth.js';
import { createChallengeEntry, getChallengeEntry, uploadProposalFile } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('competitionForm');
  
  if (!form) {
    console.warn('Competition form not found');
    return;
  }

  try {
    // Check if user is authenticated
    const authenticated = await isAuthenticated();
    
    if (!authenticated) {
      // Hide form and show login prompt
      const formSection = form.closest('.section-copy');
      if (formSection) {
        formSection.innerHTML = `
          <span class="eyebrow">Enter the Challenge</span>
          <h2>Log in to submit your team entry</h2>
          <p>You'll need a member account to register your team for the Green Challenge.</p>
          <div style="display:flex; gap:12px; margin-top:1.2rem;">
            <a href="login.html" class="btn">Log In</a>
            <a href="register.html" class="btn btn-secondary">Create Account</a>
          </div>
        `;
      }
      form.style.display = 'none';
      return;
    }

    // User is authenticated - check if they already have an entry
    const user = await getCurrentUser();
    if (!user || !user.profile) {
      throw new Error('Failed to load user profile');
    }

    const existingEntry = await getChallengeEntry(user.profile.id);
    
    if (existingEntry) {
      // User already submitted - show their entry
      const statusMap = {
        'pending': 'Under Review',
        'approved': 'Approved ✓',
        'rejected': 'Rejected'
      };

      const formSection = form.closest('.section-copy');
      if (formSection) {
        formSection.innerHTML = `
          <span class="eyebrow">Your Entry</span>
          <h2>You've already entered the Green Challenge</h2>
          <div class="entry-status-card">
            <p><strong>${existingEntry.team_name}</strong> &mdash; "${existingEntry.project_title}"</p>
            <p>University: ${existingEntry.university}</p>
            <p>Status: <span class="status-pill status-${existingEntry.status}">${statusMap[existingEntry.status] || 'Unknown'}</span></p>
            ${existingEntry.proposal_file_url ? `<p><a href="${existingEntry.proposal_file_url}" target="_blank" rel="noopener">View Proposal</a></p>` : ''}
          </div>
        `;
      }
      form.style.display = 'none';
      return;
    }

    // Setup form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const statusEl = document.getElementById('formStatus');
      const submitBtn = form.querySelector('button[type="submit"]');

      try {
        if (statusEl) {
          statusEl.textContent = 'Submitting your entry...';
          statusEl.className = 'form-status is-success';
        }

        if (submitBtn) {
          submitBtn.disabled = true;
        }

        // Handle file upload if provided
        let proposalUrl = null;
        const proposalFileInput = document.getElementById('proposalFile');
        
        if (proposalFileInput && proposalFileInput.files.length > 0) {
          const proposalFile = proposalFileInput.files[0];

          if (statusEl) {
            statusEl.textContent = 'Uploading proposal file...';
            statusEl.className = 'form-status is-success';
          }

          const uploadResult = await uploadProposalFile(proposalFile);
          proposalUrl = uploadResult.publicUrl;
        }

        // Prepare entry data
        const entryData = {
          team_name: (document.getElementById('teamName') || {}).value || '',
          university: (document.getElementById('university') || {}).value || '',
          project_title: (document.getElementById('projectTitle') || {}).value || '',
          project_summary: (document.getElementById('projectSummary') || {}).value || '',
          team_lead_name: (document.getElementById('teamLeadName') || {}).value || '',
          team_lead_email: (document.getElementById('teamLeadEmail') || {}).value || '',
          team_lead_student_number: (document.getElementById('teamLeadStudentNumber') || {}).value || '',
          team_members: (document.getElementById('teamMembers') || {}).value || '',
          team_size: parseInt((document.getElementById('teamSize') || {}).value || 1),
          proposal_file_url: proposalUrl
        };

        // Validate required fields
        if (!entryData.team_name || !entryData.university || !entryData.project_title) {
          throw new Error('Please fill in all required fields');
        }

        if (statusEl) {
          statusEl.textContent = 'Creating entry...';
          statusEl.className = 'form-status is-success';
        }

        // Create entry in database
        await createChallengeEntry(entryData);

        if (statusEl) {
          statusEl.textContent = 'Entry submitted successfully! Redirecting...';
          statusEl.className = 'form-status is-success';
        }

        // Redirect to dashboard after 1 second
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1000);
      } catch (error) {
        if (statusEl) {
          statusEl.textContent = error.message || 'Submission failed. Please try again.';
          statusEl.className = 'form-status is-error';
        }
        console.error('Submission error:', error);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
        }
      }
    });
  } catch (error) {
    console.error('Competition page error:', error);
    const statusEl = document.getElementById('formStatus');
    if (statusEl) {
      statusEl.textContent = 'An error occurred. Please refresh the page.';
      statusEl.className = 'form-status is-error';
    }
  }
});
