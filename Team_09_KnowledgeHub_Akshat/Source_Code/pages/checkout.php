<?php
/**
 * Checkout — Step 1: Select/Add address. Step 2: Payment method.
 */
require_once dirname(__DIR__) . '/includes/init.php';
require_once dirname(__DIR__) . '/includes/db.php';
require_once dirname(__DIR__) . '/includes/cart_service.php';

if (empty($_SESSION['cart'])) {
    header('Location: cart.php');
    exit;
}

if (!isset($_SESSION['customer_id']) || (int) $_SESSION['customer_id'] <= 0) {
    $_SESSION['flash'] = 'Please log in to continue checkout.';
    $_SESSION['flash_type'] = 'error';
    $_SESSION['redirect_after_login'] = 'pages/checkout.php';
    header('Location: ../login.php');
    exit;
}

$cid     = (int) $_SESSION['customer_id'];
$summary = cart_checkout_summary($conn, $_SESSION['cart']);

if ($summary['grand'] <= 0) {
    $_SESSION['flash'] = 'Your cart has no items in stock.';
    $_SESSION['flash_type'] = 'error';
    header('Location: cart.php');
    exit;
}

// Fetch saved addresses
$addrStmt = $conn->prepare('SELECT * FROM address WHERE customer_id = ? ORDER BY is_default DESC, address_id DESC');
$addrStmt->bind_param('i', $cid);
$addrStmt->execute();
$addrRes   = $addrStmt->get_result();
$addresses = [];
while ($r = $addrRes->fetch_assoc()) { $addresses[] = $r; }
$addrStmt->close();

// Resolve selected address
$selectedId = (int) ($_SESSION['selected_address_id'] ?? 0);
if ($selectedId === 0 && !empty($addresses)) {
    foreach ($addresses as $a) {
        if ($a['is_default']) { $selectedId = (int)$a['address_id']; break; }
    }
    if ($selectedId === 0) { $selectedId = (int)$addresses[0]['address_id']; }
}

$pageTitle = 'Secure Checkout';
$activeNav = 'checkout';
require_once dirname(__DIR__) . '/components/navbar.php';

$flash     = $_SESSION['flash'] ?? '';
$flashType = $_SESSION['flash_type'] ?? 'info';
unset($_SESSION['flash'], $_SESSION['flash_type']);
?>
<style>
/* ── Checkout Stepper ── */
.checkout-page { padding: 2rem 0 4rem; }
.checkout-stepper {
    display: flex;
    align-items: center;
    gap: 0;
    margin-bottom: 2.5rem;
    counter-reset: step;
}
.step {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-secondary);
    flex: 1;
    position: relative;
}
.step::after {
    content: '';
    flex: 1;
    height: 2px;
    background: var(--border);
    margin: 0 12px;
}
.step:last-child::after { display: none; }
.step.done .step-num, .step.active .step-num {
    background: var(--accent);
    color: #fff;
    border-color: var(--accent);
}
.step.active { color: var(--accent); }
.step.done { color: var(--success); }
.step.done .step-num { background: var(--success); border-color: var(--success); }
.step-num {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 2px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
    font-weight: 700;
    flex-shrink: 0;
    transition: all .3s;
}

/* ── Layout ── */
.checkout-layout {
    display: grid;
    grid-template-columns: 1fr 360px;
    gap: 2rem;
    align-items: start;
}
@media(max-width:860px){
    .checkout-layout { grid-template-columns: 1fr; }
}

