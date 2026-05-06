# Knowledge Hub Bookstore - DBMS Project

## 1. Problem Statement
The traditional management of a bookstore involves manual tracking of inventory, customer records, and order processing. This manual process is prone to errors, data redundancy, and inefficiencies. The **Knowledge Hub Bookstore** project is a comprehensive Database Management System (DBMS) designed to automate these processes. It provides a robust backend to handle customer authentication, shopping cart management, secure order placement via ACID-compliant transactions, and inventory tracking, ensuring data integrity and a seamless user experience.

## 2. Users
The system caters to two primary user roles:
*   **Customer (User)**: Can browse the catalog, manage their shopping cart, add/select delivery addresses, place orders, view order history, and manage their profile.
*   **Administrator (Admin)**: Can manage the book inventory (add, edit, delete books), update stock levels in real-time, and view system-wide customer orders.

## 3. Data Managed
The system manages the following core entities:
*   **Customers**: Authentication details, contact information, and role management.
*   **Addresses**: Multiple delivery addresses per customer with a default selection mechanism.
*   **Books & Categories**: Book metadata (title, author, price), categorical organization, and real-time stock levels.
*   **Orders & Order Details**: Order metadata (date, status, totals) and line-item specifics (book ID, quantity, price at time of purchase).
*   **Payments**: Payment methods, statuses, and transaction amounts linked to specific orders.
*   **Wishlist & Reviews**: User preferences and feedback on books.

## 4. Entity-Relationship (ER) Explanation
The ER model is built around the `Customer` and `Book` entities interacting through an `Order`.
*   A **Customer** can have multiple **Addresses** (1:N relationship).
*   A **Customer** can place multiple **Orders** (1:N relationship).
*   An **Order** MUST have exactly one **Payment** (1:1 relationship).
*   An **Order** contains multiple **Order Details** (line items), and each line item maps to exactly one **Book** (M:N relationship between Orders and Books resolved by the `order_details` associative entity).
*   A **Category** can contain multiple **Books** (1:N relationship).

## 5. Schema Explanation
The physical schema implements the ER model using relational tables:
*   `customer` (customer_id PK)
*   `address` (address_id PK, customer_id FK)
*   `category` (category_id PK)
*   `book` (book_id PK, category_id FK)
*   `orders` (order_id PK, customer_id FK, address_id FK)
*   `order_details` (order_detail_id PK, order_id FK, book_id FK)
*   `payment` (payment_id PK, order_id FK)

## 6. Normalization
The database is fully normalized to the 3rd Normal Form (3NF) to eliminate data anomalies:
*   **1NF (First Normal Form)**: All attributes are atomic. There are no repeating groups (e.g., instead of storing multiple addresses in a single string, they are separated into the `address` table).
*   **2NF (Second Normal Form)**: All tables have a single-column Primary Key (surrogate keys like `order_id`), so all non-key attributes are fully functionally dependent on the entire primary key. No partial dependencies exist.
*   **3NF (Third Normal Form)**: No transitive dependencies exist. For example, `orders` stores `address_id` rather than duplicating the city/state details of the address, and `order_details` stores the `price` at the time of purchase rather than relying on the mutable `book.price`.

## 7. Keys (Primary and Foreign Keys)
*   **Primary Keys (PK)**: Used uniquely to identify records (e.g., `customer_id`, `book_id`, `order_id`). AUTO_INCREMENT is utilized for surrogate keys.
*   **Foreign Keys (FK)**: Used to enforce referential integrity.
    *   `orders.customer_id` references `customer.customer_id` (ON DELETE RESTRICT to prevent deleting a customer with active orders).
    *   `order_details.order_id` references `orders.order_id` (ON DELETE CASCADE to delete line items if the main order is deleted).

## 8. Advanced SQL Features Used
To achieve maximum performance and data integrity, the following advanced DBMS features are implemented:
*   **Joins**: Extensive use of `INNER JOIN` and `LEFT JOIN` to retrieve composite data (e.g., fetching order details along with book titles and customer names).
*   **Subqueries**: Used for complex filtering (e.g., finding customers who spent above average).
*   **Views**: `v_customer_order_summary` encapsulates a complex multi-join and aggregate query, providing a clean interface for the UI to display order summaries.
*   **Stored Procedures**: `sp_place_order` encapsulates the entire checkout logic.
*   **Transactions (ACID)**: `START TRANSACTION`, `COMMIT`, and `ROLLBACK` ensure that an order, its line items, stock reduction, and payment record are all saved atomically. If stock is insufficient, the entire operation rolls back safely.
*   **Functions**: Mathematical and aggregate functions (`SUM`, `COUNT`, `LEAST`, `ROUND`) are heavily utilized in reports and the checkout procedure.
*   **Indexing**: B-Tree indexes are created on frequently searched columns (e.g., `book.title`) and Foreign Keys (e.g., `order_details.book_id`) to optimize `JOIN` and `WHERE` clause performance.

## 9. Sample Queries with Explanation
Please refer to the `docs/dbms_features.sql` file in the project repository for a comprehensive list of runnable queries demonstrating JOINS, GROUP BY, Subqueries, and Stored Procedure invocations.

### Example: Stored Procedure Invocation
```sql
-- This query is executed by the PHP backend during checkout.
-- It passes a JSON array of the cart and executes all insertions and stock updates atomically.
CALL sp_place_order(
    1,                       -- Customer ID
    'Card',                  -- Payment Method
    '[{"book_id":1, "qty":2}]', -- JSON Cart Data
    1,                       -- Address ID
    10.00,                   -- GST Amount
    50.00,                   -- Delivery Fee
    @order_id,               -- OUT Parameter for new Order ID
    @error_msg               -- OUT Parameter for Error Messages
);
SELECT @order_id, @error_msg;
```

## 10. Conclusion
The Knowledge Hub Bookstore DBMS effectively demonstrates the application of relational database concepts in a real-world scenario. By leveraging normalization, ACID transactions, stored procedures, and views, the system guarantees data consistency, prevents race conditions (like overselling stock), and provides an optimized backend architecture capable of supporting a full-stack web application.
