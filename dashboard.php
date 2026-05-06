<?php
session_start();
if (!isset($_SESSION['user_id'])) { header("Location: login.php"); exit(); }
include 'config.php';
$uid  = $_SESSION['user_id'];
$name = $_SESSION['name'];

// Stats
$issue_count = $conn->query("SELECT COUNT(*) as t FROM ISSUE WHERE user_id = $uid")->fetch_assoc()['t'];
$event_count = $conn->query("SELECT COUNT(*) as t FROM EVENT")->fetch_assoc()['t'];
$lf_count    = $conn->query("SELECT COUNT(*) as t FROM LOST_FOUND WHERE status='Open'")->fetch_assoc()['t'];
$pending     = $conn->query("SELECT COUNT(*) as t FROM ISSUE WHERE user_id = $uid AND status='Pending'")->fetch_assoc()['t'];
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard — CBIRS</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
<div class="page-wrapper">
  <?php include 'navbar.php'; ?>

  <div class="main-content">

    <!-- Welcome Hero -->
    <div class="welcome-hero fade-in-up">
      <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px;">
        <div>
          <p style="font-size:.8rem; color:var(--accent-light); font-weight:600; text-transform:uppercase; letter-spacing:.1em; margin-bottom:6px;">Welcome back</p>
          <h1 style="margin-bottom:8px;">Hello, <?= htmlspecialchars($name) ?> 👋</h1>
          <p>Here's what's happening in your community today.</p>
        </div>
        <a href="report_issue.php" class="btn btn-primary">⚠️ Report an Issue</a>
      </div>
    </div>

    <!-- Stats -->
    <div class="stats-grid fade-in-up delay-1">
      <div class="stat-card">
        <div class="stat-icon indigo">📋</div>
        <div>
          <div class="stat-number"><?= $issue_count ?></div>
          <div class="stat-label">Total Reports</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon amber">⏳</div>
        <div>
          <div class="stat-number"><?= $pending ?></div>
          <div class="stat-label">Pending Issues</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green">🎉</div>
        <div>
          <div class="stat-number"><?= $event_count ?></div>
          <div class="stat-label">City Events</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon purple">🔍</div>
        <div>
          <div class="stat-number"><?= $lf_count ?></div>
          <div class="stat-label">Lost &amp; Found</div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <p class="section-title fade-in-up delay-2">⚡ Quick Actions</p>
    <div class="action-grid fade-in-up delay-2">
      <a href="report_issue.php" class="action-card">
        <div class="action-card-icon" style="background:rgba(239,68,68,0.15);">⚠️</div>
        <div>
          <div class="action-card-title">Report Issue</div>
          <div class="action-card-sub">Flag a civic problem</div>
        </div>
      </a>
      <a href="lost_found.php" class="action-card">
        <div class="action-card-icon" style="background:rgba(59,130,246,0.15);">🔍</div>
        <div>
          <div class="action-card-title">Lost &amp; Found</div>
          <div class="action-card-sub">Post or find an item</div>
        </div>
      </a>
      <a href="events.php" class="action-card">
        <div class="action-card-icon" style="background:rgba(139,92,246,0.15);">🎉</div>
        <div>
          <div class="action-card-title">Events &amp; Services</div>
          <div class="action-card-sub">Upcoming community events</div>
        </div>
      </a>
    </div>

    <!-- Recent Reports -->
    <p class="section-title fade-in-up delay-3">📋 Your Recent Reports</p>
    <div class="table-wrapper fade-in-up delay-3">
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th>Status</th>
            <th>Reported On</th>
          </tr>
        </thead>
        <tbody>
          <?php
          $sql = "SELECT category, status, created_at FROM ISSUE WHERE user_id = $uid ORDER BY created_at DESC LIMIT 8";
          $res = $conn->query($sql);
          if ($res->num_rows > 0):
            while ($row = $res->fetch_assoc()):
              $badge = $row['status'] == 'Pending' ? 'badge-pending' : 'badge-resolved';
              $icon  = $row['status'] == 'Pending' ? '⏳' : '✅';
          ?>
          <tr>
            <td style="color:var(--text-primary); font-weight:500;"><?= htmlspecialchars($row['category']) ?></td>
            <td><span class="badge <?= $badge ?>"><?= $icon ?> <?= htmlspecialchars($row['status']) ?></span></td>
            <td><?= date('d M Y', strtotime($row['created_at'])) ?></td>
          </tr>
          <?php endwhile; else: ?>
          <tr>
            <td colspan="3" style="text-align:center; padding:36px; color:var(--text-muted);">
              No reports yet. <a href="report_issue.php" style="color:var(--accent-light);">Submit your first report →</a>
            </td>
          </tr>
          <?php endif; ?>
        </tbody>
      </table>
    </div>

  </div><!-- /main-content -->
</div>
</body>
</html>
