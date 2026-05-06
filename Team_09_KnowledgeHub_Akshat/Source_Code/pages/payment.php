<?php
require_once dirname(__DIR__) . '/includes/init.php';
require_once dirname(__DIR__) . '/includes/db.php';
require_once dirname(__DIR__) . '/includes/cart_service.php';

if (empty($_SESSION['cart'])) { header('Location: cart.php'); exit; }
if (!isset($_SESSION['customer_id']) || (int)$_SESSION['customer_id'] <= 0) { header('Location: ../login.php'); exit; }

$summary      = cart_checkout_summary($conn, $_SESSION['cart']);
$displayTotal = $summary['grand'];
if ($displayTotal <= 0) { header('Location: cart.php'); exit; }

// Store address_id from POST into session so place_order can use it
$addressId = (int)($_POST['address_id'] ?? $_SESSION['checkout_address_id'] ?? 0);
if ($addressId > 0) { $_SESSION['checkout_address_id'] = $addressId; }
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Secure Payment | Knowledge Hub</title>
<link rel="stylesheet" href="../css/style.css">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{
  background:#f0f4ff;min-height:100vh;
  display:flex!important;flex-direction:row!important;
  font-family:'Inter',sans-serif;
}
/* Full-page split */
.pay-wrap{
  display:flex;width:100%;min-height:100vh;
}
.pf{
  flex:1;padding:48px 52px;overflow-y:auto;
  background:#fff;
  display:flex;flex-direction:column;
}
.ps{
  width:360px;flex-shrink:0;
  background:#f8fafc;padding:40px 36px;
  overflow-y:auto;border-left:1px solid #f0f0f0;
}

