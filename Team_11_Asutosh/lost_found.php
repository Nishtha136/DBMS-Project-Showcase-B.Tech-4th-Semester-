<?php
session_start();
include 'config.php';
if (!isset($_SESSION['user_id'])) { header("Location: login.php"); exit(); }

$uid     = $_SESSION['user_id'];
$success = '';
$error   = '';

// ── POST: Add new item ────────────────────────────────────────────────────────
if (isset($_POST['post_item'])) {
    $item    = trim($_POST['item_name']);
    $desc    = trim($_POST['description']);
    $loc     = trim($_POST['location']);
    $contact = trim($_POST['contact']);
    $type    = in_array($_POST['type'] ?? '', ['Lost','Found']) ? $_POST['type'] : 'Lost';

    $conn->begin_transaction();
    try {
        $stmt = $conn->prepare(
            "INSERT INTO LOST_FOUND (item_name, description, location, contact_info, type, user_id)
             VALUES (?, ?, ?, ?, ?, ?)"
        );
        $stmt->bind_param("sssssi", $item, $desc, $loc, $contact, $type, $uid);
        $stmt->execute();
        $conn->commit();
        $success = "Your item has been posted successfully!";
    } catch (Exception $e) {
        $conn->rollback();
        $error = "Something went wrong. Please try again.";
    }
}

// ── Stats ─────────────────────────────────────────────────────────────────────
$total_lost  = $conn->query("SELECT COUNT(*) FROM LOST_FOUND WHERE type='Lost'")->fetch_row()[0] ?? 0;
$total_found = $conn->query("SELECT COUNT(*) FROM LOST_FOUND WHERE type='Found'")->fetch_row()[0] ?? 0;
$open_count  = $conn->query("SELECT COUNT(*) FROM LOST_FOUND WHERE status='Open'")->fetch_row()[0] ?? 0;
$resolved_ct = $conn->query("SELECT COUNT(*) FROM LOST_FOUND WHERE status='Resolved'")->fetch_row()[0] ?? 0;

