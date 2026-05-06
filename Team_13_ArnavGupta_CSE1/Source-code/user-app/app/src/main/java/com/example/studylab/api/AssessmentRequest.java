package com.example.studylab.api;

/** Body for POST /api/student/assessments and PATCH .../{id}. */
public class AssessmentRequest {
    public String  type;        // quiz | exam | assignment | project
    public String  title;
    public String  notes;
    public String  dueAt;       // ISO-8601 datetime
    public Integer isDone;      // 0 / 1
    public Double  score;
    public Double  maxScore;
    public String  subjectId;
}