/* ── Address Cards ── */
.address-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
}
.addr-card {
    border: 2px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 18px;
    cursor: pointer;
    transition: all .25s;
    position: relative;
    background: var(--bg-primary);
}
.addr-card:hover { border-color: var(--accent); transform: translateY(-2px); box-shadow: 0 4px 16px rgba(255,106,0,.12); }
.addr-card.selected { border-color: var(--accent); background: rgba(255,106,0,.04); }
.addr-card .addr-badge {
    position: absolute; top: 12px; right: 12px;
    background: var(--accent); color: #fff;
    font-size: 0.7rem; font-weight: 700;
    padding: 2px 8px; border-radius: 999px;
}
.addr-card .addr-name { font-weight: 700; margin-bottom: 4px; }
.addr-card .addr-line { font-size: 0.88rem; color: var(--text-secondary); line-height: 1.5; }
.addr-radio { position: absolute; opacity: 0; }
.addr-card input[type="radio"] { position: absolute; opacity: 0; width: 0; height: 0; }
.addr-check {
    width: 20px; height: 20px;
    border: 2px solid var(--border);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 8px;
    transition: all .2s;
}
.addr-card.selected .addr-check {
    border-color: var(--accent);
    background: var(--accent);
}
.addr-card.selected .addr-check::after {
    content: '';
    width: 8px; height: 8px;
    background: #fff;
    border-radius: 50%;
}

/* ── Add Address Form ── */
.add-addr-toggle {
    display: flex; align-items: center; gap: 10px;
    color: var(--accent); font-weight: 600; cursor: pointer;
    border: 2px dashed var(--accent);
    border-radius: var(--radius-lg);
    padding: 14px 20px;
    background: rgba(255,106,0,.04);
    transition: background .2s;
    user-select: none;
}
.add-addr-toggle:hover { background: rgba(255,106,0,.08); }
.add-addr-form {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 24px;
    margin-top: 1rem;
    display: none;
}
.add-addr-form.open { display: block; animation: fadeIn .2s ease; }
.addr-form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
}
.addr-form-grid .full-width { grid-column: 1/-1; }
.addr-field { display: flex; flex-direction: column; gap: 6px; }
.addr-field label { font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); }
.addr-field input, .addr-field select {
    padding: 10px 14px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-size: 0.95rem;
    background: var(--bg-primary);
    color: var(--text-primary);
    transition: border .2s;
}
.addr-field input:focus, .addr-field select:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(255,106,0,.12);
}

/* ── Payment Options ── */
.payment-section { margin-top: 2rem; }
.payment-section h3 { font-size: 1.1rem; margin-bottom: 1rem; }
.pay-option {
    display: flex; align-items: center; gap: 14px;
    border: 2px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 16px 20px;
    margin-bottom: 12px;
    cursor: pointer;
    transition: all .2s;
}
.pay-option:hover { border-color: var(--accent); }
.pay-option.selected { border-color: var(--accent); background: rgba(255,106,0,.04); }
.pay-option input[type="radio"] { display: none; }
.pay-radio-dot {
    width: 20px; height: 20px;
    border: 2px solid var(--border);
    border-radius: 50%;
    flex-shrink: 0;
    transition: all .2s;
    display: flex; align-items: center; justify-content: center;
}
.pay-option.selected .pay-radio-dot {
    border-color: var(--accent);
    background: var(--accent);
}
.pay-option.selected .pay-radio-dot::after {
    content: ''; width: 8px; height: 8px; background: #fff; border-radius: 50%;
}
.pay-label { font-weight: 600; }
.pay-sub { font-size: 0.82rem; color: var(--text-secondary); margin-top: 2px; }

/* ── Order Summary Sidebar ── */
.order-summary-box {
    background: var(--bg-primary);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 24px;
    position: sticky;
    top: 90px;
}
.summary-title { font-size: 1.1rem; font-weight: 700; margin-bottom: 1.25rem; padding-bottom: 12px; border-bottom: 1px solid var(--border); }
.sum-row { display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 10px; }
.sum-row.total { border-top: 1px dashed var(--border); padding-top: 14px; margin-top: 4px; font-weight: 700; font-size: 1.05rem; }
.sum-row.total span:last-child { color: var(--accent); font-size: 1.2rem; }
.sum-items { margin-bottom: 16px; }
.sum-item { display: flex; justify-content: space-between; font-size: 0.83rem; color: var(--text-secondary); margin-bottom: 6px; }
</style>

