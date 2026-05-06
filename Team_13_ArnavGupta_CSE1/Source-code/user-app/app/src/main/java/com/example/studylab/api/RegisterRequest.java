package com.example.studylab.api;

public class RegisterRequest {
    private final String name;
    private final String email;
    private final String password;
    /** accounts.id of the chosen mentor; null = no mentor assignment. Gson
     *  serialises this as "mentor_id" via the LOWER_CASE_WITH_UNDERSCORES
     *  policy configured in ApiClient. */
    private final String mentorId;

    public RegisterRequest(String name, String email, String password) {
        this(name, email, password, null);
    }

    public RegisterRequest(String name, String email, String password, String mentorId) {
        this.name     = name;
        this.email    = email;
        this.password = password;
        this.mentorId = mentorId;
    }
}
