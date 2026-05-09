-- ============================================================
-- MUSIC STREAMING DATABASE
-- Project: Music Streaming Platform (Spotify-like)
-- ============================================================

DROP DATABASE IF EXISTS music_streaming;
CREATE DATABASE music_streaming;
USE music_streaming;

-- ============================================================
-- TABLE 1: User
-- ============================================================
CREATE TABLE User (
    UserID      INT AUTO_INCREMENT PRIMARY KEY,
    Name        VARCHAR(100) NOT NULL,
    Email       VARCHAR(150) NOT NULL UNIQUE,
    Password    VARCHAR(255) NOT NULL,
    JoiningDate DATE NOT NULL DEFAULT (CURRENT_DATE)
);

-- ============================================================
-- TABLE 2: Subscription
-- ============================================================
CREATE TABLE Subscription (
    SubscriptionID  INT AUTO_INCREMENT PRIMARY KEY,
    UserID          INT NOT NULL,
    PlanType        ENUM('Free', 'Basic', 'Premium') NOT NULL DEFAULT 'Free',
    StartDate       DATE NOT NULL,
    EndDate         DATE,
    Status          ENUM('Active', 'Expired', 'Cancelled') NOT NULL DEFAULT 'Active',
    FOREIGN KEY (UserID) REFERENCES User(UserID) ON DELETE CASCADE
);

-- ============================================================
-- TABLE 3: Payment
-- ============================================================
CREATE TABLE Payment (
    PaymentID       INT AUTO_INCREMENT PRIMARY KEY,
    SubscriptionID  INT NOT NULL,
    Amount          DECIMAL(8,2) NOT NULL,
    PaymentDate     DATE NOT NULL,
    PaymentMethod   ENUM('Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Wallet') NOT NULL,
    Status          ENUM('Success', 'Failed', 'Pending') NOT NULL DEFAULT 'Pending',
    FOREIGN KEY (SubscriptionID) REFERENCES Subscription(SubscriptionID) ON DELETE CASCADE
);

-- ============================================================
-- TABLE 4: Artist
-- ============================================================
CREATE TABLE Artist (
    ArtistID    INT AUTO_INCREMENT PRIMARY KEY,
    ArtistName  VARCHAR(150) NOT NULL,
    Country     VARCHAR(100)
);

-- ============================================================
-- TABLE 5: Album
-- ============================================================
CREATE TABLE Album (
    AlbumID     INT AUTO_INCREMENT PRIMARY KEY,
    AlbumName   VARCHAR(200) NOT NULL,
    ReleaseYear YEAR NOT NULL,
    ArtistID    INT NOT NULL,
    FOREIGN KEY (ArtistID) REFERENCES Artist(ArtistID) ON DELETE CASCADE
);

-- ============================================================
-- TABLE 6: Genre
-- ============================================================
CREATE TABLE Genre (
    GenreID     INT AUTO_INCREMENT PRIMARY KEY,
    GenreName   VARCHAR(100) NOT NULL UNIQUE
);

-- ============================================================
-- TABLE 7: Song
-- ============================================================
CREATE TABLE Song (
    SongID      INT AUTO_INCREMENT PRIMARY KEY,
    Title       VARCHAR(200) NOT NULL,
    Duration    INT NOT NULL COMMENT 'Duration in seconds',
    AlbumID     INT,
    FOREIGN KEY (AlbumID) REFERENCES Album(AlbumID) ON DELETE SET NULL
);

-- ============================================================
-- TABLE 8: Song_Genre 
-- ============================================================
CREATE TABLE Song_Genre (
    SongID      INT NOT NULL,
    GenreID     INT NOT NULL,
    PRIMARY KEY (SongID, GenreID),
    FOREIGN KEY (SongID)  REFERENCES Song(SongID)  ON DELETE CASCADE,
    FOREIGN KEY (GenreID) REFERENCES Genre(GenreID) ON DELETE CASCADE
);

-- ============================================================
-- TABLE 9: Playlist
-- ============================================================
CREATE TABLE Playlist (
    PlaylistID      INT AUTO_INCREMENT PRIMARY KEY,
    PlaylistName    VARCHAR(200) NOT NULL,
    CreatedDate     DATE NOT NULL DEFAULT (CURRENT_DATE),
    UserID          INT NOT NULL,
    FOREIGN KEY (UserID) REFERENCES User(UserID) ON DELETE CASCADE
);

-- ============================================================
-- TABLE 10: Playlist_Song 
-- ============================================================
CREATE TABLE Playlist_Song (
    PlaylistID  INT NOT NULL,
    SongID      INT NOT NULL,
    AddedOn     DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (PlaylistID, SongID),
    FOREIGN KEY (PlaylistID) REFERENCES Playlist(PlaylistID) ON DELETE CASCADE,
    FOREIGN KEY (SongID)     REFERENCES Song(SongID)         ON DELETE CASCADE
);

-- ============================================================
-- TABLE 11: ListeningHistory 
-- ============================================================
CREATE TABLE ListeningHistory (
    HistoryID   INT AUTO_INCREMENT PRIMARY KEY,
    UserID      INT NOT NULL,
    SongID      INT NOT NULL,
    PlayedAt    DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES User(UserID) ON DELETE CASCADE,
    FOREIGN KEY (SongID) REFERENCES Song(SongID) ON DELETE CASCADE
);

-- ============================================================
-- INDEXES 
-- ============================================================
-- Primary indexes are on PKs.
CREATE INDEX idx_song_title      ON Song(Title);
CREATE INDEX idx_artist_name     ON Artist(ArtistName);
CREATE INDEX idx_user_email      ON User(Email);
CREATE INDEX idx_payment_date    ON Payment(PaymentDate);
CREATE INDEX idx_history_user    ON ListeningHistory(UserID);
CREATE INDEX idx_history_song    ON ListeningHistory(SongID);
