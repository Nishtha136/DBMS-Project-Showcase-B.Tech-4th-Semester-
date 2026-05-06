-- Seed data for BizFlow (small demo set)
-- NOTE: `schema.sql` already contains many sample INSERTs. Use this file for additional quick seeds.

USE bizflow;

-- Roles (MUST be inserted first before users)
INSERT INTO role (role_name) VALUES
  ('Admin'),
  ('Manager'),
  ('Accountant'),
  ('Sales Executive'),
  ('Store Manager');

-- Demo admin user (password: Admin@123)
INSERT INTO user (user_name, email, password, role_id) VALUES
  ('admin', 'admin@bizflow.local', '$2b$10$xrikYmGmyfW0Fkrs85hcm.v6jDykugmS8JrjNOLfMCnAsQNO6nB8O', 1);

-- Sample parties (plus initial Seed Supplier if needed)
INSERT INTO party (company_name, contact_person, phone, party_type) VALUES
  ('Seed Supplier Ltd', 'Seema Rao', '9998887776', 'vendor'),
  ('RawCo Suppliers', 'Ramesh Kumar', '9876543210', 'vendor'),
  ('BuildMart Ltd', 'Priya Singh', '9123456780', 'customer'),
  ('MetalWorks Inc', 'Arjun Verma', '9001234567', 'both');

-- Raw materials
INSERT INTO raw_material (name, unit, current_stock, reorder_level) VALUES
  ('Test Material',     'pcs',  100.00, 20.00),
  ('Steel Rod',     'kg',  500.00, 100.00),
  ('Aluminium Sheet','kg', 300.00,  80.00),
  ('Rubber Gasket', 'pcs', 1000.00, 200.00),
  ('Paint (Red)',   'litre', 50.00,  20.00),
  ('Welding Wire',  'kg',  150.00,  30.00);

-- Products
INSERT INTO product (name, sku, unit, selling_price, current_stock) VALUES
  ('Steel Frame',    'PRD-001', 'pcs', 4500.00, 20.00),
  ('Aluminium Panel','PRD-002', 'pcs', 3200.00, 15.00),
  ('Rubber Seal Kit','PRD-003', 'pcs',  850.00, 50.00);

-- BOM entries
INSERT INTO bom (product_id, raw_material_id, quantity_required) VALUES
  (1, 1, 5.00),
  (1, 5, 0.50),
  (2, 2, 3.00),
  (3, 3, 4.00);

-- Purchase orders
INSERT INTO purchase_order (party_id, po_number, order_date, status, total_amount) VALUES
  (1, 'PO-2024-001', '2024-01-10', 'received',  25000.00),
  (1, 'PO-2024-002', '2024-02-15', 'pending',   18000.00),
  (3, 'PO-2024-003', '2024-03-01', 'approved',  12000.00);

INSERT INTO po_items (po_id, raw_material_id, quantity, price) VALUES
  (1, 1, 100.00, 150.00),
  (1, 5,  50.00,  200.00),
  (2, 2,  80.00, 180.00),
  (3, 3, 200.00,  30.00);

-- Customer POs and Sales Orders
INSERT INTO customer_po (party_id, client_po_number, order_date, status) VALUES
  (2, 'CUST-PO-001', '2024-01-20', 'confirmed'),
  (2, 'CUST-PO-002', '2024-02-10', 'pending');

INSERT INTO sales_order (cust_po_id, so_number, order_date, status, total_amount) VALUES
  (1, 'SO-2024-001', '2024-01-21', 'completed', 90000.00),
  (2, 'SO-2024-002', '2024-02-11', 'processing', 48000.00);

INSERT INTO so_items (so_id, product_id, quantity, price) VALUES
  (1, 1, 10.00, 4500.00),
  (1, 2,  5.00, 3200.00),
  (2, 3, 20.00,  850.00);

-- Invoices, payments, dispatch
INSERT INTO invoice (so_id, invoice_number, invoice_date, tax_amount, total_amount, status) VALUES
  (1, 'INV-2024-001', '2024-01-22', 4500.00, 94500.00, 'paid'),
  (2, 'INV-2024-002', '2024-02-12', 2400.00, 50400.00, 'unpaid');

INSERT INTO payment (invoice_id, amount_paid, payment_date, payment_mode) VALUES
  (1, 94500.00, '2024-01-25', 'bank_transfer');

INSERT INTO dispatch (so_id, tracking_number, transport_name, dispatch_date, delivery_status) VALUES
  (1, 'TRK-98765', 'BlueDart', '2024-01-23', 'delivered');

-- Production orders
INSERT INTO production_order (so_item_id, product_id, quantity, status, start_date, end_date) VALUES
  (1, 1, 10.00, 'completed',    '2024-01-18', '2024-01-20'),
  (2, 2,  5.00, 'in_progress',  '2024-02-05', NULL),
  (NULL, 3, 30.00, 'planned',   NULL,          NULL);

-- Employees
INSERT INTO employee (user_id, name, email, designation, salary, join_date) VALUES
  (NULL, 'Rajan Mehta',   'rajan@bizflow.com',  'Production Supervisor', 45000.00, '2022-06-01'),
  (NULL, 'Sneha Tiwari',  'sneha@bizflow.com',  'Store Manager',         38000.00, '2021-03-15'),
  (NULL, 'Karan Bhatia',  'karan@bizflow.com',  'Sales Executive',       35000.00, '2023-01-10'),
  (NULL, 'Meena Joshi',   'meena@bizflow.com',  'Accountant',            40000.00, '2020-09-01'),
  (NULL, 'Dev Sharma',    'dev@bizflow.com',    'Maintenance Tech',      32000.00, '2023-07-20');

-- Assign employee to production orders
UPDATE production_order SET employee_id = 1 WHERE production_id = 1;
UPDATE production_order SET employee_id = 1 WHERE production_id = 2;

-- Machines and maintenance logs
INSERT INTO machine (name, location, last_service_date, next_service_date) VALUES
  ('CNC Machine A',    'Shop Floor 1', '2024-01-05', '2024-04-05'),
  ('Hydraulic Press',  'Shop Floor 2', '2023-12-10', '2024-03-10'),
  ('Welding Unit B',   'Shop Floor 1', '2024-02-01', '2024-05-01');

INSERT INTO maintenance_log (machine_id, employee_id, description, cost, service_date) VALUES
  (1, 5, 'Routine lubrication and calibration', 1500.00, '2024-01-05'),
  (2, 5, 'Replaced hydraulic seals',            3200.00, '2023-12-10'),
  (3, 5, 'Electrode replacement and cleaning',   800.00, '2024-02-01');

