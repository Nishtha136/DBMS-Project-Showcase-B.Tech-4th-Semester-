<?php
/**
 * pages/address_action.php — Add / Edit / Delete / Set Default address
 */
require_once dirname(__DIR__) . '/includes/init.php';
require_once dirname(__DIR__) . '/includes/db.php';

if (!isset($_SESSION['customer_id']) || (int)$_SESSION['customer_id'] <= 0) {
    header('Location: login.php'); exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: profile.php'); exit;
}

$cid    = (int)$_SESSION['customer_id'];
$action = $_POST['action'] ?? '';
$addrId = (int)($_POST['address_id'] ?? 0);

switch ($action) {

    case 'add':
    case 'edit':
        $fullName = trim($_POST['full_name']    ?? '');
        $phone    = trim($_POST['phone']        ?? '');
        $addrLine = trim($_POST['address_line'] ?? '');
        $city     = trim($_POST['city']         ?? '');
        $state    = trim($_POST['state']        ?? '');
        $pincode  = trim($_POST['pincode']      ?? '');
        $country  = trim($_POST['country']      ?? 'India');
        $isDef    = isset($_POST['is_default']) ? 1 : 0;

        $errs = [];
        if ($fullName === '')  $errs[] = 'Full name is required.';
        if ($addrLine === '')  $errs[] = 'Address line is required.';
        if ($city === '')      $errs[] = 'City is required.';
        if ($state === '')     $errs[] = 'State is required.';
        if (!preg_match('/^\d{6}$/', $pincode)) $errs[] = 'Valid 6-digit pincode required.';
        if ($country === '')   $country = 'India';

        if (!empty($errs)) {
            $_SESSION['flash'] = implode(' ', $errs);
            $_SESSION['flash_type'] = 'error';
            header('Location: profile.php'); exit;
        }

        if ($isDef) {
            $conn->query("UPDATE address SET is_default = 0 WHERE customer_id = $cid");
        }

        if ($action === 'add') {
            $stmt = $conn->prepare('INSERT INTO address (customer_id, full_name, phone, address_line, city, state, pincode, country, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
            $stmt->bind_param('isssssssi', $cid, $fullName, $phone, $addrLine, $city, $state, $pincode, $country, $isDef);
        } else {
            // Edit: verify ownership
            $chk = $conn->prepare('SELECT address_id FROM address WHERE address_id=? AND customer_id=? LIMIT 1');
            $chk->bind_param('ii', $addrId, $cid);
            $chk->execute();
            if (!$chk->get_result()->fetch_assoc()) {
                $_SESSION['flash'] = 'Address not found.';
                $_SESSION['flash_type'] = 'error';
                header('Location: profile.php'); exit;
            }
            $chk->close();
            $stmt = $conn->prepare('UPDATE address SET full_name=?, phone=?, address_line=?, city=?, state=?, pincode=?, country=?, is_default=? WHERE address_id=? AND customer_id=?');
            $stmt->bind_param('sssssssiis', $fullName, $phone, $addrLine, $city, $state, $pincode, $country, $isDef, $addrId, $cid);
        }

        if ($stmt->execute()) {
            $_SESSION['flash'] = $action === 'add' ? 'Address added!' : 'Address updated!';
            $_SESSION['flash_type'] = 'success';
        } else {
            $_SESSION['flash'] = 'Failed to save address.';
            $_SESSION['flash_type'] = 'error';
        }
        $stmt->close();
        break;

    case 'delete':
        if ($addrId <= 0) { header('Location: profile.php'); exit; }
        $stmt = $conn->prepare('DELETE FROM address WHERE address_id=? AND customer_id=?');
        $stmt->bind_param('ii', $addrId, $cid);
        if ($stmt->execute() && $stmt->affected_rows > 0) {
            $_SESSION['flash'] = 'Address deleted.';
            $_SESSION['flash_type'] = 'success';
        } else {
            $_SESSION['flash'] = 'Could not delete address.';
            $_SESSION['flash_type'] = 'error';
        }
        $stmt->close();
        break;

    case 'set_default':
        if ($addrId <= 0) { header('Location: profile.php'); exit; }
        $conn->query("UPDATE address SET is_default = 0 WHERE customer_id = $cid");
        $stmt = $conn->prepare('UPDATE address SET is_default = 1 WHERE address_id=? AND customer_id=?');
        $stmt->bind_param('ii', $addrId, $cid);
        if ($stmt->execute()) {
            $_SESSION['flash'] = 'Default address updated!';
            $_SESSION['flash_type'] = 'success';
        }
        $stmt->close();
        break;

    default:
        break;
}

header('Location: profile.php');
exit;
