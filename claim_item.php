<?php
session_start();
include 'config.php';
if (!isset($_SESSION['user_id'])) { header("Location: login.php"); exit(); }

$uid = $_SESSION['user_id'];

// ── CLAIM: non-owner marks a Lost item as found ──────────────────────────────
if (isset($_POST['claim_item'])) {
    $lf_id = (int)$_POST['lf_id'];

    // Fetch item to validate
    $chk = $conn->prepare("SELECT user_id, status, type FROM LOST_FOUND WHERE lf_id = ?");
    $chk->bind_param("i", $lf_id);
    $chk->execute();
    $item = $chk->get_result()->fetch_assoc();

    if ($item && $item['status'] === 'Open' && (int)$item['user_id'] !== $uid) {
        $conn->begin_transaction();
        try {
            $stmt = $conn->prepare(
                "UPDATE LOST_FOUND
                    SET status = 'Claimed', claimed_by = ?, claimed_at = NOW()
                  WHERE lf_id = ? AND status = 'Open'"
            );
            $stmt->bind_param("ii", $uid, $lf_id);
            $stmt->execute();
            $conn->commit();
        } catch (Exception $e) {
            $conn->rollback();
        }
    }
}

// ── RESOLVE: owner closes the tracking entry ─────────────────────────────────
if (isset($_POST['resolve_item'])) {
    $lf_id = (int)$_POST['lf_id'];

    $chk = $conn->prepare("SELECT user_id FROM LOST_FOUND WHERE lf_id = ?");
    $chk->bind_param("i", $lf_id);
    $chk->execute();
    $item = $chk->get_result()->fetch_assoc();

    if ($item && (int)$item['user_id'] === $uid) {
        $conn->begin_transaction();
        try {
            $stmt = $conn->prepare("UPDATE LOST_FOUND SET status = 'Resolved' WHERE lf_id = ?");
            $stmt->bind_param("i", $lf_id);
            $stmt->execute();
            $conn->commit();
        } catch (Exception $e) {
            $conn->rollback();
        }
    }
}

header("Location: lost_found.php");
exit();
