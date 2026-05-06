package com.example.studylab.database;

import androidx.room.ColumnInfo;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "vault_items")
public class VaultItem {

    public enum Type {
        FILE, LINK, TEXT
    }
    @PrimaryKey(autoGenerate = true)
    public int id;

    @ColumnInfo(name = "type")
    public String type; // FILE, LINK, or TEXT

    @ColumnInfo(name = "title")
    public String title;

    @ColumnInfo(name = "content")
    public String content;

    @ColumnInfo(name = "file_path")
    public String filePath;

    @ColumnInfo(name = "subject_id")
    public int subjectId;

    @ColumnInfo(name = "date_added")
    public long dateAdded;

    @ColumnInfo(name = "file_size_bytes", defaultValue = "0")
    public long fileSizeBytes;

    public int getId() { return id; }
    public String getType() { return type; }
    public String getTitle() { return title; }
    public String getContent() { return content; }
    public String getFilePath() { return filePath; }
    public int getSubjectId() { return subjectId; }
    public long getDateAdded() { return dateAdded; }
    public long getFileSizeBytes() { return fileSizeBytes; }
}