// ── Fetch all items (type + status + claimer join) ────────────────────────────
$res = $conn->query(
"SELECT LF.*, U1.name AS poster_name,
        U2.name  AS claimer_name,
        U2.email AS claimer_email,
        U2.user_id AS claimer_id
 FROM LOST_FOUND LF
 JOIN  USER U1 ON LF.user_id    = U1.user_id
 LEFT JOIN USER U2 ON LF.claimed_by = U2.user_id
 ORDER BY FIELD(LF.status,'Open','Claimed','Resolved'), LF.created_at DESC"
);
$items = [];
if ($res) while ($row = $res->fetch_assoc()) $items[] = $row;
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lost &amp; Found — CBIRS</title>
  <link rel="stylesheet" href="style.css">
  <style>
    /* ── Tracking-specific styles ─────────────────────────────────── */
    .lf-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;
      margin-bottom: 28px;
    }
    .lf-stat {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 16px;
      text-align: center;
    }
    .lf-stat-num  { font-size: 1.8rem; font-weight: 800; color: var(--text-primary); }
    .lf-stat-lbl  { font-size: .72rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: .07em; margin-top: 4px; }

    .type-radio-group { display: flex; gap: 10px; margin-bottom: 4px; }
    .type-radio-btn {
      flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;
      padding: 10px; border-radius: var(--radius-sm); cursor: pointer;
      border: 2px solid var(--border); background: var(--bg-input);
      color: var(--text-secondary); font-size: .88rem; font-weight: 600;
      transition: all .2s;
    }
    .type-radio-btn input { display: none; }
    .type-radio-btn:has(input:checked) { border-color: var(--accent); color: var(--accent-light); background: rgba(99,102,241,.12); }
    .type-radio-btn.lost-btn:has(input:checked) { border-color: #f87171; color: #fca5a5; background: rgba(239,68,68,.12); }

    /* ── Tab bar ──────────────────────────────────────────────────── */
    .lf-tabs { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
    .lf-tab {
      padding: 7px 18px; border-radius: 999px; border: 1px solid var(--border);
      background: var(--bg-card); color: var(--text-secondary);
      font-size: .82rem; font-weight: 600; cursor: pointer; transition: all .2s;
    }
    .lf-tab:hover { border-color: var(--accent); color: var(--accent-light); }
    .lf-tab.active { background: var(--accent); border-color: var(--accent); color: #fff; }

    /* ── Status filter ────────────────────────────────────────────── */
    .status-filter { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
    .sf-btn {
      padding: 4px 14px; border-radius: 999px; border: 1px solid var(--border);
      background: transparent; color: var(--text-muted);
      font-size: .76rem; font-weight: 600; cursor: pointer; transition: all .2s;
    }
    .sf-btn.active-open     { border-color:#fbbf24; color:#fbbf24; background:rgba(245,158,11,.1); }
    .sf-btn.active-claimed  { border-color:#93c5fd; color:#93c5fd; background:rgba(59,130,246,.1); }
    .sf-btn.active-resolved { border-color:#34d399; color:#34d399; background:rgba(16,185,129,.1); }
    .sf-btn.active-all      { border-color:var(--accent); color:var(--accent-light); background:rgba(99,102,241,.1); }

    /* ── Type badges ──────────────────────────────────────────────── */
    .badge-lost  { background:rgba(239,68,68,.15);  color:#fca5a5; border:1px solid rgba(239,68,68,.3); }
    .badge-found { background:rgba(16,185,129,.15); color:#34d399; border:1px solid rgba(16,185,129,.3); }
    .badge-open  { background:rgba(245,158,11,.15); color:#fbbf24; border:1px solid rgba(245,158,11,.3); }
    .badge-claimed  { background:rgba(59,130,246,.15); color:#93c5fd; border:1px solid rgba(59,130,246,.3); }

    /* ── Claimer info card ────────────────────────────────────────── */
    .claimer-card {
      margin-top: 8px; padding: 10px 12px;
      background: rgba(99,102,241,.1); border: 1px solid rgba(99,102,241,.25);
      border-radius: var(--radius-sm); font-size: .8rem;
    }
    .claimer-card strong { color: var(--accent-light); display: block; margin-bottom: 2px; }

    /* ── Action buttons ───────────────────────────────────────────── */
    .btn-claim {
      padding: 5px 12px; font-size: .78rem; border-radius: 6px; cursor: pointer; border: none;
      background: rgba(16,185,129,.15); color: #34d399; border: 1px solid rgba(16,185,129,.3);
      font-weight: 600; transition: all .2s;
    }
    .btn-claim:hover { background: rgba(16,185,129,.3); }
    .btn-resolve {
      padding: 5px 12px; font-size: .78rem; border-radius: 6px; cursor: pointer; border: none;
      background: rgba(99,102,241,.15); color: #a5b4fc; border: 1px solid rgba(99,102,241,.3);
      font-weight: 600; transition: all .2s;
    }
    .btn-resolve:hover { background: rgba(99,102,241,.3); }
    .item-hidden { display: none; }
  </style>
</head>
<body>
<div class="page-wrapper">
  <?php include 'navbar.php'; ?>

  <div class="main-content">

    <!-- Page Header -->
    <div class="page-header fade-in-up">
      <div style="display:flex; align-items:center; gap:12px; margin-bottom:8px;">
        <a href="dashboard.php" class="btn btn-secondary" style="padding:7px 14px; font-size:.8rem;">← Back</a>
        <div class="badge badge-info">🔍 Lost &amp; Found</div>
      </div>
      <h1>Lost &amp; Found Tracker</h1>
      <p>Report a lost or found item, track its status, and connect with finders.</p>
    </div>

    <!-- Stats Bar -->
    <div class="lf-stats fade-in-up">
      <div class="lf-stat">
        <div class="lf-stat-num" style="color:#fca5a5;"><?= $total_lost ?></div>
        <div class="lf-stat-lbl">🔴 Lost Items</div>
      </div>
      <div class="lf-stat">
        <div class="lf-stat-num" style="color:#34d399;"><?= $total_found ?></div>
        <div class="lf-stat-lbl">🟢 Found Items</div>
      </div>
      <div class="lf-stat">
        <div class="lf-stat-num" style="color:#fbbf24;"><?= $open_count ?></div>
        <div class="lf-stat-lbl">⏳ Still Open</div>
      </div>
      <div class="lf-stat">
        <div class="lf-stat-num" style="color:#34d399;"><?= $resolved_ct ?></div>
        <div class="lf-stat-lbl">✅ Resolved</div>
      </div>
    </div>

    <div style="display:grid; grid-template-columns:320px 1fr; gap:28px; align-items:start;">

      <!-- ── Post Item Form ──────────────────────────────────────── -->
      <div class="fade-in-up delay-1">
        <p class="section-title">📝 Post an Item</p>
        <div class="card">

          <?php if ($success): ?>
            <div class="alert alert-success">✅ <?= htmlspecialchars($success) ?></div>
          <?php endif; ?>
          <?php if ($error): ?>
            <div class="alert alert-error">⚠️ <?= htmlspecialchars($error) ?></div>
          <?php endif; ?>

          <form method="POST" id="lf-form">
            <!-- Type Selector -->
            <div class="form-group">
              <label class="form-label">Item Type</label>
              <div class="type-radio-group">
                <label class="type-radio-btn lost-btn">
                  <input type="radio" name="type" value="Lost" checked>
                  🔴 I Lost This
                </label>
                <label class="type-radio-btn">
                  <input type="radio" name="type" value="Found">
                  🟢 I Found This
                </label>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label" for="item_name">Item Name</label>
              <input id="item_name" class="form-control" type="text" name="item_name"
                     placeholder="e.g. Blue Backpack, iPhone 13" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="lf_location">Location Lost / Found</label>
              <input id="lf_location" class="form-control" type="text" name="location"
                     placeholder="e.g. Central Park, Bus Stop 12" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="lf_desc">Description</label>
              <textarea id="lf_desc" class="form-control" name="description"
                        placeholder="Colour, size, distinguishing features…" style="min-height:80px;"></textarea>
            </div>
            <div class="form-group">
              <label class="form-label" for="contact">Your Contact Info</label>
              <input id="contact" class="form-control" type="text" name="contact"
                     placeholder="Phone number or email" required>
            </div>
            <button type="submit" name="post_item" class="btn btn-primary btn-block">
              📌 Post Item
            </button>
          </form>
        </div>

        <!-- Legend -->
        <div class="card" style="margin-top:16px; padding:16px;">
          <p style="font-size:.78rem; color:var(--text-muted); margin-bottom:10px; font-weight:600; text-transform:uppercase; letter-spacing:.07em;">How It Works</p>
          <div style="font-size:.82rem; color:var(--text-secondary); line-height:2;">
            🟡 <strong style="color:var(--text-primary);">Open</strong> — actively looking<br>
            🔵 <strong style="color:var(--text-primary);">Claimed</strong> — someone responded<br>
            ✅ <strong style="color:var(--text-primary);">Resolved</strong> — item returned / closed<br><br>
            <span style="color:var(--accent-light);">🔴 Lost</span> items show a <em>"I Found This!"</em> button to other users.
          </div>
        </div>
      </div>

      <!-- ── Item Board ──────────────────────────────────────────── -->
      <div class="fade-in-up delay-2">
        <p class="section-title">📋 Item Board</p>

        <!-- Tab bar -->
        <div class="lf-tabs" id="lf-tabs">
          <button class="lf-tab active" data-tab="all">📋 All</button>
          <button class="lf-tab" data-tab="Lost">🔴 Lost</button>
          <button class="lf-tab" data-tab="Found">🟢 Found</button>
        </div>

        <!-- Status filter -->
        <div class="status-filter" id="status-filter">
          <button class="sf-btn active-all" data-sf="all">All Statuses</button>
          <button class="sf-btn" data-sf="Open">Open</button>
          <button class="sf-btn" data-sf="Claimed">Claimed</button>
          <button class="sf-btn" data-sf="Resolved">Resolved</button>
        </div>

        <!-- Table -->
        <div class="table-wrapper">
          <table id="lf-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Item</th>
                <th>Location</th>
                <th>Posted By</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <?php if (count($items) > 0): ?>
                <?php foreach ($items as $row):
                  $is_owner   = ((int)$row['user_id'] === $uid);
                  $can_claim  = !$is_owner && $row['type'] === 'Lost' && $row['status'] === 'Open';
                  $can_resolve= $is_owner && $row['status'] !== 'Resolved';
                  $show_claim_info = $is_owner && $row['status'] === 'Claimed' && !empty($row['claimer_name']);

                  $type_badge = $row['type'] === 'Lost'
                    ? '<span class="badge badge-lost">🔴 Lost</span>'
                    : '<span class="badge badge-found">🟢 Found</span>';

                  if ($row['status'] === 'Open')     $st_badge = '<span class="badge badge-open">⏳ Open</span>';
                  elseif ($row['status'] === 'Claimed') $st_badge = '<span class="badge badge-claimed">🔵 Claimed</span>';
                  else $st_badge = '<span class="badge badge-resolved">✅ Resolved</span>';
                ?>
                <tr class="lf-row"
                    data-type="<?= $row['type'] ?>"
                    data-status="<?= $row['status'] ?>">
                  <td><?= $type_badge ?></td>
                  <td>
                    <div style="font-weight:600; color:var(--text-primary);">
                      <?= htmlspecialchars($row['item_name']) ?>
                    </div>
                    <?php if ($row['description']): ?>
                    <div style="font-size:.78rem; color:var(--text-muted); margin-top:2px;">
                      <?= htmlspecialchars(mb_strimwidth($row['description'], 0, 60, '…')) ?>
                    </div>
                    <?php endif; ?>
                  </td>
                  <td>📍 <?= htmlspecialchars($row['location']) ?></td>
                  <td>
                    <div style="display:flex; align-items:center; gap:7px;">
                      <div style="width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent-purple));display:flex;align-items:center;justify-content:center;font-size:.72rem;font-weight:700;flex-shrink:0;">
                        <?= strtoupper(substr($row['poster_name'],0,1)) ?>
                      </div>
                      <div>
                        <div style="font-size:.85rem;"><?= htmlspecialchars($row['poster_name']) ?></div>
                        <?php if ($is_owner): ?>
                          <div style="font-size:.72rem; color:var(--accent-light);">You</div>
                        <?php endif; ?>
                      </div>
                    </div>
                  </td>
                  <td>
                    <?= $st_badge ?>
                    <!-- Claimer info — only visible to the item owner -->
                    <?php if ($show_claim_info): ?>
                    <div class="claimer-card">
                      <strong>🙋 Finder's Contact</strong>
                      <?= htmlspecialchars($row['claimer_name']) ?><br>
                      <span style="color:var(--accent-light);">✉ <?= htmlspecialchars($row['claimer_email']) ?></span>
                    </div>
                    <?php endif; ?>
                  </td>
                  <td style="color:var(--text-muted); font-size:.82rem; white-space:nowrap;">
                    <?= date('d M Y', strtotime($row['created_at'])) ?>
                  </td>
                  <td>
                    <div style="display:flex; flex-direction:column; gap:6px; min-width:110px;">
                      <?php if ($can_claim): ?>
                      <form method="POST" action="claim_item.php">
                        <input type="hidden" name="lf_id" value="<?= $row['lf_id'] ?>">
                        <button type="submit" name="claim_item" class="btn-claim"
                                onclick="return confirm('Confirm: you found this item? Your contact info will be shared with the owner.')">
                          🙋 I Found This!
                        </button>
                      </form>
                      <?php endif; ?>

                      <?php if ($can_resolve): ?>
                      <form method="POST" action="claim_item.php">
                        <input type="hidden" name="lf_id" value="<?= $row['lf_id'] ?>">
                        <button type="submit" name="resolve_item" class="btn-resolve"
                                onclick="return confirm('Mark this item as Resolved / returned?')">
                          ✅ Mark Resolved
                        </button>
                      </form>
                      <?php endif; ?>

                      <?php if (!$can_claim && !$can_resolve && !$is_owner): ?>
                        <span style="color:var(--text-muted); font-size:.78rem;">—</span>
                      <?php endif; ?>
                    </div>
                  </td>
                </tr>
                <?php endforeach; ?>
              <?php else: ?>
                <tr>
                  <td colspan="7" style="text-align:center; padding:48px; color:var(--text-muted);">
                    No items posted yet. Be the first to post!
                  </td>
                </tr>
              <?php endif; ?>
            </tbody>
          </table>
        </div><!-- /table-wrapper -->
      </div><!-- /board -->

    </div><!-- /grid -->
  </div><!-- /main-content -->
</div>

<script>
// ── Tab + Status filter logic ─────────────────────────────────────────────────
let activeTab = 'all';
let activeSf  = 'all';

function applyFilters() {
  document.querySelectorAll('#lf-table .lf-row').forEach(function(row) {
    const type   = row.dataset.type;
    const status = row.dataset.status;
    const matchTab = (activeTab === 'all' || type === activeTab);
    const matchSf  = (activeSf  === 'all' || status === activeSf);
    row.style.display = (matchTab && matchSf) ? '' : 'none';
  });
}

document.querySelectorAll('.lf-tab').forEach(function(btn) {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.lf-tab').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    activeTab = this.dataset.tab;
    applyFilters();
  });
});

document.querySelectorAll('.sf-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.sf-btn').forEach(b => {
      b.className = 'sf-btn';
    });
    const sf = this.dataset.sf;
    if (sf === 'all')      this.classList.add('active-all');
    else if(sf==='Open')   this.classList.add('active-open');
    else if(sf==='Claimed')this.classList.add('active-claimed');
    else                   this.classList.add('active-resolved');
    activeSf = sf;
    applyFilters();
  });
});
</script>
</body>
</html>