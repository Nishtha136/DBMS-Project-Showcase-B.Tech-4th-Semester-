<?php
/**
 * Detects real MySQL columns and fixes common mismatches (order_details price, payment amount).
 * Beginner-friendly: uses SHOW COLUMNS + optional ALTER for XAMPP projects.
 */

/** @return string[] column names for a table */
function bookstore_table_columns(mysqli $conn, string $table): array
{
    $cols = [];
    $t = $conn->real_escape_string($table);
    $res = $conn->query("SHOW COLUMNS FROM `{$t}`");
    if (!$res) {
        return [];
    }
    while ($row = $res->fetch_assoc()) {
        $cols[] = $row['Field'];
    }
    return $cols;
}

/**
 * Ensures order_details has a numeric column for line pricing (unit or line total).
 * Tries ALTER ADD `price` only if nothing suitable exists.
 *
 * @return array{0:string,1:string} [ column_name, 'unit'|'line' ] — value to store: unit price or qty*unit
 */
function bookstore_order_detail_price_target(mysqli $conn): array
{
    $cols = bookstore_table_columns($conn, 'order_details');

    if (in_array('price', $cols, true)) {
        return ['price', 'unit'];
    }
    if (in_array('unit_price', $cols, true)) {
        return ['unit_price', 'unit'];
    }
    if (in_array('subtotal', $cols, true)) {
        return ['subtotal', 'line'];
    }

    // No known column — try to add `price` (unit snapshot, matches book.price)
    @$conn->query('ALTER TABLE order_details ADD COLUMN price DECIMAL(10,2) NOT NULL DEFAULT 0');
    $cols = bookstore_table_columns($conn, 'order_details');
    if (in_array('price', $cols, true)) {
        return ['price', 'unit'];
    }

    throw new RuntimeException('order_details needs column price, unit_price, or subtotal (could not add price automatically).');
}

/**
 * Prepare payment INSERT based on actual columns (amount, payment_status, payment_date, etc.).
 *
 * @return array{sql:string, types:string, has_amount:bool, has_status:bool, has_date_literal:bool}
 */
function bookstore_payment_insert_plan(mysqli $conn): array
{
    $cols = bookstore_table_columns($conn, 'payment');
    $have = array_fill_keys($cols, true);

    if (empty($have['amount'])) {
        @$conn->query('ALTER TABLE payment ADD COLUMN amount DECIMAL(12,2) NOT NULL DEFAULT 0');
        $cols = bookstore_table_columns($conn, 'payment');
        $have = array_fill_keys($cols, true);
    }

    $fields = [];
    $values = [];
    $types = '';
    $hasAmount = false;
    $hasStatus = false;
    $hasDateLiteral = false;

    $fields[] = 'order_id';
    $values[] = '?';
    $types .= 'i';

    $fields[] = 'payment_method';
    $values[] = '?';
    $types .= 's';

    if (!empty($have['amount'])) {
        $fields[] = 'amount';
        $values[] = '?';
        $types .= 'd';
        $hasAmount = true;
    }

    if (!empty($have['payment_status'])) {
        $fields[] = 'payment_status';
        $values[] = '?';
        $types .= 's';
        $hasStatus = true;
    }

    if (!empty($have['payment_date'])) {
        $fields[] = 'payment_date';
        $values[] = 'NOW()';
        $hasDateLiteral = true;
    }

    $sql = 'INSERT INTO payment (' . implode(', ', $fields) . ') VALUES (' . implode(', ', $values) . ')';

    return [
        'sql' => $sql,
        'types' => $types,
        'has_amount' => $hasAmount,
        'has_status' => $hasStatus,
        'has_date_literal' => $hasDateLiteral,
    ];
}

/** True if wishlist table exists (after upgrade_dbms.sql). */
function bookstore_wishlist_table_exists(mysqli $conn): bool
{
    $r = $conn->query("SHOW TABLES LIKE 'wishlist'");
    return $r && $r->num_rows > 0;
}

/** True if a stored procedure exists in the current database */
function bookstore_routine_exists(mysqli $conn, string $routineName, string $routineType = 'PROCEDURE'): bool
{
    $name = $conn->real_escape_string($routineName);
    $type = $conn->real_escape_string(strtoupper($routineType));
    $sql = "SELECT COUNT(*) AS c FROM information_schema.ROUTINES
            WHERE ROUTINE_SCHEMA = DATABASE() AND ROUTINE_NAME = '{$name}' AND ROUTINE_TYPE = '{$type}'";
    $res = $conn->query($sql);
    if (!$res) {
        return false;
    }
    $row = $res->fetch_assoc();
    return isset($row['c']) && (int) $row['c'] > 0;
}

/**
 * Prepared SELECT for receipt / order history line items (supports price, unit_price, or subtotal).
 *
 * @return string SQL with one bound placeholder for order_id
 */
function bookstore_order_detail_receipt_sql(mysqli $conn): string
{
    [$priceCol, $priceMode] = bookstore_order_detail_price_target($conn);
    $allowed = ['price' => true, 'unit_price' => true, 'subtotal' => true];
    if (empty($allowed[$priceCol])) {
        throw new RuntimeException('Invalid order_details price column.');
    }
    $pc = $priceCol;
    if ($priceMode === 'line') {
        $unitExpr = "(od.`{$pc}` / NULLIF(od.quantity, 0))";
        $lineTotalExpr = "od.`{$pc}`";
    } else {
        $unitExpr = "od.`{$pc}`";
        $lineTotalExpr = "(od.`{$pc}` * od.quantity)";
    }
    $fnSelect = '';
    if (bookstore_routine_exists($conn, 'fn_line_subtotal', 'FUNCTION')) {
        $fnSelect = ", fn_line_subtotal(od.quantity, {$unitExpr}) AS line_fn_check";
    }

    return 'SELECT od.book_id, b.title, od.quantity, '
        . "{$unitExpr} AS unit_price, {$lineTotalExpr} AS line_total{$fnSelect} "
        . 'FROM order_details od INNER JOIN book b ON b.book_id = od.book_id '
        . 'WHERE od.order_id = ?';
}

/** Whitelist a column name from book table for YEAR() filter */
function bookstore_book_year_column(array $bookCols): ?string
{
    foreach (['published_date', 'publication_date', 'pub_date'] as $c) {
        if (in_array($c, $bookCols, true)) {
            return $c;
        }
    }
    if (in_array('year_published', $bookCols, true)) {
        return 'year_published';
    }
    return null;
}
