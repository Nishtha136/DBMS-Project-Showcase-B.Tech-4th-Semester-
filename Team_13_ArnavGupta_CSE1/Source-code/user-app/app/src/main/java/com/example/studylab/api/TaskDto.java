package com.example.studylab.api;

/** Wire format for /api/student/tasks rows (and POST response). */
public class TaskDto {
    public String  id;            // server UUID
    public String  title;
    public String  description;
    public String  dueDate;       // ISO datetime or null
    public String  priority;      // "low" | "medium" | "high"
    public String  status;        // "pending" | "in_progress" | "done" | "cancelled"
    public String  mentorId;      // null = self-task
    public String  mentorName;
    public Integer isSelf;        // 0 / 1
    public String  createdAt;
    public String  updatedAt;
}
