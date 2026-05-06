DROP PROCEDURE IF EXISTS sp_place_order;
DELIMITER $$
CREATE PROCEDURE sp_place_order(
    IN p_customer_id INT,
    IN p_payment_method VARCHAR(40),
    IN p_lines JSON,
    IN p_address_id INT,
    IN p_gst_amount DECIMAL(12,2),
    IN p_delivery_fee DECIMAL(12,2),
    OUT p_order_id INT,
    OUT p_error_msg VARCHAR(512)
)
proc_exit: BEGIN
    DECLARE v_total DECIMAL(12,2) DEFAULT 0;
    DECLARE v_cnt INT DEFAULT 0;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_order_id = 0;
        SET p_error_msg = 'Database error — order rolled back.';
    END;

    SET p_order_id = 0;
    SET p_error_msg = NULL;

    IF p_customer_id IS NULL OR p_customer_id <= 0 THEN
        SET p_error_msg = 'Invalid customer.';
        LEAVE proc_exit;
    END IF;

    IF p_lines IS NULL OR JSON_TYPE(p_lines) <> 'ARRAY' THEN
        SET p_error_msg = 'Invalid cart JSON.';
        LEAVE proc_exit;
    END IF;

    IF p_address_id IS NULL OR p_address_id <= 0 THEN
        SET p_error_msg = 'Invalid address ID.';
        LEAVE proc_exit;
    END IF;

    START TRANSACTION;

    DROP TEMPORARY TABLE IF EXISTS tmp_cart_raw;
    CREATE TEMPORARY TABLE tmp_cart_raw (
        book_id INT NOT NULL,
        qty INT NOT NULL
    ) ENGINE=MEMORY;

    INSERT INTO tmp_cart_raw (book_id, qty)
    SELECT j.book_id, j.qty
    FROM JSON_TABLE(
        p_lines,
        '$[*]' COLUMNS (
            book_id INT PATH '$.book_id',
            qty INT PATH '$.qty'
        )
    ) AS j
    WHERE j.qty > 0;

    DROP TEMPORARY TABLE IF EXISTS tmp_cart_lines;
    CREATE TEMPORARY TABLE tmp_cart_lines (
        book_id INT NOT NULL PRIMARY KEY,
        qty INT NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        line_total DECIMAL(12,2) NOT NULL
    ) ENGINE=MEMORY;

    INSERT INTO tmp_cart_lines (book_id, qty, unit_price, line_total)
    SELECT
        r.book_id,
        LEAST(SUM(r.qty), b.stock),
        b.price,
        ROUND(LEAST(SUM(r.qty), b.stock) * b.price, 2)
    FROM tmp_cart_raw r
    INNER JOIN book b ON b.book_id = r.book_id
    WHERE b.stock > 0
    GROUP BY r.book_id, b.price, b.stock
    HAVING LEAST(SUM(r.qty), b.stock) > 0;

    SELECT COUNT(*), COALESCE(SUM(line_total), 0) INTO v_cnt, v_total FROM tmp_cart_lines;

    IF v_cnt = 0 THEN
        ROLLBACK;
        SET p_error_msg = 'No valid lines (check stock or book ids).';
        LEAVE proc_exit;
    END IF;

    -- Add delivery fee and gst
    SET v_total = v_total + p_gst_amount + p_delivery_fee;

    INSERT INTO orders (customer_id, order_date, total_amount, gst_amount, delivery_fee, order_status, address_id)
    VALUES (p_customer_id, NOW(), v_total, p_gst_amount, p_delivery_fee, 'Placed', p_address_id);

    SET p_order_id = LAST_INSERT_ID();

    INSERT INTO order_details (order_id, book_id, quantity, price)
    SELECT p_order_id, book_id, qty, unit_price FROM tmp_cart_lines;

    UPDATE book b
    INNER JOIN tmp_cart_lines t ON t.book_id = b.book_id
    SET b.stock = b.stock - t.qty;

    INSERT INTO payment (order_id, payment_method, amount, payment_status, payment_date)
    VALUES (p_order_id, p_payment_method, v_total, 'Pending', NULL);

    COMMIT;
END$$
DELIMITER ;
