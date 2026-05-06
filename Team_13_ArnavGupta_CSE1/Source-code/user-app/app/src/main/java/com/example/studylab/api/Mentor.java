package com.example.studylab.api;

/**
 * Single entry in the GET /api/auth/mentors response. Used by the register
 * screen's mentor-picker spinner. Only id + name are returned by the
 * backend (see routes/auth.py::list_mentors) -- emails and other PII are
 * intentionally not exposed on this unauthenticated endpoint.
 */
public class Mentor {
    private String id;
    private String name;

    public String getId()   { return id; }
    public String getName() { return name; }

    /** Spinner adapters render Object#toString() by default; show the name. */
    @Override public String toString() {
        return name == null ? "" : name;
    }
}
