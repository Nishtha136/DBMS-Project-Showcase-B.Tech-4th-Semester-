package com.example.studylab.vault;

import com.example.studylab.api.ApiCallback;
import com.example.studylab.api.ApiClient;
import com.example.studylab.api.ListResult;
import com.example.studylab.api.Subscription;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class VaultLinkRepository {

    public static Subscription getLinksBySubjectId(String subjectId, ListResult<VaultLink> callback) {
        Call<List<VaultLink>> call = ApiClient.get().getLinksBySubject(subjectId);
        call.enqueue(new Callback<List<VaultLink>>() {
            @Override
            public void onResponse(Call<List<VaultLink>> call, Response<List<VaultLink>> response) {
                if (response.isSuccessful()) callback.onResult(response.body(), null);
                else callback.onResult(null, "Server error " + response.code());
            }

            @Override
            public void onFailure(Call<List<VaultLink>> call, Throwable t) {
                if (!call.isCanceled()) callback.onResult(null, t.getMessage());
            }
        });
        return Subscription.of(call);
    }

    public static Subscription getAllLinks(ListResult<VaultLink> callback) {
        Call<List<VaultLink>> call = ApiClient.get().getAllLinks();
        call.enqueue(new Callback<List<VaultLink>>() {
            @Override
            public void onResponse(Call<List<VaultLink>> call, Response<List<VaultLink>> response) {
                if (response.isSuccessful()) callback.onResult(response.body(), null);
                else callback.onResult(null, "Server error " + response.code());
            }

            @Override
            public void onFailure(Call<List<VaultLink>> call, Throwable t) {
                if (!call.isCanceled()) callback.onResult(null, t.getMessage());
            }
        });
        return Subscription.of(call);
    }

    public static void addLink(VaultLink link, ApiCallback callback) {
        ApiClient.get().addLink(link).enqueue(new Callback<VaultLink>() {
            @Override
            public void onResponse(Call<VaultLink> call, Response<VaultLink> response) {
                if (response.isSuccessful()) callback.onSuccess();
                else callback.onError("Server error " + response.code());
            }

            @Override
            public void onFailure(Call<VaultLink> call, Throwable t) {
                callback.onError(t.getMessage());
            }
        });
    }

    public static void updateLink(String linkId, String name, String url, ApiCallback callback) {
        Map<String, String> updates = new HashMap<>();
        updates.put("link_name", name);
        updates.put("url", url);
        ApiClient.get().updateLink(linkId, updates).enqueue(new Callback<Void>() {
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

    public static void deleteLink(String linkId, ApiCallback callback) {
        ApiClient.get().deleteLink(linkId).enqueue(new Callback<Void>() {
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
