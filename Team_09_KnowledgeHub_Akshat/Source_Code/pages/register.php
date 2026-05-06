<?php
/**
 * pages/register.php â€” Full registration with address + confirm password.
 */
require_once dirname(__DIR__) . '/includes/init.php';
require_once dirname(__DIR__) . '/includes/db.php';

$pageTitle = 'Create Account';

if (isset($_SESSION['customer_id']) && (int)$_SESSION['customer_id'] > 0) {
    header('Location: home.php'); exit;
}

$flash = $_SESSION['flash'] ?? '';
$flashType = $_SESSION['flash_type'] ?? 'info';
unset($_SESSION['flash'], $_SESSION['flash_type']);

// Persist form values across POST redirect
$old = [];
foreach (['first_name','last_name','email','phone','address_line','city','state','pincode','country'] as $f) {
    $old[$f] = htmlspecialchars($_POST[$f] ?? '', ENT_QUOTES, 'UTF-8');
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $first   = trim($_POST['first_name']   ?? '');
    $last    = trim($_POST['last_name']    ?? '');
    $email   = trim($_POST['email']        ?? '');
    $phone   = trim($_POST['phone']        ?? '');
    $pass    = $_POST['password']          ?? '';
    $conf    = $_POST['confirm_password']  ?? '';
    $addrLine= trim($_POST['address_line'] ?? '');
    $city    = trim($_POST['city']         ?? '');
    $state   = trim($_POST['state']        ?? '');
    $pincode = trim($_POST['pincode']      ?? '');
    $country = trim($_POST['country']      ?? 'India');

    // --- Validation ---
    $errs = [];
    if ($first === '')  $errs[] = 'First name is required.';
    if ($last === '')   $errs[] = 'Last name is required.';
    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) $errs[] = 'A valid email is required.';
    if ($phone !== '' && !preg_match('/^\d{10}$/', $phone)) $errs[] = 'Phone must be 10 digits.';
    if (strlen($pass) < 6)   $errs[] = 'Password must be at least 6 characters.';
    if ($pass !== $conf)      $errs[] = 'Passwords do not match.';
    if ($addrLine === '')     $errs[] = 'Address line is required.';
    if ($city === '')         $errs[] = 'City is required.';
    if ($state === '')        $errs[] = 'State is required.';
    if (!preg_match('/^\d{6}$/', $pincode)) $errs[] = 'Pincode must be 6 digits.';
    if ($country === '')      $country = 'India';

    if (!empty($errs)) {
        $_SESSION['flash'] = implode(' ', $errs);
        $_SESSION['flash_type'] = 'error';
        header('Location: register.php');
        exit;
    }

    // Email uniqueness
    $chk = $conn->prepare('SELECT customer_id FROM customer WHERE email = ? LIMIT 1');
    $chk->bind_param('s', $email);
    $chk->execute();
    if ($chk->get_result()->fetch_assoc()) {
        $_SESSION['flash'] = 'Email is already registered.';
        $_SESSION['flash_type'] = 'error';
        $chk->close();
        header('Location: register.php');
        exit;
    }
    $chk->close();

    // Insert customer
    $hash = password_hash($pass, PASSWORD_DEFAULT);
    $ins = $conn->prepare('INSERT INTO customer (first_name, last_name, email, phone_number, password, role) VALUES (?, ?, ?, ?, ?, "user")');
    $ins->bind_param('sssss', $first, $last, $email, $phone, $hash);

    if (!$ins->execute()) {
        $_SESSION['flash'] = 'Error creating account. Please try again.';
        $_SESSION['flash_type'] = 'error';
        header('Location: register.php');
        exit;
    }
    $newId = (int)$conn->insert_id;
    $ins->close();

    // Insert default address
    $fullName = $first . ' ' . $last;
    $aStmt = $conn->prepare('INSERT INTO address (customer_id, full_name, phone, address_line, city, state, pincode, country, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)');
    $aStmt->bind_param('isssssss', $newId, $fullName, $phone, $addrLine, $city, $state, $pincode, $country);
    $aStmt->execute();
    $aStmt->close();

    // Set session
    $_SESSION['customer_id'] = $newId;
    $_SESSION['role']        = 'user';
    $_SESSION['name']        = $first . ' ' . $last;

    $_SESSION['flash'] = 'Welcome to Knowledge Hub! Your account is ready.';
    $_SESSION['flash_type'] = 'success';
    header('Location: home.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Create Account â€” Knowledge Hub Books</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@600;700;800&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --accent:#ff6a00;--accent-h:#e05e00;--accent-light:rgba(255,106,0,.1);
  --bg:#f4f6fb;--card:#fff;--border:#e5e7eb;
  --text:#111827;--muted:#6b7280;--danger:#ef4444;--success:#10b981;--warn:#f59e0b;
}
body{font-family:'Inter',sans-serif;background:var(--bg);min-height:100vh}

