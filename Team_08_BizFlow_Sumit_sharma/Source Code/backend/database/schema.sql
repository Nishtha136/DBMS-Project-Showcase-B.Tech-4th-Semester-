use bizflow; 
-- 1. Role
CREATE TABLE role (
  role_id   INT AUTO_INCREMENT PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL UNIQUE
);

-- 2. User
CREATE TABLE user (
  user_id    INT AUTO_INCREMENT PRIMARY KEY,
  user_name  VARCHAR(100) NOT NULL,
  email      VARCHAR(150) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  role_id    INT NOT NULL,
  FOREIGN KEY (role_id) REFERENCES role(role_id)
);

-- 3. Party (unified vendor + customer table)
CREATE TABLE party (
  party_id       INT AUTO_INCREMENT PRIMARY KEY,
  company_name   VARCHAR(150) NOT NULL,
  contact_person VARCHAR(100),
  phone          VARCHAR(20),
  email          VARCHAR(150),
  gst_number     VARCHAR(20),
  address        TEXT,
  party_type     ENUM('vendor', 'customer', 'both') NOT NULL,
  credit_limit   DECIMAL(12,2) DEFAULT 0
);


  
  -- 4. Raw Material
CREATE TABLE raw_material (
  raw_material_id  INT AUTO_INCREMENT PRIMARY KEY,
  name             VARCHAR(150) NOT NULL,
  unit             VARCHAR(20) NOT NULL,        -- e.g. kg, litre, pcs
  current_stock    DECIMAL(10,2) DEFAULT 0,
  reorder_level    DECIMAL(10,2) DEFAULT 0
);

-- 5. Product (finished goods)
CREATE TABLE product (
  product_id      INT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(150) NOT NULL,
  sku             VARCHAR(50) UNIQUE,
  unit            VARCHAR(20) NOT NULL,
  selling_price   DECIMAL(10,2) NOT NULL,
  current_stock   DECIMAL(10,2) DEFAULT 0
);

-- 6. BOM — Bill of Materials (many-to-many: product <-> raw_material)
CREATE TABLE bom (
  bom_id           INT AUTO_INCREMENT PRIMARY KEY,
  product_id       INT NOT NULL,
  raw_material_id  INT NOT NULL,
  quantity_required DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (product_id)      REFERENCES product(product_id),
  FOREIGN KEY (raw_material_id) REFERENCES raw_material(raw_material_id),
  UNIQUE (product_id, raw_material_id)   -- no duplicate entries per product
);


  
  -- 7. Purchase Order
CREATE TABLE purchase_order (
  po_id         INT AUTO_INCREMENT PRIMARY KEY,
  party_id      INT NOT NULL,                   -- vendor from party table
  po_number     VARCHAR(50) NOT NULL UNIQUE,
  order_date    DATE NOT NULL,
  status        ENUM('pending','approved','received','cancelled') DEFAULT 'pending',
  total_amount  DECIMAL(12,2) DEFAULT 0,
  FOREIGN KEY (party_id) REFERENCES party(party_id)
);

-- 8. PO Items (line items for each PO)
CREATE TABLE po_items (
  po_item_id      INT AUTO_INCREMENT PRIMARY KEY,
  po_id           INT NOT NULL,
  raw_material_id INT NOT NULL,
  quantity        DECIMAL(10,2) NOT NULL,
  price           DECIMAL(10,2) NOT NULL,        -- price per unit at time of order
  FOREIGN KEY (po_id)           REFERENCES purchase_order(po_id),
  FOREIGN KEY (raw_material_id) REFERENCES raw_material(raw_material_id)
);


  
-- 9. Customer PO (purchase order placed by the customer to us)
CREATE TABLE customer_po (
  cust_po_id        INT AUTO_INCREMENT PRIMARY KEY,
  party_id          INT NOT NULL,               -- customer from party table
  client_po_number  VARCHAR(50) NOT NULL UNIQUE,
  order_date        DATE NOT NULL,
  status            ENUM('pending','confirmed','cancelled') DEFAULT 'pending',
  FOREIGN KEY (party_id) REFERENCES party(party_id)
);

-- 10. Sales Order (our internal SO, generated from customer PO)
CREATE TABLE sales_order (
  so_id          INT AUTO_INCREMENT PRIMARY KEY,
  cust_po_id     INT,                           -- optional link to customer PO
  so_number      VARCHAR(50) NOT NULL UNIQUE,
  order_date     DATE NOT NULL,
  status         ENUM('pending','processing','dispatched','completed','cancelled') DEFAULT 'pending',
  total_amount   DECIMAL(12,2) DEFAULT 0,
  FOREIGN KEY (cust_po_id) REFERENCES customer_po(cust_po_id)
);

