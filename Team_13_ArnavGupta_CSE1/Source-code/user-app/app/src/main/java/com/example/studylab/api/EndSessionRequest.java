package com.example.studylab.api;

/** POST /api/study/sessions/end request body. id is required. */
public class EndSessionRequest {
    public String  id;
    public String  endedAt;       // ISO-8601; if null the server uses NOW().
    public Integer focusSeconds;
    public String  notes;

    public EndSessionRequest() {}

    public EndSessionRequest(String id, Integer focusSeconds, String notes) {
        this.id = id;
        this.focusSeconds = focusSeconds;
        this.notes = notes;
    }
}
