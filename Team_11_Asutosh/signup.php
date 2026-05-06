<?php
include 'config.php';
$error = '';
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $name  = $_POST['name'];
    $email = $_POST['email'];
    $pass  = password_hash($_POST['password'], PASSWORD_DEFAULT);
    $role  = 'Citizen';

    $sql  = "INSERT INTO USER (name, email, password, role) VALUES (?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ssss", $name, $email, $pass, $role);
    if ($stmt->execute()) {
        header("Location: login.php?msg=Account created! Please sign in.");
        exit();
    } else {
        $error = "Registration failed. That email may already be in use.";
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign Up — CBIRS</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
<div class="auth-page">
  <div class="auth-card fade-in-up">

    <div class="auth-logo">
      <div class="auth-logo-icon">🏛️</div>
      <div>
        <div class="auth-logo-text">CBIRS</div>
        <div class="auth-logo-sub">Community Platform</div>
      </div>
    </div>

    <h2 class="auth-title">Join your community</h2>
    <p class="auth-subtitle">Create a free account to get started</p>

    <?php if ($error): ?>
      <div class="alert alert-error">⚠️ <?= htmlspecialchars($error) ?></div>
    <?php endif; ?>

    <form method="POST" id="signup-form">
      <div class="form-group">
        <label class="form-label" for="name">Full Name</label>
        <input id="name" class="form-control" type="text" name="name" placeholder="Your full name" required>
      </div>
      <div class="form-group">
        <label class="form-label" for="email">Email Address</label>
        <input id="email" class="form-control" type="email" name="email" placeholder="you@example.com" required>
      </div>
      <div class="form-group">
        <label class="form-label" for="password">Password</label>
        <input id="password" class="form-control" type="password" name="password" placeholder="Create a strong password" required>
      </div>
      <button type="submit" class="btn btn-primary btn-block" style="margin-top:8px;">Create Account →</button>
    </form>

    <div class="auth-divider">or</div>

    <div class="auth-footer">
      Already have an account? <a href="login.php">Sign in</a>
    </div>
  </div>
</div>
</body>
</html>