-- =============================================================================
-- Knowledge Hub Bookstore - DBMS Academic Features Demonstration
-- This file contains queries that demonstrate the use of advanced SQL concepts
-- required for full marks in the DBMS project evaluation.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. JOINS
-- Show full order details combining customer, order, and book information.
-- Demonstrates INNER JOIN across 4 tables.
-- -----------------------------------------------------------------------------
SELECT 
    o.order_id,
    c.first_name,
    c.last_name,
    c.email,
    o.order_date,
    b.title AS book_title,
    od.quantity,
    od.price AS unit_price,
    (od.quantity * od.price) AS line_total,
    o.order_status
FROM orders o
INNER JOIN customer c ON o.customer_id = c.customer_id
INNER JOIN order_details od ON o.order_id = od.order_id
INNER JOIN book b ON od.book_id = b.book_id
ORDER BY o.order_id DESC;

-- -----------------------------------------------------------------------------
-- 2. GROUP BY + HAVING
-- Example A: Total orders and total amount spent per user, for users with > 1 order.
-- -----------------------------------------------------------------------------
SELECT 
    c.customer_id,
    c.first_name,
    c.last_name,
    COUNT(o.order_id) AS total_orders,
    SUM(o.total_amount) AS total_spent
FROM customer c
INNER JOIN orders o ON c.customer_id = o.customer_id
GROUP BY c.customer_id, c.first_name, c.last_name
HAVING COUNT(o.order_id) > 1
ORDER BY total_spent DESC;

-- Example B: Books sold more than 5 times total.
SELECT 
    b.book_id,
    b.title,
    SUM(od.quantity) AS total_sold
FROM book b
INNER JOIN order_details od ON b.book_id = od.book_id
GROUP BY b.book_id, b.title
HAVING SUM(od.quantity) > 5
ORDER BY total_sold DESC;

-- -----------------------------------------------------------------------------
-- 3. SUBQUERIES
-- Find customers who have spent more than the average order value across all orders.
-- -----------------------------------------------------------------------------
SELECT 
    c.customer_id,
    c.first_name,
    c.last_name,
    o.order_id,
    o.total_amount
FROM customer c
INNER JOIN orders o ON c.customer_id = o.customer_id
WHERE o.total_amount > (
    SELECT AVG(total_amount) FROM orders
)
ORDER BY o.total_amount DESC;

-- -----------------------------------------------------------------------------
-- 4. VIEWS
-- Creation of the View (already exists in schema, but shown here for completeness)
-- -----------------------------------------------------------------------------
/*
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
*/

-- Querying the View
SELECT * FROM v_customer_order_summary WHERE total_units > 2;

-- -----------------------------------------------------------------------------
-- 5. STORED PROCEDURES
-- The sp_place_order procedure handles stock updates, inserts into orders, 
-- order_details, and payment safely inside a transaction.
-- See sql/update_sp.sql for the full creation code.
-- 
-- Example execution (this is how the PHP backend calls it):
-- CALL sp_place_order(1, 'Card', '[{"book_id":1, "qty":2}]', 1, 10.00, 50.00, @order_id, @error_msg);
-- SELECT @order_id, @error_msg;
-- -----------------------------------------------------------------------------

-- -----------------------------------------------------------------------------
-- 6. FUNCTIONS
-- Scalar Function: fn_line_subtotal (Calculates line total safely)
-- -----------------------------------------------------------------------------
/*
CREATE FUNCTION fn_line_subtotal(p_qty INT, p_unit_price DECIMAL(10,2))
RETURNS DECIMAL(12,2)
DETERMINISTIC
NO SQL
BEGIN
    IF p_qty IS NULL OR p_unit_price IS NULL OR p_qty < 0 THEN
        RETURN 0;
    END IF;
    RETURN ROUND(p_qty * p_unit_price, 2);
END;
*/

-- Aggregate Functions Example (SUM, COUNT, AVG)
SELECT 
    COUNT(*) AS total_books_in_catalog,
    SUM(stock) AS total_inventory_units,
    ROUND(AVG(price), 2) AS average_book_price
FROM book;

-- -----------------------------------------------------------------------------
-- 7. INDEXING
-- Adding indexes improves lookup performance on foreign keys and commonly searched columns.
-- -----------------------------------------------------------------------------
/*
CREATE INDEX idx_orders_customer ON orders (customer_id);
CREATE INDEX idx_od_book ON order_details (book_id);
CREATE INDEX idx_address_customer ON address (customer_id);
CREATE INDEX idx_book_title ON book (title(120));
*/
