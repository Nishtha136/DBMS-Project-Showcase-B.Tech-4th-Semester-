package com.example.studylab.api;

/** Wire format for /api/student/assessments rows. */
public class AssessmentDto {
    public String  id;             // server UUID
    public String  type;           // "quiz" | "exam" | "assignment" | "project"
    public String  title;
    public String  notes;
    public String  dueAt;          // ISO datetime or null
    public Integer isDone;
    public Double  score;
    public Double  maxScore;
    public String  subjectId;
    public String  subjectName;
    public String  subjectColor;
    public String  mentorId;
    public String  mentorName;
    public Integer isSelf;
    public String  createdAt;
    public String  updatedAt;
}
