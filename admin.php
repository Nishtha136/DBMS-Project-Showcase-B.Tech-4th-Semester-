<?php
session_start();
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'Admin') {
    header("Location: dashboard.php");
    exit();
}
include 'config.php';

$msg   = '';
$error = '';

// ── DML UPDATE via TRANSACTION (Rubric: TCL + DML) ─────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['update_status'])) {
    $issue_id = (int)$_POST['issue_id'];
    $status   = $_POST['new_status'];

    $conn->begin_transaction();                          // START TRANSACTION
    try {
        $stmt = $conn->prepare("UPDATE ISSUE SET status = ? WHERE issue_id = ?");
        $stmt->bind_param("si", $status, $issue_id);
        $stmt->execute();
        $conn->commit();                                 // COMMIT
        $msg = "Issue #$issue_id status updated to '$status'.";
    } catch (Exception $e) {
        $conn->rollback();                               // ROLLBACK on error
        $error = "Transaction failed — rolled back. " . $e->getMessage();
    }
}

// ── DML DELETE via TRANSACTION (Rubric: TCL + DML DELETE) ──────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['delete_issue'])) {
    $issue_id = (int)$_POST['issue_id'];

    $conn->begin_transaction();
    try {
        $stmt = $conn->prepare("DELETE FROM ISSUE WHERE issue_id = ?");
        $stmt->bind_param("i", $issue_id);
        $stmt->execute();
        $conn->commit();
        $msg = "Issue #$issue_id deleted successfully.";
    } catch (Exception $e) {
        $conn->rollback();
        $error = "Delete failed — rolled back.";
    }
}

// ── LOST & FOUND: UPDATE STATUS ───────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['update_lf_status'])) {
    $lf_id  = (int)$_POST['lf_id'];
    $status = $_POST['new_status'];

    $conn->begin_transaction();
    try {
        $stmt = $conn->prepare("UPDATE LOST_FOUND SET status = ? WHERE lf_id = ?");
        $stmt->bind_param("si", $status, $lf_id);
        $stmt->execute();
        $conn->commit();
        $msg = "Lost/Found Item #$lf_id status updated to '$status'.";
    } catch (Exception $e) {
        $conn->rollback();
        $error = "Update failed.";
    }
}

// ── LOST & FOUND: DELETE ──────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['delete_lf'])) {
    $lf_id = (int)$_POST['lf_id'];

    $conn->begin_transaction();
    try {
        $stmt = $conn->prepare("DELETE FROM LOST_FOUND WHERE lf_id = ?");
        $stmt->bind_param("i", $lf_id);
        $stmt->execute();
        $conn->commit();
        $msg = "Lost/Found Item #$lf_id deleted.";
    } catch (Exception $e) {
        $conn->rollback();
        $error = "Delete failed.";
    }
}

// ── QUERY 1: VIEW — issue_summary_view (Rubric: Views) ─────────────────────
$view_res = $conn->query(
    "SELECT * FROM issue_summary_view ORDER BY created_at DESC LIMIT 10"
);

// ── QUERY 2: GROUP BY + HAVING (Rubric: Group By & Having) ─────────────────
$group_res = $conn->query(
    "SELECT category,
            COUNT(*)                                                  AS total,
            SUM(CASE WHEN status='Resolved'    THEN 1 ELSE 0 END)    AS resolved,
            SUM(CASE WHEN status='Pending'     THEN 1 ELSE 0 END)    AS pending,
            SUM(CASE WHEN status='In Progress' THEN 1 ELSE 0 END)    AS in_progress
     FROM ISSUE
     GROUP BY category
     HAVING total > 0
     ORDER BY total DESC"
);

// ── QUERY 3: Subquery — users above average report count (Rubric: Subqueries)
$sub_res = $conn->query(
    "SELECT U.name, U.email, COUNT(I.issue_id) AS issue_count
     FROM USER U
     JOIN ISSUE I ON U.user_id = I.user_id
     GROUP BY U.user_id, U.name, U.email
     HAVING issue_count > (
         SELECT AVG(cnt) FROM (
             SELECT COUNT(*) AS cnt FROM ISSUE GROUP BY user_id
         ) AS sub
     )
     ORDER BY issue_count DESC"
);