<div class="container checkout-page">
    <?php if ($flash !== '') {
        $cls = $flashType === 'error' ? 'alert-error' : ($flashType === 'success' ? 'alert-success' : 'alert-info');
        echo '<div class="alert ' . htmlspecialchars($cls) . '" style="margin-bottom:1.5rem;">' . htmlspecialchars($flash) . '</div>';
    } ?>

    <!-- Stepper -->
    <div class="checkout-stepper">
        <div class="step <?= empty($addresses) || $selectedId === 0 ? 'active' : 'done' ?>">
            <div class="step-num">1</div> Delivery Address
        </div>
        <div class="step <?= ($selectedId > 0) ? 'active' : '' ?>">
            <div class="step-num">2</div> Payment
        </div>
        <div class="step">
            <div class="step-num">3</div> Confirmation
        </div>
    </div>

    <div class="checkout-layout">
        <!-- LEFT: Address + Payment -->
        <div>
            <!-- Address Section -->
            <div class="checkout-card" style="background:var(--bg-primary);border:1px solid var(--border);border-radius:var(--radius-lg);padding:24px;margin-bottom:1.5rem;">
                <h2 style="font-size:1.15rem;margin-bottom:1.25rem;display:flex;align-items:center;gap:10px;">
                    <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    Delivery Address
                </h2>

                <form method="post" action="../place_order.php" id="checkout-form">
                    <input type="hidden" name="payment_method" value="COD" id="hidden-method">

                    <?php if (!empty($addresses)): ?>
                    <div class="address-grid" id="address-grid">
                        <?php foreach ($addresses as $addr):
                            $isSelected = ((int)$addr['address_id'] === $selectedId);
                        ?>
                        <label class="addr-card <?= $isSelected ? 'selected' : '' ?>" id="addr-card-<?= (int)$addr['address_id'] ?>">
                            <input type="radio" name="address_id"
                                   value="<?= (int)$addr['address_id'] ?>"
                                   <?= $isSelected ? 'checked' : '' ?>
                                   onchange="selectAddress(<?= (int)$addr['address_id'] ?>, this.closest('.addr-card'))">
                            <?php if ($addr['is_default']): ?>
                                <span class="addr-badge">Default</span>
                            <?php endif; ?>
                            <div class="addr-check"></div>
                            <div class="addr-name"><?= htmlspecialchars($addr['full_name']) ?></div>
                            <div class="addr-line">
                                <?= htmlspecialchars($addr['address_line']) ?><br>
                                <?= htmlspecialchars($addr['city']) ?>, <?= htmlspecialchars($addr['state']) ?> &mdash; <?= htmlspecialchars($addr['pincode']) ?><br>
                                &#128222; <?= htmlspecialchars($addr['phone']) ?>
                            </div>
                        </label>
                        <?php endforeach; ?>
                    </div>
                    <?php endif; ?>

                    <!-- Add New Address Toggle -->
                    <?php if (!empty($addresses)): ?>
                    <div class="add-addr-toggle" onclick="toggleAddrForm()" id="addr-toggle">
                        <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
                        Add New Address
                    </div>
                    <?php endif; ?>

                    <!-- Add New Address Form -->
                    <div class="add-addr-form <?= empty($addresses) ? 'open' : '' ?>" id="addr-form-wrap">
                        <form id="new-addr-form" method="post" action="save_address.php">
                        <h3 style="font-size:1rem;margin-bottom:16px;color:var(--text-primary);">New Address</h3>
                        <div class="addr-form-grid">
                            <div class="addr-field full-width">
                                <label>Full Name *</label>
                                <input type="text" name="full_name" placeholder="e.g. Rahul Sharma" required>
                            </div>
                            <div class="addr-field">
                                <label>Phone Number *</label>
                                <input type="tel" name="phone" placeholder="10-digit mobile" maxlength="10" pattern="\d{10}" required>
                            </div>
                            <div class="addr-field">
                                <label>Pincode *</label>
                                <input type="text" name="pincode" placeholder="6-digit pincode" maxlength="6" pattern="\d{6}" required>
                            </div>
                            <div class="addr-field full-width">
                                <label>Address Line *</label>
                                <input type="text" name="address_line" placeholder="House No, Street, Area" required>
                            </div>
                            <div class="addr-field">
                                <label>City *</label>
                                <input type="text" name="city" placeholder="City" required>
                            </div>
                            <div class="addr-field">
                                <label>State *</label>
                                <input type="text" name="state" placeholder="State" required>
                            </div>
                            <input type="hidden" name="country" value="India">
                            <div class="addr-field full-width" style="flex-direction:row;align-items:center;gap:8px;">
                                <input type="checkbox" name="is_default" id="cb-default" style="width:18px;height:18px;">
                                <label for="cb-default" style="font-size:0.9rem;cursor:pointer;">Set as default address</label>
                            </div>
                        </div>
                        <button type="submit" class="btn btn-primary" style="margin-top:16px;width:100%;">Save Address</button>
                        </form>
                    </div>

                    <!-- Payment Method -->
                    <div class="payment-section">
                        <h3>Payment Method</h3>

                        <label class="pay-option selected" id="pay-cod">
                            <input type="radio" name="pay_select" value="COD" checked onchange="setPayMethod('COD')">
                            <div class="pay-radio-dot"></div>
                            <div>
                                <div class="pay-label">
                                    <svg width="20" height="20" fill="none" stroke="#ff6a00" stroke-width="2" viewBox="0 0 24 24" style="vertical-align:middle;margin-right:8px"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 10h20"/><path d="M6 14h2"/><path d="M10 14h4"/></svg>
                                    Cash on Delivery
                                </div>
                                <div class="pay-sub">Pay when your order arrives at your door.</div>
                            </div>
                        </label>

                        <label class="pay-option" id="pay-upi">
                            <input type="radio" name="pay_select" value="UPI" onchange="setPayMethod('UPI')">
                            <div class="pay-radio-dot"></div>
                            <div>
                                <div class="pay-label">
                                    <svg width="20" height="20" fill="none" stroke="#ff6a00" stroke-width="2" viewBox="0 0 24 24" style="vertical-align:middle;margin-right:8px"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/><path d="M9 7h6"/></svg>
                                    UPI
                                </div>
                                <div class="pay-sub">Pay using GPay, PhonePe, or any UPI app.</div>
                            </div>
                        </label>

                        <label class="pay-option" id="pay-card">
                            <input type="radio" name="pay_select" value="Card" onchange="setPayMethod('Card')">
                            <div class="pay-radio-dot"></div>
                            <div>
                                <div class="pay-label">
                                    <svg width="20" height="20" fill="none" stroke="#ff6a00" stroke-width="2" viewBox="0 0 24 24" style="vertical-align:middle;margin-right:8px"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/><path d="M6 15h2"/></svg>
                                    Credit / Debit Card
                                </div>
                                <div class="pay-sub">Secure payment with OTP verification.</div>
                            </div>
                        </label>
                    </div>

                    <div id="addr-error" style="display:none;color:#ef4444;font-size:0.88rem;margin-bottom:12px;">
                        ⚠️ Please select a delivery address before proceeding.
                    </div>

                    <button type="button" onclick="submitCheckout()" id="btn-checkout"
                            class="btn btn-primary"
                            style="width:100%;padding:16px;font-size:1.05rem;margin-top:20px;display:flex;justify-content:center;align-items:center;gap:8px;">
                        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                        Place Order — ₹<?= number_format($summary['grand'], 2) ?>
                    </button>
                </form>
            </div>
        </div>

        <!-- RIGHT: Order Summary -->
        <aside class="order-summary-box">
            <div class="summary-title">Order Summary</div>

            <!-- Items -->
            <div class="sum-items">
                <?php
                $books = cart_load_books_by_ids($conn, $_SESSION['cart']);
                foreach ($_SESSION['cart'] as $bid => $qty):
                    $bid = (int)$bid; $qty = (int)$qty;
                    if (!isset($books[$bid])) continue;
                    $b = $books[$bid];
                    $lineTotal = (float)$b['price'] * $qty;
                ?>
                <div class="sum-item">
                    <span><?= htmlspecialchars($b['title']) ?> ×<?= $qty ?></span>
                    <span>₹<?= number_format($lineTotal, 2) ?></span>
                </div>
                <?php endforeach; ?>
            </div>

            <div class="sum-row">
                <span class="muted">Subtotal</span>
                <span>₹<?= number_format($summary['subtotal'], 2) ?></span>
            </div>
            <div class="sum-row">
                <span class="muted">GST (18%)</span>
                <span>₹<?= number_format($summary['gst'], 2) ?></span>
            </div>
            <div class="sum-row">
                <span class="muted">Delivery</span>
                <?php if ($summary['delivery'] == 0): ?>
                    <span style="color:var(--success);font-weight:600;">FREE</span>
                <?php else: ?>
                    <span>₹<?= number_format($summary['delivery'], 2) ?></span>
                <?php endif; ?>
            </div>
            <div class="sum-row total">
                <span>Total Due</span>
                <span>₹<?= number_format($summary['grand'], 2) ?></span>
            </div>

            <div style="margin-top:16px;text-align:center;">
                <a href="cart.php" style="font-size:0.85rem;color:var(--text-secondary);text-decoration:none;">← Back to Cart</a>
            </div>
        </aside>
    </div>
