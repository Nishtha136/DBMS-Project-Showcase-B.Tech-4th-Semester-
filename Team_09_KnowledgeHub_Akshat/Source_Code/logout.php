<?php
/**
 * logout.php — destroy session / log out
 */
require_once __DIR__ . '/includes/init.php';

// Destroy session completely (logs out user)
$_SESSION = [];
if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
}
session_destroy();

session_start(); // allow setting a flash message after destroy
$_SESSION['flash'] = 'You have been logged out.';
$_SESSION['flash_type'] = 'info';
header('Location: index.php');
exit;