// ── QUERY 4: Aggregate Functions (Rubric: Functions — Aggregate) ────────────
$agg = $conn->query(
    "SELECT COUNT(*)               AS total_issues,
            COUNT(DISTINCT user_id) AS unique_reporters,
            SUM(status='Resolved')  AS resolved_count,
            MAX(created_at)         AS latest_report,
            MIN(created_at)         AS earliest_report
     FROM ISSUE"
)->fetch_assoc();

// ── QUERY 5: Scalar Functions (Rubric: Functions — Scalar) ─────────────────
$scalar_res = $conn->query(
    "SELECT issue_id,
            UPPER(category)                        AS category_upper,
            CHAR_LENGTH(description)               AS desc_length,
            DATE_FORMAT(created_at,'%D %M %Y')     AS formatted_date,
            DATEDIFF(NOW(), created_at)            AS days_ago
     FROM ISSUE
     ORDER BY created_at DESC
     LIMIT 6"
);

// ── QUERY 6: Multi-table JOIN (Rubric: Joins) ───────────────────────────────
$join_res = $conn->query(
    "SELECT U.name, U.email, U.role,
            COUNT(DISTINCT I.issue_id)  AS issues_reported,
            COUNT(DISTINCT L.lf_id)     AS lf_posted
     FROM USER U
     LEFT JOIN ISSUE      I ON U.user_id = I.user_id
     LEFT JOIN LOST_FOUND L ON U.user_id = L.user_id
     GROUP BY U.user_id, U.name, U.email, U.role
     ORDER BY issues_reported DESC"
);

// All issues for status update panel
$all_issues = $conn->query(
    "SELECT I.issue_id, I.category, I.status, U.name
     FROM ISSUE I JOIN USER U ON I.user_id = U.user_id
     ORDER BY I.created_at DESC"
);

