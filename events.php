<?php
session_start();
include 'config.php';

$events   = $conn->query("SELECT * FROM EVENT ORDER BY date ASC");
$services = $conn->query("SELECT * FROM SERVICE");
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Events &amp; Services — CBIRS</title>
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
        <div class="badge badge-info">🎉 Community</div>
      </div>
      <h1>Events &amp; Local Services</h1>
      <p>Upcoming community events and nearby city services at a glance.</p>
    </div>

    <!-- ── EVENTS SECTION ── -->
    <p class="section-title fade-in-up delay-1">📅 Upcoming Events</p>

    <div class="event-grid fade-in-up delay-1">
      <?php if ($events && $events->num_rows > 0): ?>
        <?php
        $colors = ['#6366f1','#10b981','#f59e0b','#3b82f6','#8b5cf6','#ef4444'];
        $i = 0;
        while ($row = $events->fetch_assoc()):
          $color = $colors[$i % count($colors)];
          $i++;
        ?>
        <div class="event-card">
          <div class="event-date-badge">
            📅 <?= date('d M Y', strtotime($row['date'])) ?>
          </div>
          <div class="event-title"><?= htmlspecialchars($row['title']) ?></div>
          <?php if (!empty($row['description'])): ?>
            <p style="font-size:.82rem; color:var(--text-secondary); margin-bottom:10px; line-height:1.5;">
              <?= htmlspecialchars($row['description']) ?>
            </p>
          <?php endif; ?>
          <div class="event-location">
            📍 <?= htmlspecialchars($row['location']) ?>
          </div>
          <div style="margin-top:14px; height:3px; border-radius:999px; background:<?= $color ?>; opacity:0.5;"></div>
        </div>
        <?php endwhile; ?>
      <?php else: ?>
        <div class="card" style="grid-column:1/-1; text-align:center; padding:48px; color:var(--text-muted);">
          <div style="font-size:2.5rem; margin-bottom:12px;">📭</div>
          <div style="font-weight:600; color:var(--text-secondary);">No upcoming events right now.</div>
          <div style="font-size:.85rem; margin-top:4px;">Check back soon — your city is always busy!</div>
        </div>
      <?php endif; ?>
    </div>

    <!-- ── SERVICES SECTION ── -->
    <p class="section-title fade-in-up delay-2" style="margin-top:44px;">🏥 Local Services</p>

    <div class="service-grid fade-in-up delay-2">
      <?php
      $service_icons = [
        'Hospital'   => '🏥',
        'Police'     => '👮',
        'Fire'       => '🚒',
        'School'     => '🏫',
        'Park'       => '🌳',
        'Library'    => '📚',
        'Transport'  => '🚌',
      ];
      if ($services && $services->num_rows > 0):
        while ($row = $services->fetch_assoc()):
          $icon = '🏢';
          foreach ($service_icons as $key => $val) {
            if (stripos($row['type'], $key) !== false) { $icon = $val; break; }
          }
      ?>
      <div class="service-card">
        <div style="font-size:1.8rem; margin-bottom:10px;"><?= $icon ?></div>
        <div class="service-name"><?= htmlspecialchars($row['name']) ?></div>
        <div class="service-type"><?= htmlspecialchars($row['type']) ?></div>
        <div class="service-address">📍 <?= htmlspecialchars($row['address']) ?></div>
      </div>
      <?php endwhile; ?>
      <?php else: ?>
        <div class="card" style="grid-column:1/-1; text-align:center; padding:48px; color:var(--text-muted);">
          <div style="font-size:2.5rem; margin-bottom:12px;">🏢</div>
          <div style="font-weight:600; color:var(--text-secondary);">No services listed yet.</div>
        </div>
      <?php endif; ?>
    </div>

  </div><!-- /main-content -->
</div>
</body>
</html>