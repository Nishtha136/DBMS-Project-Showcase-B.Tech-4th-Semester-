package com.example.studylab.api;

import java.util.List;

/** Wraps the {"data": [...]} envelope returned by GET /api/auth/mentors. */
public class MentorListResponse {
    private List<Mentor> data;

    public List<Mentor> getData() { return data; }
}
