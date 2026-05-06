package com.example.studylab.api;

/** POST /api/study/sessions/start request body. All fields optional. */
public class StartSessionRequest {
    public String subjectId;
    public String subjectLabel;
    public String startedAt;     // ISO-8601; if null the server uses NOW().

    public StartSessionRequest() {}

    public StartSessionRequest(String subjectId, String subjectLabel) {
        this.subjectId = subjectId;
        this.subjectLabel = subjectLabel;
    }
}
