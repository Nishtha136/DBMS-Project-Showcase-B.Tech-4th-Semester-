package com.example.studylab.api;

import com.example.studylab.vault.Subject;
import com.example.studylab.vault.VaultFile;
import com.example.studylab.vault.VaultLink;
import java.util.List;
import java.util.Map;
import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.DELETE;
import retrofit2.http.GET;
import retrofit2.http.PATCH;
import retrofit2.http.POST;
import retrofit2.http.PUT;
import retrofit2.http.Path;
import retrofit2.http.Query;

public interface ApiService {

    @POST("auth/login")
    Call<AuthResponse> login(@Body LoginRequest body);

    @POST("auth/register")
    Call<AuthResponse> register(@Body RegisterRequest body);

    @GET("auth/mentors")
    Call<MentorListResponse> getMentors();

    @GET("subjects")
    Call<List<Subject>> getSubjects();

    @POST("subjects")
    Call<Subject> addSubject(@Body Subject subject);

    @DELETE("subjects/{id}")
    Call<Void> deleteSubject(@Path("id") String id);

    @GET("vault-files")
    Call<List<VaultFile>> getAllFiles();

    @GET("vault-files")
    Call<List<VaultFile>> getFilesBySubject(@Query("subjectId") String subjectId);

    @POST("vault-files")
    Call<VaultFile> addFile(@Body VaultFile file);

    @PUT("vault-files/{id}")
    Call<Void> updateFile(@Path("id") String id, @Body Map<String, String> updates);

    @DELETE("vault-files/{id}")
    Call<Void> deleteFile(@Path("id") String id);

    @GET("vault-links")
    Call<List<VaultLink>> getAllLinks();

    @GET("vault-links")
    Call<List<VaultLink>> getLinksBySubject(@Query("subjectId") String subjectId);

    @POST("vault-links")
    Call<VaultLink> addLink(@Body VaultLink link);

    @PUT("vault-links/{id}")
    Call<Void> updateLink(@Path("id") String id, @Body Map<String, String> updates);

    @DELETE("vault-links/{id}")
    Call<Void> deleteLink(@Path("id") String id);

    // ─── Study sync (POST /api/study/*) ─────────────────────────────────
    // Called by StudyTimerService on Start / Stop and by the focus-mode
    // toggle to keep the mentor CRM's "total study time" + 2-day inactivity
    // rule fed by real user data.

    @POST("study/sessions/start")
    Call<StudySessionDto> startStudySession(@Body StartSessionRequest body);

    @POST("study/sessions/end")
    Call<StudySessionDto> endStudySession(@Body EndSessionRequest body);

    @POST("study/focus-events")
    Call<Map<String, String>> logFocusEvent(@Body FocusEventRequest body);

    @GET("study/sessions/mine")
    Call<List<StudySessionDto>> getMyStudySessions(@Query("limit") int limit);

    // ─── Student sync (POST/GET/PATCH /api/student/*) ─────────────────────
    // Two-way sync between local Room and the backend:
    //   - Push: each Repository.insert/update/delete fires the matching POST
    //     /PATCH/DELETE.
    //   - Pull: MentorSyncService fetches getStudentTasks() + getStudentAssessments()
    //     periodically so mentor-assigned items appear in the app.

    @GET("student/tasks")
    Call<List<TaskDto>> getStudentTasks();

    @POST("student/tasks")
    Call<TaskDto> createStudentTask(@Body TaskRequest body);

    @PATCH("student/tasks/{id}")
    Call<Map<String, Object>> updateStudentTask(@Path("id") String id, @Body TaskRequest body);

    @DELETE("student/tasks/{id}")
    Call<Map<String, Object>> deleteStudentTask(@Path("id") String id);

    @GET("student/assessments")
    Call<List<AssessmentDto>> getStudentAssessments();

    @POST("student/assessments")
    Call<AssessmentDto> createStudentAssessment(@Body AssessmentRequest body);

    @PATCH("student/assessments/{id}")
    Call<Map<String, Object>> updateStudentAssessment(@Path("id") String id, @Body AssessmentRequest body);

    @DELETE("student/assessments/{id}")
    Call<Map<String, Object>> deleteStudentAssessment(@Path("id") String id);

    @GET("student/check-ins")
    Call<List<CheckInDto>> getStudentCheckIns(@Query("limit") int limit);

    @POST("student/check-ins")
    Call<CheckInDto> createStudentCheckIn(@Body CheckInRequest body);

    @PATCH("student/check-ins/{id}")
    Call<Map<String, Object>> updateStudentCheckIn(@Path("id") String id, @Body CheckInRequest body);

    @DELETE("student/check-ins/{id}")
    Call<Map<String, Object>> deleteStudentCheckIn(@Path("id") String id);
}
