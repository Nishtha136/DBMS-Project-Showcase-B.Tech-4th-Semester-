<?php
/**
 * pages/login.php — User login
 */
require_once dirname(__DIR__) . '/includes/init.php';
require_once dirname(__DIR__) . '/includes/db.php';

$pageTitle = 'Login';

// Message handling
$flash = $_SESSION['flash'] ?? '';
$flashType = $_SESSION['flash_type'] ?? 'info';
unset($_SESSION['flash'], $_SESSION['flash_type']);

// If already logged in, send them to requested page (or checkout)
$alreadyLoggedIn = isset($_SESSION['customer_id']) && (int)$_SESSION['customer_id'] > 0;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email    = trim((string)($_POST['email']    ?? ''));
    $password = (string)($_POST['password'] ?? '');

    if ($email === '' || $password === '') {
        $_SESSION['flash']      = 'Email and password are required.';
        $_SESSION['flash_type'] = 'error';
        header('Location: login.php');
        exit;
    }

    $stmt = $conn->prepare('SELECT customer_id, first_name, last_name, password, COALESCE(role, "user") AS role FROM customer WHERE email = ? LIMIT 1');
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$user || !is_string($user['password']) || !password_verify($password, $user['password'])) {
        $_SESSION['flash']      = 'Invalid email or password.';
        $_SESSION['flash_type'] = 'error';
        header('Location: login.php');
        exit;
    }

    $dbRole = ($user['role'] ?? 'user') === 'admin' ? 'admin' : 'user';

    // Login success
    $_SESSION['customer_id'] = (int) $user['customer_id'];
    $_SESSION['role']        = $dbRole;
    $_SESSION['name']        = trim($user['first_name'] . ' ' . $user['last_name']);
    $_SESSION['flash']      = 'Welcome back, ' . htmlspecialchars(explode(' ', $user['first_name'])[0]) . '!';
    $_SESSION['flash_type'] = 'success';

    if ($dbRole === 'admin') {
        header('Location: admin_orders.php');
    } else {
        $redirect = $_SESSION['redirect_after_login'] ?? 'home.php';
        unset($_SESSION['redirect_after_login']);
        header('Location: ' . $redirect);
    }
    exit;
}

if ($alreadyLoggedIn) {
    $redirect = $_SESSION['redirect_after_login'] ?? 'home.php';
    unset($_SESSION['redirect_after_login']);
    header('Location: ' . $redirect);
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo htmlspecialchars($pageTitle); ?> — Knowledge Hub Books</title>
    <link rel="stylesheet" href="../css/style.css">
    <link rel="stylesheet" href="../assets/css/auth.css">
</head>
<body>

<div class="auth-split fade-in">
    <div class="auth-left">
        <div class="auth-left-content">
            <h1>Welcome Back</h1>
            <p>Log in to access your library, check out faster, and manage your orders.</p>
            <a href="register.php" class="btn-outline-white">Create Account</a>
        </div>
    </div>
    
    <div class="auth-right">
        <div class="auth-card slide-in">
            <h2>Sign In</h2>
            <p class="subtitle">Enter your email and password to login.</p>
            
            <?php if ($flash !== '') {
                $cls = $flashType === 'error' ? 'alert-error' : ($flashType === 'success' ? 'alert-success' : 'alert-info');
                ?>
                <div class="alert <?php echo htmlspecialchars($cls); ?>" style="margin-bottom: 24px;">
                    <?php echo htmlspecialchars($flash); ?>
                </div>
            <?php } ?>

            <form method="post" action="login.php">
                <div class="auth-input-group">
                    <label>Email Address</label>
                    <input class="auth-input" type="email" name="email" required
                           value="<?php echo htmlspecialchars($_POST['email'] ?? ''); ?>"
                           placeholder="john@example.com" autocomplete="email">
                </div>

                <div class="auth-input-group">
                    <label>Password</label>
                    <input class="auth-input" type="password" name="password" required placeholder="••••••••" autocomplete="current-password">
                </div>

                <button type="submit" class="btn-auth">Sign In</button>
            </form>
            
            <p style="text-align: center; margin-top: 24px; font-size: 0.9rem; color: var(--text-secondary);">
                <a href="home.php" style="color: var(--text-primary); text-decoration: none; font-weight: 500;">&larr; Back to Home</a>
            </p>
        </div>
    </div>
</div>

</body>
</html>
