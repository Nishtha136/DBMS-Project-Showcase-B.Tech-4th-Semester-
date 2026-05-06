package com.example.studylab.database;

import android.content.Context;
import android.text.TextUtils;
import android.util.Log;

import androidx.lifecycle.LiveData;

import com.example.studylab.api.ApiClient;
import com.example.studylab.api.CheckInDto;
import com.example.studylab.api.CheckInRequest;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import java.lang.reflect.Type;
import java.text.SimpleDateFormat;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TimeZone;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * Local Room CRUD + fire-and-forget sync to /api/student/check-ins.
 * See TaskRepository for the sync model.
 */
public class CheckInRepository {
    private static final String TAG = "CheckInRepository";
    private static final Gson GSON = new Gson();
    private static final Type MAP_TYPE = new TypeToken<Map<String, Object>>() {}.getType();

    private final CheckInDao checkInDao;

    public CheckInRepository(Context context) {
        AppDatabase database = AppDatabase.getInstance(context);
        checkInDao = database.checkInDao();
    }

    public void insert(CheckIn checkIn) {
        AppDatabase.databaseWriteExecutor.execute(() -> {
            long localId = checkInDao.insert(checkIn);
            checkIn.id = (int) localId;
            uploadCreate(checkIn);
        });
    }

    public void update(CheckIn checkIn) {
        AppDatabase.databaseWriteExecutor.execute(() -> {
            checkInDao.update(checkIn);
            uploadPatch(checkIn);
        });
    }

    public void delete(CheckIn checkIn) {
        AppDatabase.databaseWriteExecutor.execute(() -> {
            checkInDao.delete(checkIn);
            uploadDelete(checkIn);
        });
    }

    public LiveData<List<CheckIn>> getCheckInsByExperiment(int experimentId) {
        return checkInDao.getCheckInsByExperiment(experimentId);
    }

    public LiveData<List<CheckIn>> getCheckInsByExperimentAndDate(int experimentId, long startOfDay, long endOfDay) {
        return checkInDao.getCheckInsByExperimentAndDate(experimentId, startOfDay, endOfDay);
    }

    // ─── Sync helpers ───────────────────────────────────────────────────

    private void uploadCreate(CheckIn ci) {
        CheckInRequest req = toRequest(ci);
        ApiClient.get().createStudentCheckIn(req).enqueue(new Callback<CheckInDto>() {
            @Override public void onResponse(Call<CheckInDto> c, Response<CheckInDto> r) {
                if (r.isSuccessful() && r.body() != null && r.body().id != null) {
                    AppDatabase.databaseWriteExecutor.execute(() -> {
                        checkInDao.setServerId(ci.id, r.body().id);
                        ci.serverId = r.body().id;
                    });
                } else {
                    Log.w(TAG, "createStudentCheckIn failed: " + r.code());
                }
            }
            @Override public void onFailure(Call<CheckInDto> c, Throwable t) {
                Log.w(TAG, "createStudentCheckIn network error: " + t.getMessage());
            }
        });
    }

    private void uploadPatch(CheckIn ci) {
        if (TextUtils.isEmpty(ci.serverId)) return;
        CheckInRequest req = toRequest(ci);
        ApiClient.get().updateStudentCheckIn(ci.serverId, req)
            .enqueue(new Callback<Map<String, Object>>() {
                @Override public void onResponse(Call<Map<String, Object>> c, Response<Map<String, Object>> r) {
                    if (!r.isSuccessful()) Log.w(TAG, "updateStudentCheckIn failed: " + r.code());
                }
                @Override public void onFailure(Call<Map<String, Object>> c, Throwable t) {
                    Log.w(TAG, "updateStudentCheckIn network error: " + t.getMessage());
                }
            });
    }

    private void uploadDelete(CheckIn ci) {
        if (TextUtils.isEmpty(ci.serverId)) return;
        ApiClient.get().deleteStudentCheckIn(ci.serverId)
            .enqueue(new Callback<Map<String, Object>>() {
                @Override public void onResponse(Call<Map<String, Object>> c, Response<Map<String, Object>> r) {}
                @Override public void onFailure(Call<Map<String, Object>> c, Throwable t) {
                    Log.w(TAG, "deleteStudentCheckIn network error: " + t.getMessage());
                }
            });
    }

    @SuppressWarnings("unchecked")
    private static CheckInRequest toRequest(CheckIn ci) {
        CheckInRequest r = new CheckInRequest();
        r.experimentLocalId = ci.experimentId;
        r.dateAt = millisToIso(ci.dateMillis);
        r.notes  = ci.notes;
        if (!TextUtils.isEmpty(ci.metricValuesJson)) {
            try {
                r.metricValues = (Map<String, Object>) GSON.fromJson(ci.metricValuesJson, MAP_TYPE);
            } catch (Exception e) {
                r.metricValues = Collections.emptyMap();
            }
        }
        return r;
    }

    private static String millisToIso(long millis) {
        if (millis <= 0) return null;
        SimpleDateFormat fmt = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US);
        fmt.setTimeZone(TimeZone.getTimeZone("UTC"));
        return fmt.format(new Date(millis));
    }
}
