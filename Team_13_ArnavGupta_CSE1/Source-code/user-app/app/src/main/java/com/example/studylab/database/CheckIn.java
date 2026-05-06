package com.example.studylab.database;

import androidx.room.ColumnInfo;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "check_ins")
public class CheckIn {
    @PrimaryKey(autoGenerate = true)
    public int id;

    @ColumnInfo(name = "experiment_id")
    public int experimentId;

    @ColumnInfo(name = "date_millis")
    public long dateMillis;

    @ColumnInfo(name = "metric_values_json")
    public String metricValuesJson;

    @ColumnInfo(name = "notes")
    public String notes;

    /** Server-side UUID once this check-in has been pushed to the backend. */
    @ColumnInfo(name = "server_id")
    public String serverId;
}