package com.example.studylab.database;

import android.content.Context;
import android.text.TextUtils;
import android.util.Log;

import androidx.lifecycle.LiveData;

import com.example.studylab.api.ApiClient;
import com.example.studylab.api.AssessmentDto;
import com.example.studylab.api.AssessmentRequest;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TimeZone;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * Local Room CRUD + fire-and-forget sync to /api/student/assessments.
 * See TaskRepository for the sync model.
 */
public class AssessmentRepository {
    private static final String TAG = "AssessmentRepository";
    private final AssessmentDao assessmentDao;

    public AssessmentRepository(Context context) {
        AppDatabase database = AppDatabase.getInstance(context);
        assessmentDao = database.assessmentDao();
    }

    public void insert(Assessment assessment) {
        AppDatabase.databaseWriteExecutor.execute(() -> {
            long localId = assessmentDao.insert(assessment);
            assessment.id = (int) localId;
            uploadCreate(assessment);
        });
    }

    public void update(Assessment assessment) {
        AppDatabase.databaseWriteExecutor.execute(() -> {
            assessmentDao.update(assessment);
            uploadPatch(assessment);
        });
    }

    public void delete(Assessment assessment) {
        AppDatabase.databaseWriteExecutor.execute(() -> {
            assessmentDao.delete(assessment);
            uploadDelete(assessment);
        });
    }

    public LiveData<List<Assessment>> getAssessmentsByDate(int subjectId, long startOfDay, long endOfDay) {
        return assessmentDao.getAssessmentsByDate(subjectId, startOfDay, endOfDay);
    }

    public LiveData<Assessment> getNextAssessment(long startOfMillis) {
        return assessmentDao.getNextAssessment(startOfMillis);
    }

    public LiveData<List<Assessment>> getAssessmentsForMonth(long startOfMonth, long endOfMonth) {
        return assessmentDao.getAssessmentsForMonth(startOfMonth, endOfMonth);
    }

    public LiveData<List<Assessment>> getAllAssessments() {
        return assessmentDao.getAllAssessments();
    }

    public LiveData<List<Assessment>> getAssessmentsInRange(long startMillis, long endMillis) {
        return assessmentDao.getAssessmentsInRange(startMillis, endMillis);
    }

    // ─── Sync helpers ───────────────────────────────────────────────────

    private void uploadCreate(Assessment a) {
        AssessmentRequest req = toRequest(a);
        ApiClient.get().createStudentAssessment(req).enqueue(new Callback<AssessmentDto>() {
            @Override public void onResponse(Call<AssessmentDto> c, Response<AssessmentDto> r) {
                if (r.isSuccessful() && r.body() != null && r.body().id != null) {
                    AppDatabase.databaseWriteExecutor.execute(() -> {
                        assessmentDao.setServerId(a.id, r.body().id);
                        a.serverId = r.body().id;
                    });
                } else {
                    Log.w(TAG, "createStudentAssessment failed: " + r.code());
                }
            }
            @Override public void onFailure(Call<AssessmentDto> c, Throwable t) {
                Log.w(TAG, "createStudentAssessment network error: " + t.getMessage());
            }
        });
    }

    private void uploadPatch(Assessment a) {
        if (TextUtils.isEmpty(a.serverId)) return;
        AssessmentRequest req = toRequest(a);
        ApiClient.get().updateStudentAssessment(a.serverId, req)
            .enqueue(new Callback<Map<String, Object>>() {
                @Override public void onResponse(Call<Map<String, Object>> c, Response<Map<String, Object>> r) {
                    if (!r.isSuccessful()) Log.w(TAG, "updateStudentAssessment failed: " + r.code());
                }
                @Override public void onFailure(Call<Map<String, Object>> c, Throwable t) {
                    Log.w(TAG, "updateStudentAssessment network error: " + t.getMessage());
                }
            });
    }

    private void uploadDelete(Assessment a) {
        if (TextUtils.isEmpty(a.serverId)) return;
        ApiClient.get().deleteStudentAssessment(a.serverId)
            .enqueue(new Callback<Map<String, Object>>() {
                @Override public void onResponse(Call<Map<String, Object>> c, Response<Map<String, Object>> r) {
                    /* 404 means mentor-assigned -> backend refused -- ignore */
                }
                @Override public void onFailure(Call<Map<String, Object>> c, Throwable t) {
                    Log.w(TAG, "deleteStudentAssessment network error: " + t.getMessage());
                }
            });
    }

    private static AssessmentRequest toRequest(Assessment a) {
        AssessmentRequest r = new AssessmentRequest();
        r.type     = mapType(a.type);
        r.title    = a.title;
        r.notes    = a.notes;
        r.dueAt    = millisToIso(a.dateTimeMillis);
        r.isDone   = a.isDone ? 1 : 0;
        return r;
    }

    /** Local uses Title-Case ("Quiz"), server expects lowercase. */
    private static String mapType(String t) {
        if (t == null) return "assignment";
        String lower = t.toLowerCase(Locale.US).trim();
        if ("quiz".equals(lower) || "exam".equals(lower)
                || "assignment".equals(lower) || "project".equals(lower)) return lower;
        return "assignment";
    }

    private static String millisToIso(long millis) {
        if (millis <= 0) return null;
        SimpleDateFormat fmt = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US);
        fmt.setTimeZone(TimeZone.getTimeZone("UTC"));
        return fmt.format(new Date(millis));
    }
}
