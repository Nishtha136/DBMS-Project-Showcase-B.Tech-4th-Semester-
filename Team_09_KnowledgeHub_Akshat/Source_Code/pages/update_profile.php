<?php
/**
 * pages/update_profile.php — Update first_name, last_name, phone_number
 */
require_once dirname(__DIR__) . '/includes/init.php';
require_once dirname(__DIR__) . '/includes/db.php';

if (!isset($_SESSION['customer_id']) || (int)$_SESSION['customer_id'] <= 0) {
    header('Location: login.php'); exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: profile.php'); exit;
}

$cid   = (int)$_SESSION['customer_id'];
$first = trim($_POST['first_name']   ?? '');
$last  = trim($_POST['last_name']    ?? '');
$phone = trim($_POST['phone_number'] ?? '');

$errs = [];
if ($first === '') $errs[] = 'First name is required.';
if ($last === '')  $errs[] = 'Last name is required.';
if ($phone !== '' && !preg_match('/^\d{10}$/', $phone)) $errs[] = 'Phone must be 10 digits.';

if (!empty($errs)) {
    $_SESSION['flash'] = implode(' ', $errs);
    $_SESSION['flash_type'] = 'error';
    header('Location: profile.php'); exit;
}

$stmt = $conn->prepare('UPDATE customer SET first_name=?, last_name=?, phone_number=? WHERE customer_id=?');
$stmt->bind_param('sssi', $first, $last, $phone, $cid);

if ($stmt->execute()) {
    $_SESSION['name']  = trim($first . ' ' . $last);
    $_SESSION['flash'] = 'Profile updated successfully!';
    $_SESSION['flash_type'] = 'success';
} else {
    $_SESSION['flash'] = 'Failed to update profile. Please try again.';
    $_SESSION['flash_type'] = 'error';
}
$stmt->close();
header('Location: profile.php');
exit;
