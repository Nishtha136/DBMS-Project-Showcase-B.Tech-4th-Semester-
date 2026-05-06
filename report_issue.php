<?php
session_start();
if (!isset($_SESSION['user_id'])) { header("Location: login.php"); exit(); }
include 'config.php';

$success = '';
$error   = '';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $uid  = $_SESSION['user_id'];
    $cat  = $_POST['category'];
    $desc = $_POST['description'];
    $loc  = $_POST['location'];

    $stmt = $conn->prepare("INSERT INTO ISSUE (category, description, location, user_id) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("sssi", $cat, $desc, $loc, $uid);
    if ($stmt->execute()) {
        $success = "Your issue has been reported successfully!";
    } else {
        $error = "Something went wrong. Please try again.";
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Report Issue — CBIRS</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
<div class="page-wrapper">
  <?php include 'navbar.php'; ?>

  <div class="main-content">

    <!-- Page Header -->
    <div class="page-header fade-in-up">
      <div style="display:flex; align-items:center; gap:12px; margin-bottom:8px;">
        <a href="dashboard.php" class="btn btn-secondary" style="padding:7px 14px; font-size:.8rem;">← Back</a>
        <div class="badge badge-info">⚠️ New Report</div>
      </div>
      <h1>Report a Community Issue</h1>
      <p>Help improve your city by reporting civic problems directly.</p>
    </div>

    <div class="split-layout">

      <!-- Form -->
      <div style="grid-column: 1 / -1; max-width: 640px;">
        <div class="card fade-in-up delay-1">

          <?php if ($success): ?>
            <div class="alert alert-success">✅ <?= htmlspecialchars($success) ?></div>
          <?php endif; ?>
          <?php if ($error): ?>
            <div class="alert alert-error">⚠️ <?= htmlspecialchars($error) ?></div>
          <?php endif; ?>

          <form method="POST" id="report-form">

            <div class="form-group">
              <label class="form-label" for="category">Issue Category</label>
              <select id="category" name="category" class="form-control" required>
                <option value="" disabled selected>Select a category…</option>
                <option value="Garbage">🗑️  Garbage Collection</option>
                <option value="Street Light">💡  Street Light</option>
                <option value="Road Damage">🚧  Road Damage</option>
                <option value="Water Supply">💧  Water Supply</option>
                <option value="Noise Complaint">🔊  Noise Complaint</option>
                <option value="Other">📌  Other</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="location">Exact Location</label>
              <input id="location" class="form-control" type="text" name="location"
                     placeholder="e.g. Near Gate 3, MG Road, Sector 14" required>
            </div>

            <div class="form-group">
              <label class="form-label" for="description">Description</label>
              <textarea id="description" class="form-control" name="description"
                        placeholder="Describe the problem in detail — the more info, the faster it gets resolved…"
                        style="min-height:130px;" required></textarea>
            </div>

            <div style="display:flex; gap:12px; align-items:center; margin-top:8px;">
              <button type="submit" class="btn btn-primary" style="flex:1; justify-content:center;">
                ⚠️ Submit Report
              </button>
              <a href="dashboard.php" class="btn btn-secondary">Cancel</a>
            </div>

          </form>
        </div>
      </div>

      <!-- Info Panel -->
      <div style="display:none;"></div>
    </div>

    <!-- Tips row -->
    <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:16px; margin-top:32px;" class="fade-in-up delay-2">
      <div class="card" style="padding:20px;">
        <div style="font-size:1.6rem; margin-bottom:8px;">📍</div>
        <div style="font-weight:700; color:var(--text-primary); margin-bottom:4px; font-size:.9rem;">Be Specific</div>
        <p style="font-size:.8rem;">Include street names, landmarks, or sector numbers for faster resolution.</p>
      </div>
      <div class="card" style="padding:20px;">
        <div style="font-size:1.6rem; margin-bottom:8px;">⏱️</div>
        <div style="font-weight:700; color:var(--text-primary); margin-bottom:4px; font-size:.9rem;">Response Time</div>
        <p style="font-size:.8rem;">Most reports are reviewed within 24–48 hours by city officials.</p>
      </div>
      <div class="card" style="padding:20px;">
        <div style="font-size:1.6rem; margin-bottom:8px;">🔔</div>
        <div style="font-weight:700; color:var(--text-primary); margin-bottom:4px; font-size:.9rem;">Track Status</div>
        <p style="font-size:.8rem;">View all your submitted reports and their statuses on the Dashboard.</p>
      </div>
    </div>

  </div>
</div>
</body>
</html>