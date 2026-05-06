-- =============================================================================
-- Knowledge Hub — Online Bookstore
-- VIVA DEMO QUERIES (MySQL / MariaDB compatible)
-- =============================================================================
-- Database: bookstore (see includes/db.php)
-- Core tables: category, customer, book, orders, order_details, payment,
--              wishlist, reviews
-- Optional (if your live DB was extended by the PHP app): address, extra
-- columns on orders (address_id, gst_amount, delivery_fee).
--
-- HOW TO USE SAFELY
-- - Run in phpMyAdmin or mysql CLI on a COPY of production data when possible.
-- - Sections marked [OPTIONAL / RUN ONCE] may fail if objects already exist;
--   read the note and skip or adjust.
-- - Stored procedure: this project ships sp_place_order (see sql/update_sp.sql
--   vs sql/upgrade_dbms.sql for different signatures — match your installation).
-- =============================================================================

SET NAMES utf8mb4;


-- =============================================================================
-- 1. DATABASE SELECTION
-- =============================================================================
-- What: Selects the schema your PHP app connects to.
-- Why: All following statements run against the bookstore project database.
-- Topic: Database / schema basics.
-- =============================================================================

USE bookstore;


-- =============================================================================
-- 2. SHOW TABLES — CATALOG & TABLE STRUCTURE
-- =============================================================================
-- What: Lists all base tables and views; DESCRIBE shows columns and types.
-- Why: Proves physical schema matches ER design (customer, book, orders, …).
-- Topic: Data dictionary, metadata.
-- =============================================================================

SHOW TABLES;

-- Important project tables (run each line separately if you prefer):

DESCRIBE category;
DESCRIBE customer;
DESCRIBE book;
DESCRIBE orders;
DESCRIBE order_details;
DESCRIBE payment;
DESCRIBE wishlist;
DESCRIBE reviews;


-- =============================================================================
-- 3. DDL COMMANDS (Data Definition Language)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 3a. CREATE TABLE — example aligned with project schema
-- -----------------------------------------------------------------------------
-- What: Idempotent table creation exactly as in sql/schema.sql (IF NOT EXISTS).
-- Why: Shows how the bookstore entities are declared (engine, keys, FKs).
-- Topic: DDL — CREATE TABLE, constraints, InnoDB.
-- -----------------------------------------------------------------------------
-- [Safe to re-run: no-op if tables already exist.]