-- 11. SO Items
CREATE TABLE so_items (
  so_item_id  INT AUTO_INCREMENT PRIMARY KEY,
  so_id       INT NOT NULL,
  product_id  INT NOT NULL,
  quantity    DECIMAL(10,2) NOT NULL,
  price       DECIMAL(10,2) NOT NULL,           -- selling price at time of order
  FOREIGN KEY (so_id)      REFERENCES sales_order(so_id),
  FOREIGN KEY (product_id) REFERENCES product(product_id)
);

-- 12. Invoice
CREATE TABLE invoice (
  invoice_id     INT AUTO_INCREMENT PRIMARY KEY,
  so_id          INT NOT NULL,
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  invoice_date   DATE NOT NULL,
  tax_amount     DECIMAL(10,2) DEFAULT 0,
  total_amount   DECIMAL(12,2) NOT NULL,
  status         ENUM('unpaid','partial','paid') DEFAULT 'unpaid',
  FOREIGN KEY (so_id) REFERENCES sales_order(so_id)
);

-- 13. Payment
CREATE TABLE payment (
  payment_id    INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id    INT NOT NULL,
  amount_paid   DECIMAL(12,2) NOT NULL,
  payment_date  DATE NOT NULL,
  payment_mode  ENUM('cash','bank_transfer','cheque','upi') NOT NULL,
  FOREIGN KEY (invoice_id) REFERENCES invoice(invoice_id)
);

-- 14. Dispatch
CREATE TABLE dispatch (
  dispatch_id      INT AUTO_INCREMENT PRIMARY KEY,
  so_id            INT NOT NULL,
  tracking_number  VARCHAR(100),
  transport_name   VARCHAR(100),
  dispatch_date    DATE,
  delivery_status  ENUM('pending','in_transit','delivered') DEFAULT 'pending',
  FOREIGN KEY (so_id) REFERENCES sales_order(so_id)
);

  
  
  -- 15. Production Order
CREATE TABLE production_order (
  production_id  INT AUTO_INCREMENT PRIMARY KEY,
  so_item_id     INT,                          -- optional: linked to a sales order item
  product_id     INT NOT NULL,
  employee_id    INT,                          -- assigned employee (FK added after HR table)
  quantity       DECIMAL(10,2) NOT NULL,
  status         ENUM('planned','in_progress','completed','cancelled') DEFAULT 'planned',
  start_date     DATE,
  end_date       DATE,
  FOREIGN KEY (so_item_id)  REFERENCES so_items(so_item_id),
  FOREIGN KEY (product_id)  REFERENCES product(product_id)
  -- employee_id FK will be added after employee table is created
);


  
  -- 16. Employee
CREATE TABLE employee (
  employee_id  INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT,                            -- nullable: not all employees have system access
  name         VARCHAR(100) NOT NULL,
  email        VARCHAR(150) UNIQUE,
  phone        VARCHAR(20),
  designation  VARCHAR(100),
  salary       DECIMAL(10,2),
  join_date    DATE,
  FOREIGN KEY (user_id) REFERENCES user(user_id)
);

ALTER TABLE production_order
  ADD CONSTRAINT fk_production_employee
  FOREIGN KEY (employee_id) REFERENCES employee(employee_id);

-- 17. Machine
CREATE TABLE machine (
  machine_id        INT AUTO_INCREMENT PRIMARY KEY,
  name              VARCHAR(100) NOT NULL,
  location          VARCHAR(100),
  last_service_date DATE,
  next_service_date DATE
);

-- 18. Maintenance Log
CREATE TABLE maintenance_log (
  maintenance_id  INT AUTO_INCREMENT PRIMARY KEY,
  machine_id      INT NOT NULL,
  employee_id     INT,                        -- technician who performed service
  description     TEXT,
  cost            DECIMAL(10,2),
  service_date    DATE NOT NULL,
  FOREIGN KEY (machine_id)  REFERENCES machine(machine_id),
  FOREIGN KEY (employee_id) REFERENCES employee(employee_id)
);


  
  SHOW TABLES;
  
  -- Trigger 1 - GRN: auto-update raw material stock 
DELIMITER $$

CREATE TRIGGER trg_grn_stock_update
AFTER UPDATE ON purchase_order
FOR EACH ROW
BEGIN
  -- only fire when status changes TO 'received'
  IF NEW.status = 'received' AND OLD.status != 'received' THEN
    UPDATE raw_material rm
    JOIN po_items pi ON rm.raw_material_id = pi.raw_material_id
    SET rm.current_stock = rm.current_stock + pi.quantity
    WHERE pi.po_id = NEW.po_id;
  END IF;
END$$

DELIMITER ;

-- Trigger 2 - Dispatch: auto-update sales order status
DELIMITER $$

CREATE TRIGGER trg_dispatch_update_so
AFTER INSERT ON dispatch
FOR EACH ROW
BEGIN
  UPDATE sales_order
  SET status = 'dispatched'
  WHERE so_id = NEW.so_id;
