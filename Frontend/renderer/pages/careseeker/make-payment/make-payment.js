let selectedPaymentMode = 'CARD';
let selectedPaymentRequestId = null;

/* ===============================
   Payment method switch
=============================== */
document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
  radio.addEventListener('change', (e) => {
    selectedPaymentMode = e.target.value;

    document.getElementById('cardForm')
      .classList.toggle('hidden', selectedPaymentMode !== 'CARD');

    document.getElementById('upiForm')
      .classList.toggle('hidden', selectedPaymentMode !== 'UPI');
  });
});


/* ===============================
   Load completed requests
=============================== */
async function loadCompletedRequests() {
  try {
    const res = await api('/seeker/care-requests/completed', 'GET');
    if (!res.success) throw new Error(res.message);

    const tbody = document.getElementById('paymentTableBody');
    tbody.innerHTML = '';

    if (!res.data.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="no-completed-req">No completed requests</td>
        </tr>
      `;
      return;
    }

    res.data.forEach(req => {
      const isPaid = req.payment_status === 'PAID';

      const tr = document.createElement('tr');

      tr.innerHTML = `
        <td>#REQ${req.request_id}</td>
        <td>${req.care_type}</td>
        <td>₹${req.amount ?? '-'}</td>
        <td>
          <span class="status ${isPaid ? 'paid' : 'pending'}">
            ${isPaid ? 'Paid' : 'Payment Pending'}
          </span>
        </td>
        <td>
          ${isPaid ? '-' : `<button class="pay-btn" data-id="${req.request_id}">Pay Now</button>`}
        </td>
      `;

      tbody.appendChild(tr);
    });

    /* Attach click events (CSP-safe) */
    document.querySelectorAll('.pay-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        goToPayment(btn.dataset.id);
      });
    });

  } catch (err) {
    console.error(err);
    alert('Failed to load completed requests');
  }
}


/* ===============================
   Open payment popup
=============================== */
async function goToPayment(requestId) {
  try {
    const res = await api(`/seeker/payments/request/${requestId}`, 'GET');
    if (!res.success) throw new Error(res.message);

    selectedPaymentRequestId = requestId;
    selectedPaymentMode = 'CARD';

    document.getElementById('payAmount').textContent = res.data.amount;
    document.getElementById('paymentModal').style.display = 'flex';

    document.getElementById('cardForm').classList.remove('hidden');
    document.getElementById('upiForm').classList.add('hidden');

  } catch (err) {
    alert(err.message || 'Failed to load payment details');
  }
}


/* ===============================
   Close popup
=============================== */
function closePaymentModal() {
  selectedPaymentRequestId = null;
  document.getElementById('paymentModal').style.display = 'none';
}


/* ===============================
   Confirm payment
=============================== */
async function confirmPayment() {
  if (!selectedPaymentRequestId) return;

  try {
    const res = await api(
      `/seeker/payment/${selectedPaymentRequestId}`,
      'POST',
      { payment_mode: selectedPaymentMode }
    );

    if (!res.success) {
      alert(res.message || 'Payment failed');
      return;
    }

    alert('Payment successful 🎉');

    closePaymentModal();
    loadCompletedRequests();

  } catch (err) {
    console.error(err);
    alert('Something went wrong during payment');
  }
}


/* ===============================
   Init
=============================== */
window.addEventListener('DOMContentLoaded', loadCompletedRequests);

function logout() {
  localStorage.clear();
  location.href = "../../common/login/login.html";
}