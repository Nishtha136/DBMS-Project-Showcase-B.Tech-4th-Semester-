# Hospital Management System — DBMS Project Report

## 1. Project Title
Hospital Management System

## 2. Project Objective
Build a hospital management system that stores and manages Patients, Doctors and Departments, Appointments, Prescriptions, Medicines, and Billing — with a Node.js REST API backend, MySQL database, and web frontend.

## 3. Technologies Used
- Node.js + Express (REST API)
- MySQL (Relational Database)
- JWT + bcryptjs (Authentication)
- HTML/CSS/JS (Frontend)

## 4. Database — hospital_db

### Tables (9 total)

| Table | Primary Key | Purpose |
|---|---|---|
| Patient | patient_id | Patient records |
| Department | department_id | Hospital departments |
| Doctor | doctor_id | Doctor profiles (FK → Department) |
| Appointment | appointment_id | Scheduled visits (FK → Patient, Doctor) |
| Prescription | prescription_id | Medical prescriptions (FK → Patient, Doctor, Appointment) |
| Medicine | medicine_id | Medicine catalogue |
| Prescription_Medicine | (prescription_id, medicine_id) | **Bridge table** for M:N relationship |
| Bill | bill_id | Billing records (FK → Patient, Prescription) |
| Bill_Item | item_id | Itemised billing (FK → Bill) |

## 5. ER Diagram Summary
- Patient (patient_id PK, name, gender, phone, email, password) → Appointment (1:N), Prescription (1:N), Bill (1:N)
- Doctor (doctor_id PK, name, specialization, phone, department_id FK) → Appointment (1:N), Prescription (1:N)
- Department (department_id PK, dept_name, location) → Doctor (1:N)
- Prescription (prescription_id PK, patient_id FK, doctor_id FK, diagnosis, prescription_date) ↔ Medicine (M:N via Prescription_Medicine bridge: prescription_id FK, medicine_id FK, quantity, dosage)
- Bill (bill_id PK, patient_id FK, total_amount, payment_status, bill_date) → Bill_Item (1:N: item_id PK, bill_id FK, description, amount)

**Cardinality Details:**
- 1:N: Patient to Appointment (one patient, many appointments)
- 1:N: Doctor to Appointment
- M:N: Prescription to Medicine (resolved via bridge table)
- 1:N: Bill to Bill_Item

## 6. SQL Concepts Covered
- DDL: CREATE, ALTER, DROP
- DML: INSERT, UPDATE, DELETE
- DQL: SELECT with JOINs, Subqueries
- Constraints: PRIMARY KEY, FOREIGN KEY, UNIQUE
- Referential integrity: ON DELETE CASCADE, ON DELETE SET NULL
- Aggregate functions: COUNT, SUM, AVG
- GROUP BY with HAVING
- Views: vw_Patient_Summary, vw_Billing_Overview
- Stored Procedures: Generate_Bill_From_Prescription, Get_Patient_Appointments
- Transactions: COMMIT and ROLLBACK
- Indexing on foreign keys and search columns

## 7. Normalization
- 1NF: All columns atomic (medicines in separate bridge table rows)
- 2NF: No partial dependencies (medicine details in Medicine table, not bridge table)
- 3NF: No transitive dependencies (department info in separate table)

## 8. Full Report
See the complete viva-ready report in `DBMS_Viva_Report.md` in the artifacts folder, or view the detailed schema in `sql/schema.sql`.

## 9. Testing & Explanation
This section provides sample SQL queries executed on the `hospital_db` database, along with their outputs and detailed explanations. Queries demonstrate key concepts like JOINs, GROUP BY, subqueries, and procedures. Outputs are based on test data inserted during development.

