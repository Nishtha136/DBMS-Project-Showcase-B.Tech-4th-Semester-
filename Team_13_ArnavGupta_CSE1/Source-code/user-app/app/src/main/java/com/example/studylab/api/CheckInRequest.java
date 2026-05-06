package com.example.studylab.api;

import java.util.Map;

/** Body for POST /api/student/check-ins and PATCH .../{id}. */
public class CheckInRequest {
    public Integer             experimentLocalId;
    public String              dateAt;          // ISO-8601 datetime
    public Map<String, Object> metricValues;
    public String              notes;
}
