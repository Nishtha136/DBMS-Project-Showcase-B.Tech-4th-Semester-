DROP DATABASE movie_awards;
CREATE DATABASE movie_awards;
USE movie_awards;

-- USERS
CREATE TABLE Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(150) NOT NULL,
    role ENUM('ADMIN', 'JURY') NOT NULL
);

-- MOVIES
CREATE TABLE Movies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    release_year INT CHECK (release_year >= 1900),
    duration INT CHECK (duration > 0),
    description TEXT
);

-- PEOPLE
CREATE TABLE People (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    birth_date DATE,
    nationality VARCHAR(100)
);

-- MOVIE CREW (RELATION TABLE)
CREATE TABLE Movie_Crew (
    movie_id INT,
    person_id INT,
    role ENUM('ACTOR','DIRECTOR','WRITER','PRODUCER','SOUND_EDITOR','VFX','COSTUME_DESIGNER') NOT NULL,
    character_name VARCHAR(150),
    PRIMARY KEY (movie_id, person_id, role),
    FOREIGN KEY (movie_id) REFERENCES Movies(id) ON DELETE CASCADE,
    FOREIGN KEY (person_id) REFERENCES People(id) ON DELETE CASCADE
);

-- AWARDS
CREATE TABLE Awards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200),
    year INT CHECK (year >= 1900),
    description TEXT
);

-- CATEGORIES
CREATE TABLE Categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200),
    nominee_type ENUM(
        'MOVIE','ACTOR','DIRECTOR','WRITER',
        'PRODUCER','SOUND_EDITOR','VFX',
        'COSTUME_DESIGNER','ANY_CREW'
    ) NOT NULL DEFAULT 'ANY_CREW',
    UNIQUE (name)
);

-- AWARD CATEGORY (BRIDGE)
CREATE TABLE Award_Category (
    id INT AUTO_INCREMENT PRIMARY KEY,
    award_id INT NOT NULL,
    category_id INT NOT NULL,
    start_time DATETIME,
    end_time DATETIME,
    CHECK (end_time > start_time),
    UNIQUE (award_id, category_id),
    FOREIGN KEY (award_id) REFERENCES Awards(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES Categories(id) ON DELETE CASCADE
);

-- NOMINATIONS
CREATE TABLE Nominations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    award_category_id INT NOT NULL,
    movie_id INT NOT NULL,
    person_id INT,
    FOREIGN KEY (award_category_id) REFERENCES Award_Category(id) ON DELETE CASCADE,
    FOREIGN KEY (movie_id) REFERENCES Movies(id) ON DELETE CASCADE,
    FOREIGN KEY (person_id) REFERENCES People(id) ON DELETE CASCADE
);

-- VOTES
CREATE TABLE Votes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    jury_id INT NOT NULL,
    award_category_id INT NOT NULL,
    nomination_id INT NOT NULL,
    cast_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (jury_id, award_category_id),
    FOREIGN KEY (jury_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (award_category_id) REFERENCES Award_Category(id) ON DELETE CASCADE,
    FOREIGN KEY (nomination_id) REFERENCES Nominations(id) ON DELETE CASCADE
);

-- INDEXES
CREATE UNIQUE INDEX uq_nominations_slot_movie_person
ON Nominations (award_category_id, movie_id, (COALESCE(person_id, 0)));

CREATE INDEX idx_nominations_award_category 
ON Nominations(award_category_id);

CREATE INDEX idx_votes_nomination 
ON Votes(nomination_id);

CREATE INDEX idx_votes_award_category 
ON Votes(award_category_id);

CREATE INDEX idx_moviecrew_movie_person 
ON Movie_Crew(movie_id, person_id);



-- Fetch nomination details
CREATE VIEW Nomination_Details AS
SELECT 
    n.id AS nomination_id,
    m.title AS movie,
    COALESCE(CONCAT(p.first_name, ' ', p.last_name), 'N/A') AS person,
    c.name AS category,
    a.name AS award,
    a.year
FROM Nominations n
JOIN Movies m ON n.movie_id = m.id
LEFT JOIN People p ON n.person_id = p.id
JOIN Award_Category ac ON n.award_category_id = ac.id
JOIN Categories c ON ac.category_id = c.id
JOIN Awards a ON ac.award_id = a.id;


-- Fetch vote details of nominations
CREATE VIEW Vote_Summary AS
SELECT 
    n.id AS nomination_id,
    m.title,
    c.name AS category,
    COUNT(v.id) AS total_votes
