import { createDonation } from './api.js';

const PRESETS = [50, 100, 250, 500];

const IMPACT = {
  50: 'plants ~5 trees',
  100: 'funds a community clean-up',
  250: 'sponsors an education workshop',
  500: 'restores a section of wetland',
};

function formatZAR(n) {
  return `R${Number(n).toLocaleString('en-ZA', { minimumFractionDigits: 0 })}`;
}

function luhnValid(number) {
  const digits = number.replace(/\s+/g, '');
  if (!/^\d{13,19}$/.test(digits)) return false;
  let sum = 0;
  let dbl = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i]);
    if (dbl) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
    dbl = !dbl;
  }
  return sum % 10 === 0;
}

function cardBrand(number) {
  const n = number.replace(/\s+/g, '');
  if (/^4/.test(n)) return 'visa';
  if (/^(5[1-5]|2[2-7])/.test(n)) return 'mastercard';
  if (/^3[47]/.test(n)) return 'amex';
  if (/^6(?:011|5)/.test(n)) return 'discover';
  return null;
}

function formatCardNumber(value) {
  const digits = value.replace(/\D/g, '').slice(0, 19);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(value) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function openDonationModal(isAuthenticated) {
  const existing = document.getElementById('donationModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.className = 'donation-modal-backdrop';
  modal.id = 'donationModal';
  modal.innerHTML = `
    <section class="donation-modal donation-flow" role="dialog" aria-modal="true" aria-labelledby="donationTitle">
      <button class="modal-close" type="button" aria-label="Close donation options">&times;</button>
      <div class="donation-progress" aria-hidden="true">
        <span class="donation-step is-active" data-step="1">1</span>
        <span class="donation-step-bar"></span>
        <span class="donation-step" data-step="2">2</span>
        <span class="donation-step-bar"></span>
        <span class="donation-step" data-step="3">3</span>
      </div>
      <span class="eyebrow">Support the initiative</span>
      <h2 id="donationTitle">Choose your donation</h2>
      <p class="donation-sub">Every contribution plants trees, funds community programmes, and powers environmental education across Cape Town.</p>
      <div class="donation-body">
        ${isAuthenticated ? `
          <div class="donation-pane is-active" data-pane="1">
            <div class="donation-options">
              ${PRESETS.map((amt) => `<button type="button" class="donation-amount" data-amount="${amt}"><strong>${formatZAR(amt)}</strong><span>${IMPACT[amt]}</span></button>`).join('')}
            </div>
            <label class="donation-custom">Custom amount (R)
              <input id="customDonationAmount" type="number" min="1" step="1" placeholder="Enter amount">
            </label>
            <p class="donation-impact" id="donationImpact" hidden></p>
            <button class="btn donation-next" type="button" data-goto="2" disabled>Continue</button>
          </div>

          <div class="donation-pane" data-pane="2">
            <div class="donation-summary" id="donationSummary"></div>
            <div class="form-group">
              <label for="donorName">Full name</label>
              <input id="donorName" type="text" autocomplete="name" placeholder="Jane Mokoena">
            </div>
            <div class="form-group">
              <label for="donorEmail">Email for receipt</label>
              <input id="donorEmail" type="email" autocomplete="email" placeholder="jane@example.com">
            </div>
            <label class="donation-cover">
              <input id="donorCoverFee" type="checkbox">
              <span>Cover the processing fee so 100% goes to the cause</span>
            </label>
            <div class="donation-pane-actions">
              <button class="btn btn-secondary donation-back" type="button" data-goto="1">Back</button>
              <button class="btn donation-next" type="button" data-goto="3">Continue to payment</button>
            </div>
          </div>

          <div class="donation-pane" data-pane="3">
            <div class="donation-summary" id="donationSummaryPay"></div>
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
            <div class="donation-card-fields" id="donationCardFields">
              <div class="form-group">
                <label for="cardNumber">Card number</label>
                <div class="card-input-wrap">
                  <input id="cardNumber" type="text" inputmode="numeric" autocomplete="cc-number" placeholder="0000 0000 0000 0000" maxlength="19">
                  <span class="card-brand" id="cardBrand" aria-hidden="true"></span>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label for="cardExpiry">Expiry</label>
                  <input id="cardExpiry" type="text" inputmode="numeric" autocomplete="cc-exp" placeholder="MM/YY" maxlength="5">
                </div>
                <div class="form-group">
                  <label for="cardCvc">CVC</label>
                  <input id="cardCvc" type="text" inputmode="numeric" autocomplete="cc-csc" placeholder="123" maxlength="4">
                </div>
              </div>
            </div>
            <p class="donation-secure"><span class="lock-dot" aria-hidden="true"></span> Payments are encrypted end-to-end. Card details are never stored on our servers.</p>
            <div class="donation-pane-actions">
              <button class="btn btn-secondary donation-back" type="button" data-goto="2">Back</button>
              <button class="btn donation-confirm" type="button">Donate <span id="confirmAmount"></span></button>
            </div>
            <p class="form-status" id="donationStatus"></p>
          </div>

          <div class="donation-pane donation-success" data-pane="success">
            <div class="donation-success-mark" aria-hidden="true">
              <svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="25" fill="none"/><path fill="none" d="M14 27l8 8 16-18"/></svg>
            </div>
            <h3>Thank you for your generosity</h3>
            <p id="successMessage"></p>
            <p class="donation-receipt-note">A receipt has been sent to your email.</p>
            <button class="btn donation-done" type="button">Done</button>
          </div>` : `
          <p>Please log in or create an account to make a donation.</p>
          <a class="btn" href="login.html">Log in to donate</a>`}
      </div>
    </section>`;

  document.body.appendChild(modal);
  const close = () => modal.remove();
  modal.querySelector('.modal-close').addEventListener('click', close);
  modal.addEventListener('click', (event) => { if (event.target === modal) close(); });
  document.addEventListener('keydown', function esc(e) {
    if (e.key === 'Escape' && document.getElementById('donationModal')) { close(); document.removeEventListener('keydown', esc); }
  });

  if (!isAuthenticated) return;

  let selectedAmount = null;
  let selectedMethod = 'card';
  const steps = modal.querySelectorAll('.donation-step');
  const panes = modal.querySelectorAll('.donation-pane');
  const status = modal.querySelector('#donationStatus');
  const custom = modal.querySelector('#customDonationAmount');
  const impact = modal.querySelector('#donationImpact');

  function gotoPane(target) {
    panes.forEach((p) => p.classList.toggle('is-active', p.dataset.pane === String(target)));
    const idx = Number(target);
    steps.forEach((s) => s.classList.toggle('is-active', Number(s.dataset.step) <= idx));
    modal.querySelector('.donation-modal').scrollTop = 0;
  }

  function selectAmount(amount, button = null) {
    selectedAmount = Number(amount);
    modal.querySelectorAll('[data-amount]').forEach((option) => option.classList.toggle('is-selected', option === button));
    const next = modal.querySelector('[data-goto="2"]');
    next.disabled = !Number.isFinite(selectedAmount) || selectedAmount <= 0;
    if (impact) {
      const presetImpact = PRESETS.includes(selectedAmount) ? IMPACT[selectedAmount] : null;
      impact.hidden = !presetImpact && !(selectedAmount > 0);
      impact.textContent = presetImpact ? `Your ${formatZAR(selectedAmount)} gift ${presetImpact}.` : (selectedAmount > 0 ? `Your ${formatZAR(selectedAmount)} gift supports our work.` : '');
    }
    updateSummary();
  }

  function updateSummary() {
    const total = computeTotal();
    const summaryHtml = `<span class="donation-summary-label">You're donating</span><strong class="donation-summary-amount">${formatZAR(total)}</strong>`;
    const s1 = modal.querySelector('#donationSummary');
    const s2 = modal.querySelector('#donationSummaryPay');
    if (s1) s1.innerHTML = summaryHtml;
    if (s2) s2.innerHTML = summaryHtml;
    const confirmAmt = modal.querySelector('#confirmAmount');
    if (confirmAmt) confirmAmt.textContent = formatZAR(total);
  }

  function computeTotal() {
    const base = selectedAmount || 0;
    const cover = modal.querySelector('#donorCoverFee')?.checked;
    const fee = cover ? Math.round(base * 0.029 + 2) : 0;
    return base + fee;
  }

  modal.querySelectorAll('[data-amount]').forEach((button) => {
    button.addEventListener('click', () => {
      custom.value = '';
      selectAmount(button.dataset.amount, button);
    });
  });
  custom.addEventListener('input', () => selectAmount(custom.value));

  modal.querySelectorAll('[data-goto]').forEach((btn) => {
    btn.addEventListener('click', () => gotoPane(btn.dataset.goto));
  });

  modal.querySelector('#donorCoverFee')?.addEventListener('change', updateSummary);

  modal.querySelectorAll('.donation-pay-method').forEach((method) => {
    method.addEventListener('click', () => {
      modal.querySelectorAll('.donation-pay-method').forEach((m) => m.classList.remove('is-selected'));
      method.classList.add('is-selected');
      const input = method.querySelector('input[name="payMethod"]');
      if (input) { input.checked = true; selectedMethod = input.value; }
      modal.querySelector('#donationCardFields').style.display = selectedMethod === 'card' ? '' : 'none';
    });
  });

  const cardNumber = modal.querySelector('#cardNumber');
  const cardExpiry = modal.querySelector('#cardExpiry');
  const cardCvc = modal.querySelector('#cardCvc');
  const cardBrandEl = modal.querySelector('#cardBrand');

  cardNumber.addEventListener('input', () => {
    cardNumber.value = formatCardNumber(cardNumber.value);
    const brand = cardBrand(cardNumber.value);
    cardBrandEl.textContent = brand ? brand.toUpperCase() : '';
    cardBrandEl.className = `card-brand ${brand || ''}`;
  });
  cardExpiry.addEventListener('input', () => {
    cardExpiry.value = formatExpiry(cardExpiry.value);
  });
  cardCvc.addEventListener('input', () => {
    cardCvc.value = cardCvc.value.replace(/\D/g, '').slice(0, 4);
  });

  function validateCard() {
    const number = cardNumber.value.replace(/\s+/g, '');
    if (!luhnValid(number)) return 'Please enter a valid card number.';
    const [mm, yy] = cardExpiry.value.split('/');
    if (!mm || !yy || Number(mm) < 1 || Number(mm) > 12) return 'Enter a valid expiry date (MM/YY).';
    const now = new Date();
    const exp = new Date(2000 + Number(yy), Number(mm));
    if (exp < now) return 'That card has expired.';
    if (cardCvc.value.length < 3) return 'Enter the 3-digit CVC from the back of your card.';
    return null;
  }

  const confirmButton = modal.querySelector('.donation-confirm');
  confirmButton.addEventListener('click', async () => {
    if (selectedMethod === 'card') {
      const err = validateCard();
      if (err) {
        status.textContent = err;
        status.className = 'form-status is-error';
        return;
      }
    }
    confirmButton.disabled = true;
    const total = computeTotal();
    status.textContent = `Processing your ${formatZAR(total)} ${selectedMethod === 'paypal' ? 'PayPal' : 'card'} payment…`;
    status.className = 'form-status is-success';
    try {
      await createDonation(total, `SIM-${Date.now()}-${selectedMethod}`);
      const msg = modal.querySelector('#successMessage');
      msg.textContent = `Your ${formatZAR(total)} donation via ${selectedMethod === 'paypal' ? 'PayPal' : 'card'} has been received. You're helping Cape Town grow greener.`;
      gotoPane('success');
      steps.forEach((s) => s.classList.remove('is-active'));
      modal.querySelector('.donation-done').addEventListener('click', close);
    } catch (error) {
      status.textContent = error.message || 'Your donation could not be processed.';
      status.className = 'form-status is-error';
      confirmButton.disabled = false;
    }
  });
}
