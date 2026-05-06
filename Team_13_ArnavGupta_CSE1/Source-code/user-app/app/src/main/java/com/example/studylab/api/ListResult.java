package com.example.studylab.api;

import java.util.List;

public interface ListResult<T> {
    void onResult(List<T> items, String error);
}
