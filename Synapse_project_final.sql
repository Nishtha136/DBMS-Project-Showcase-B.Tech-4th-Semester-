USE sqp_db;

DELIMITER //

-- -----------------------------------------------------------------
DROP PROCEDURE IF EXISTS GetBuyerPurchaseSummary //
CREATE PROCEDURE GetBuyerPurchaseSummary(IN p_UserID INT)
BEGIN
    SELECT 
        p.PurchaseID,
        n.Title         AS NoteTitle,
        n.Price,
        p.Amount,
        p.PurchaseDate,
        p.PaymentStatus,
        pay.Method      AS PaymentMethod
    FROM PURCHASES p
    JOIN NOTES n           ON p.NoteID     = n.NoteID
    LEFT JOIN PAYMENTS pay ON p.PurchaseID = pay.PurchaseID
    WHERE p.BuyerID = p_UserID
    ORDER BY p.PurchaseDate DESC;
END //

-- -----------------------------------------------------------------
DROP PROCEDURE IF EXISTS GetSubjectsByCourseAndSem //
CREATE PROCEDURE GetSubjectsByCourseAndSem(
    IN p_Course   VARCHAR(100),
    IN p_Semester TINYINT
)
BEGIN
    SELECT 
        SubjectID,
        SubjectName,
        Course,
        Semester
    FROM SUBJECTS
    WHERE Course    = p_Course
      AND Semester  = p_Semester
    ORDER BY SubjectName ASC;
END //

-- -----------------------------------------------------------------
DROP PROCEDURE IF EXISTS GetTopNotesBySubject //
CREATE PROCEDURE GetTopNotesBySubject(IN p_SubjectID INT)
BEGIN
    SELECT 
        n.NoteID,
        n.Title,
        n.Price,
        n.Downloads,
        n.RatingAvg,
        u.Name AS UploaderName
    FROM NOTES n
    JOIN SELLERS sel ON n.UploaderID = sel.UserID
    JOIN USERS u     ON sel.UserID   = u.UserID
    WHERE n.SubjectID = p_SubjectID
    ORDER BY n.RatingAvg DESC, n.Downloads DESC
    LIMIT 10;
END //

-- -----------------------------------------------------------------
DROP PROCEDURE IF EXISTS GetUniversityStats //
CREATE PROCEDURE GetUniversityStats(IN p_UniversityID INT)
BEGIN
    SELECT 
        uni.UniversityName,
        uni.City,
        COUNT(DISTINCT u.UserID)  AS TotalUsers,
        COUNT(DISTINCT s.UserID)  AS TotalSellers,
        COUNT(DISTINCT n.NoteID)  AS TotalNotes,
        ROUND(AVG(n.RatingAvg),2) AS AvgRating
    FROM UNIVERSITIES uni
    LEFT JOIN USERS u   ON uni.UniversityID = u.UniversityID
    LEFT JOIN SELLERS s ON u.UserID         = s.UserID
    LEFT JOIN NOTES n   ON s.UserID         = n.UploaderID
    WHERE uni.UniversityID = p_UniversityID
    GROUP BY uni.UniversityName, uni.City;
END //

-- -----------------------------------------------------------------
DROP PROCEDURE IF EXISTS GetUsersByCity //
CREATE PROCEDURE GetUsersByCity(IN p_City VARCHAR(80))
BEGIN
    SELECT 
        u.UserID,
        u.Name,
        u.Email,
        u.Course,
        u.Year,
        uni.UniversityName,
        uni.City
    FROM USERS u
    JOIN UNIVERSITIES uni ON u.UniversityID = uni.UniversityID
    WHERE uni.City = p_City
    ORDER BY u.Name ASC;
END //

DELIMITER ;