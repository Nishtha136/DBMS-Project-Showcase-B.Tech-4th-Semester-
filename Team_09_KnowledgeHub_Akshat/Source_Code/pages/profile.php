<?php
/**
 * pages/profile.php — User profile dashboard with address management.
 */
require_once dirname(__DIR__) . '/includes/init.php';
require_once dirname(__DIR__) . '/includes/db.php';

if (!isset($_SESSION['customer_id']) || (int)$_SESSION['customer_id'] <= 0) {
    $_SESSION['flash'] = 'Please log in to view your profile.';
    $_SESSION['flash_type'] = 'error';
    header('Location: login.php'); exit;
}

$cid = (int)$_SESSION['customer_id'];

// Fetch customer
$cStmt = $conn->prepare('SELECT first_name, last_name, email, phone_number FROM customer WHERE customer_id = ? LIMIT 1');
$cStmt->bind_param('i', $cid);
$cStmt->execute();
$customer = $cStmt->get_result()->fetch_assoc();
$cStmt->close();

if (!$customer) { header('Location: ../logout.php'); exit; }

// Fetch addresses
$aStmt = $conn->prepare('SELECT * FROM address WHERE customer_id = ? ORDER BY is_default DESC, address_id ASC');
$aStmt->bind_param('i', $cid);
$aStmt->execute();
$addresses = $aStmt->get_result()->fetch_all(MYSQLI_ASSOC);
$aStmt->close();

// Fetch order count
$oRes = $conn->query("SELECT COUNT(*) AS cnt FROM orders WHERE customer_id = $cid");
$orderCount = (int)($oRes ? $oRes->fetch_assoc()['cnt'] : 0);

// Fetch wishlist count
$wRes = $conn->query("SELECT COUNT(*) AS cnt FROM wishlist WHERE customer_id = $cid");
$wishCount = (int)($wRes ? $wRes->fetch_assoc()['cnt'] : 0);

$flash     = $_SESSION['flash'] ?? '';
$flashType = $_SESSION['flash_type'] ?? 'info';
unset($_SESSION['flash'], $_SESSION['flash_type']);

$fullName = htmlspecialchars($customer['first_name'] . ' ' . $customer['last_name']);
$initials = strtoupper(substr($customer['first_name'], 0, 1) . substr($customer['last_name'], 0, 1));

$pageTitle = 'My Profile';
$activeNav = 'profile';
require_once dirname(__DIR__) . '/components/navbar.php';
?>
<style>
/* ── Profile Layout ── */
.profile-page { padding: 0 0 60px; }

