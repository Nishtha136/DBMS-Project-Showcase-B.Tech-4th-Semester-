-- =============================================================================
-- DBMS UPGRADE — Run in phpMyAdmin on `bookstore`
-- If a line errors with "Duplicate column" / "Duplicate key", skip that line.
-- Requires MySQL 8.0.4+ or MariaDB 10.6+ for JSON_TABLE (stored procedure).
-- =============================================================================
SET NAMES utf8mb4;

ALTER TABLE orders ADD COLUMN order_status VARCHAR(40) NOT NULL DEFAULT 'Placed';
ALTER TABLE orders ADD COLUMN is_archived TINYINT NOT NULL DEFAULT 0;
ALTER TABLE payment ADD COLUMN payment_status VARCHAR(40) NOT NULL DEFAULT 'Pending';
ALTER TABLE payment ADD COLUMN payment_date DATETIME NULL;
ALTER TABLE order_details ADD COLUMN price DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE book ADD COLUMN rating_demo DECIMAL(3,2) NULL COMMENT 'Demo rating 0-5 for UI';
ALTER TABLE customer ADD COLUMN role VARCHAR(10) NOT NULL DEFAULT 'user';

-- Search performance (run once; drop if you need to re-run: DROP INDEX idx_book_title ON book;)
CREATE INDEX idx_book_title ON book (title(120));
CREATE INDEX idx_book_author ON book (author(80));

CREATE TABLE IF NOT EXISTS wishlist (
    wishlist_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    book_id INT NOT NULL,
    added_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_customer_book (customer_id, book_id),
    CONSTRAINT fk_wish_customer FOREIGN KEY (customer_id) REFERENCES customer(customer_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_wish_book FOREIGN KEY (book_id) REFERENCES book(book_id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    book_id INT NOT NULL,
    customer_id INT NOT NULL,
    rating INT NOT NULL,
    comment TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_review_customer_book (customer_id, book_id),
    INDEX idx_reviews_book (book_id),
    CONSTRAINT fk_reviews_book FOREIGN KEY (book_id) REFERENCES book(book_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_reviews_customer FOREIGN KEY (customer_id) REFERENCES customer(customer_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP FUNCTION IF EXISTS fn_line_subtotal;
DELIMITER $$
CREATE FUNCTION fn_line_subtotal(p_qty INT, p_unit_price DECIMAL(10,2))
RETURNS DECIMAL(12,2)
DETERMINISTIC
NO SQL
BEGIN
    IF p_qty IS NULL OR p_unit_price IS NULL OR p_qty < 0 THEN
        RETURN 0;
    END IF;
    RETURN ROUND(p_qty * p_unit_price, 2);
END$$
DELIMITER ;

DROP VIEW IF EXISTS v_customer_order_summary;
CREATE VIEW v_customer_order_summary AS
SELECT
    c.customer_id,
    CONCAT(TRIM(c.first_name), ' ', TRIM(c.last_name)) AS customer_name,
    c.email,
    o.order_id,
    o.order_date,
    o.total_amount,
    o.order_status,
    (SELECT COUNT(*) FROM order_details od WHERE od.order_id = o.order_id) AS line_items,
    (SELECT COALESCE(SUM(od.quantity), 0) FROM order_details od WHERE od.order_id = o.order_id) AS total_units
FROM customer c
INNER JOIN orders o ON o.customer_id = c.customer_id;

DROP PROCEDURE IF EXISTS sp_place_order;
DELIMITER $$
CREATE PROCEDURE sp_place_order(
    IN p_customer_id INT,
    IN p_payment_method VARCHAR(40),
    IN p_lines JSON,
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
        fn_line_subtotal(LEAST(SUM(r.qty), b.stock), b.price)
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

    INSERT INTO orders (customer_id, order_date, total_amount, order_status)
    VALUES (p_customer_id, NOW(), v_total, 'Paid');

    SET p_order_id = LAST_INSERT_ID();

    INSERT INTO order_details (order_id, book_id, quantity, price)
    SELECT p_order_id, book_id, qty, unit_price FROM tmp_cart_lines;

    UPDATE book b
    INNER JOIN tmp_cart_lines t ON t.book_id = b.book_id
    SET b.stock = b.stock - t.qty;

    INSERT INTO payment (order_id, payment_method, amount, payment_status, payment_date)
    VALUES (p_order_id, p_payment_method, v_total, 'Completed', NOW());

    COMMIT;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_report_above_average_books;
DELIMITER $$
CREATE PROCEDURE sp_report_above_average_books()
BEGIN
    SELECT b.book_id,
           b.title,
           b.author,
           b.price,
           b.stock,
           (SELECT ROUND(AVG(x.price), 2) FROM book x) AS catalog_avg_price
    FROM book b
    WHERE b.price > (SELECT AVG(x.price) FROM book x)
    ORDER BY b.price DESC;
END$$
DELIMITER ;

DROP VIEW IF EXISTS v_category_inventory;
CREATE VIEW v_category_inventory AS
SELECT
    c.category_id,
    c.category_name,
    COUNT(b.book_id) AS title_count,
    COALESCE(SUM(b.stock), 0) AS units_in_stock,
    ROUND(COALESCE(AVG(b.price), 0), 2) AS avg_list_price
FROM category c
LEFT JOIN book b ON b.category_id = c.category_id
GROUP BY c.category_id, c.category_name;

CREATE INDEX idx_orders_status ON orders (order_status(32));
