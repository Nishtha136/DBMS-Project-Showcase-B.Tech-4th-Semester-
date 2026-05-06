package com.example.studylab.vault;

import com.example.studylab.api.ApiCallback;
import com.example.studylab.api.ApiClient;
import com.example.studylab.api.ListResult;
import com.example.studylab.api.Subscription;
import java.util.List;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class SubjectRepository {

    public static Subscription getAllSubjects(ListResult<Subject> callback) {
        Call<List<Subject>> call = ApiClient.get().getSubjects();
        call.enqueue(new Callback<List<Subject>>() {
            @Override
            public void onResponse(Call<List<Subject>> call, Response<List<Subject>> response) {
                if (response.isSuccessful()) {
                    callback.onResult(response.body(), null);
                } else {
                    callback.onResult(null, "Server error " + response.code());
                }
            }

            @Override
            public void onFailure(Call<List<Subject>> call, Throwable t) {
                if (!call.isCanceled()) callback.onResult(null, t.getMessage());
            }
        });
        return Subscription.of(call);
    }

    public static void addSubject(Subject subject, ApiCallback callback) {
        ApiClient.get().addSubject(subject).enqueue(new Callback<Subject>() {
            @Override
            public void onResponse(Call<Subject> call, Response<Subject> response) {
                if (response.isSuccessful()) callback.onSuccess();
                else callback.onError("Server error " + response.code());
            }

            @Override
            public void onFailure(Call<Subject> call, Throwable t) {
                callback.onError(t.getMessage());
            }
        });
    }

    public static void deleteSubject(String subjectId, ApiCallback callback) {
        ApiClient.get().deleteSubject(subjectId).enqueue(new Callback<Void>() {
            @Override
            public void onResponse(Call<Void> call, Response<Void> response) {
                if (response.isSuccessful()) callback.onSuccess();
                else callback.onError("Server error " + response.code());
            }

            @Override
            public void onFailure(Call<Void> call, Throwable t) {
                callback.onError(t.getMessage());
            }
        });
    }
}
