-- Optional: run ONLY if your database was created with older column names.
-- Backup your database before altering.

-- If order_details used `subtotal` for line totals, rename to match place_order.php:
-- ALTER TABLE order_details CHANGE subtotal price DECIMAL(10,2) NOT NULL COMMENT 'Unit price at order time';

-- If payment has no `amount` column, add it:
-- ALTER TABLE payment ADD COLUMN amount DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER payment_method;
