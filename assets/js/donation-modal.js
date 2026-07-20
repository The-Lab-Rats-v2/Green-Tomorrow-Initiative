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
      <p>Every contribution plants trees, funds community programmes, and powers environmental education across Cape Town.</p>
      ${isAuthenticated ? `
        <div class="donation-options">
          <button type="button" data-amount="50">R50</button>
          <button type="button" data-amount="100">R100</button>
          <button type="button" data-amount="250">R250</button>
        </div>
        <label class="donation-custom">Custom amount (R)
          <input id="customDonationAmount" type="number" min="1" step="1" placeholder="Enter amount">
        </label>
        <p class="donation-pay-label">Payment method</p>
        <div class="donation-pay-methods">
          <label class="donation-pay-method is-selected">
            <input type="radio" name="payMethod" value="card" checked>
            <span class="pay-icon card" aria-hidden="true">CC</span>
            <span class="pay-label"><strong>Credit / debit card</strong><span>Visa, Mastercard, Amex</span></span>
          </label>
          <label class="donation-pay-method">
            <input type="radio" name="payMethod" value="paypal">
            <span class="pay-icon paypal" aria-hidden="true"></span>
            <span class="pay-label"><strong>PayPal</strong><span>Pay with your PayPal balance</span></span>
          </label>
        </div>
        <p class="donation-secure">Payments are processed securely. Card details are never stored on our servers.</p>
        <button class="btn donation-confirm" type="button" disabled>Continue to secure checkout</button>
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
  let selectedMethod = 'card';
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

  modal.querySelectorAll('.donation-pay-method').forEach((method) => {
    method.addEventListener('click', () => {
      modal.querySelectorAll('.donation-pay-method').forEach((m) => m.classList.remove('is-selected'));
      method.classList.add('is-selected');
      const input = method.querySelector('input[name="payMethod"]');
      if (input) { input.checked = true; selectedMethod = input.value; }
    });
  });

  confirmButton.addEventListener('click', async () => {
    confirmButton.disabled = true;
    status.textContent = `Redirecting to secure ${selectedMethod === 'paypal' ? 'PayPal' : 'card'} checkout…`;
    status.className = 'form-status is-success';
    try {
      await createDonation(selectedAmount, `SIM-${Date.now()}-${selectedMethod}`);
      status.textContent = `Thank you — your R${selectedAmount.toFixed(2)} donation was recorded via ${selectedMethod === 'paypal' ? 'PayPal' : 'card'}.`;
    } catch (error) {
      status.textContent = error.message || 'Your donation could not be recorded.';
      status.className = 'form-status is-error';
      confirmButton.disabled = false;
    }
  });
}
