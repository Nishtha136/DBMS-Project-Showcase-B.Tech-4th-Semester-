package com.example.studylab.api;

/**
 * Wire format for /api/study/sessions/* responses.
 * Field names use snake_case to match the backend (Gson is configured with
 * LOWER_CASE_WITH_UNDERSCORES in ApiClient).
 */
public class StudySessionDto {
    private String id;
    private String studentId;
    private String subjectId;
    private String subjectLabel;
    private String subjectName;
    private String subjectColor;
    private String startedAt;
    private String endedAt;
    private Double durationMinutes;
    private Integer focusSeconds;
    private String  notes;

    public String getId() { return id; }
    public String getStudentId() { return studentId; }
    public String getSubjectId() { return subjectId; }
    public String getSubjectLabel() { return subjectLabel; }
    public String getSubjectName() { return subjectName; }
    public String getSubjectColor() { return subjectColor; }
    public String getStartedAt() { return startedAt; }
    public String getEndedAt() { return endedAt; }
    public Double getDurationMinutes() { return durationMinutes; }
    public Integer getFocusSeconds() { return focusSeconds; }
    public String getNotes() { return notes; }
}
