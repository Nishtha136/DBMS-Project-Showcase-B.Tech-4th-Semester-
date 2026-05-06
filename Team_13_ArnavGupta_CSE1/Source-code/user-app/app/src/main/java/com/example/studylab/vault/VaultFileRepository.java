package com.example.studylab.vault;

import com.example.studylab.api.ApiCallback;
import com.example.studylab.api.ApiClient;
import com.example.studylab.api.ListResult;
import com.example.studylab.api.Subscription;
import java.io.File;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class VaultFileRepository {

    public static Subscription getFilesBySubjectId(String subjectId, ListResult<VaultFile> callback) {
        Call<List<VaultFile>> call = ApiClient.get().getFilesBySubject(subjectId);
        call.enqueue(new Callback<List<VaultFile>>() {
            @Override
            public void onResponse(Call<List<VaultFile>> call, Response<List<VaultFile>> response) {
                if (response.isSuccessful()) callback.onResult(response.body(), null);
                else callback.onResult(null, "Server error " + response.code());
            }

            @Override
            public void onFailure(Call<List<VaultFile>> call, Throwable t) {
                if (!call.isCanceled()) callback.onResult(null, t.getMessage());
            }
        });
        return Subscription.of(call);
    }

    public static Subscription getAllFiles(ListResult<VaultFile> callback) {
        Call<List<VaultFile>> call = ApiClient.get().getAllFiles();
        call.enqueue(new Callback<List<VaultFile>>() {
            @Override
            public void onResponse(Call<List<VaultFile>> call, Response<List<VaultFile>> response) {
                if (response.isSuccessful()) callback.onResult(response.body(), null);
                else callback.onResult(null, "Server error " + response.code());
            }

            @Override
            public void onFailure(Call<List<VaultFile>> call, Throwable t) {
                if (!call.isCanceled()) callback.onResult(null, t.getMessage());
            }
        });
        return Subscription.of(call);
    }

    public static void addFile(VaultFile file, ApiCallback callback) {
        ApiClient.get().addFile(file).enqueue(new Callback<VaultFile>() {
            @Override
            public void onResponse(Call<VaultFile> call, Response<VaultFile> response) {
                if (response.isSuccessful()) callback.onSuccess();
                else callback.onError("Server error " + response.code());
            }

            @Override
            public void onFailure(Call<VaultFile> call, Throwable t) {
                callback.onError(t.getMessage());
            }
        });
    }

    public static void updateNote(String fileId, String noteName, String noteDescription,
                                  ApiCallback callback) {
        Map<String, String> updates = new HashMap<>();
        updates.put("note_name", noteName);
        updates.put("note_description", noteDescription);
        ApiClient.get().updateFile(fileId, updates).enqueue(new Callback<Void>() {
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

    public static void deleteFile(String fileId, String localPath, ApiCallback callback) {
        ApiClient.get().deleteFile(fileId).enqueue(new Callback<Void>() {
            @Override
            public void onResponse(Call<Void> call, Response<Void> response) {
                if (response.isSuccessful()) {
                    if (localPath != null && !localPath.isEmpty()) {
                        new File(localPath).delete();
                    }
                    callback.onSuccess();
                } else {
                    callback.onError("Server error " + response.code());
                }
            }

            @Override
            public void onFailure(Call<Void> call, Throwable t) {
                callback.onError(t.getMessage());
            }
        });
    }
}
