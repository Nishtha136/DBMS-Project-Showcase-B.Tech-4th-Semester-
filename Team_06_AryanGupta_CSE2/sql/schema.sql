CREATE DATABASE IF NOT EXISTS hospital_db;
USE hospital_db;

CREATE TABLE IF NOT EXISTS Patient (
  patient_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  gender VARCHAR(10) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS Department (
  department_id INT PRIMARY KEY,
  dept_name VARCHAR(100) NOT NULL,
  location VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS Doctor (
  doctor_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  specialization VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  department_id INT DEFAULT NULL,
  FOREIGN KEY (department_id) REFERENCES Department(department_id)
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS Appointment (
  appointment_id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status VARCHAR(50) DEFAULT 'Scheduled',
  FOREIGN KEY (patient_id) REFERENCES Patient(patient_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES Doctor(doctor_id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS Prescription (
  prescription_id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  diagnosis TEXT NOT NULL,
  prescription_date DATE NOT NULL,
  FOREIGN KEY (patient_id) REFERENCES Patient(patient_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES Doctor(doctor_id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS Medicine (
  medicine_id INT AUTO_INCREMENT PRIMARY KEY,
  medicine_name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS Prescription_Medicine (
  prescription_id INT,
  medicine_id INT,
  quantity INT NOT NULL,
  dosage VARCHAR(100) NOT NULL,
  PRIMARY KEY (prescription_id, medicine_id),
  FOREIGN KEY (prescription_id) REFERENCES Prescription(prescription_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (medicine_id) REFERENCES Medicine(medicine_id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS Bill (
  bill_id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_status VARCHAR(30) DEFAULT 'Pending',
  bill_date DATE DEFAULT (CURDATE()),
  FOREIGN KEY (patient_id) REFERENCES Patient(patient_id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS Bill_Item (
  item_id INT AUTO_INCREMENT PRIMARY KEY,
  bill_id INT NOT NULL,
  description VARCHAR(255),
  amount DECIMAL(10,2),
  FOREIGN KEY (bill_id) REFERENCES Bill(bill_id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

DROP VIEW IF EXISTS vw_Patient_Summary;

CREATE VIEW vw_Patient_Summary AS
SELECT 
  p.patient_id,
  p.name,
  p.phone,
  MAX(a.appointment_date) AS last_appointment
FROM Patient p
LEFT JOIN Appointment a ON p.patient_id = a.patient_id
GROUP BY p.patient_id;

DROP VIEW IF EXISTS vw_Billing_Overview;

CREATE VIEW vw_Billing_Overview AS
SELECT 
  b.bill_id,
  p.name AS patient_name,
  b.total_amount,
  b.payment_status,
  b.bill_date
FROM Bill b
JOIN Patient p ON b.patient_id = p.patient_id;

DROP PROCEDURE IF EXISTS Generate_Bill_From_Prescription;
DROP PROCEDURE IF EXISTS Get_Patient_Appointments;


CREATE PROCEDURE Generate_Bill_From_Prescription(
  IN p_prescription_id INT,
  IN p_bill_date DATE
)
BEGIN
  DECLARE total DECIMAL(10,2) DEFAULT 0;
  DECLARE pat_id INT;

  START TRANSACTION;

  SELECT patient_id INTO pat_id
  FROM Prescription
  WHERE prescription_id = p_prescription_id;

  SELECT SUM(m.price * pm.quantity) INTO total
  FROM Prescription_Medicine pm
  JOIN Medicine m ON pm.medicine_id = m.medicine_id
  WHERE pm.prescription_id = p_prescription_id;

  SET total = IFNULL(total, 0);

  INSERT INTO Bill (patient_id, total_amount, bill_date)
  VALUES (pat_id, total, p_bill_date);

  COMMIT;
END 

CREATE PROCEDURE Get_Patient_Appointments(IN p_patient_id INT)
BEGIN
  SELECT 
    a.appointment_id,
    d.name AS doctor_name,
    a.appointment_date,
    a.appointment_time,
    a.status
  FROM Appointment a
  JOIN Doctor d ON a.doctor_id = d.doctor_id
  WHERE a.patient_id = p_patient_id
  ORDER BY a.appointment_date DESC;
END 

DELIMITER ;
SELECT * FROM Patient;
SELECT * FROM vw_Patient_Summary;
CALL Get_Patient_Appointments(1);
SELECT * FROM vw_Billing_Overview;
SELECT SUM(total_amount) FROM Bill;
SELECT * FROM Doctor;
SELECT * FROM Appointment;
SELECT * FROM Bill;
SELECT * FROM Bill WHERE payment_status = 'Pending';