/* ── Split Layout ── */
.reg-wrap{display:flex;width:100%;min-height:100vh}

/* LEFT */
.reg-left{
  flex:0 0 42%;
  background:linear-gradient(145deg,#ff416c 0%,#ff6a00 50%,#ff8f3f 100%);
  display:flex;flex-direction:column;justify-content:center;align-items:center;
  padding:60px 48px;text-align:center;position:relative;overflow:hidden;
}
.reg-left::before,.reg-left::after{
  content:'';position:absolute;border-radius:50%;
  background:rgba(255,255,255,.08);
}
.reg-left::before{width:420px;height:420px;top:-120px;left:-120px}
.reg-left::after{width:300px;height:300px;bottom:-80px;right:-80px}
.reg-left-inner{position:relative;z-index:2}
.reg-left h1{
  font-family:'Poppins',sans-serif;font-size:2.8rem;font-weight:800;
  color:#fff;line-height:1.15;margin-bottom:18px;
}
.reg-left p{color:rgba(255,255,255,.85);font-size:1.05rem;line-height:1.65;margin-bottom:36px}
.reg-left-btn{
  display:inline-block;border:2px solid rgba(255,255,255,.8);color:#fff;
  padding:12px 36px;border-radius:99px;font-size:.95rem;font-weight:600;
  text-decoration:none;transition:all .25s;
}
.reg-left-btn:hover{background:#fff;color:var(--accent);transform:scale(1.04)}

/* floating shapes */
.shape{position:absolute;border-radius:50%;opacity:.12;animation:float 6s ease-in-out infinite}
.shape-1{width:80px;height:80px;background:#fff;top:18%;left:12%;animation-delay:0s}
.shape-2{width:50px;height:50px;background:#fff;top:60%;left:72%;animation-delay:2s}
.shape-3{width:120px;height:120px;background:#fff;top:75%;left:8%;animation-delay:4s}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-18px)}}

/* Illustration icon */
.reg-icon{font-size:5rem;margin-bottom:28px;animation:pop .6s cubic-bezier(.34,1.56,.64,1) both}
@keyframes pop{from{opacity:0;transform:scale(.5)}to{opacity:1;transform:scale(1)}}

/* RIGHT */
.reg-right{
  flex:1;display:flex;justify-content:center;align-items:flex-start;
  padding:40px 32px;overflow-y:auto;background:var(--bg);
  max-height:100vh;
}
.reg-card{
  background:var(--card);width:100%;max-width:580px;
  border-radius:20px;padding:44px 44px 36px;
  box-shadow:0 8px 40px rgba(0,0,0,.08),0 2px 8px rgba(0,0,0,.04);
  animation:slideUp .45s ease both;
}
@keyframes slideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}

.reg-card h2{font-family:'Poppins',sans-serif;font-size:1.9rem;font-weight:700;color:var(--text);margin-bottom:4px}
.reg-card .sub{color:var(--muted);font-size:.9rem;margin-bottom:28px}

/* Section heading */
.sec-title{
  display:flex;align-items:center;gap:8px;font-size:.72rem;font-weight:700;
  text-transform:uppercase;letter-spacing:1px;color:var(--accent);
  margin:28px 0 18px;
}
.sec-title::after{content:'';flex:1;height:1px;background:var(--border)}

/* Grid rows */
.row-2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.row-3{display:grid;grid-template-columns:1fr 1fr;gap:14px}

/* Field */
.field{display:flex;flex-direction:column;gap:5px;margin-bottom:16px}
.field label{font-size:.8rem;font-weight:600;color:var(--muted);letter-spacing:.2px}
.field label .req{color:var(--accent)}

.inp{
  height:46px;padding:0 14px;
  border:1.5px solid var(--border);border-radius:9px;
  font-family:'Inter',sans-serif;font-size:.93rem;color:var(--text);
  background:#fff;transition:border .2s,box-shadow .2s;
  width:100%;
}
.inp:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-light)}
.inp.err{border-color:var(--danger);box-shadow:0 0 0 3px rgba(239,68,68,.1)}
.inp.ok{border-color:var(--success)}
.field-msg{font-size:.74rem;color:var(--danger);margin-top:2px;min-height:14px}

/* Password strength */
.strength-wrap{display:flex;gap:4px;margin-top:6px}
.s-bar{flex:1;height:3px;border-radius:2px;background:var(--border);transition:background .3s}
.strength-lbl{font-size:.72rem;font-weight:600;text-align:right;margin-top:3px}

/* Flash alert */
.alert{padding:12px 16px;border-radius:9px;font-size:.88rem;font-weight:500;margin-bottom:20px}
.alert-error{background:#fee2e2;color:#b91c1c;border:1px solid #fecaca}
.alert-success{background:#d1fae5;color:#065f46;border:1px solid #a7f3d0}

/* Submit button */
.btn-submit{
  width:100%;height:50px;background:var(--accent);color:#fff;
  border:none;border-radius:10px;font-family:'Inter',sans-serif;
  font-size:1rem;font-weight:700;cursor:pointer;margin-top:8px;
  transition:background .2s,transform .15s;position:relative;overflow:hidden;
  letter-spacing:.3px;
}
.btn-submit:hover:not(:disabled){background:var(--accent-h);transform:scale(1.015)}
.btn-submit:active{transform:scale(.98)}
.btn-submit:disabled{background:#d1d5db;cursor:not-allowed;color:#9ca3af}
.btn-submit.loading{color:transparent}
.btn-submit.loading::after{
  content:'';position:absolute;inset:0;margin:auto;
  width:20px;height:20px;border:2.5px solid rgba(255,255,255,.4);
  border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;
}
@keyframes spin{to{transform:rotate(360deg)}}

.back-link{display:block;text-align:center;margin-top:20px;font-size:.85rem;color:var(--muted)}
.back-link a{color:var(--text);font-weight:600;text-decoration:none}
.back-link a:hover{color:var(--accent)}

/* Responsive */
@media(max-width:900px){
  .reg-wrap{flex-direction:column}
  .reg-left{flex:none;padding:44px 28px 48px;min-height:240px}
  .reg-left h1{font-size:2rem}
  .reg-right{padding:28px 16px 48px}
  .reg-card{padding:30px 24px;border-radius:14px}
}
@media(max-width:520px){
  .row-2,.row-3{grid-template-columns:1fr}
  .reg-card{padding:24px 16px}
}
</style>
</head>
<body>
<div class="reg-wrap">

  <!-- LEFT -->
  <div class="reg-left">
    <div class="shape shape-1"></div>
    <div class="shape shape-2"></div>
    <div class="shape shape-3"></div>
    <div class="reg-left-inner">
      <div class="reg-icon">
        <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.95)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
        </svg>
      </div>
      <h1>Create Your Account</h1>
      <p>Join thousands of readers on Knowledge Hub.<br>Track orders, save addresses, and checkout faster.</p>
      <a href="login.php" class="reg-left-btn">Sign In Instead</a>
    </div>
  </div>

  <!-- RIGHT -->
  <div class="reg-right">
    <div class="reg-card">
      <h2>Register</h2>
      <p class="sub">Fill in your details below to get started.</p>

      <?php if ($flash !== ''): ?>
      <div class="alert alert-<?= $flashType === 'error' ? 'error' : 'success' ?>"><?= htmlspecialchars($flash) ?></div>
      <?php endif; ?>

      <form method="post" action="register.php" id="reg-form" novalidate>

        <!-- â”€â”€ Section 1: Personal Info â”€â”€ -->
        <div class="sec-title">
          <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Personal Information
        </div>

        <div class="row-2">
          <div class="field">
            <label>First Name <span class="req">*</span></label>
            <input class="inp" type="text" name="first_name" id="f-first" required value="<?= $old['first_name'] ?>" placeholder="John" autocomplete="given-name">
            <div class="field-msg" id="m-first"></div>
          </div>
          <div class="field">
            <label>Last Name <span class="req">*</span></label>
            <input class="inp" type="text" name="last_name" id="f-last" required value="<?= $old['last_name'] ?>" placeholder="Doe" autocomplete="family-name">
            <div class="field-msg" id="m-last"></div>
          </div>
        </div>

        <div class="field">
          <label>Email Address <span class="req">*</span></label>
          <input class="inp" type="email" name="email" id="f-email" required value="<?= $old['email'] ?>" placeholder="john@example.com" autocomplete="email">
          <div class="field-msg" id="m-email"></div>
        </div>

        <div class="field">
          <label>Phone Number <span style="color:var(--muted);font-weight:400">(10 digits, optional)</span></label>
          <input class="inp" type="tel" name="phone" id="f-phone" maxlength="10" value="<?= $old['phone'] ?>" placeholder="9876543210" autocomplete="tel">
          <div class="field-msg" id="m-phone"></div>
        </div>

        <!-- â”€â”€ Section 2: Password â”€â”€ -->
        <div class="sec-title">
          <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          Security
        </div>

        <div class="row-2">
          <div class="field">
            <label>Password <span class="req">*</span></label>
            <input class="inp" type="password" name="password" id="f-pass" required placeholder="Min 6 characters" autocomplete="new-password">
            <div class="strength-wrap"><div class="s-bar" id="b1"></div><div class="s-bar" id="b2"></div><div class="s-bar" id="b3"></div></div>
            <div class="strength-lbl" id="s-lbl"></div>
            <div class="field-msg" id="m-pass"></div>
          </div>
          <div class="field">
            <label>Confirm Password <span class="req">*</span></label>
            <input class="inp" type="password" name="confirm_password" id="f-conf" required placeholder="Re-enter password" autocomplete="new-password">
            <div class="field-msg" id="m-conf"></div>
          </div>
        </div>

        <!-- â”€â”€ Section 3: Address â”€â”€ -->
        <div class="sec-title">
          <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><circle cx="12" cy="11" r="3"/></svg>
          Default Delivery Address
        </div>

        <div class="field">
          <label>Address Line <span class="req">*</span></label>
          <input class="inp" type="text" name="address_line" id="f-addr" required value="<?= $old['address_line'] ?>" placeholder="House No, Street, Area, Landmark">
          <div class="field-msg" id="m-addr"></div>
        </div>

        <div class="row-2">
          <div class="field">
            <label>City <span class="req">*</span></label>
            <input class="inp" type="text" name="city" required value="<?= $old['city'] ?>" placeholder="Mumbai">
          </div>
          <div class="field">
            <label>State <span class="req">*</span></label>
            <input class="inp" type="text" name="state" required value="<?= $old['state'] ?>" placeholder="Maharashtra">
          </div>
        </div>

        <div class="row-2">
          <div class="field">
            <label>Pincode <span class="req">*</span></label>
            <input class="inp" type="text" name="pincode" id="f-pin" required maxlength="6" pattern="\d{6}" value="<?= $old['pincode'] ?>" placeholder="400001">
            <div class="field-msg" id="m-pin"></div>
          </div>
          <div class="field">
            <label>Country <span class="req">*</span></label>
            <input class="inp" type="text" name="country" required value="<?= $old['country'] ?: 'India' ?>" placeholder="India">
          </div>
        </div>

        <button type="submit" class="btn-submit" id="btn-submit">Create Account</button>
      </form>

      <p class="back-link"><a href="home.php">â† Back to Home</a></p>
    </div>
  </div>
</div>

<script>
(function(){
  var form  = document.getElementById('reg-form');
  var fPass = document.getElementById('f-pass');
  var fConf = document.getElementById('f-conf');
  var btn   = document.getElementById('btn-submit');

  // â”€â”€ Inline validation helpers â”€â”€
  function setErr(inp, msgId, txt){
    if(inp){inp.classList.add('err');inp.classList.remove('ok');}
    var m=document.getElementById(msgId);if(m)m.textContent=txt;
  }
  function setOk(inp, msgId){
    if(inp){inp.classList.remove('err');inp.classList.add('ok');}
    var m=document.getElementById(msgId);if(m)m.textContent='';
  }
  function clr(inp,msgId){
    if(inp){inp.classList.remove('err','ok');}
    var m=document.getElementById(msgId);if(m)m.textContent='';
  }

  // Live: first name
  var fFirst=document.getElementById('f-first');
  if(fFirst) fFirst.addEventListener('blur',function(){
    this.value.trim()?setOk(this,'m-first'):setErr(this,'m-first','Required');
  });
  // Live: last name
  var fLast=document.getElementById('f-last');
  if(fLast) fLast.addEventListener('blur',function(){
    this.value.trim()?setOk(this,'m-last'):setErr(this,'m-last','Required');
  });
  // Live: email
  var fEmail=document.getElementById('f-email');
  if(fEmail) fEmail.addEventListener('blur',function(){
    var ok=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.value.trim());
    ok?setOk(this,'m-email'):setErr(this,'m-email','Enter a valid email');
  });
  // Live: phone
  var fPhone=document.getElementById('f-phone');
  if(fPhone) fPhone.addEventListener('input',function(){
    this.value=this.value.replace(/\D/g,'');
    if(this.value&&this.value.length!==10) setErr(this,'m-phone','Must be 10 digits');
    else clr(this,'m-phone');
  });
  // Live: pincode
  var fPin=document.getElementById('f-pin');
  if(fPin) fPin.addEventListener('input',function(){
    this.value=this.value.replace(/\D/g,'');
    if(this.value&&this.value.length!==6) setErr(this,'m-pin','Must be 6 digits');
    else clr(this,'m-pin');
  });
  // Live: address
  var fAddr=document.getElementById('f-addr');
  if(fAddr) fAddr.addEventListener('blur',function(){
    this.value.trim()?setOk(this,'m-addr'):setErr(this,'m-addr','Required');
  });

  // â”€â”€ Password strength â”€â”€
  fPass.addEventListener('input',function(){
    var v=this.value, s=0;
    if(v.length>=6) s++;
    if(v.length>=8&&/[A-Z]/.test(v)&&/[0-9]/.test(v)) s++;
    if(v.length>=10&&/[^A-Za-z0-9]/.test(v)) s++;
    var bars=[document.getElementById('b1'),document.getElementById('b2'),document.getElementById('b3')];
    var lbl=document.getElementById('s-lbl');
    var cols=['#ef4444','#f59e0b','#10b981'], labels=['Weak','Fair','Strong'];
    bars.forEach(function(b,i){b.style.background=i<=s?cols[s]:'var(--border)';});
    lbl.textContent=v?labels[s]:''; lbl.style.color=cols[s];
    // cross-check confirm
    if(fConf.value) checkConf();
  });

  // â”€â”€ Confirm password â”€â”€
  function checkConf(){
    if(fConf.value&&fConf.value!==fPass.value){
      setErr(fConf,'m-conf',"Passwords don't match");
    } else if(fConf.value){
      setOk(fConf,'m-conf');
    }
  }
  fConf.addEventListener('input', checkConf);

  // â”€â”€ Submit guard â”€â”€
  form.addEventListener('submit',function(e){
    var ok=true;
    // required fields
    form.querySelectorAll('[required]').forEach(function(inp){
      if(!inp.value.trim()){setErr(inp,'m-'+inp.id.replace('f-',''),'Required');ok=false;}
    });
    // password match
    if(fPass.value!==fConf.value){setErr(fConf,'m-conf',"Passwords don't match");ok=false;}
    if(fPass.value.length<6){setErr(fPass,'m-pass','Minimum 6 characters');ok=false;}
    if(!ok){e.preventDefault();return;}
    // loading
    btn.classList.add('loading'); btn.disabled=true;
  });
})();
</script>
</body>
</html>
