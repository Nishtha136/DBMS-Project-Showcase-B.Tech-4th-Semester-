# DBMS Project Viva/Video Presentation Script

## 1. Introduction (30 seconds)
**Speaker:** "Hello everyone, my name is [Your Name] and I'm presenting the 'Knowledge Hub Bookstore', a comprehensive Database Management System project built using PHP and MySQL. The goal of this project was to design a robust, normalized, and transaction-safe backend to manage an online bookstore's end-to-end operations."

## 2. Problem Statement (30 seconds)
**Speaker:** "Traditional bookstores often rely on manual inventory tracking and ledger-based sales records. This leads to data inconsistencies, overselling out-of-stock items, and inefficient customer management. This project solves that by providing an ACID-compliant database that automatically manages stock, handles secure customer authentication, and links multiple delivery addresses and payment records to orders seamlessly."

## 3. ER Diagram Explanation (45 seconds)
**Speaker:** "Looking at our Entity-Relationship model, the core of our system is the `Customer` and the `Book`. 
- A **Customer** can place many **Orders** (1 to Many). 
- An **Order** has exactly one **Payment** (1 to 1). 
- The relationship between Orders and Books is Many-to-Many. We resolved this by introducing the **Order Details** associative entity.
- A **Customer** can also have multiple **Addresses** saved in their profile (1 to Many)."

## 4. Schema Explanation & Normalization (45 seconds)
**Speaker:** "Our physical schema maps directly to this ER model. We achieved 3rd Normal Form (3NF) to eliminate redundancy. 
- **1NF:** Every column contains atomic values. 
- **2NF:** We use AUTO_INCREMENT surrogate primary keys like `order_id` and `book_id`, ensuring all attributes depend entirely on the primary key.
- **3NF:** We eliminated transitive dependencies. For example, instead of duplicating address text in the `orders` table, we store an `address_id` foreign key. We also store a snapshot of the `price` in `order_details` because the catalog book price might change in the future, but historical orders must remain accurate."

## 5. Live Demo Flow (2 minutes)
**Speaker:** "Let's walk through the application flow.
1.  **Register/Login:** I'll log in as a customer. The system verifies credentials against the `customer` table.
2.  **Add Address:** I'll go to checkout and add a new delivery address. You can see it automatically saves and marks it as the default.
3.  **Place Order:** I have items in my cart. I will select the address and place the order.
4.  **Backend Magic:** Under the hood, this triggers our Stored Procedure which I will explain shortly.
5.  **Orders Page:** Now on the 'My Orders' page, we can see the order dynamically rendered along with its 'Paid' status. 
6.  **Admin Panel:** If I switch to the Admin view, you can see the inventory has been automatically deducted."

## 6. Advanced SQL Explanations (1.5 minutes)
**Speaker:** "To achieve maximum marks, I implemented several advanced DBMS features:
-   **Joins:** We use `INNER JOIN` heavily. For example, to display the orders page, we join `orders`, `order_details`, `book`, and `customer` to get the full receipt data.
-   **Group By & Having:** To analyze sales, we group order details by `book_id` and use `HAVING SUM(quantity) > 5` to find our bestsellers.
-   **Subqueries:** We use subqueries to identify premium customers—those whose total spend is greater than the `AVG()` total spend of all users.
-   **Views:** I created a view called `v_customer_order_summary` which encapsulates complex aggregations, making UI reporting queries much simpler."

## 7. Transactions and ACID Properties (1 minute)
**Speaker:** "The most critical part of this system is the `sp_place_order` Stored Procedure. When a user clicks checkout, this procedure starts a **Transaction**.
-   **Atomicity:** It inserts the order, adds the order details, updates the stock, and inserts the payment. Either *all* of these succeed, or a `ROLLBACK` is triggered and *none* do.
-   **Consistency:** We use `CHECK` constraints and `HAVING` clauses to ensure stock never drops below zero.
-   **Isolation:** The transaction isolates this checkout from other users trying to buy the same book simultaneously.
-   **Durability:** Once the `COMMIT` command fires, the order is permanently saved to the disk."

## 8. Conclusion (15 seconds)
**Speaker:** "In conclusion, the Knowledge Hub Bookstore successfully demonstrates how relational database design, indexing, stored procedures, and ACID transactions come together to create a reliable, real-world application backend. Thank you."
