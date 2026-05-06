package com.example.studylab.services;

import android.content.Context;
import android.util.Log;

import com.example.studylab.api.ApiClient;
import com.example.studylab.api.AssessmentDto;
import com.example.studylab.api.SessionManager;
import com.example.studylab.api.TaskDto;
import com.example.studylab.database.AppDatabase;
import com.example.studylab.database.Assessment;
import com.example.studylab.database.AssessmentDao;
import com.example.studylab.database.Task;
import com.example.studylab.database.TaskDao;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.TimeZone;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * Pulls mentor-assigned tasks + assessments from the backend and upserts
 * them into local Room so the mentee app sees what their mentor sent.
 *
 * Usage:
 *     MentorSyncService.syncNow(this);
 *
 * Recommended hook points:
 *   - MainActivity.onResume()
 *   - After login (login.java success path)
 *   - On a periodic timer (e.g. every 10 min in foreground)
 *
 * All work is async (Retrofit enqueue + databaseWriteExecutor). Network
 * failures are logged and ignored -- the next syncNow() retries.
 */
public final class MentorSyncService {

    private static final String TAG = "MentorSyncService";

    private MentorSyncService() {}

    public static void syncNow(Context context) {
        if (context == null) return;
        Context appCtx = context.getApplicationContext();
        if (!new SessionManager(appCtx).isLoggedIn()) return;

        syncTasks(appCtx);
        syncAssessments(appCtx);
    }

    // ─── Tasks ──────────────────────────────────────────────────────────

    private static void syncTasks(Context appCtx) {
        ApiClient.get().getStudentTasks().enqueue(new Callback<List<TaskDto>>() {
            @Override public void onResponse(Call<List<TaskDto>> call, Response<List<TaskDto>> r) {
                if (!r.isSuccessful() || r.body() == null) {
                    Log.w(TAG, "tasks GET failed: " + r.code());
                    return;
                }
                AppDatabase.databaseWriteExecutor.execute(() -> {
                    TaskDao dao = AppDatabase.getInstance(appCtx).taskDao();
                    for (TaskDto dto : r.body()) {
                        upsertTask(dao, dto);
                    }
                });
            }
            @Override public void onFailure(Call<List<TaskDto>> call, Throwable t) {
                Log.w(TAG, "tasks GET network error: " + t.getMessage());
            }
        });
    }

    private static void upsertTask(TaskDao dao, TaskDto dto) {
        if (dto.id == null) return;
        Task existing = dao.findByServerId(dto.id);
        Task t = (existing != null) ? existing : new Task();
        t.setServerId(dto.id);
        t.setTitle(dto.title);
        t.setDescription(dto.description);
        t.setDueDateMillis(parseIsoMillis(dto.dueDate));
        t.setPriority(capitalize(dto.priority, "Medium"));
        t.setCompleted("done".equals(dto.status));
        // Subject mapping is intentionally omitted: the local Subject ids
        // are INTs while the backend uses UUIDs. The two domains aren't
        // linked yet, so we leave subjectId at its default.
        if (existing == null) dao.insert(t);
        else                   dao.update(t);
    }

    // ─── Assessments ────────────────────────────────────────────────────

    private static void syncAssessments(Context appCtx) {
        ApiClient.get().getStudentAssessments().enqueue(new Callback<List<AssessmentDto>>() {
            @Override public void onResponse(Call<List<AssessmentDto>> call, Response<List<AssessmentDto>> r) {
                if (!r.isSuccessful() || r.body() == null) {
                    Log.w(TAG, "assessments GET failed: " + r.code());
                    return;
                }
                AppDatabase.databaseWriteExecutor.execute(() -> {
                    AssessmentDao dao = AppDatabase.getInstance(appCtx).assessmentDao();
                    for (AssessmentDto dto : r.body()) {
                        upsertAssessment(dao, dto);
                    }
                });
            }
            @Override public void onFailure(Call<List<AssessmentDto>> call, Throwable t) {
                Log.w(TAG, "assessments GET network error: " + t.getMessage());
            }
        });
    }

    private static void upsertAssessment(AssessmentDao dao, AssessmentDto dto) {
        if (dto.id == null) return;
        Assessment existing = dao.findByServerId(dto.id);
        Assessment a = (existing != null) ? existing : new Assessment();
        a.serverId = dto.id;
        a.title    = dto.title;
        a.notes    = dto.notes;
        a.dateTimeMillis = parseIsoMillis(dto.dueAt);
        a.type     = capitalize(dto.type, "Assignment");
        a.isDone   = dto.isDone != null && dto.isDone == 1;
        if (existing == null) dao.insert(a);
        else                   dao.update(a);
    }

    // ─── Helpers ────────────────────────────────────────────────────────

    /** Parse server ISO timestamps. Returns 0 on null/empty/parse-error. */
    private static long parseIsoMillis(String iso) {
        if (iso == null || iso.isEmpty()) return 0L;
        // Accept "...Z" (UTC) and "..." (assume UTC) variants.
        String trimmed = iso.replace("Z", "").trim();
        // Strip any trailing fractional-second segment longer than .SSS.
        int dot = trimmed.indexOf('.');
        if (dot > 0 && trimmed.length() - dot > 4) {
            trimmed = trimmed.substring(0, dot + 4);
        }
        String[] patterns = {
            "yyyy-MM-dd'T'HH:mm:ss.SSS",
            "yyyy-MM-dd'T'HH:mm:ss",
            "yyyy-MM-dd HH:mm:ss",
            "yyyy-MM-dd",
        };
        for (String p : patterns) {
            SimpleDateFormat fmt = new SimpleDateFormat(p, Locale.US);
            fmt.setTimeZone(TimeZone.getTimeZone("UTC"));
            try {
                Date d = fmt.parse(trimmed);
                if (d != null) return d.getTime();
            } catch (ParseException ignored) {}
        }
        return 0L;
    }

    /** "high" -> "High". Returns the fallback if input is null/empty. */
    private static String capitalize(String s, String fallback) {
        if (s == null || s.isEmpty()) return fallback;
        return Character.toUpperCase(s.charAt(0)) + s.substring(1).toLowerCase(Locale.US);
    }
}