END$$

DELIMITER ;

-- Trigger 3 - Payment: auto-update invoice status
DELIMITER $$

CREATE TRIGGER trg_payment_update_invoice
AFTER INSERT ON payment
FOR EACH ROW
BEGIN
  DECLARE total_paid DECIMAL(12,2);
  DECLARE invoice_total DECIMAL(12,2);

  -- sum all payments for this invoice
  SELECT SUM(amount_paid) INTO total_paid
  FROM payment
  WHERE invoice_id = NEW.invoice_id;

  -- get the invoice total
  SELECT total_amount INTO invoice_total
  FROM invoice
  WHERE invoice_id = NEW.invoice_id;

  -- update status accordingly
  IF total_paid >= invoice_total THEN
    UPDATE invoice SET status = 'paid'    WHERE invoice_id = NEW.invoice_id;
  ELSE
    UPDATE invoice SET status = 'partial' WHERE invoice_id = NEW.invoice_id;
  END IF;
END$$

DELIMITER ;

-- View 1 - Low stock report 
CREATE VIEW low_stock_report AS
SELECT
  raw_material_id,
  name,
  unit,
  current_stock,
  reorder_level,
  (reorder_level - current_stock) AS shortage
FROM raw_material
WHERE current_stock <= reorder_level;

-- View 2 - Unpaid invoices with customer details 
CREATE VIEW unpaid_invoices AS
SELECT
  i.invoice_id,
  i.invoice_number,
  i.invoice_date,
  i.total_amount,
  i.status,
  p.company_name AS customer_name,
  p.phone        AS customer_phone,
  so.so_number
FROM invoice i
JOIN sales_order so  ON i.so_id         = so.so_id
JOIN customer_po cp  ON so.cust_po_id   = cp.cust_po_id
JOIN party p         ON cp.party_id     = p.party_id
WHERE i.status IN ('unpaid', 'partial');

-- View 3 - Production status summary 
CREATE VIEW production_summary AS
SELECT
  po.production_id,
  pr.name        AS product_name,
  po.quantity,
  po.status,
  po.start_date,
  po.end_date,
  e.name         AS assigned_to
FROM production_order po
JOIN product  pr ON po.product_id  = pr.product_id
LEFT JOIN employee e ON po.employee_id = e.employee_id;

-- Stored Procedure - ProcessProductionOrder(production id)
DELIMITER $$

CREATE PROCEDURE ProcessProductionOrder(IN p_production_id INT)
BEGIN
  -- variables
  DECLARE v_product_id     INT;
  DECLARE v_quantity        DECIMAL(10,2);
  DECLARE v_done            INT DEFAULT 0;
  DECLARE v_rm_id           INT;
  DECLARE v_required        DECIMAL(10,2);
  DECLARE v_available       DECIMAL(10,2);
  DECLARE v_error_msg       VARCHAR(255);

  -- cursor to loop through BOM items for this product
  DECLARE bom_cursor CURSOR FOR
    SELECT b.raw_material_id,
           b.quantity_required * v_quantity AS total_required,
           rm.current_stock
    FROM bom b
    JOIN raw_material rm ON b.raw_material_id = rm.raw_material_id
    WHERE b.product_id = v_product_id;

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

  -- rollback everything if any SQL error occurs
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  -- get production order details
  SELECT product_id, quantity
  INTO v_product_id, v_quantity
  FROM production_order
  WHERE production_id = p_production_id;

  -- -----------------------------------------------
  -- STEP 1: Check if sufficient stock exists
  -- -----------------------------------------------
  SELECT COUNT(*) INTO @insufficient
  FROM bom b
  JOIN raw_material rm ON b.raw_material_id = rm.raw_material_id
  WHERE b.product_id = v_product_id
    AND rm.current_stock < (b.quantity_required * v_quantity);

  IF @insufficient > 0 THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Insufficient raw material stock to process this production order.';
  END IF;

  -- -----------------------------------------------
  -- STEP 2: Begin transaction — deduct & update
  -- -----------------------------------------------
  START TRANSACTION;

    -- Deduct raw materials based on BOM
    UPDATE raw_material rm
    JOIN bom b ON rm.raw_material_id = b.raw_material_id
    SET rm.current_stock = rm.current_stock - (b.quantity_required * v_quantity)
    WHERE b.product_id = v_product_id;

    -- Add finished goods to product stock
    UPDATE product
    SET current_stock = current_stock + v_quantity
    WHERE product_id = v_product_id;

    -- Mark production order as completed
    UPDATE production_order
    SET status   = 'completed',
        end_date = CURDATE()
    WHERE production_id = p_production_id;

  COMMIT;

END$$

DELIMITER ;

  