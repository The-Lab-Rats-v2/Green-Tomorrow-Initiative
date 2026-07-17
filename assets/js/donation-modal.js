import { createDonation } from './api.js';

export function openDonationModal(isAuthenticated) {
  const existing = document.getElementById('donationModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.className = 'donation-modal-backdrop';
  modal.id = 'donationModal';
  modal.innerHTML = `
    <section class="donation-modal" role="dialog" aria-modal="true" aria-labelledby="donationTitle">
      <button class="modal-close" type="button" aria-label="Close donation options">&times;</button>
      <span class="eyebrow">Support the initiative</span>
      <h2 id="donationTitle">Choose your donation</h2>
      <p>Your donation is recorded as a simulated payment for this demo.</p>
      ${isAuthenticated ? `
        <div class="donation-options">
          <button type="button" data-amount="50">R50</button>
          <button type="button" data-amount="100">R100</button>
          <button type="button" data-amount="250">R250</button>
        </div>
        <label class="donation-custom">Custom amount (R)
          <input id="customDonationAmount" type="number" min="1" step="1" placeholder="Enter amount">
        </label>
        <button class="btn donation-confirm" type="button" disabled>Pay</button>
        <p class="form-status" id="donationStatus"></p>` : `
        <p>Please log in or create an account to make a donation.</p>
        <a class="btn" href="login.html">Log in to donate</a>`}
    </section>`;

  document.body.appendChild(modal);
  const close = () => modal.remove();
  modal.querySelector('.modal-close').addEventListener('click', close);
  modal.addEventListener('click', (event) => { if (event.target === modal) close(); });

  if (!isAuthenticated) return;

  let selectedAmount = null;
  const confirmButton = modal.querySelector('.donation-confirm');
  const status = modal.querySelector('#donationStatus');
  const custom = modal.querySelector('#customDonationAmount');
  const selectAmount = (amount, button = null) => {
    selectedAmount = Number(amount);
    modal.querySelectorAll('[data-amount]').forEach((option) => option.classList.toggle('is-selected', option === button));
    confirmButton.disabled = !Number.isFinite(selectedAmount) || selectedAmount <= 0;
  };

  modal.querySelectorAll('[data-amount]').forEach((button) => {
    button.addEventListener('click', () => {
      custom.value = '';
      selectAmount(button.dataset.amount, button);
    });
  });
  custom.addEventListener('input', () => selectAmount(custom.value));
  confirmButton.addEventListener('click', async () => {
    confirmButton.disabled = true;
    status.textContent = 'Processing payment…';
    status.className = 'form-status is-success';
    try {
      await createDonation(selectedAmount, `SIM-${Date.now()}`);
      status.textContent = `Thank you — your R${selectedAmount.toFixed(2)} donation was recorded.`;
    } catch (error) {
      status.textContent = error.message || 'Your donation could not be recorded.';
      status.className = 'form-status is-error';
      confirmButton.disabled = false;
    }
  });
}