// All Lost & Found items for admin management
$all_lf = $conn->query(
    "SELECT L.lf_id, L.item_name, L.type, L.status, U.name
     FROM LOST_FOUND L JOIN USER U ON L.user_id = U.user_id
     ORDER BY L.created_at DESC"
);
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Panel — CBIRS</title>
  <link rel="stylesheet" href="style.css">
  <style>
    .query-tag {
      display: inline-block;
      font-size: .68rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 999px;
      text-transform: uppercase;
      letter-spacing: .06em;
      margin-left: 8px;
      vertical-align: middle;
    }
    .tag-view      { background:rgba(16,185,129,.15); color:#34d399; border:1px solid rgba(16,185,129,.25); }
    .tag-group     { background:rgba(245,158,11,.15);  color:#fbbf24; border:1px solid rgba(245,158,11,.25); }
    .tag-sub       { background:rgba(139,92,246,.15);  color:#c4b5fd; border:1px solid rgba(139,92,246,.25); }
    .tag-agg       { background:rgba(59,130,246,.15);  color:#93c5fd; border:1px solid rgba(59,130,246,.25); }
    .tag-scalar    { background:rgba(239,68,68,.15);   color:#fca5a5; border:1px solid rgba(239,68,68,.25); }
    .tag-join      { background:rgba(99,102,241,.15);  color:#a5b4fc; border:1px solid rgba(99,102,241,.25); }
    .tag-txn       { background:rgba(251,191,36,.15);  color:#fde68a; border:1px solid rgba(251,191,36,.25); }

    .agg-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }
    .agg-box {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 18px 16px;
      text-align: center;
    }
    .agg-value { font-size: 1.6rem; font-weight: 800; color: var(--text-primary); }
    .agg-label { font-size: .75rem; color: var(--text-secondary); margin-top: 4px; text-transform: uppercase; letter-spacing: .05em; }

    .progress-bar-bg { background: rgba(255,255,255,.07); border-radius: 999px; height: 6px; margin-top: 6px; overflow: hidden; }
    .progress-bar    { height: 6px; border-radius: 999px; background: linear-gradient(90deg, var(--accent), var(--accent-purple)); }

    .code-block {
      background: rgba(0,0,0,.4);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 12px 16px;
      font-family: 'Courier New', monospace;
      font-size: .78rem;
      color: #a5b4fc;
      margin-top: 10px;
      line-height: 1.7;
      overflow-x: auto;
      white-space: pre;
    }

    details > summary {
      cursor: pointer;
      font-size: .8rem;
      color: var(--text-muted);
      margin-top: 10px;
      user-select: none;
    }
    details > summary:hover { color: var(--accent-light); }

    .status-form { display: flex; gap: 8px; align-items: center; }
    .status-form select { padding: 5px 8px; font-size: .8rem; border-radius: 6px;
      background: rgba(255,255,255,.05); border: 1px solid var(--border);
      color: var(--text-primary); font-family: inherit; }
    .btn-xs { padding: 5px 12px; font-size: .78rem; border-radius: 6px; }
    .btn-delete { background: rgba(239,68,68,.15); color: #fca5a5; border: 1px solid rgba(239,68,68,.25); cursor:pointer; }
    .btn-delete:hover { background: rgba(239,68,68,.3); }
  </style>
</head>
<body>
<div class="page-wrapper">
  <?php include 'navbar.php'; ?>

  <div class="main-content">

    <!-- Header -->
    <div class="page-header fade-in-up">
      <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
        <div class="badge" style="background:rgba(245,158,11,.15);color:#fbbf24;border:1px solid rgba(245,158,11,.25);">⚙️ Admin Only</div>
      </div>
      <h1>Admin Analytics Panel</h1>
      <p>Live SQL queries demonstrating Views, GROUP BY, Subqueries, Transactions, Functions &amp; Joins.</p>
    </div>

    <!-- Flash messages -->
    <?php if ($msg):   ?><div class="alert alert-success fade-in-up">✅ <?= htmlspecialchars($msg) ?></div><?php endif; ?>
    <?php if ($error): ?><div class="alert alert-error   fade-in-up">⚠️ <?= htmlspecialchars($error) ?></div><?php endif; ?>

    <!-- ── AGGREGATE FUNCTIONS SUMMARY ────────────────────────────────── -->
    <p class="section-title fade-in-up delay-1">
      📊 Platform Statistics
      <span class="query-tag tag-agg">Aggregate Functions</span>
    </p>
    <div class="agg-grid fade-in-up delay-1">
      <div class="agg-box">
        <div class="agg-value"><?= $agg['total_issues']      ?? 0 ?></div>
        <div class="agg-label">Total Issues</div>
      </div>
      <div class="agg-box">
        <div class="agg-value"><?= $agg['unique_reporters']  ?? 0 ?></div>
        <div class="agg-label">Unique Reporters</div>
      </div>
      <div class="agg-box">
        <div class="agg-value"><?= $agg['resolved_count']    ?? 0 ?></div>
        <div class="agg-label">Resolved Issues</div>
      </div>
      <div class="agg-box">
        <div class="agg-value" style="font-size:1rem;">
          <?= $agg['latest_report'] ? date('d M Y', strtotime($agg['latest_report'])) : '—' ?>
        </div>
        <div class="agg-label">Latest Report (MAX)</div>
      </div>
      <div class="agg-box">
        <div class="agg-value" style="font-size:1rem;">
          <?= $agg['earliest_report'] ? date('d M Y', strtotime($agg['earliest_report'])) : '—' ?>
        </div>
        <div class="agg-label">First Report (MIN)</div>
      </div>
    </div>
    <details><summary>▶ View SQL Query</summary>
      <div class="code-block">SELECT COUNT(*) AS total_issues,
       COUNT(DISTINCT user_id) AS unique_reporters,
       SUM(status='Resolved')  AS resolved_count,
       MAX(created_at)         AS latest_report,
       MIN(created_at)         AS earliest_report
FROM ISSUE;</div>
    </details>

    <!-- ── GROUP BY + HAVING ──────────────────────────────────────────── -->
    <p class="section-title fade-in-up delay-1" style="margin-top:40px;">
      📂 Issues by Category
      <span class="query-tag tag-group">GROUP BY + HAVING</span>
    </p>
    <div class="table-wrapper fade-in-up delay-1">
      <table>
        <thead>
          <tr><th>Category</th><th>Total</th><th>Resolved</th><th>Pending</th><th>In Progress</th><th>Progress</th></tr>
        </thead>
        <tbody>
          <?php if ($group_res && $group_res->num_rows > 0): ?>
            <?php while ($r = $group_res->fetch_assoc()):
              $pct = $r['total'] > 0 ? round($r['resolved'] / $r['total'] * 100) : 0;
            ?>
            <tr>
              <td style="font-weight:600; color:var(--text-primary);"><?= htmlspecialchars($r['category']) ?></td>
              <td><span class="badge badge-info"><?= $r['total'] ?></span></td>
              <td style="color:#34d399;"><?= $r['resolved'] ?></td>
              <td style="color:#fbbf24;"><?= $r['pending'] ?></td>
              <td style="color:#93c5fd;"><?= $r['in_progress'] ?></td>
              <td style="min-width:120px;">
                <div style="font-size:.75rem; color:var(--text-muted); margin-bottom:3px;"><?= $pct ?>% resolved</div>
                <div class="progress-bar-bg"><div class="progress-bar" style="width:<?= $pct ?>%;"></div></div>
              </td>
            </tr>
            <?php endwhile; ?>
          <?php else: ?>
            <tr><td colspan="6" style="text-align:center;padding:32px;color:var(--text-muted);">No data yet.</td></tr>
          <?php endif; ?>
        </tbody>
      </table>
    </div>
    <details><summary>▶ View SQL Query</summary>
      <div class="code-block">SELECT category,
       COUNT(*)                                               AS total,
       SUM(CASE WHEN status='Resolved'    THEN 1 ELSE 0 END) AS resolved,
       SUM(CASE WHEN status='Pending'     THEN 1 ELSE 0 END) AS pending,
       SUM(CASE WHEN status='In Progress' THEN 1 ELSE 0 END) AS in_progress
FROM ISSUE
GROUP BY category
HAVING total > 0        -- HAVING filters after GROUP BY
ORDER BY total DESC;</div>
    </details>

    <!-- ── VIEW ──────────────────────────────────────────────────────── -->
    <p class="section-title fade-in-up delay-2" style="margin-top:40px;">
      👁️ Issue Summary View
      <span class="query-tag tag-view">SQL View</span>
    </p>
    <div class="table-wrapper fade-in-up delay-2">
      <table>
        <thead>
          <tr><th>#</th><th>Category</th><th>Location</th><th>Status</th><th>Reporter</th><th>Date</th></tr>
        </thead>
        <tbody>
          <?php if ($view_res && $view_res->num_rows > 0): ?>
            <?php while ($r = $view_res->fetch_assoc()):
              $badge = $r['status'] === 'Pending' ? 'badge-pending' : ($r['status'] === 'Resolved' ? 'badge-resolved' : 'badge-info');
            ?>
            <tr>
              <td style="color:var(--text-muted);">#<?= $r['issue_id'] ?></td>
              <td style="font-weight:600; color:var(--text-primary);"><?= htmlspecialchars($r['category']) ?></td>
              <td>📍 <?= htmlspecialchars($r['location']) ?></td>
              <td><span class="badge <?= $badge ?>"><?= htmlspecialchars($r['status']) ?></span></td>
              <td><?= htmlspecialchars($r['reporter_name']) ?></td>
              <td><?= date('d M Y', strtotime($r['created_at'])) ?></td>
            </tr>
            <?php endwhile; ?>
          <?php else: ?>
            <tr><td colspan="6" style="text-align:center;padding:32px;color:var(--text-muted);">No issues found in view.</td></tr>
          <?php endif; ?>
        </tbody>
      </table>
    </div>
    <details><summary>▶ View SQL Query</summary>
      <div class="code-block">-- VIEW DEFINITION (run once in setup.sql):
CREATE OR REPLACE VIEW issue_summary_view AS
  SELECT I.issue_id, I.category, I.description, I.location,
         I.status, I.created_at,
         U.name AS reporter_name, U.email AS reporter_email
  FROM ISSUE I
  INNER JOIN USER U ON I.user_id = U.user_id;

-- USAGE:
SELECT * FROM issue_summary_view WHERE status = 'Pending';</div>
    </details>

    <!-- ── SUBQUERY ───────────────────────────────────────────────────── -->
    <p class="section-title fade-in-up delay-2" style="margin-top:40px;">
      🔎 Top Reporters (Above Average)
      <span class="query-tag tag-sub">Subquery</span>
    </p>
    <div class="table-wrapper fade-in-up delay-2">
      <table>
        <thead><tr><th>Name</th><th>Email</th><th>Issues Reported</th></tr></thead>
        <tbody>
          <?php if ($sub_res && $sub_res->num_rows > 0): ?>
            <?php while ($r = $sub_res->fetch_assoc()): ?>
            <tr>
              <td style="font-weight:600; color:var(--text-primary);"><?= htmlspecialchars($r['name']) ?></td>
              <td><?= htmlspecialchars($r['email']) ?></td>
              <td><span class="badge badge-info">⬆️ <?= $r['issue_count'] ?></span></td>
            </tr>
            <?php endwhile; ?>
          <?php else: ?>
            <tr><td colspan="3" style="text-align:center;padding:32px;color:var(--text-muted);">Not enough data for subquery result.</td></tr>
          <?php endif; ?>
        </tbody>
      </table>
    </div>
    <details><summary>▶ View SQL Query</summary>
      <div class="code-block">-- Nested subquery: users who report MORE than the average
SELECT U.name, U.email, COUNT(I.issue_id) AS issue_count
FROM USER U
JOIN ISSUE I ON U.user_id = I.user_id
GROUP BY U.user_id, U.name, U.email
HAVING issue_count > (
    SELECT AVG(cnt)            -- inner subquery: compute average
    FROM (
        SELECT COUNT(*) AS cnt
        FROM ISSUE
        GROUP BY user_id
    ) AS sub
)
ORDER BY issue_count DESC;</div>
    </details>

    <!-- ── SCALAR FUNCTIONS ───────────────────────────────────────────── -->
    <p class="section-title fade-in-up delay-3" style="margin-top:40px;">
      🔡 Scalar Functions on Issues
      <span class="query-tag tag-scalar">Scalar Functions</span>
    </p>
    <div class="table-wrapper fade-in-up delay-3">
      <table>
        <thead><tr><th>#</th><th>UPPER(category)</th><th>CHAR_LENGTH(desc)</th><th>DATE_FORMAT(date)</th><th>DATEDIFF (days ago)</th></tr></thead>
        <tbody>
          <?php if ($scalar_res && $scalar_res->num_rows > 0): ?>
            <?php while ($r = $scalar_res->fetch_assoc()): ?>
            <tr>
              <td style="color:var(--text-muted);">#<?= $r['issue_id'] ?></td>
              <td style="font-weight:600; color:var(--accent-light);"><?= htmlspecialchars($r['category_upper']) ?></td>
              <td><?= $r['desc_length'] ?? '—' ?> chars</td>
              <td><?= htmlspecialchars($r['formatted_date']) ?></td>
              <td><span class="badge badge-pending"><?= $r['days_ago'] ?>d</span></td>
            </tr>
            <?php endwhile; ?>
          <?php else: ?>
            <tr><td colspan="5" style="text-align:center;padding:32px;color:var(--text-muted);">No data.</td></tr>
          <?php endif; ?>
        </tbody>
      </table>
    </div>
    <details><summary>▶ View SQL Query</summary>
      <div class="code-block">SELECT issue_id,
       UPPER(category)                    AS category_upper,
       CHAR_LENGTH(description)           AS desc_length,
       DATE_FORMAT(created_at,'%D %M %Y') AS formatted_date,
       DATEDIFF(NOW(), created_at)        AS days_ago
FROM ISSUE
ORDER BY created_at DESC LIMIT 6;</div>
    </details>

    <!-- ── MULTI-TABLE JOIN ───────────────────────────────────────────── -->
    <p class="section-title fade-in-up delay-3" style="margin-top:40px;">
      🔗 User Activity (Multi-table JOIN)
      <span class="query-tag tag-join">LEFT JOIN</span>
    </p>
    <div class="table-wrapper fade-in-up delay-3">
      <table>
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Issues</th><th>L&amp;F Posts</th></tr></thead>
        <tbody>
          <?php if ($join_res && $join_res->num_rows > 0): ?>
            <?php while ($r = $join_res->fetch_assoc()): ?>
            <tr>
              <td style="font-weight:600; color:var(--text-primary);">
                <div style="display:flex;align-items:center;gap:8px;">
                  <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent-purple));display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:700;flex-shrink:0;">
                    <?= strtoupper(substr($r['name'],0,1)) ?>
                  </div>
                  <?= htmlspecialchars($r['name']) ?>
                </div>
              </td>
              <td><?= htmlspecialchars($r['email']) ?></td>
              <td><span class="badge <?= $r['role']==='Admin' ? 'badge-pending' : 'badge-info' ?>"><?= $r['role'] ?></span></td>
              <td><?= $r['issues_reported'] ?></td>
              <td><?= $r['lf_posted'] ?></td>
            </tr>
            <?php endwhile; ?>
          <?php else: ?>
            <tr><td colspan="5" style="text-align:center;padding:32px;color:var(--text-muted);">No users found.</td></tr>
          <?php endif; ?>
        </tbody>
      </table>
    </div>
    <details><summary>▶ View SQL Query</summary>
      <div class="code-block">SELECT U.name, U.email, U.role,
       COUNT(DISTINCT I.issue_id) AS issues_reported,
       COUNT(DISTINCT L.lf_id)   AS lf_posted
FROM USER U
LEFT JOIN ISSUE      I ON U.user_id = I.user_id
LEFT JOIN LOST_FOUND L ON U.user_id = L.user_id
GROUP BY U.user_id, U.name, U.email, U.role
ORDER BY issues_reported DESC;</div>
    </details>

    <!-- ── TRANSACTION: UPDATE / DELETE ──────────────────────────────── -->
    <p class="section-title fade-in-up delay-4" style="margin-top:40px;">
      ⚡ Manage Issues
      <span class="query-tag tag-txn">Transaction · UPDATE · DELETE</span>
    </p>
    <div class="table-wrapper fade-in-up delay-4">
      <table>
        <thead><tr><th>#</th><th>Category</th><th>Current Status</th><th>Reporter</th><th>Update Status</th><th>Delete</th></tr></thead>
        <tbody>
          <?php if ($all_issues && $all_issues->num_rows > 0): ?>
            <?php while ($r = $all_issues->fetch_assoc()):
              $badge = $r['status'] === 'Pending' ? 'badge-pending' : ($r['status'] === 'Resolved' ? 'badge-resolved' : 'badge-info');
            ?>
            <tr>
              <td style="color:var(--text-muted);">#<?= $r['issue_id'] ?></td>
              <td style="font-weight:600; color:var(--text-primary);"><?= htmlspecialchars($r['category']) ?></td>
              <td><span class="badge <?= $badge ?>"><?= htmlspecialchars($r['status']) ?></span></td>
              <td><?= htmlspecialchars($r['name']) ?></td>
              <td>
                <form method="POST" class="status-form">
                  <input type="hidden" name="issue_id" value="<?= $r['issue_id'] ?>">
                  <select name="new_status">
                    <option value="Pending"     <?= $r['status']==='Pending'     ? 'selected':'' ?>>Pending</option>
                    <option value="In Progress" <?= $r['status']==='In Progress' ? 'selected':'' ?>>In Progress</option>
                    <option value="Resolved"    <?= $r['status']==='Resolved'    ? 'selected':'' ?>>Resolved</option>
                  </select>
                  <button type="submit" name="update_status" class="btn btn-primary btn-xs">Save</button>
                </form>
              </td>
              <td>
                <form method="POST" onsubmit="return confirm('Delete issue #<?= $r['issue_id'] ?>?');">
                  <input type="hidden" name="issue_id" value="<?= $r['issue_id'] ?>">
                  <button type="submit" name="delete_issue" class="btn btn-delete btn-xs">🗑️</button>
                </form>
              </td>
            </tr>
            <?php endwhile; ?>
          <?php else: ?>
            <tr><td colspan="6" style="text-align:center;padding:32px;color:var(--text-muted);">No issues in database.</td></tr>
          <?php endif; ?>
        </tbody>
      </table>
    </div>
    <!-- ── LOST & FOUND MANAGEMENT ───────────────────────────────────── -->
    <p class="section-title fade-in-up delay-4" style="margin-top:40px;">
      📦 Manage Lost & Found Items
      <span class="query-tag tag-txn">L&F Tracking</span>
    </p>
    <div class="table-wrapper fade-in-up delay-4">
      <table>
        <thead><tr><th>#</th><th>Item</th><th>Type</th><th>Current Status</th><th>Poster</th><th>Update Status</th><th>Delete</th></tr></thead>
        <tbody>
          <?php if ($all_lf && $all_lf->num_rows > 0): ?>
            <?php while ($r = $all_lf->fetch_assoc()):
              $st_badge = $r['status'] === 'Open' ? 'badge-pending' : ($r['status'] === 'Resolved' ? 'badge-resolved' : 'badge-info');
              $type_badge = $r['type'] === 'Lost' ? 'badge-lost' : 'badge-found';
            ?>
            <tr>
              <td style="color:var(--text-muted);">#<?= $r['lf_id'] ?></td>
              <td style="font-weight:600; color:var(--text-primary);"><?= htmlspecialchars($r['item_name']) ?></td>
              <td><span class="badge <?= $type_badge ?>"><?= $r['type'] ?></span></td>
              <td><span class="badge <?= $st_badge ?>"><?= htmlspecialchars($r['status']) ?></span></td>
              <td><?= htmlspecialchars($r['name']) ?></td>
              <td>
                <form method="POST" class="status-form">
                  <input type="hidden" name="lf_id" value="<?= $r['lf_id'] ?>">
                  <select name="new_status">
                    <option value="Open"     <?= $r['status']==='Open'     ? 'selected':'' ?>>Open</option>
                    <option value="Claimed"  <?= $r['status']==='Claimed'  ? 'selected':'' ?>>Claimed</option>
                    <option value="Resolved" <?= $r['status']==='Resolved' ? 'selected':'' ?>>Resolved</option>
                  </select>
                  <button type="submit" name="update_lf_status" class="btn btn-primary btn-xs">Save</button>
                </form>
              </td>
              <td>
                <form method="POST" onsubmit="return confirm('Delete item #<?= $r['lf_id'] ?>?');">
                  <input type="hidden" name="lf_id" value="<?= $r['lf_id'] ?>">
                  <button type="submit" name="delete_lf" class="btn btn-delete btn-xs">🗑️</button>
                </form>
              </td>
            </tr>
            <?php endwhile; ?>
          <?php else: ?>
            <tr><td colspan="7" style="text-align:center;padding:32px;color:var(--text-muted);">No L&F items in database.</td></tr>
          <?php endif; ?>
        </tbody>
      </table>
    </div>

    <details><summary>▶ View SQL (UPDATE + Transaction)</summary>
      <div class="code-block">-- UPDATE with full ACID transaction:
$conn->begin_transaction();             // START TRANSACTION
try {
    $stmt = $conn->prepare(
        "UPDATE ISSUE SET status = ? WHERE issue_id = ?"
    );
    $stmt->bind_param("si", $status, $issue_id);
    $stmt->execute();
    $conn->commit();                    // COMMIT — persists change
} catch (Exception $e) {
    $conn->rollback();                  // ROLLBACK — undoes on error
}

-- DELETE with transaction:
$conn->begin_transaction();
$stmt = $conn->prepare("DELETE FROM ISSUE WHERE issue_id = ?");
$stmt->execute();
$conn->commit();</div>
    </details>

  </div><!-- /main-content -->
</div>
</body>
</html>
