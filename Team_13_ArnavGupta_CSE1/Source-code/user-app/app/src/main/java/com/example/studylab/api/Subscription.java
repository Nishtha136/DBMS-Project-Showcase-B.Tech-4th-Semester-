package com.example.studylab.api;

import retrofit2.Call;

public class Subscription {
    private final Call<?> call;

    private Subscription(Call<?> call) { this.call = call; }

    public static Subscription of(Call<?> call) { return new Subscription(call); }
    public static Subscription empty() { return new Subscription(null); }

    public void cancel() {
        if (call != null && !call.isCanceled()) call.cancel();
    }
}