</div>

<script>
// ── Address Selection — highlight selected card ──
function selectAddress(id, cardEl) {
    document.querySelectorAll('.addr-card').forEach(c => c.classList.remove('selected'));
    if (cardEl) cardEl.classList.add('selected');
    document.getElementById('addr-error').style.display = 'none';
}

// Also highlight on page load for the already-checked radio
document.querySelectorAll('.addr-card input[type="radio"]').forEach(radio => {
    if (radio.checked) radio.closest('.addr-card').classList.add('selected');
    radio.addEventListener('change', function() {
        document.querySelectorAll('.addr-card').forEach(c => c.classList.remove('selected'));
        this.closest('.addr-card').classList.add('selected');
        document.getElementById('addr-error').style.display = 'none';
    });
});

// ── Add Address Form Toggle ──
function toggleAddrForm() {
    const wrap = document.getElementById('addr-form-wrap');
    wrap.classList.toggle('open');
}

// ── Payment Method ──
var currentMethod = 'COD';
function setPayMethod(method) {
    currentMethod = method;
    ['COD','UPI','Card'].forEach(m => {
        const el = document.getElementById('pay-' + m.toLowerCase());
        if (el) el.classList.toggle('selected', m === method);
    });
    document.getElementById('hidden-method').value = method;
    const btn = document.getElementById('btn-checkout');
    if (method === 'Card') {
        btn.innerHTML = '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg> Proceed to Card Payment';
    } else {
        btn.innerHTML = '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg> Place Order — ₹<?= number_format($summary['grand'], 2) ?>';
    }
}

// ── Get selected address_id from radio group ──
function getSelectedAddressId() {
    const checked = document.querySelector('input[name="address_id"]:checked');
    return checked ? checked.value : '0';
}

// ── Submit Checkout ──
function submitCheckout() {
    const addrId = getSelectedAddressId();
    <?php if (!empty($addresses)): ?>
    if (!addrId || addrId === '0') {
        document.getElementById('addr-error').style.display = 'block';
        document.getElementById('addr-error').scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }
    <?php endif; ?>

    const form = document.getElementById('checkout-form');
    if (currentMethod === 'Card') {
        // POST address_id + payment_method to payment.php
        const f = document.createElement('form');
        f.method = 'POST';
        f.action = 'payment.php';
        const addHidden = (n, v) => {
            const i = document.createElement('input');
            i.type = 'hidden'; i.name = n; i.value = v;
            f.appendChild(i);
        };
        addHidden('payment_method', 'Card');
        addHidden('address_id', addrId);
        document.body.appendChild(f);
        f.submit();
    } else {
        // For COD/UPI: radio is already inside the form, just submit
        form.action = '../place_order.php';
        form.submit();
    }
}

</script>

<?php require_once dirname(__DIR__) . '/components/footer.php'; ?>
