package com.example.studylab.api;

public interface ApiCallback {
    void onSuccess();
    void onError(String message);
}
