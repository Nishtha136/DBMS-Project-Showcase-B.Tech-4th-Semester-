package com.example.studylab.api;

import java.util.Map;

/** Wire format for /api/student/check-ins rows. */
public class CheckInDto {
    public String              id;
    public Integer             experimentLocalId;
    public String              dateAt;            // ISO datetime
    public Map<String, Object> metricValues;     // parsed JSON
    public String              notes;
    public String              createdAt;
    public String              updatedAt;
}
