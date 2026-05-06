package com.example.studylab.database;

import android.content.Context;
import android.text.TextUtils;
import android.util.Log;

import androidx.lifecycle.LiveData;

import com.example.studylab.api.ApiClient;
import com.example.studylab.api.TaskDto;
import com.example.studylab.api.TaskRequest;

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
 * Local Room CRUD + fire-and-forget sync to /api/student/tasks.
 *
 * Insert flow:
 *   - write to Room (gets local int id)
 *   - POST /api/student/tasks
 *   - on response, store the returned UUID back into Room as server_id
 *
 * Update flow: Room write + PATCH if we have a server_id.
 * Delete flow: Room write + DELETE if we have a server_id.
 *
 * Network failures are logged and ignored -- the local copy is the source
 * of truth for the UI; the next manual sync re-converges.
 */
public class TaskRepository {
    private static final String TAG = "TaskRepository";
    private final TaskDao taskDao;

    public TaskRepository(Context context) {
        taskDao = AppDatabase.getInstance(context).taskDao();
    }

    public void insert(Task task) {
        AppDatabase.databaseWriteExecutor.execute(() -> {
            long localId = taskDao.insert(task);
            task.setId((int) localId);
            uploadCreate(task);
        });
    }

    public void update(Task task) {
        AppDatabase.databaseWriteExecutor.execute(() -> {
            taskDao.update(task);
            uploadPatch(task);
        });
    }

    public void delete(Task task) {
        AppDatabase.databaseWriteExecutor.execute(() -> {
            taskDao.delete(task);
            uploadDelete(task);
        });
    }

    public LiveData<List<Task>> getTasksForMonth(long startOfMonth, long endOfMonth) {
        return taskDao.getTasksForMonth(startOfMonth, endOfMonth);
    }

    public LiveData<List<Task>> getTasksForDay(long startOfDay, long endOfDay) {
        return taskDao.getTasksForDay(startOfDay, endOfDay);
    }

    // ─── Sync helpers ───────────────────────────────────────────────────

    private void uploadCreate(Task task) {
        TaskRequest req = toRequest(task);
        ApiClient.get().createStudentTask(req).enqueue(new Callback<TaskDto>() {
            @Override public void onResponse(Call<TaskDto> call, Response<TaskDto> r) {
                if (r.isSuccessful() && r.body() != null && r.body().id != null) {
                    AppDatabase.databaseWriteExecutor.execute(() -> {
                        taskDao.setServerId(task.getId(), r.body().id);
                        task.setServerId(r.body().id);
                    });
                } else {
                    Log.w(TAG, "createStudentTask failed: " + r.code());
                }
            }
            @Override public void onFailure(Call<TaskDto> call, Throwable t) {
                Log.w(TAG, "createStudentTask network error: " + t.getMessage());
            }
        });
    }

    private void uploadPatch(Task task) {
        if (TextUtils.isEmpty(task.getServerId())) return;  // never reached the server
        TaskRequest req = toRequest(task);
        // status field reflects local isCompleted state.
        req.status = task.isCompleted() ? "done" : "pending";
        ApiClient.get().updateStudentTask(task.getServerId(), req)
            .enqueue(new Callback<Map<String, Object>>() {
                @Override public void onResponse(Call<Map<String, Object>> c, Response<Map<String, Object>> r) {
                    if (!r.isSuccessful()) Log.w(TAG, "updateStudentTask failed: " + r.code());
                }
                @Override public void onFailure(Call<Map<String, Object>> c, Throwable t) {
                    Log.w(TAG, "updateStudentTask network error: " + t.getMessage());
                }
            });
    }

    private void uploadDelete(Task task) {
        if (TextUtils.isEmpty(task.getServerId())) return;
        ApiClient.get().deleteStudentTask(task.getServerId())
            .enqueue(new Callback<Map<String, Object>>() {
                @Override public void onResponse(Call<Map<String, Object>> c, Response<Map<String, Object>> r) {
                    // 404 is OK -- it just means the task was mentor-assigned and the
                    // server refused. Local copy is gone either way.
                }
                @Override public void onFailure(Call<Map<String, Object>> c, Throwable t) {
                    Log.w(TAG, "deleteStudentTask network error: " + t.getMessage());
                }
            });
    }

    private static TaskRequest toRequest(Task task) {
        TaskRequest r = new TaskRequest();
        r.title       = task.getTitle();
        r.description = task.getDescription();
        r.priority    = mapPriority(task.getPriority());
        r.status      = task.isCompleted() ? "done" : "pending";
        r.dueDate     = millisToIso(task.getDueDateMillis());
        return r;
    }

    /** Local Task uses "High"/"Medium"/"Low"; server expects lowercase. */
    private static String mapPriority(String p) {
        if (p == null) return "medium";
        String lower = p.toLowerCase(Locale.US);
        if ("high".equals(lower) || "medium".equals(lower) || "low".equals(lower)) return lower;
        return "medium";
    }

    private static String millisToIso(long millis) {
        if (millis <= 0) return null;
        SimpleDateFormat fmt = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US);
        fmt.setTimeZone(TimeZone.getTimeZone("UTC"));
        return fmt.format(new Date(millis));
    }
}
