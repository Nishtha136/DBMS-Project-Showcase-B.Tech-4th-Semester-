package com.example.studylab.api;

/**
 * Body for POST /api/student/tasks and PATCH /api/student/tasks/:id.
 * Any field set to null is omitted by Gson and the server treats it as
 * "leave unchanged" (PATCH) or "use default" (POST).
 */
public class TaskRequest {
    public String title;
    public String description;
    public String dueDate;     // ISO-8601 datetime
    public String priority;    // "low" | "medium" | "high"
    public String status;      // "pending" | "in_progress" | "done" | "cancelled"

    public static TaskRequest fromTitle(String title, String priority) {
        TaskRequest r = new TaskRequest();
        r.title = title;
        r.priority = priority;
        return r;
    }
}
