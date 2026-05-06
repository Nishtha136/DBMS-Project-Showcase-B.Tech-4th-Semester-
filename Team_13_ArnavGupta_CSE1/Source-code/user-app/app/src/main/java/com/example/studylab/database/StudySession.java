package com.example.studylab.database;

import androidx.room.ColumnInfo;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "study_sessions")
public class StudySession {
    @PrimaryKey(autoGenerate = true)
    public int id;

    @ColumnInfo(name = "subject_id")
    public int subjectId;

    @ColumnInfo(name = "subject_name")
    public String subjectName;

    @ColumnInfo(name = "start_time")
    public long startTime;

    @ColumnInfo(name = "end_time")
    public long endTime;

    @ColumnInfo(name = "duration_seconds")
    public int durationSeconds;

    @ColumnInfo(name = "date")
    public String date; // format: yyyy-MM-dd

    @ColumnInfo(name = "was_completed")
    public boolean wasCompleted;
}