/* Hero */
.profile-hero {
    background: linear-gradient(135deg, #ff6a00 0%, #ff4e6a 60%, #ff8f3f 100%);
    position: relative;
    overflow: hidden;
    padding: 50px 0 80px;
    text-align: center;
}
.profile-hero::before, .profile-hero::after {
    content: '';
    position: absolute;
    border-radius: 50%;
    background: rgba(255,255,255,.08);
}
.profile-hero::before { width: 280px; height: 280px; top: -80px; left: -60px; }
.profile-hero::after  { width: 200px; height: 200px; bottom: -60px; right: -40px; }
.avatar-ring {
    width: 100px; height: 100px;
    border-radius: 50%;
    background: rgba(255,255,255,.25);
    border: 4px solid rgba(255,255,255,.6);
    display: flex; align-items: center; justify-content: center;
    font-size: 2.2rem; font-weight: 800; color: #fff;
    margin: 0 auto 14px;
    position: relative; z-index: 1;
    box-shadow: 0 8px 32px rgba(0,0,0,.15);
    letter-spacing: 1px;
}
.hero-name { font-size: 1.65rem; font-weight: 700; color: #fff; margin-bottom: 4px; z-index:1; position:relative; }
.hero-email { font-size: .9rem; color: rgba(255,255,255,.8); z-index:1; position:relative; }

/* Stats */
.stats-row {
    display: flex;
    justify-content: center;
    gap: 0;
    max-width: 500px;
    margin: -28px auto 0;
    background: var(--bg-primary);
    border-radius: 16px;
    box-shadow: 0 4px 24px rgba(0,0,0,.1);
    overflow: hidden;
    position: relative; z-index: 2;
}
.stat-item {
    flex: 1;
    text-align: center;
    padding: 20px 16px;
    border-right: 1px solid var(--border);
}
.stat-item:last-child { border-right: none; }
.stat-num { font-size: 1.6rem; font-weight: 800; color: var(--accent); }
.stat-lbl { font-size: .75rem; color: var(--text-secondary); margin-top: 2px; text-transform: uppercase; letter-spacing: .5px; }

/* Body */
.profile-body { max-width: 900px; margin: 36px auto 0; padding: 0 20px; }
.section-card {
    background: var(--bg-primary);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 28px;
    margin-bottom: 24px;
    box-shadow: 0 2px 12px rgba(0,0,0,.04);
}
.section-head {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 22px; padding-bottom: 14px;
    border-bottom: 1px solid var(--border);
}
.section-head h3 { font-size: 1.05rem; font-weight: 700; display: flex; align-items: center; gap: 8px; }

/* Edit Profile Form */
.edit-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
@media(max-width:600px){ .edit-grid{ grid-template-columns:1fr; } }
.pf-field { display: flex; flex-direction: column; gap: 6px; }
.pf-field label { font-size: .82rem; font-weight: 600; color: var(--text-secondary); }
.pf-input {
    padding: 10px 14px;
    border: 1.5px solid var(--border);
    border-radius: 8px;
    font-size: .95rem;
    background: var(--bg-secondary);
    color: var(--text-primary);
    transition: border .2s;
}
.pf-input:focus { outline: none; border-color: var(--accent); background: #fff; box-shadow: 0 0 0 3px rgba(255,106,0,.1); }
.pf-input[readonly] { background: var(--bg-tertiary); color: var(--text-secondary); cursor: not-allowed; }

/* Address Cards */
.addr-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(240px,1fr)); gap: 16px; }
.addr-card {
    border: 1.5px solid var(--border);
    border-radius: 12px;
    padding: 18px;
    position: relative;
    background: var(--bg-primary);
    transition: border .2s, box-shadow .2s, transform .2s;
}
.addr-card:hover { border-color: var(--accent); box-shadow: 0 4px 16px rgba(255,106,0,.1); transform: translateY(-2px); }
.addr-card.is-default { border-color: var(--accent); background: rgba(255,106,0,.03); }
.default-badge {
    position: absolute; top: 12px; right: 12px;
    background: var(--accent); color: #fff;
    font-size: .68rem; font-weight: 700;
    padding: 3px 10px; border-radius: 99px;
    text-transform: uppercase; letter-spacing: .5px;
}
.addr-name { font-weight: 700; font-size: .95rem; margin-bottom: 6px; }
.addr-line { font-size: .83rem; color: var(--text-secondary); line-height: 1.6; }
.addr-actions { display: flex; gap: 8px; margin-top: 14px; flex-wrap: wrap; }
.btn-sm {
    padding: 6px 14px; font-size: .78rem; font-weight: 600;
    border-radius: 7px; border: none; cursor: pointer;
    transition: all .2s; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;
}
.btn-sm-primary { background: var(--accent); color: #fff; }
.btn-sm-primary:hover { background: #e05e00; }
.btn-sm-outline { background: none; border: 1.5px solid var(--border); color: var(--text-primary); }
.btn-sm-outline:hover { border-color: var(--accent); color: var(--accent); }
.btn-sm-danger { background: none; border: 1.5px solid #fee2e2; color: #ef4444; }
.btn-sm-danger:hover { background: #fee2e2; }

/* Add address inline form */
.add-addr-collapse {
    border: 2px dashed var(--border); border-radius: 12px;
    padding: 20px; display: none; margin-top: 16px;
    background: var(--bg-secondary);
    animation: fadeIn .2s;
}
.add-addr-collapse.open { display: block; }
.addr-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.addr-form-grid .span2 { grid-column: 1/-1; }
@media(max-width:500px){ .addr-form-grid{grid-template-columns:1fr;} }

@keyframes fadeIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
</style>

<div class="profile-page">
    <!-- Hero -->
    <div class="profile-hero">
        <div class="avatar-ring"><?= $initials ?></div>
        <div class="hero-name"><?= $fullName ?></div>
        <div class="hero-email"><?= htmlspecialchars($customer['email']) ?></div>
    </div>

    <!-- Stats -->
    <div class="stats-row">
        <div class="stat-item">
            <div class="stat-num"><?= $orderCount ?></div>
            <div class="stat-lbl">Orders</div>
        </div>
        <div class="stat-item">
            <div class="stat-num"><?= count($addresses) ?></div>
            <div class="stat-lbl">Addresses</div>
        </div>
        <div class="stat-item">
            <div class="stat-num"><?= $wishCount ?></div>
            <div class="stat-lbl">Wishlist</div>
        </div>
    </div>

    <div class="profile-body">
        <!-- Flash -->
        <?php if ($flash !== '') {
            $cls = $flashType === 'error' ? 'alert-error' : 'alert-success';
            echo '<div class="alert ' . htmlspecialchars($cls) . '" style="margin-bottom:16px">' . htmlspecialchars($flash) . '</div>';
        } ?>

        <!-- Edit Profile -->
        <div class="section-card">
            <div class="section-head">
                <h3>
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Personal Information
                </h3>
                <button class="btn-sm btn-sm-outline" onclick="toggleEdit()">Edit Profile</button>
            </div>

            <form method="post" action="update_profile.php" id="edit-form">
                <div class="edit-grid">
                    <div class="pf-field">
                        <label>First Name</label>
                        <input class="pf-input" type="text" name="first_name" id="pf-first" value="<?= htmlspecialchars($customer['first_name']) ?>" readonly>
                    </div>
                    <div class="pf-field">
                        <label>Last Name</label>
                        <input class="pf-input" type="text" name="last_name" id="pf-last" value="<?= htmlspecialchars($customer['last_name']) ?>" readonly>
                    </div>
                    <div class="pf-field">
                        <label>Email Address</label>
                        <input class="pf-input" type="email" value="<?= htmlspecialchars($customer['email']) ?>" readonly>
                    </div>
                    <div class="pf-field">
                        <label>Phone Number</label>
                        <input class="pf-input" type="tel" name="phone_number" id="pf-phone" value="<?= htmlspecialchars($customer['phone_number'] ?? '') ?>" readonly maxlength="10">
                    </div>
                </div>
                <div id="edit-btns" style="display:none;margin-top:16px;display:none;gap:10px;">
                    <button type="submit" class="btn btn-primary" style="padding:10px 28px">Save Changes</button>
                    <button type="button" class="btn btn-secondary" style="padding:10px 24px" onclick="cancelEdit()">Cancel</button>
                </div>
            </form>
        </div>

        <!-- My Addresses -->
        <div class="section-card">
            <div class="section-head">
                <h3>
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    My Addresses
                </h3>
                <button class="btn-sm btn-sm-primary" onclick="toggleAddrForm()">+ Add Address</button>
            </div>

            <?php if (empty($addresses)): ?>
            <div style="text-align:center;padding:32px 0;color:var(--text-secondary);">
                <svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" style="margin:0 auto 12px;display:block;opacity:.4"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                <p>No addresses saved yet.</p>
            </div>
            <?php else: ?>
            <div class="addr-grid">
                <?php foreach ($addresses as $addr): ?>
                <div class="addr-card <?= $addr['is_default'] ? 'is-default' : '' ?>">
                    <?php if ($addr['is_default']): ?>
                    <span class="default-badge">⭐ Default</span>
                    <?php endif; ?>
                    <div class="addr-name"><?= htmlspecialchars($addr['full_name']) ?></div>
                    <div class="addr-line">
                        <?= htmlspecialchars($addr['address_line']) ?><br>
                        <?= htmlspecialchars($addr['city']) ?>, <?= htmlspecialchars($addr['state']) ?> – <?= htmlspecialchars($addr['pincode']) ?><br>
                        <?= htmlspecialchars($addr['country'] ?? 'India') ?><br>
                        📞 <?= htmlspecialchars($addr['phone']) ?>
                    </div>
                    <div class="addr-actions">
                        <?php if (!$addr['is_default']): ?>
                        <form method="post" action="address_action.php" style="margin:0">
                            <input type="hidden" name="action" value="set_default">
                            <input type="hidden" name="address_id" value="<?= (int)$addr['address_id'] ?>">
                            <button type="submit" class="btn-sm btn-sm-outline">Set Default</button>
                        </form>
                        <?php endif; ?>
                        <button class="btn-sm btn-sm-outline" onclick="showEditAddr(<?= htmlspecialchars(json_encode($addr)) ?>)">Edit</button>
                        <form method="post" action="address_action.php" onsubmit="return confirm('Delete this address?')" style="margin:0">
                            <input type="hidden" name="action" value="delete">
                            <input type="hidden" name="address_id" value="<?= (int)$addr['address_id'] ?>">
                            <button type="submit" class="btn-sm btn-sm-danger">Delete</button>
                        </form>
                    </div>
                </div>
                <?php endforeach; ?>
            </div>
            <?php endif; ?>

            <!-- Add / Edit Address Form -->
            <div class="add-addr-collapse" id="addr-form-wrap">
                <h4 id="addr-form-title" style="margin-bottom:16px;font-size:.95rem;">New Address</h4>
                <form method="post" action="address_action.php" id="addr-form">
                    <input type="hidden" name="action" id="addr-action" value="add">
                    <input type="hidden" name="address_id" id="addr-edit-id" value="">
                    <div class="addr-form-grid">
                        <div class="pf-field span2">
                            <label>Full Name *</label>
                            <input class="pf-input" type="text" name="full_name" id="af-name" required placeholder="e.g. Rahul Sharma">
                        </div>
                        <div class="pf-field">
                            <label>Phone (10 digits)</label>
                            <input class="pf-input" type="tel" name="phone" id="af-phone" maxlength="10" placeholder="9876543210">
                        </div>
                        <div class="pf-field">
                            <label>Pincode *</label>
                            <input class="pf-input" type="text" name="pincode" id="af-pin" maxlength="6" pattern="\d{6}" required placeholder="400001">
                        </div>
                        <div class="pf-field span2">
                            <label>Address Line *</label>
                            <input class="pf-input" type="text" name="address_line" id="af-line" required placeholder="House No, Street, Area">
                        </div>
                        <div class="pf-field">
                            <label>City *</label>
                            <input class="pf-input" type="text" name="city" id="af-city" required placeholder="Mumbai">
                        </div>
                        <div class="pf-field">
                            <label>State *</label>
                            <input class="pf-input" type="text" name="state" id="af-state" required placeholder="Maharashtra">
                        </div>
                        <div class="pf-field">
                            <label>Country *</label>
                            <input class="pf-input" type="text" name="country" id="af-country" required value="India">
                        </div>
                        <div class="pf-field" style="justify-content:flex-end;flex-direction:row;align-items:center;gap:8px;padding-top:20px">
                            <input type="checkbox" name="is_default" id="af-default" style="width:18px;height:18px">
                            <label for="af-default" style="font-size:.88rem;cursor:pointer">Set as default</label>
                        </div>
                    </div>
                    <div style="display:flex;gap:10px;margin-top:16px">
                        <button type="submit" class="btn btn-primary" style="padding:10px 28px">Save Address</button>
                        <button type="button" class="btn btn-secondary" style="padding:10px 20px" onclick="closeAddrForm()">Cancel</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Quick Links -->
        <div style="display:flex;gap:12px;flex-wrap:wrap">
            <a href="orders.php" class="btn btn-secondary" style="display:flex;align-items:center;gap:6px">
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                My Orders
            </a>
            <a href="wishlist.php" class="btn btn-secondary" style="display:flex;align-items:center;gap:6px">
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                Wishlist
            </a>
            <a href="../logout.php" class="btn" style="display:flex;align-items:center;gap:6px;padding:10px 20px;border:1.5px solid #fee2e2;color:#ef4444;border-radius:8px;text-decoration:none;font-weight:600;transition:all .2s" onmouseover="this.style.background='#fee2e2'" onmouseout="this.style.background=''">
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                Sign Out
            </a>
        </div>
    </div>
</div>

<script>
// ── Edit Profile ──
var editMode = false;
var editFields = ['pf-first','pf-last','pf-phone'];
function toggleEdit() {
    editMode = !editMode;
    editFields.forEach(id => { document.getElementById(id).readOnly = !editMode; });
    document.getElementById('edit-btns').style.display = editMode ? 'flex' : 'none';
}
function cancelEdit() {
    editMode = false;
    editFields.forEach(id => { document.getElementById(id).readOnly = true; });
    document.getElementById('edit-btns').style.display = 'none';
}

// ── Address Form ──
function toggleAddrForm() {
    var wrap = document.getElementById('addr-form-wrap');
    wrap.classList.toggle('open');
    if (wrap.classList.contains('open')) {
        // Reset to Add mode
        document.getElementById('addr-action').value = 'add';
        document.getElementById('addr-edit-id').value = '';
        document.getElementById('addr-form-title').textContent = 'New Address';
        document.getElementById('addr-form').reset();
        document.getElementById('af-country').value = 'India';
    }
}
function closeAddrForm() {
    document.getElementById('addr-form-wrap').classList.remove('open');
}
function showEditAddr(addr) {
    var wrap = document.getElementById('addr-form-wrap');
    wrap.classList.add('open');
    document.getElementById('addr-action').value = 'edit';
    document.getElementById('addr-edit-id').value = addr.address_id;
    document.getElementById('addr-form-title').textContent = 'Edit Address';
    document.getElementById('af-name').value    = addr.full_name || '';
    document.getElementById('af-phone').value   = addr.phone || '';
    document.getElementById('af-pin').value     = addr.pincode || '';
    document.getElementById('af-line').value    = addr.address_line || '';
    document.getElementById('af-city').value    = addr.city || '';
    document.getElementById('af-state').value   = addr.state || '';
    document.getElementById('af-country').value = addr.country || 'India';
    document.getElementById('af-default').checked = addr.is_default == 1;
    wrap.scrollIntoView({ behavior:'smooth', block:'center' });
}
</script>

<?php require_once dirname(__DIR__) . '/components/footer.php'; ?>
