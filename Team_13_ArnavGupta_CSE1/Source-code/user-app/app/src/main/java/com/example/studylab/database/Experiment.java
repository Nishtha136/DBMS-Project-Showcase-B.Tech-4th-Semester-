package com.example.studylab.database;

import androidx.room.ColumnInfo;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "experiments")
public class Experiment {
    @PrimaryKey(autoGenerate = true)
    public int id;

    @ColumnInfo(name = "name")
    public String name;

    @ColumnInfo(name = "hypothesis")
    public String hypothesis;

    @ColumnInfo(name = "duration_days")
    public int durationDays;

    @ColumnInfo(name = "start_date_millis")
    public long startDateMillis;

    @ColumnInfo(name = "status")
    public String status; // ACTIVE, COMPLETED, PAUSED

    @ColumnInfo(name = "selected_metrics")
    public String selectedMetrics; // Comma-separated string of metric names

    @ColumnInfo(name = "current_day", defaultValue = "1")
    public int currentDay;

    @ColumnInfo(name = "last_check_in_millis", defaultValue = "0")
    public long lastCheckInDateMillis;
}