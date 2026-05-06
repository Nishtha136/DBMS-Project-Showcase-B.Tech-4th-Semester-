<?php
/**
 * PHP fallback when sp_place_order is not installed — mirrors procedure logic in app layer.
 */
require_once __DIR__ . '/schema_bookstore.php';

/**
 * @param array<int, array{book_id:int,qty:int,unit_price:float,subtotal:float}> $lines
 * @return array{ok:bool, order_id?:int, error?:string}
 */
function bookstore_place_order_legacy(mysqli $conn, int $customerId, string $paymentMethod, array $lines): array
{
    if ($lines === []) {
        return ['ok' => false, 'error' => 'No valid lines.'];
    }

    try {
        [$priceCol, $priceMode] = bookstore_order_detail_price_target($conn);
    } catch (RuntimeException $e) {
        return ['ok' => false, 'error' => $e->getMessage()];
    }

    $allowedOd = ['price' => true, 'unit_price' => true, 'subtotal' => true];
    if (empty($allowedOd[$priceCol])) {
        return ['ok' => false, 'error' => 'Invalid order_details price column.'];
    }

    $payPlan = bookstore_payment_insert_plan($conn);
    $orderTotal = 0.0;
    foreach ($lines as $l) {
        $orderTotal += $l['subtotal'];
    }
    $orderTotal = round($orderTotal, 2);

    $orderCols = bookstore_table_columns($conn, 'orders');
    $hasOrderStatus = in_array('order_status', $orderCols, true);

    $conn->begin_transaction();

    try {
        if ($hasOrderStatus) {
            $stmt = $conn->prepare('INSERT INTO orders (customer_id, order_date, total_amount, order_status) VALUES (?, NOW(), ?, ?)');
            $status = 'Paid';
            $stmt->bind_param('ids', $customerId, $orderTotal, $status);
        } else {
            $stmt = $conn->prepare('INSERT INTO orders (customer_id, order_date, total_amount) VALUES (?, NOW(), ?)');
            $stmt->bind_param('id', $customerId, $orderTotal);
        }
        if (!$stmt || !$stmt->execute()) {
            throw new Exception($stmt ? $stmt->error : $conn->error);
        }
        $orderId = (int) $conn->insert_id;
        $stmt->close();

        $sqlLine = "INSERT INTO order_details (order_id, book_id, quantity, `{$priceCol}`) VALUES (?, ?, ?, ?)";
        $insLine = $conn->prepare($sqlLine);
        $updStock = $conn->prepare('UPDATE book SET stock = stock - ? WHERE book_id = ?');
        if (!$insLine || !$updStock) {
            throw new Exception($conn->error);
        }

        foreach ($lines as $line) {
            $bid = $line['book_id'];
            $q = $line['qty'];
            $unit = $line['unit_price'];
            $bindPrice = ($priceMode === 'line') ? ($unit * $q) : $unit;

            $insLine->bind_param('iiid', $orderId, $bid, $q, $bindPrice);
            if (!$insLine->execute()) {
                throw new Exception($insLine->error);
            }
            $updStock->bind_param('ii', $q, $bid);
            if (!$updStock->execute()) {
                throw new Exception($updStock->error);
            }
        }
        $insLine->close();
        $updStock->close();

        $pay = $conn->prepare($payPlan['sql']);
        if (!$pay) {
            throw new Exception($conn->error);
        }
        $bindPay = [$orderId, $paymentMethod];
        if ($payPlan['has_amount']) {
            $bindPay[] = $orderTotal;
        }
        if ($payPlan['has_status']) {
            $bindPay[] = 'Completed';
        }
        $pay->bind_param($payPlan['types'], ...$bindPay);
        if (!$pay->execute()) {
            throw new Exception($pay->error);
        }
        $pay->close();

        $conn->commit();
        error_log('[order] placed via legacy customer_id=' . $customerId . ' order_id=' . $orderId);
        return ['ok' => true, 'order_id' => $orderId];
    } catch (Exception $e) {
        $conn->rollback();
        return ['ok' => false, 'error' => $e->getMessage()];
    }
}
