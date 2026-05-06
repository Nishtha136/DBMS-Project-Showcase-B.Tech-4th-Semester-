<?php
/**
 * save_address.php — Saves a new delivery address for the logged-in customer.
 */
require_once dirname(__DIR__) . '/includes/init.php';
require_once dirname(__DIR__) . '/includes/db.php';

if (!isset($_SESSION['customer_id']) || (int) $_SESSION['customer_id'] <= 0) {
    header('Location: ../login.php');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: checkout.php');
    exit;
}

$cid        = (int) $_SESSION['customer_id'];
$fullName   = trim($_POST['full_name']   ?? '');
$phone      = trim($_POST['phone']       ?? '');
$addrLine   = trim($_POST['address_line']?? '');
$city       = trim($_POST['city']        ?? '');
$state      = trim($_POST['state']       ?? '');
$pincode    = trim($_POST['pincode']     ?? '');
$country    = trim($_POST['country']     ?? 'India');
$isDefault  = isset($_POST['is_default']) ? 1 : 0;

// Validate
$errors = [];
if ($fullName === '')  $errors[] = 'Full name is required.';
if ($phone === '' || !preg_match('/^\d{10}$/', $phone)) $errors[] = 'Valid 10-digit phone number required.';
if ($addrLine === '')  $errors[] = 'Address is required.';
if ($city === '')      $errors[] = 'City is required.';
if ($state === '')     $errors[] = 'State is required.';
if (!preg_match('/^\d{6}$/', $pincode)) $errors[] = 'Valid 6-digit pincode required.';

if (!empty($errors)) {
    $_SESSION['flash'] = implode(' ', $errors);
    $_SESSION['flash_type'] = 'error';
    header('Location: checkout.php');
    exit;
}

// Count existing addresses BEFORE any UPDATE (so we can detect "first address")
$countRes = $conn->query("SELECT COUNT(*) as cnt FROM address WHERE customer_id = $cid");
$countRow = $countRes->fetch_assoc();
$existingCount = (int)$countRow['cnt'];

// If this is the customer's first address, always make it default
if ($existingCount === 0) {
    $isDefault = 1;
}

// Clear all previous defaults before inserting (prevents multiple is_default=1)
$conn->query("UPDATE address SET is_default = 0 WHERE customer_id = $cid");


$stmt = $conn->prepare('INSERT INTO address (customer_id, full_name, phone, address_line, city, state, pincode, country, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
$stmt->bind_param('isssssssi', $cid, $fullName, $phone, $addrLine, $city, $state, $pincode, $country, $isDefault);
if ($stmt->execute()) {
    $newAddrId = (int) $conn->insert_id;
    // Auto-select the newly saved address for checkout
    $_SESSION['selected_address_id'] = $newAddrId;
    $_SESSION['flash'] = 'Address saved successfully!';
    $_SESSION['flash_type'] = 'success';
} else {
    $_SESSION['flash'] = 'Failed to save address: ' . $conn->error;
    $_SESSION['flash_type'] = 'error';
}
$stmt->close();

header('Location: checkout.php');
exit;
