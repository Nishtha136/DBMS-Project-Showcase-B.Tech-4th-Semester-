<?php
session_start();
include 'config.php';

$error = '';
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $email = $_POST['email'];
    $pass  = $_POST['password'];
    $result = $conn->query("SELECT * FROM USER WHERE email = '$email'");
    if ($user = $result->fetch_assoc()) {
        if (password_verify($pass, $user['password'])) {
            $_SESSION['user_id'] = $user['user_id'];
            $_SESSION['name']    = $user['name'];
            $_SESSION['role']    = $user['role'];
            header("Location: dashboard.php");
            exit();
        } else { $error = "Incorrect password. Please try again."; }
    } else { $error = "No account found with that email address."; }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login — CBIRS</title>
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

    <h2 class="auth-title">Welcome back</h2>
    <p class="auth-subtitle">Sign in to your account to continue</p>

    <?php if ($error): ?>
      <div class="alert alert-error">⚠️ <?= htmlspecialchars($error) ?></div>
    <?php endif; ?>

    <?php if (isset($_GET['msg'])): ?>
      <div class="alert alert-success">✅ <?= htmlspecialchars($_GET['msg']) ?></div>
    <?php endif; ?>

    <form method="POST" id="login-form">
      <div class="form-group">
        <label class="form-label" for="email">Email Address</label>
        <input id="email" class="form-control" type="email" name="email" placeholder="you@example.com" required>
      </div>
      <div class="form-group">
        <label class="form-label" for="password">Password</label>
        <input id="password" class="form-control" type="password" name="password" placeholder="••••••••" required>
      </div>
      <button type="submit" class="btn btn-primary btn-block" style="margin-top:8px;">Sign In →</button>
    </form>

    <div class="auth-divider">or</div>

    <div class="auth-footer">
      Don't have an account? <a href="signup.php">Create one free</a>
    </div>
  </div>
</div>
</body>
</html>