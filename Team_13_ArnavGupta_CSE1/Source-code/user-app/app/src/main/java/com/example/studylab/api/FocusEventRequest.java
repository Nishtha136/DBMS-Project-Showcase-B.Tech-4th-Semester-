package com.example.studylab.api;

/**
 * POST /api/study/focus-events request body.
 * eventType must be "enabled" or "disabled". sessionId is optional;
 * when provided it must belong to the calling student.
 */
public class FocusEventRequest {
    public String eventType;
    public String sessionId;
    public String eventAt;   // ISO-8601; if null the server uses NOW().

    public FocusEventRequest() {}

    public FocusEventRequest(String eventType, String sessionId) {
        this.eventType = eventType;
        this.sessionId = sessionId;
    }
}
