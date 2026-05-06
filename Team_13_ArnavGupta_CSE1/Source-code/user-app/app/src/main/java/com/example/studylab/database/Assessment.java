package com.example.studylab.database;

import androidx.room.ColumnInfo;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "assessments")
public class Assessment {
    @PrimaryKey(autoGenerate = true)
    public int id;

    @ColumnInfo(name = "subject_id")
    public int subjectId;

    @ColumnInfo(name = "type")
    public String type; // Quiz, Exam, Assignment, Project

    @ColumnInfo(name = "title")
    public String title;

    @ColumnInfo(name = "date_time_millis")
    public long dateTimeMillis;

    @ColumnInfo(name = "notes")
    public String notes;

    @ColumnInfo(name = "is_done", defaultValue = "0")
    public boolean isDone;

    /** Server-side UUID once this assessment has been pushed/pulled. */
    @ColumnInfo(name = "server_id")
    public String serverId;

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    public int getSubjectId() { return subjectId; }
    public void setSubjectId(int subjectId) { this.subjectId = subjectId; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public long getDateTimeMillis() { return dateTimeMillis; }
    public void setDateTimeMillis(long dateTimeMillis) { this.dateTimeMillis = dateTimeMillis; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public boolean isDone() { return isDone; }
    public void setDone(boolean done) { isDone = done; }
}