.close-x{position:fixed;top:16px;right:20px;background:rgba(255,255,255,.9);border:1px solid #e5e7eb;border-radius:50%;width:36px;height:36px;font-size:1.2rem;cursor:pointer;color:#9ca3af;z-index:20;transition:all .2s;display:flex;align-items:center;justify-content:center;}
.close-x:hover{color:#111;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.1)}
/* Left panel header */
.pf-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:36px;padding-bottom:20px;border-bottom:1px solid #f3f4f6}
.pf-logo{display:flex;align-items:center;gap:10px;font-weight:700;font-size:1.2rem;color:#ff6a00}
.pf-logo-icon{width:36px;height:36px;background:#ff6a00;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff}
.timer-wrap{display:flex;gap:3px;align-items:center}
.td{background:#1a1f36;color:#fff;padding:5px 9px;border-radius:6px;font-family:monospace;font-weight:700;font-size:1rem}
/* Fields */
.fg{display:flex;flex-direction:column;gap:6px;margin-bottom:22px}
.fg label{font-size:.84rem;font-weight:600;color:#374151}
.fg small{font-size:.75rem;color:#9ca3af}
.fi-wrap{position:relative}
.fi{width:100%;height:48px;padding:0 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:.95rem;background:#f9fafb;color:#111;transition:border .2s,box-shadow .2s;outline:none}
.fi:focus{border-color:#ff6a00;background:#fff;box-shadow:0 0 0 3px rgba(255,106,0,.1)}
.fi.error-field{border-color:#ef4444;background:#fff5f5}
.fi-icon{position:absolute;right:14px;top:50%;transform:translateY(-50%);pointer-events:none}
.err-msg{color:#ef4444;font-size:.78rem;margin-top:4px;display:none}
.err-msg.show{display:block}
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.btn-pay-now{width:100%;padding:16px;background:linear-gradient(135deg,#ff6a00,#ff8f3f);color:#fff;border:none;border-radius:12px;font-size:1.05rem;font-weight:700;cursor:pointer;transition:all .2s;margin-top:8px;letter-spacing:.3px;}
.btn-pay-now:hover{background:linear-gradient(135deg,#e05e00,#ff6a00);transform:scale(1.01)}
.btn-pay-now:active{transform:scale(.98)}
.btn-pay-now:disabled{opacity:.6;cursor:not-allowed}
/* Right panel */
.ps-title{font-size:1rem;font-weight:700;color:#111;margin-bottom:24px;padding-bottom:14px;border-bottom:1px solid #e9ecef}
.vcard{background:linear-gradient(135deg,#1a1f36,#2d3561);border-radius:18px;padding:24px;height:190px;display:flex;flex-direction:column;justify-content:space-between;margin-bottom:32px;position:relative;overflow:hidden}
.vcard::before{content:'';position:absolute;width:160px;height:160px;background:rgba(255,106,0,.2);border-radius:50%;top:-40px;right:-40px}
.vc-chip{width:38px;height:28px;background:#d4af37;border-radius:5px}
.vc-nfc{position:absolute;top:20px;right:20px;opacity:.7}
.vc-num{font-family:monospace;font-size:1.1rem;letter-spacing:2px;color:#fff;font-weight:600;margin-top:4px}
.vc-bottom{display:flex;justify-content:space-between;align-items:center}
.vc-name{color:rgba(255,255,255,.85);font-size:.85rem;text-transform:uppercase;letter-spacing:1px}
.vc-exp{color:rgba(255,255,255,.85);font-size:.85rem}
.vc-brand{width:44px}
.ps-rows{display:flex;flex-direction:column;gap:0;flex:1}
.ps-row{display:flex;justify-content:space-between;align-items:center;font-size:.9rem;color:#6b7280;padding:12px 0;border-bottom:1px solid #f0f2f4}
.ps-row:last-child{border-bottom:none}
.ps-row span:last-child{color:#111;font-weight:600}
.ps-total{background:#fff;border-radius:14px;padding:18px 20px;margin-top:20px;border:2px solid rgba(255,106,0,.15);box-shadow:0 2px 12px rgba(255,106,0,.08)}
.ps-total-lbl{font-size:.8rem;color:#9ca3af;margin-bottom:4px}
.ps-total-amt{font-size:1.6rem;font-weight:800;color:#ff6a00;letter-spacing:-.5px}
/* OTP Modal */
.otp-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:999;display:none;align-items:center;justify-content:center;animation:fadeIn .2s}
.otp-overlay.show{display:flex}
.otp-box{background:#fff;border-radius:20px;padding:36px;max-width:420px;width:100%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.2);animation:slideIn .25s ease}
.otp-icon{width:64px;height:64px;background:rgba(255,106,0,.1);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px}
.otp-title{font-size:1.25rem;font-weight:700;color:#111;margin-bottom:6px}
.otp-sub{font-size:.87rem;color:#6b7280;margin-bottom:24px;line-height:1.5}
.otp-inputs{display:flex;gap:10px;justify-content:center;margin-bottom:20px}
.otp-in{width:48px;height:56px;border:2px solid #e5e7eb;border-radius:10px;font-size:1.4rem;font-weight:700;text-align:center;color:#111;transition:border .2s;outline:none}
.otp-in:focus{border-color:#ff6a00;box-shadow:0 0 0 3px rgba(255,106,0,.1)}
.otp-in.filled{border-color:#ff6a00;background:rgba(255,106,0,.04)}
.otp-err{color:#ef4444;font-size:.83rem;margin-bottom:12px;min-height:20px}
.btn-verify{width:100%;padding:14px;background:#ff6a00;color:#fff;border:none;border-radius:10px;font-size:1rem;font-weight:700;cursor:pointer;transition:background .2s}
.btn-verify:hover{background:#e05e00}
.btn-verify:disabled{opacity:.6;cursor:not-allowed}
.otp-timer{font-size:.82rem;color:#9ca3af;margin-top:12px}
.otp-timer strong{color:#ff6a00}
.otp-dev-hint{margin-top:12px;padding:10px;background:#f3f4f6;border-radius:8px;font-size:.78rem;color:#6b7280}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideIn{from{transform:translateY(-20px);opacity:0}to{transform:translateY(0);opacity:1}}
@media(max-width:768px){
  body{flex-direction:column}
  .pay-wrap{flex-direction:column;min-height:auto}
  .pf{padding:24px 20px}
  .ps{width:100%;padding:24px 20px;border-left:none;border-top:1px solid #f0f0f0}
  .form-row{grid-template-columns:1fr}
  .close-x{top:12px;right:12px}
}
@media(min-width:769px) and (max-width:1100px){
  .pf{padding:36px 40px}
  .ps{width:300px;padding:32px 28px}
}
</style>
</head>
<body>

<div class="pay-wrap">
  <button class="close-x" onclick="location.href='checkout.php'">&times;</button>

  <!-- LEFT: Payment Form -->
  <div class="pf">
    <div class="pf-head">
      <div class="pf-logo">
        <div class="pf-logo-icon">
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
        </div>
        SecurePay
      </div>
      <div class="timer-wrap">
        <span class="td" id="t0">0</span><span class="td" id="t1">5</span>
        <span style="color:#6b7280;font-weight:700">:</span>
        <span class="td" id="t2">0</span><span class="td" id="t3">0</span>
      </div>
    </div>

    <form id="pay-form">
      <input type="hidden" name="payment_method" value="Card">
      <input type="hidden" name="address_id" value="<?= htmlspecialchars($addressId) ?>">

      <!-- Cardholder Name -->
      <div class="fg">
        <label for="cc-name">Cardholder Name</label>
        <small>Enter name exactly as on card</small>
        <div class="fi-wrap">
          <input class="fi" type="text" id="cc-name" placeholder="e.g. Rahul Sharma" autocomplete="cc-name">
        </div>
        <span class="err-msg" id="e-name">Name on card is required.</span>
      </div>

      <!-- Card Number -->
      <div class="fg">
        <label for="cc-num">Card Number</label>
        <small>16-digit card number</small>
        <div class="fi-wrap">
          <svg class="fi-icon" width="22" height="16" viewBox="0 0 40 25" fill="none"><path d="M12.5 0C19.4 0 25 5.6 25 12.5S19.4 25 12.5 25 0 19.4 0 12.5 5.6 0 12.5 0Z" fill="#EB001B"/><path d="M27.5 0C34.4 0 40 5.6 40 12.5S34.4 25 27.5 25 15 19.4 15 12.5 20.6 0 27.5 0Z" fill="#F79E1B" fill-opacity=".8"/></svg>
          <input class="fi" type="text" id="cc-num" placeholder="XXXX  XXXX  XXXX  XXXX" maxlength="22" inputmode="numeric" style="padding-right:44px;font-family:monospace;font-size:1rem;letter-spacing:2px">
        </div>
        <span class="err-msg" id="e-num">Enter a valid 16-digit card number.</span>
      </div>

      <!-- CVV + Expiry -->
      <div class="form-row">
        <div class="fg" style="margin-bottom:0">
          <label for="cc-cvv">CVV</label>
          <small>3 digits on back of card</small>
          <div class="fi-wrap">
            <input class="fi" type="password" id="cc-cvv" placeholder="•••" maxlength="3" inputmode="numeric">
          </div>
          <span class="err-msg" id="e-cvv">Enter a valid 3-digit CVV.</span>
        </div>
        <div class="fg" style="margin-bottom:0">
          <label>Expiry Date</label>
          <small>MM/YY format</small>
          <div class="fi-wrap">
            <input class="fi" type="text" id="cc-exp" placeholder="MM/YY" maxlength="5" inputmode="numeric">
          </div>
          <span class="err-msg" id="e-exp">Enter a valid future expiry date.</span>
        </div>
      </div>

      <div style="margin-top:20px">
        <button type="button" class="btn-pay-now" id="btn-pay" onclick="validateAndShowOtp()">
          🔒 Pay ₹<?= number_format($displayTotal, 2) ?>
        </button>
      </div>
    </form>
  </div>

  <!-- RIGHT: Virtual Card + Summary -->
  <div class="ps">
    <div class="vcard">
      <svg class="vc-nfc" width="22" height="22" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="1.5" viewBox="0 0 24 24"><path d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"/></svg>
      <div class="vc-chip"></div>
      <div class="vc-num" id="v-num">•••• •••• •••• ••••</div>
      <div class="vc-bottom">
        <div>
          <div class="vc-name" id="v-name">YOUR NAME</div>
          <div class="vc-exp" id="v-exp">MM/YY</div>
        </div>
        <svg class="vc-brand" viewBox="0 0 40 25" fill="none"><path d="M12.5 0C19.4 0 25 5.6 25 12.5S19.4 25 12.5 25 0 19.4 0 12.5 5.6 0 12.5 0Z" fill="#EB001B"/><path d="M27.5 0C34.4 0 40 5.6 40 12.5S34.4 25 27.5 25 15 19.4 15 12.5 20.6 0 27.5 0Z" fill="#F79E1B" fill-opacity=".8"/></svg>
      </div>
    </div>

    <div class="ps-rows">
      <div class="ps-row"><span>Company</span><span>Knowledge Hub</span></div>
      <div class="ps-row"><span>Items</span><span>Books (<?= count($_SESSION['cart']) ?>)</span></div>
      <div class="ps-row"><span>Subtotal</span><span>₹<?= number_format($summary['subtotal'] ?? ($displayTotal - $summary['gst'] - $summary['delivery']), 2) ?></span></div>
      <div class="ps-row"><span>GST (18%)</span><span>₹<?= number_format($summary['gst'], 2) ?></span></div>
      <div class="ps-row"><span>Delivery</span><span style="color:<?= $summary['delivery'] == 0 ? '#10b981' : '#111' ?>"><?= $summary['delivery'] == 0 ? 'FREE' : '₹' . number_format($summary['delivery'], 2) ?></span></div>
    </div>

    <div class="ps-total">
      <div>
        <div class="ps-total-lbl">Total to Pay</div>
        <div class="ps-total-amt">₹<?= number_format($displayTotal, 2) ?></div>
      </div>
      <svg width="28" height="28" fill="none" stroke="#ff6a00" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
    </div>
  </div>
</div>

<!-- OTP Modal -->
<div class="otp-overlay" id="otp-overlay">
  <div class="otp-box">
    <div class="otp-icon">
      <svg width="28" height="28" fill="none" stroke="#ff6a00" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2v-1a4 4 0 00-8 0v1a2 2 0 002 2zM12 3C8.686 3 6 5.686 6 9v2h12V9c0-3.314-2.686-6-6-6z"/></svg>
    </div>
    <div class="otp-title">OTP Verification</div>
    <div class="otp-sub">We've sent a 6-digit OTP to your registered mobile number.<br>Please enter it below to complete payment.</div>

    <div class="otp-inputs">
      <input class="otp-in" type="text" maxlength="1" inputmode="numeric" id="o0">
      <input class="otp-in" type="text" maxlength="1" inputmode="numeric" id="o1">
      <input class="otp-in" type="text" maxlength="1" inputmode="numeric" id="o2">
      <input class="otp-in" type="text" maxlength="1" inputmode="numeric" id="o3">
      <input class="otp-in" type="text" maxlength="1" inputmode="numeric" id="o4">
      <input class="otp-in" type="text" maxlength="1" inputmode="numeric" id="o5">
    </div>

    <div class="otp-err" id="otp-err"></div>

    <button class="btn-verify" id="btn-verify" onclick="verifyOtp()">Verify & Complete Payment</button>

    <div class="otp-timer">OTP expires in <strong id="otp-countdown">60</strong>s &nbsp;|&nbsp; <a href="#" onclick="resendOtp();return false;" style="color:#ff6a00;text-decoration:none;">Resend OTP</a></div>

    <!-- Dev hint: shows OTP for testing -->
    <div class="otp-dev-hint" id="otp-dev-hint">
      🔧 <strong>Dev Mode:</strong> Your OTP is <strong id="otp-display">------</strong>
    </div>
  </div>
</div>

<!-- Real form that posts to place_order.php -->
<form id="real-pay-form" method="POST" action="../place_order.php" style="display:none">
  <input type="hidden" name="payment_method" value="Card">
  <input type="hidden" name="address_id" value="<?= htmlspecialchars($addressId) ?>">
</form>

<script>
// ── Timer (5 min) ──
var timeLeft = 300;
var timerIds = ['t0','t1','t2','t3'];
var payExpired = false;
var payTimer = setInterval(function(){
  timeLeft--;
  if (timeLeft <= 0) { clearInterval(payTimer); payExpired = true; alert('Payment session expired.'); location.href = 'checkout.php'; return; }
  var m = Math.floor(timeLeft/60), s = timeLeft%60;
  var str = (m < 10 ? '0'+m : ''+m) + (s < 10 ? '0'+s : ''+s);
  for (var i=0;i<4;i++) document.getElementById(timerIds[i]).textContent = str[i];
}, 1000);

// ── Card Input Sync ──
document.getElementById('cc-name').addEventListener('input', function(){
  document.getElementById('v-name').textContent = this.value.toUpperCase() || 'YOUR NAME';
  clearErr('e-name');
});
document.getElementById('cc-num').addEventListener('input', function(){
  var raw = this.value.replace(/\D/g,'');
  var parts = raw.match(/.{1,4}/g) || [];
  this.value = parts.join('  ');
  document.getElementById('v-num').textContent = raw.length > 12 ? '•••• •••• •••• ' + raw.slice(12,16) : '•••• •••• •••• ••••';
  clearErr('e-num');
});
document.getElementById('cc-exp').addEventListener('input', function(){
  var raw = this.value.replace(/\D/g,'');
  if (raw.length > 2) raw = raw.slice(0,2) + '/' + raw.slice(2,4);
  this.value = raw;
  document.getElementById('v-exp').textContent = raw || 'MM/YY';
  clearErr('e-exp');
});
document.getElementById('cc-cvv').addEventListener('input', function(){ clearErr('e-cvv'); });

function clearErr(id){ document.getElementById(id).classList.remove('show'); }
function showErr(id){ document.getElementById(id).classList.add('show'); document.getElementById(id).previousElementSibling.querySelector('.fi')?.classList.add('error-field'); }

// ── Validation ──
function validateAndShowOtp() {
  if (payExpired) { alert('Session expired.'); location.href = 'checkout.php'; return; }
  var ok = true;
  var name = document.getElementById('cc-name').value.trim();
  var numRaw = document.getElementById('cc-num').value.replace(/\D/g,'');
  var cvv = document.getElementById('cc-cvv').value.trim();
  var exp = document.getElementById('cc-exp').value.trim();

  if (!name) { document.getElementById('e-name').classList.add('show'); ok = false; }
  if (numRaw.length !== 16) { document.getElementById('e-num').classList.add('show'); ok = false; }
  if (!/^\d{3}$/.test(cvv)) { document.getElementById('e-cvv').classList.add('show'); ok = false; }

  // Validate expiry: must be MM/YY future date
  var expMatch = exp.match(/^(\d{2})\/(\d{2})$/);
  if (!expMatch) { document.getElementById('e-exp').classList.add('show'); ok = false; }
  else {
    var em = parseInt(expMatch[1]), ey = parseInt(expMatch[2]) + 2000;
    var now = new Date(); var nm = now.getMonth()+1, ny = now.getFullYear();
    if (em < 1 || em > 12 || ey < ny || (ey === ny && em < nm)) { document.getElementById('e-exp').classList.add('show'); ok = false; }
  }

  if (!ok) return;
  showOtpModal();
}

// ── OTP Logic ──
var currentOtp = '';
var otpCountdown = 60;
var otpTimer = null;

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function showOtpModal() {
  currentOtp = generateOtp();
  document.getElementById('otp-display').textContent = currentOtp;
  document.getElementById('otp-err').textContent = '';
  document.getElementById('otp-overlay').classList.add('show');
  ['o0','o1','o2','o3','o4','o5'].forEach(function(id){ document.getElementById(id).value = ''; document.getElementById(id).classList.remove('filled'); });
  document.getElementById('o0').focus();
  startOtpCountdown();
}

function startOtpCountdown() {
  if (otpTimer) clearInterval(otpTimer);
  otpCountdown = 60;
  document.getElementById('otp-countdown').textContent = otpCountdown;
  otpTimer = setInterval(function(){
    otpCountdown--;
    document.getElementById('otp-countdown').textContent = otpCountdown;
    if (otpCountdown <= 0) {
      clearInterval(otpTimer);
      document.getElementById('otp-err').textContent = 'OTP expired. Please resend.';
    }
  }, 1000);
}

function resendOtp() {
  currentOtp = generateOtp();
  document.getElementById('otp-display').textContent = currentOtp;
  document.getElementById('otp-err').textContent = 'New OTP generated.';
  startOtpCountdown();
}

// OTP input auto-advance
['o0','o1','o2','o3','o4','o5'].forEach(function(id, i) {
  var el = document.getElementById(id);
  el.addEventListener('input', function(){
    this.value = this.value.replace(/\D/g,'').slice(-1);
    if (this.value) { this.classList.add('filled'); if (i < 5) document.getElementById('o'+(i+1)).focus(); }
    else { this.classList.remove('filled'); }
    document.getElementById('otp-err').textContent = '';
  });
  el.addEventListener('keydown', function(e){
    if (e.key === 'Backspace' && !this.value && i > 0) document.getElementById('o'+(i-1)).focus();
  });
});

function verifyOtp() {
  if (otpCountdown <= 0) { document.getElementById('otp-err').textContent = 'OTP expired. Click Resend.'; return; }
  var entered = '';
  for (var i=0;i<6;i++) entered += document.getElementById('o'+i).value;
  if (entered.length < 6) { document.getElementById('otp-err').textContent = 'Please enter all 6 digits.'; return; }
  if (entered === currentOtp) {
    var btn = document.getElementById('btn-verify');
    btn.textContent = 'Verified! Processing...'; btn.disabled = true;
    document.getElementById('real-pay-form').submit();
  } else {
    document.getElementById('otp-err').textContent = '❌ Incorrect OTP. Please try again.';
    ['o0','o1','o2','o3','o4','o5'].forEach(function(id){ document.getElementById(id).value=''; document.getElementById(id).classList.remove('filled'); });
    document.getElementById('o0').focus();
  }
}
</script>
</body>
</html>
