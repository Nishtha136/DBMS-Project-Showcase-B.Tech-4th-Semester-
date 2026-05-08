CREATE DATABASE FarmerMarketplace;
use FarmerMarketplace;

CREATE TABLE Category (
    CategoryID INT PRIMARY KEY AUTO_INCREMENT,
    CategoryName VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE Farmer (
    FarmerID INT PRIMARY KEY AUTO_INCREMENT,
    FarmerName VARCHAR(100) NOT NULL,
    Phone VARCHAR(15) NOT NULL UNIQUE,
    Village VARCHAR(100),
    State VARCHAR(50),
    BankAccNo VARCHAR(20) NOT NULL
);

CREATE INDEX idx_farmer_name ON Farmer(FarmerName);

CREATE TABLE Buyer (
    BuyerID INT PRIMARY KEY AUTO_INCREMENT,
    BuyerName VARCHAR(100) NOT NULL,
    Phone VARCHAR(15) NOT NULL UNIQUE,
    Email VARCHAR(100),
    Address TEXT NOT NULL
);
CREATE INDEX idx_buyer_name ON Buyer(BuyerName);
CREATE TABLE Product (
    ProductID INT PRIMARY KEY AUTO_INCREMENT,
    FarmerID INT NOT NULL,
    CategoryID INT NOT NULL,
    ProductName VARCHAR(100) NOT NULL,
    QtyAvailable DECIMAL(10,2) NOT NULL DEFAULT 0,
    UnitPrice DECIMAL(10,2) NOT NULL,
    HarvestDate DATE,
    FOREIGN KEY (FarmerID) REFERENCES Farmer(FarmerID) ON DELETE CASCADE,
    FOREIGN KEY (CategoryID) REFERENCES Category(CategoryID) ON DELETE CASCADE
);



CREATE INDEX idx_product_name ON Product(ProductName);
CREATE TABLE `Order` (
    OrderID INT PRIMARY KEY AUTO_INCREMENT,
    BuyerID INT NOT NULL,
    OrderDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    OrderStatus VARCHAR(20) DEFAULT 'Pending',
    TotalAmt DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (BuyerID) REFERENCES Buyer(BuyerID) ON DELETE CASCADE
);
CREATE INDEX idx_order_date ON `Order`(OrderDate);
CREATE TABLE OrderItem (
    OrderID INT NOT NULL,
    ProductID INT NOT NULL,
    QtyOrdered DECIMAL(10,2) NOT NULL,
    PriceAtPurchase DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (OrderID, ProductID),
    FOREIGN KEY (OrderID) REFERENCES `Order`(OrderID) ON DELETE CASCADE,
    FOREIGN KEY (ProductID) REFERENCES Product(ProductID) ON DELETE CASCADE
);

CREATE TABLE Payment (
    PaymentID INT PRIMARY KEY AUTO_INCREMENT,
    OrderID INT NOT NULL,
    PaymentDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    Amount DECIMAL(10,2) NOT NULL,
    PaymentMethod VARCHAR(50),
    PaymentStatus VARCHAR(20) DEFAULT 'Completed',
    FOREIGN KEY (OrderID) REFERENCES `Order`(OrderID) ON DELETE CASCADE
);

CREATE TABLE Delivery (
    DeliveryID INT PRIMARY KEY AUTO_INCREMENT,
    OrderID INT NOT NULL,
    DeliveryPartner VARCHAR(100),
    DispatchDate DATE,
    DeliveryDate DATE,
    DeliveryStatus VARCHAR(20) DEFAULT 'Processing',
    FOREIGN KEY (OrderID) REFERENCES `Order`(OrderID) ON DELETE CASCADE
);

INSERT INTO Category (CategoryID, CategoryName) VALUES
(1,'Vegetables'),
(2,'Fruits'),
(3,'Grains'),
(4,'Dairy'),
(5,'Spices'),
(6,'Pulses'),
(7,'Nuts'),
(8,'Herbs');

INSERT INTO Farmer (FarmerID, FarmerName, Phone, Village, State, BankAccNo) VALUES
(1,'Amit Kumar','9876543210','Kharak','Haryana','SBIN0001111'),
(2,'Rajesh Singh','9876543211','Palampur','Himachal Pradesh','HDFC0002222'),
(3,'Suresh Bhai','9876543212','Anand','Gujarat','ICIC0003333'),
(4,'Ramesh Patil','9876543213','Nashik','Maharashtra','UTIB0004444'),
(5,'Manoj Gowda','9876543214','Mandya','Karnataka','SBIN0005555'),
(6,'Vikram Reddy','9876543215','Warangal','Telangana','HDFC0006666'),
(7,'Anil Sharma','9876543216','Mathura','Uttar Pradesh','ICIC0007777'),
(8,'Karan Yadav','9876543217','Patna','Bihar','UTIB0008888');


INSERT INTO Buyer (BuyerID, BuyerName, Phone, Email, Address) VALUES
(1,'Fresh Foods Ltd','8876543210','contact@freshfoods.com','Delhi'),
(2,'Green Groceries','8876543211','info@greengroceries.in','Mumbai'),
(3,'Organic Eats','8876543212','sales@organiceats.com','Bangalore'),
(4,'Daily Needs','8876543213','support@dailyneeds.in','Shimla'),
(5,'SuperMart','8876543214','hello@supermart.com','Pune'),
(6,'Farm to Home','8876543215','care@farmtohome.in','Hyderabad'),
(7,'Healthy Bites','8876543216','admin@healthybites.com','Kolkata'),
(8,'AgriFresh','8876543217','contact@agrifresh.in','Chennai');

INSERT INTO Product (ProductID, FarmerID, CategoryID, ProductName, QtyAvailable, UnitPrice, HarvestDate) VALUES
(1,1,3,'Wheat',1000,25,'2026-04-10'),
(2,2,2,'Apples',500,120,'2026-04-12'),
(3,3,4,'Milk',200,50,'2026-04-17'),
(4,4,2,'Grapes',300,80,'2026-04-15'),
(5,5,3,'Ragi',800,40,'2026-04-05'),
(6,6,1,'Tomatoes',400,30,'2026-04-16'),
(7,7,1,'Potatoes',1500,20,'2026-04-14'),
(8,8,6,'Lentils',600,90,'2026-03-20');

INSERT INTO `Order` (OrderID, BuyerID, OrderDate, OrderStatus, TotalAmt) VALUES
(1,1,'2026-04-16 10:00:00','Completed',2500),
(2,2,'2026-04-16 11:30:00','Processing',6000),
(3,3,'2026-04-16 14:15:00','Pending',500),
(4,4,'2026-04-17 09:00:00','Shipped',2400),
(5,5,'2026-04-17 09:45:00','Completed',1200),
(6,6,'2026-04-17 10:30:00','Pending',3000),
(7,7,'2026-04-17 11:00:00','Processing',1000),
(8,8,'2026-04-17 12:15:00','Pending',4500);

INSERT INTO OrderItem (OrderID, ProductID, QtyOrdered, PriceAtPurchase) VALUES
(1,1,100,25),
(2,2,50,120),
(3,3,10,50),
(4,4,30,80),
(5,6,40,30),
(6,1,120,25),
(7,7,50,20),
(8,8,50,90);

INSERT INTO Payment (PaymentID, OrderID, PaymentDate, Amount, PaymentMethod, PaymentStatus) VALUES
(1,1,'2026-04-16 10:05:00',2500,'UPI','Completed'),
(2,2,'2026-04-16 11:35:00',6000,'Bank Transfer','Completed'),
(3,3,'2026-04-16 14:20:00',500,'Credit Card','Pending'),
(4,4,'2026-04-17 09:05:00',2400,'Net Banking','Completed'),
(5,5,'2026-04-17 09:50:00',1200,'UPI','Completed'),
(6,6,'2026-04-17 10:35:00',3000,'Bank Transfer','Pending'),
(7,7,'2026-04-17 11:05:00',1000,'UPI','Completed'),
(8,8,'2026-04-17 12:20:00',4500,'Debit Card','Pending');

INSERT INTO Delivery (DeliveryID, OrderID, DeliveryPartner, DispatchDate, DeliveryDate, DeliveryStatus) VALUES
(1,1,'BlueDart','2026-04-16','2026-04-17','Delivered'),
(2,2,'Delhivery','2026-04-17',NULL,'In Transit'),
(3,3,'Shadowfax',NULL,NULL,'Pending'),
(4,4,'Ecom Express','2026-04-17',NULL,'Shipped'),
(5,5,'India Post','2026-04-17','2026-04-17','Delivered'),
(6,6,'Delhivery',NULL,NULL,'Processing'),
(7,7,'XpressBees','2026-04-18',NULL,'Scheduled'),
(8,8,'Shadowfax',NULL,NULL,'Pending');


-- This query displays all products along with the farmer who produced them
-- It uses JOIN to combine Product and Farmer tables
SELECT p.ProductName, p.UnitPrice, f.FarmerName
FROM Product p
JOIN Farmer f ON p.FarmerID = f.FarmerID;

-- This query shows all orders along with buyer information
-- It helps in tracking which buyer placed which order
SELECT o.OrderID, b.BuyerName, o.OrderDate, o.OrderStatus
FROM `Order` o
JOIN Buyer b ON o.BuyerID = b.BuyerID;


-- This query shows which products are included in each order
-- It joins OrderItem with Product and Order tables
SELECT o.OrderID, p.ProductName, oi.QtyOrdered
FROM OrderItem oi
JOIN `Order` o ON oi.OrderID = o.OrderID
JOIN Product p ON oi.ProductID = p.ProductID;


-- This query calculates total sales for each farmer
-- It uses GROUP BY and aggregate function SUM
SELECT f.FarmerName, 
       SUM(oi.QtyOrdered * oi.PriceAtPurchase) AS TotalSales
FROM OrderItem oi
JOIN Product p ON oi.ProductID = p.ProductID
JOIN Farmer f ON p.FarmerID = f.FarmerID
GROUP BY f.FarmerName;


-- This query finds the product with the highest price
-- It uses a subquery with MAX function
SELECT ProductName, UnitPrice
FROM Product
WHERE UnitPrice = (SELECT MAX(UnitPrice) FROM Product);

-- This query lists buyers who placed high-value orders (>2000)
-- Useful for identifying premium customers
SELECT b.BuyerName, o.TotalAmt
FROM Buyer b
JOIN `Order` o ON b.BuyerID = o.BuyerID
WHERE o.TotalAmt > 2000;


-- This query shows orders that are not yet delivered
-- It helps in tracking pending deliveries
SELECT o.OrderID, d.DeliveryStatus
FROM Delivery d
JOIN `Order` o ON d.OrderID = o.OrderID
WHERE d.DeliveryStatus != 'Delivered';


-- This query counts how many orders each buyer has placed
-- It uses COUNT and GROUP BY
SELECT b.BuyerName, COUNT(o.OrderID) AS TotalOrders
FROM Buyer b
JOIN `Order` o ON b.BuyerID = o.BuyerID
GROUP BY b.BuyerName;


SELECT p.ProductName, c.CategoryName
FROM Product p
JOIN Category c ON p.CategoryID = c.CategoryID;


SELECT o.OrderID, p.PaymentStatus
FROM Payment p
JOIN `Order` o ON p.OrderID = o.OrderID;


CREATE VIEW FarmerSales AS
SELECT f.FarmerName, 
       SUM(oi.QtyOrdered * oi.PriceAtPurchase) AS TotalSales
FROM OrderItem oi
JOIN Product p ON oi.ProductID = p.ProductID
JOIN Farmer f ON p.FarmerID = f.FarmerID
GROUP BY f.FarmerName;

SELECT * FROM FarmerSales;


SELECT * FROM farmer;
SELECT * FROM product;
SELECT * FROM category;
SELECT * FROM buyer;
SELECT * FROM `order`;
SELECT * FROM orderitem;
SELECT * FROM payment;
SELECT * FROM delivery;


SELECT * From `Order`;
SHOW TABLES;