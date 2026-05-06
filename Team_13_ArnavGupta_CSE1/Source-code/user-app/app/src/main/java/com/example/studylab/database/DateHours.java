package com.example.studylab.database;

/**
 * Simple POJO for Room query results mapping date → total study hours.
 * Used by the calendar heatmap to determine color intensity per day.
 */
public class DateHours {
    public String date;
    public float hours;
}
