<?php
$current = basename($_SERVER['PHP_SELF']);
?>
<nav class="navbar">
  <div class="navbar-inner">
    <a href="dashboard.php" class="navbar-brand">
      <div class="brand-icon">🏛️</div>
      <span>CBIRS</span>
    </a>
    <a href="dashboard.php"    class="nav-link <?= $current=='dashboard.php'  ? 'active':'' ?>">🏠 Dashboard</a>
    <a href="report_issue.php" class="nav-link <?= $current=='report_issue.php'? 'active':'' ?>">⚠️ Report Issue</a>
    <a href="lost_found.php"   class="nav-link <?= $current=='lost_found.php'  ? 'active':'' ?>">🔍 Lost &amp; Found</a>
    <a href="events.php"       class="nav-link <?= $current=='events.php'      ? 'active':'' ?>">🎉 Events</a>
    <?php if (isset($_SESSION['role']) && $_SESSION['role'] === 'Admin'): ?>
    <a href="admin.php"        class="nav-link <?= $current=='admin.php'        ? 'active':'' ?>" style="color:var(--accent-amber);">⚙️ Admin</a>
    <?php endif; ?>
    <a href="logout.php"       class="nav-link nav-logout">⏻ Logout</a>
  </div>
</nav>