FROM Nominations n
JOIN Movies m ON n.movie_id = m.id
JOIN Award_Category ac ON n.award_category_id = ac.id
JOIN Categories c ON ac.category_id = c.id
LEFT JOIN Votes v ON v.nomination_id = n.id
GROUP BY n.id, m.title, c.name;


-- Fetch winners per category
CREATE VIEW Winners AS
SELECT vs.*
FROM Vote_Summary vs
JOIN (
    SELECT category, MAX(total_votes) AS max_votes
    FROM Vote_Summary
    GROUP BY category
) t 
ON vs.category = t.category 
AND vs.total_votes = t.max_votes;

DELIMITER //
-- Transaction to cast a vote
CREATE PROCEDURE CastVote(
    IN p_jury INT,
    IN p_nomination_id INT,
    IN p_category_id INT
)
BEGIN
    DECLARE existing_vote INT;
	DECLARE v_category_id INT;
    
    START TRANSACTION;
	
    -- Lock nomination row
    SELECT award_category_id INTO v_category_id
    FROM Nominations
    WHERE id = p_nomination_id
    FOR UPDATE;
    
    -- Lock votes row
    SELECT id INTO existing_vote
    FROM Votes
    WHERE jury_id = p_jury
      AND award_category_id = p_category_id
    FOR UPDATE;
    
    -- If vote already exists, rollback; otherwise, insert vote
    IF existing_vote IS NOT NULL THEN
        ROLLBACK;
    ELSE
        INSERT INTO Votes (jury_id, nomination_id, award_category_id)
        VALUES (p_jury, p_nomination_id, p_category_id);
        
        COMMIT;
    END IF;
END//


-- Transaction to create a nomination
CREATE PROCEDURE CreateNomination(
    IN p_award_category_id INT,
    IN p_movie_id INT,
    IN p_person_id INT
)
BEGIN
    DECLARE cat_type VARCHAR(50);
    START TRANSACTION;
    -- Get category type
    SELECT c.nominee_type INTO cat_type
    FROM Award_Category ac
    JOIN Categories c ON ac.category_id = c.id
    WHERE ac.id = p_award_category_id
    FOR UPDATE;
	
    -- If category type is movie then person is null
    IF cat_type = 'MOVIE' THEN
        INSERT INTO Nominations (award_category_id, movie_id, person_id)
        VALUES (p_award_category_id, p_movie_id, NULL);

    ELSE
		-- Check if person role is valid for the category type
        IF EXISTS (
            SELECT 1
            FROM Movie_Crew mc
            WHERE mc.movie_id = p_movie_id
              AND mc.person_id = p_person_id
              AND (cat_type = 'ANY_CREW' OR mc.role = cat_type)
			FOR UPDATE
        ) THEN
            INSERT INTO Nominations (award_category_id, movie_id, person_id)
            VALUES (p_award_category_id, p_movie_id, p_person_id);
            
			COMMIT;
        END IF;
    END IF;
END //


-- Procedure to update nomination
CREATE PROCEDURE UpdateNomination(
    IN p_nomination_id INT,
    IN p_award_category_id INT,
    IN p_movie_id INT,
    IN p_person_id INT
)
BEGIN
    DECLARE prev_category INT;

    START TRANSACTION;
    
    -- Lock nomination row
	SELECT id
    FROM Nominations
    WHERE id = p_nomination_id
    FOR UPDATE;
    
    SELECT award_category_id INTO prev_category
    FROM Nominations
    WHERE id = p_nomination_id
    FOR UPDATE;
	
    -- Update nomination with the data
    UPDATE Nominations
    SET award_category_id = p_award_category_id,
        movie_id = p_movie_id,
        person_id = p_person_id
    WHERE id = p_nomination_id;
	
    -- Select and update votes for the nomination accordingly
    SELECT id FROM Votes
    WHERE nomination_id = p_nomination_id
    FOR UPDATE;

    UPDATE Votes
    SET award_category_id = p_award_category_id
    WHERE nomination_id = p_nomination_id;
    
    COMMIT;
END //


-- Transaction to get statistics category-wise
CREATE PROCEDURE CategoryStats()
BEGIN
    SELECT 
        c.name,
        COUNT(DISTINCT n.id) AS total_nominations,
        COUNT(v.id) AS total_votes
    FROM Categories c
    LEFT JOIN Award_Category ac ON c.id = ac.category_id
    LEFT JOIN Nominations n ON n.award_category_id = ac.id
    LEFT JOIN Votes v ON v.nomination_id = n.id
    GROUP BY c.id, c.name;
END//
DELIMITER ;