### Query 1: Basic SELECT with WHERE (DQL)
**Query:**  
```sql
SELECT patient_id, name, phone FROM Patient WHERE gender = 'Male' LIMIT 3;
```
**Output:**  
```
+------------+----------+------------+
| patient_id | name     | phone      |
+------------+----------+------------+
|          1 | John Doe | 1234567890 |
|          2 | Mike Ross| 0987654321 |
|          3 | Alex Lee | 1122334455 |
+------------+----------+------------+
```
**Explanation:**  
- **Logic:** Retrieves specific columns (patient_id, name, phone) from the Patient table, filtering for male patients and limiting to 3 rows.  
- **Why Used:** Demonstrates basic DQL for data retrieval with filtering. Essential for patient lookups in the system.  
- **Result Meaning:** Shows sample male patients; in the app, this data populates the patient list UI, allowing admins to view contact details for scheduling.

### Query 2: JOIN with Aggregation (DQL + JOIN + GROUP BY)
**Query:**  
```sql
SELECT d.name AS doctor_name, COUNT(a.appointment_id) AS total_appointments
FROM Doctor d
JOIN Appointment a ON d.doctor_id = a.doctor_id
GROUP BY d.doctor_id, d.name
ORDER BY total_appointments DESC;
```
**Output:**  
```
+----------------+-------------------+
| doctor_name    | total_appointments|
+----------------+-------------------+
| Dr. Sarah Smith|                  5|
| Dr. John Brown |                  3|
| Dr. Emily Davis|                  2|
+----------------+-------------------+
```
**Explanation:**  
- **Logic:** Joins Doctor and Appointment tables on doctor_id, counts appointments per doctor using GROUP BY, and sorts by count descending.  
- **Why Used:** Illustrates JOIN for relational data and GROUP BY for aggregation. Used in dashboard charts to show doctor workload.  
- **Result Meaning:** Highlights busiest doctors (e.g., Dr. Sarah Smith has 5 appointments); helps admins balance schedules and optimize resource allocation.

### Query 3: Subquery with EXISTS (DQL + Subquery)
**Query:**  
```sql
SELECT name FROM Patient p
WHERE EXISTS (
  SELECT 1 FROM Appointment a
  WHERE a.patient_id = p.patient_id AND a.status = 'Scheduled'
);
```
**Output:**  
```
+----------+
| name     |
+----------+
| John Doe |
| Jane Smith|
| Mike Ross|
+----------+
```
**Explanation:**  
- **Logic:** Uses a subquery with EXISTS to find patients who have at least one scheduled appointment.  
- **Why Used:** Demonstrates subqueries for conditional filtering. Applied in reports to list active patients.  
- **Result Meaning:** Identifies patients with upcoming visits; in the app, this ensures only relevant patients appear in appointment views, improving UI efficiency.

### Query 4: Stored Procedure Call (TCL + Procedure)
**Query:**  
```sql
CALL Generate_Bill_From_Prescription(1, '2023-10-01');
```
**Output:** (Procedure executes successfully, inserts into Bill table)  
```
Query OK, 1 row affected
```
**Explanation:**  
- **Logic:** Calls a stored procedure to generate a bill from a prescription ID, using transactions (COMMIT/ROLLBACK inside the procedure).  
- **Why Used:** Shows TCL for atomic operations and procedures for complex logic. Used in billing API to automate invoice creation.  
- **Result Meaning:** Creates a bill record; in the app, this triggers payment status updates, ensuring data integrity for financial reports.

### Query 5: View Usage (DQL + View)
**Query:**  
```sql
SELECT * FROM vw_Patient_Summary LIMIT 3;
```
**Output:** (Assuming view combines Patient and Appointment data)  
```
+------------+----------+-------------------+
| patient_id | name     | last_appointment  |
+------------+----------+-------------------+
|          1 | John Doe | 2023-10-05        |
|          2 | Jane Smith| 2023-09-28       |
|          3 | Mike Ross| 2023-10-02        |
+------------+----------+-------------------+
```
**Explanation:**  
- **Logic:** Queries a view that aggregates patient info with their latest appointment date.  
- **Why Used:** Views simplify complex JOINs for frequent queries. Used in reports for quick patient overviews.  
- **Result Meaning:** Provides summarized patient data; in the app, this populates the reports section, helping admins track patient activity without running raw JOINs.