CREATE TABLE IF NOT EXISTS category (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(120) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- -----------------------------------------------------------------------------
-- 3b. ALTER TABLE — extend structure (run once; skip if column exists)
-- -----------------------------------------------------------------------------
-- What: Adds a nullable “remarks” column for a live demo of schema change.
-- Why: Real apps evolve; ALTER reflects maintenance without rebuilding tables.
-- Topic: DDL — ALTER TABLE … ADD COLUMN.
-- -----------------------------------------------------------------------------
-- [OPTIONAL / RUN ONCE] If you see “Duplicate column”, comment this out.

ALTER TABLE book
    ADD COLUMN viva_demo_remarks VARCHAR(100) NULL
    COMMENT 'Optional viva demo column; drop after presentation if undesired';


-- -----------------------------------------------------------------------------
-- 3c. INDEX — speed up common lookups
-- -----------------------------------------------------------------------------
-- What: Secondary index on orders.order_date for reporting / date filters.
-- Why: Checkout history and admin reports filter by order_date frequently.
-- Topic: DDL — CREATE INDEX, query optimization.
-- -----------------------------------------------------------------------------
-- [OPTIONAL / RUN ONCE] Drop first if re-running:
-- DROP INDEX idx_viva_demo_order_date ON orders;

CREATE INDEX idx_viva_demo_order_date ON orders (order_date);


-- =============================================================================
-- 4. DML COMMANDS (Data Manipulation Language)
-- =============================================================================
-- What: Insert, update, delete sample bookstore rows.
-- Why: The PHP catalog and checkout flows persist data with the same operations.
-- Topic: DML — INSERT, UPDATE, DELETE.
-- =============================================================================

-- Insert: add a tiny demo category + book, then clean up in DELETE step below.

INSERT INTO category (category_name)
VALUES ('Viva Demo — Short Stories');

SET @viva_category_id = LAST_INSERT_ID();

INSERT INTO book (
    title,
    author,
    description,
    price,
    stock,
    category_id,
    published_date
)
VALUES (
    'Viva Demo: Tales for the Examiner',
    'A. Candidate',
    'Temporary row for viva demonstration only.',
    12.50,
    10,
    @viva_category_id,
    '2026-01-01'
);

SET @viva_book_id = LAST_INSERT_ID();

-- Update: adjust list price / stock like an admin inventory correction.

UPDATE book
SET
    price = 11.99,
    stock = stock + 1
WHERE book_id = @viva_book_id;

-- If you ran section 3b (viva_demo_remarks column exists), you may also show:
-- UPDATE book SET viva_demo_remarks = 'Price corrected during viva demo' WHERE book_id = @viva_book_id;

-- Delete: remove the demo book (line items would block delete if any existed).

DELETE FROM book
WHERE book_id = @viva_book_id;

DELETE FROM category
WHERE category_id = @viva_category_id;


-- =============================================================================
-- 5. DQL COMMANDS (Data Query Language) — catalog browsing
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 5a. SELECT all books
-- -----------------------------------------------------------------------------
-- What: Full catalog listing with category name.
-- Why: Home / browse pages list titles from book joined to category.
-- Topic: DQL — SELECT, simple join.
-- -----------------------------------------------------------------------------

SELECT
    b.book_id,
    b.title,
    b.author,
    b.price,
    b.stock,
    c.category_name
FROM book b
LEFT JOIN category c ON c.category_id = b.category_id
ORDER BY b.book_id;


-- -----------------------------------------------------------------------------
-- 5b. Search books by title (partial match)
-- -----------------------------------------------------------------------------
-- What: Title search using LIKE.
-- Why: search / filter UI uses similar predicates.
-- Topic: DQL — pattern matching, string filters.
-- -----------------------------------------------------------------------------

SELECT book_id, title, author, price
FROM book
WHERE title LIKE '%Harry%'
ORDER BY title;


-- -----------------------------------------------------------------------------
-- 5c. Filter by category
-- -----------------------------------------------------------------------------
-- What: Books in one category by name or id.
-- Why: category.php and filters restrict catalog by genre.
-- Topic: DQL — filtering, FK use (category_id).
-- -----------------------------------------------------------------------------

SELECT b.title, b.author, b.price
FROM book b
INNER JOIN category c ON c.category_id = b.category_id
WHERE c.category_name = (
    SELECT category_name FROM category ORDER BY category_id LIMIT 1
)
ORDER BY b.title;


-- -----------------------------------------------------------------------------
-- 5d. Sort by price
-- -----------------------------------------------------------------------------
-- What: Cheapest or most expensive titles first.
-- Why: Sorting supports “price low to high” storefront options.
-- Topic: DQL — ORDER BY, decimals.
-- -----------------------------------------------------------------------------

SELECT title, author, price
FROM book
ORDER BY price DESC, title ASC
LIMIT 20;


-- =============================================================================
-- 6. KEYS DEMONSTRATION — primary & foreign keys
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 6a. Primary keys (SHOW CREATE TABLE)
-- -----------------------------------------------------------------------------
-- What: Shows PRIMARY KEY and AUTO_INCREMENT on each table.
-- Why: Each entity (book, order, …) has a surrogate PK used in PHP and URLs.
-- Topic: Keys — primary key, surrogate keys.
-- -----------------------------------------------------------------------------

SHOW CREATE TABLE book;
SHOW CREATE TABLE orders;
SHOW CREATE TABLE order_details;


-- -----------------------------------------------------------------------------
-- 6b. Foreign key relationships (information_schema)
-- -----------------------------------------------------------------------------
-- What: Lists every FK: child column → parent table.column.
-- Why: Enforces referential integrity (e.g. order_details.book_id → book).
-- Topic: Keys — foreign keys, referential integrity.
-- -----------------------------------------------------------------------------

SELECT
    kcu.TABLE_NAME      AS child_table,
    kcu.COLUMN_NAME     AS child_column,
    kcu.CONSTRAINT_NAME AS fk_name,
    kcu.REFERENCED_TABLE_NAME AS parent_table,
    kcu.REFERENCED_COLUMN_NAME AS parent_column
FROM information_schema.KEY_COLUMN_USAGE kcu
WHERE kcu.TABLE_SCHEMA = DATABASE()
  AND kcu.REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY kcu.TABLE_NAME, kcu.COLUMN_NAME;


-- =============================================================================
-- 7. JOINS — orders, customers, books, categories, line items
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 7a. INNER JOIN — only rows that exist on both sides
-- -----------------------------------------------------------------------------
-- What: Orders with customer names (no orphan orders without customer).
-- Why: Order history pages show who placed each order.
-- Topic: INNER JOIN.
-- -----------------------------------------------------------------------------

SELECT
    o.order_id,
    o.order_date,
    o.total_amount,
    o.order_status,
    c.first_name,
    c.last_name,
    c.email
FROM orders o
INNER JOIN customer c ON c.customer_id = o.customer_id
ORDER BY o.order_date DESC
LIMIT 25;


-- -----------------------------------------------------------------------------
-- 7b. LEFT JOIN — keep all books even without reviews
-- -----------------------------------------------------------------------------
-- What: Books and review counts; books with zero reviews still appear.
-- Why: Product pages may show “no reviews yet” instead of hiding titles.
-- Topic: LEFT JOIN, optional relationship (1:N reviews).
-- -----------------------------------------------------------------------------

SELECT
    b.book_id,
    b.title,
    COUNT(r.review_id) AS review_count
FROM book b
LEFT JOIN reviews r ON r.book_id = b.book_id
GROUP BY b.book_id, b.title
ORDER BY review_count DESC, b.title
LIMIT 25;


-- -----------------------------------------------------------------------------
-- 7c. Multiple-table join — order lines with book & category
-- -----------------------------------------------------------------------------
-- What: One row per line item: order, customer, book, category, qty, unit price.
-- Why: Admin order detail and invoice views assemble the same shape of data.
-- Topic: Multi-table join, associative entity order_details.
-- -----------------------------------------------------------------------------

SELECT
    o.order_id,
    o.order_date,
    CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
    b.title AS book_title,
    cat.category_name,
    od.quantity,
    od.price AS unit_price_at_order,
    ROUND(od.quantity * od.price, 2) AS line_total
FROM orders o
INNER JOIN customer c ON c.customer_id = o.customer_id
INNER JOIN order_details od ON od.order_id = o.order_id
INNER JOIN book b ON b.book_id = od.book_id
LEFT JOIN category cat ON cat.category_id = b.category_id
ORDER BY o.order_id DESC, od.order_detail_id
LIMIT 50;


-- =============================================================================
-- 8. GROUP BY and HAVING
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 8a. Count books per category
-- -----------------------------------------------------------------------------
-- What: How many titles and total stock units per genre.
-- Why: Admin inventory / category analytics.
-- Topic: GROUP BY, COUNT, SUM.
-- -----------------------------------------------------------------------------

SELECT
    c.category_id,
    c.category_name,
    COUNT(b.book_id) AS book_count,
    COALESCE(SUM(b.stock), 0) AS total_stock_units
FROM category c
LEFT JOIN book b ON b.category_id = c.category_id
GROUP BY c.category_id, c.category_name
ORDER BY book_count DESC;


-- -----------------------------------------------------------------------------
-- 8b. Count orders per customer
-- -----------------------------------------------------------------------------
-- What: Repeat buyers vs one-time purchasers.
-- Why: CRM-style insight; HAVING filters groups, not rows.
-- Topic: GROUP BY, HAVING.
-- -----------------------------------------------------------------------------

SELECT
    c.customer_id,
    CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
    COUNT(o.order_id) AS order_count,
    ROUND(SUM(o.total_amount), 2) AS lifetime_spend
FROM customer c
INNER JOIN orders o ON o.customer_id = c.customer_id
GROUP BY c.customer_id, c.first_name, c.last_name
HAVING COUNT(o.order_id) >= 1
ORDER BY order_count DESC, lifetime_spend DESC
LIMIT 25;


-- -----------------------------------------------------------------------------
-- 8c. Categories having more than two books
-- -----------------------------------------------------------------------------
-- What: Only categories with > 2 titles.
-- Why: Shows HAVING as a filter on aggregates after GROUP BY.
-- Topic: HAVING vs WHERE.
-- -----------------------------------------------------------------------------

SELECT
    c.category_name,
    COUNT(b.book_id) AS books_in_category
FROM category c
INNER JOIN book b ON b.category_id = c.category_id
GROUP BY c.category_id, c.category_name
HAVING COUNT(b.book_id) > 2
ORDER BY books_in_category DESC;


-- =============================================================================
-- 9. SUBQUERIES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 9a. Books priced above the catalog average
-- -----------------------------------------------------------------------------
-- What: Compare each row to an aggregate computed over the whole table.
-- Why: Pricing reports; same idea as sp_report_above_average_books.
-- Topic: Subquery — scalar subquery in WHERE.
-- -----------------------------------------------------------------------------

SELECT
    book_id,
    title,
    author,
    price
FROM book
WHERE price > (SELECT AVG(price) FROM book)
ORDER BY price DESC;


-- -----------------------------------------------------------------------------
-- 9b. Customer with the highest number of orders
-- -----------------------------------------------------------------------------
-- What: Top buyer by order count (ties possible — LIMIT 1 for a single winner).
-- Why: Loyalty / segmentation example.
-- Topic: Subquery — derived table / aggregation.
-- -----------------------------------------------------------------------------

SELECT
    c.customer_id,
    CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
    ocnt.order_count
FROM customer c
INNER JOIN (
    SELECT customer_id, COUNT(*) AS order_count
    FROM orders
    GROUP BY customer_id
) AS ocnt ON ocnt.customer_id = c.customer_id
WHERE ocnt.order_count = (
    SELECT MAX(x.cnt)
    FROM (SELECT COUNT(*) AS cnt FROM orders GROUP BY customer_id) x
)
LIMIT 5;


-- =============================================================================
-- 10. AGGREGATE FUNCTIONS
-- =============================================================================
-- What: Single-row summary of catalog and sales tables.
-- Why: Dashboard / admin reports (inventory value, order totals).
-- Topic: COUNT, SUM, AVG, MAX, MIN.
-- =============================================================================

SELECT
    COUNT(*) AS total_books,
    SUM(stock) AS total_units_in_stock,
    ROUND(AVG(price), 2) AS avg_list_price,
    MAX(price) AS max_price,
    MIN(price) AS min_price
FROM book;

SELECT
    COUNT(*) AS total_orders,
    ROUND(SUM(total_amount), 2) AS revenue_all_orders,
    ROUND(AVG(total_amount), 2) AS avg_order_value,
    MAX(total_amount) AS largest_order,
    MIN(total_amount) AS smallest_order
FROM orders;


-- =============================================================================
-- 11. SCALAR FUNCTIONS (string & numeric)
-- =============================================================================
-- What: Per-row transformations in the SELECT list.
-- Why: Display formatting in SQL layers or ad-hoc reports.
-- Topic: UPPER, LOWER, LENGTH, ROUND.
-- =============================================================================

SELECT
    book_id,
    UPPER(title) AS title_upper,
    LOWER(author) AS author_lower,
    LENGTH(title) AS title_char_length,
    ROUND(price * 1.05, 2) AS price_with_5pct_markup
FROM book
ORDER BY book_id
LIMIT 15;


-- =============================================================================
-- 12. VIEW — customer-facing order summary
-- =============================================================================
-- What: Virtual table joining customer + orders + line counts.
-- Why: Simplifies PHP or BI tools; project also defines v_customer_order_summary
--      in sql/upgrade_dbms.sql — this is an additional demo view name.
-- Topic: Views — abstraction, security/readability.
-- -----------------------------------------------------------------------------
-- [OPTIONAL] Drop first if you re-run: DROP VIEW IF EXISTS viva_customer_orders;

DROP VIEW IF EXISTS viva_customer_orders;

CREATE VIEW viva_customer_orders AS
SELECT
    c.customer_id,
    CONCAT(TRIM(c.first_name), ' ', TRIM(c.last_name)) AS customer_name,
    c.email,
    o.order_id,
    o.order_date,
    o.total_amount,
    o.order_status,
    (SELECT COUNT(*) FROM order_details od WHERE od.order_id = o.order_id) AS line_items,
    (SELECT COALESCE(SUM(od.quantity), 0) FROM order_details od WHERE od.order_id = o.order_id) AS units_ordered
FROM customer c
INNER JOIN orders o ON o.customer_id = c.customer_id;

-- Query the view like a table:

SELECT *
FROM viva_customer_orders
ORDER BY order_date DESC
LIMIT 20;


-- =============================================================================
-- 13. STORED PROCEDURE — sp_place_order (project routine)
-- =============================================================================
-- What: Atomic checkout: validates cart JSON, inserts order + order_details,
--       decrements stock, inserts payment — inside a transaction.
-- Why: This is exactly what place_order.php uses when the routine exists.
-- Topic: Stored procedures, parameters, transactions inside procedure.
-- -----------------------------------------------------------------------------
-- IMPORTANT: Two versions exist in the repo:
--   • sql/update_sp.sql — 8 params (customer, method, JSON lines, address_id,
--     gst, delivery, OUT order_id, OUT error) — matches current place_order.php.
--   • sql/upgrade_dbms.sql — shorter signature (no address/gst/delivery).
-- Run: SHOW CREATE PROCEDURE sp_place_order;  to see YOUR database version.
-- -----------------------------------------------------------------------------
-- Example for update_sp.sql signature (replace IDs / JSON with real data):

SET @p_oid := 0;
SET @p_err := NULL;

CALL sp_place_order(
    1,                                              -- p_customer_id (must exist)
    'Card',                                         -- p_payment_method
    '[{"book_id": 1, "qty": 1}]',                   -- p_lines (book must exist, in stock)
    1,                                              -- p_address_id (must exist if your SP requires it)
    0.00,                                           -- p_gst_amount
    0.00,                                           -- p_delivery_fee
    @p_oid,
    @p_err
);

SELECT @p_oid AS new_order_id, @p_err AS error_message;

-- If your DB has the shorter procedure from upgrade_dbms.sql, use instead:
-- CALL sp_place_order(1, 'Card', '[{"book_id":1,"qty":1}]', @p_oid, @p_err);
-- SELECT @p_oid, @p_err;

-- Read-only demo (no data change): list procedures.

SHOW PROCEDURE STATUS WHERE Db = DATABASE();


-- =============================================================================
-- 14. TRANSACTIONS — COMMIT vs ROLLBACK
-- =============================================================================
-- What: Unit of work: all succeeds or none is persisted.
-- Why: Checkout must not leave half-written orders if stock update fails.
-- Topic: ACID, transaction control.
-- =============================================================================

-- 14a. ROLLBACK — temporary insert disappears

START TRANSACTION;

INSERT INTO category (category_name)
VALUES ('VIVA_TX_ROLLBACK_DEMO');

SELECT category_id, category_name
FROM category
WHERE category_name = 'VIVA_TX_ROLLBACK_DEMO';

ROLLBACK;

SELECT category_id, category_name
FROM category
WHERE category_name = 'VIVA_TX_ROLLBACK_DEMO';


-- 14b. COMMIT — deliberate insert kept (then clean up)

START TRANSACTION;

INSERT INTO category (category_name)
VALUES ('VIVA_TX_COMMIT_DEMO');

COMMIT;

SELECT category_id, category_name
FROM category
WHERE category_name = 'VIVA_TX_COMMIT_DEMO';

-- Cleanup after demo (run after faculty sees the committed row):

DELETE FROM category
WHERE category_name = 'VIVA_TX_COMMIT_DEMO';


-- =============================================================================
-- 15. INDEXING — purpose + execution plan
-- =============================================================================
-- What: Indexes speed equality/range searches; EXPLAIN shows whether the
--       optimizer can use them.
-- Why: sql/schema.sql and sql/upgrade_dbms.sql already add idx_book_title /
--      idx_book_author; customer.email is UNIQUE (indexed). Below reinforces the idea.
-- Topic: Physical design, EXPLAIN.
-- =============================================================================

-- Title search — project index idx_book_title (prefix on title) helps LIKE 'prefix%'

EXPLAIN
SELECT book_id, title, price
FROM book
WHERE title LIKE 'The%';

-- Email lookup — UNIQUE index on customer.email

EXPLAIN
SELECT customer_id, email
FROM customer
WHERE email = 'reader@example.com';

-- Optional: extra index demo on phone lookups (skip if duplicate key error)

-- DROP INDEX idx_viva_demo_customer_phone ON customer;
-- CREATE INDEX idx_viva_demo_customer_phone ON customer (phone_number(20));


-- =============================================================================
-- 16. OUTPUT EXPLANATION (how to narrate results)
-- =============================================================================
-- For each section above, tell the examiner:
--   • What the result rows mean in bookstore terms (catalog, cart, invoice).
--   • Which clause did the work (WHERE vs HAVING, JOIN type, subquery).
--   • How it maps to your PHP modules (e.g. place_order.php, admin_orders.php).
-- This file already prefixes each block with: what / why / topic.
-- =============================================================================


-- =============================================================================
-- 17. FINAL DEMO SEQUENCE (suggested order for the viva)
-- =============================================================================
-- 1) USE bookstore; SHOW TABLES; DESCRIBE book; DESCRIBE orders;
--    — “Here is our physical schema for the ER model.”
-- 2) SHOW CREATE TABLE order_details; + information_schema FK query (section 6)
--    — “Primary and foreign keys enforce integrity.”
-- 3) Run one catalog SELECT (section 5) + one sorted price list
--    — “DQL powers the storefront listing.”
-- 4) Run INNER JOIN order lines (section 7c)
--    — “This is the invoice / order-detail shape.”
-- 5) GROUP BY category (section 8a) + HAVING > 2 books (section 8c)
--    — “Aggregates feed inventory reports.”
-- 6) Subquery above-average price (section 9a)
--    — “Nested queries for pricing analytics.”
-- 7) Aggregates on book + orders (section 10); scalar functions (section 11)
--    — “Dashboard summaries and display helpers.”
-- 8) SELECT * FROM viva_customer_orders LIMIT 10 (section 12)
--    — “Views simplify repeated joins for reporting.”
-- 9) SHOW PROCEDURE STATUS; explain sp_place_order; optionally CALL with test data
--    — “Business logic in the database with transactions inside the procedure.”
-- 10) Transaction ROLLBACK demo (section 14a)
--    — “If anything fails, we roll back — same idea as checkout.”
-- 11) EXPLAIN on title search (section 15)
--     — “Indexes match how users search the catalog.”
-- =============================================================================
