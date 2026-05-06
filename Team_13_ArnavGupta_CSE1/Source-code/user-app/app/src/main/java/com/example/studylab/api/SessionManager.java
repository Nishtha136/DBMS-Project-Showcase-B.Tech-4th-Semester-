package com.example.studylab.api;

import android.content.Context;
import android.content.SharedPreferences;

public class SessionManager {
    private static final String PREF_NAME = "studylab_session";
    private static final String KEY_TOKEN = "jwt_token";
    private static final String KEY_NAME  = "user_name";
    private static final String KEY_EMAIL = "user_email";

    private final SharedPreferences prefs;

    public SessionManager(Context context) {
        prefs = context.getApplicationContext()
                       .getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
    }

    public void save(String token, String name, String email) {
        prefs.edit()
             .putString(KEY_TOKEN, token)
             .putString(KEY_NAME, name)
             .putString(KEY_EMAIL, email)
             .apply();
    }

    public String getToken()  { return prefs.getString(KEY_TOKEN, null); }
    public String getName()   { return prefs.getString(KEY_NAME, ""); }
    public String getEmail()  { return prefs.getString(KEY_EMAIL, ""); }
    public boolean isLoggedIn() { return getToken() != null; }

    public void logout() {
        prefs.edit().clear().apply();
    }
}
