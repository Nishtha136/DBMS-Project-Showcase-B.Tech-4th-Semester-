package com.example.studylab.services;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;

import android.util.Log;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import com.example.studylab.R;
import com.example.studylab.StudyTimerActivity;
import com.example.studylab.api.ApiClient;
import com.example.studylab.api.ApiService;
import com.example.studylab.api.EndSessionRequest;
import com.example.studylab.api.FocusEventRequest;
import com.example.studylab.api.StartSessionRequest;
import com.example.studylab.api.StudySessionDto;
import com.example.studylab.database.StudySession;
import com.example.studylab.database.StudySessionRepository;
import com.example.studylab.database.SubjectRepository;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.Map;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class StudyTimerService extends Service {

    // Commands
    public static final String ACTION_START  = "com.studylab.TIMER_START";
    public static final String ACTION_PAUSE  = "com.studylab.TIMER_PAUSE";
    public static final String ACTION_RESUME = "com.studylab.TIMER_RESUME";
    public static final String ACTION_STOP   = "com.studylab.TIMER_STOP";
    public static final String ACTION_RESET  = "com.studylab.TIMER_RESET";

    // Broadcasts to UI
    public static final String ACTION_TICK   = "com.studylab.TIMER_TICK";
    public static final String ACTION_FINISH = "com.studylab.TIMER_FINISH"; // goal reached

    // Intent extras
    public static final String EXTRA_ELAPSED_SECONDS = "extra_elapsed_seconds";
    public static final String EXTRA_TOTAL_SECONDS   = "extra_total_seconds";
    public static final String EXTRA_PROGRESS        = "extra_progress";
    public static final String EXTRA_SUBJECT_ID      = "extra_subject_id";
    public static final String EXTRA_SUBJECT_NAME    = "extra_subject_name";

    private static final String CHANNEL_ID      = "study_timer_channel";
    private static final int    NOTIFICATION_ID = 101;

    private final Handler timerHandler = new Handler(Looper.getMainLooper());
    private final Runnable tickRunnable = new Runnable() {
        @Override
        public void run() {
            if (!isRunning) return;
            elapsedSeconds = (int) ((System.currentTimeMillis() - sessionStartMillis - totalPausedMillis) / 1000);
            broadcastTick();
            // Fire goal-reached event once when target is hit
            if (!goalReached && totalSeconds > 0 && elapsedSeconds >= totalSeconds) {
                goalReached = true;
                broadcastFinish();
            }
            if (elapsedSeconds % 30 == 0) updateNotification();
            timerHandler.postDelayed(this, 1000);
        }
    };

    private long    sessionStartMillis = 0;
    private long    pauseStartMillis   = 0;
    private long    totalPausedMillis  = 0;
    private int     elapsedSeconds     = 0;
    private int     totalSeconds       = 2700; // reference for progress ring
    private int     subjectId          = -1;
    private String  subjectName        = "Study Session";
    private boolean isRunning          = false;
    private boolean isPaused           = false;
    private boolean goalReached        = false;

    private StudySessionRepository sessionRepo;
    private SubjectRepository subjectRepo;

    // ─── Server-side study session tracking ─────────────────────────────────
    // The mentor CRM displays total study time + the "active in last 2 days"
    // rule from these uploads. Local Room writes still happen for offline
    // resilience; the network calls are fire-and-forget on top.
    private static final String TAG_API = "StudyTimerService";
    private static final String FOCUS_PREF_KEY = "focus_mode_enabled";
    private String  serverSessionId      = null;        // populated async after /sessions/start
    private long    focusOnStartMillis   = -1L;         // -1 when focus mode is off / not yet known
    private long    focusAccumMillis     = 0L;          // total ms focus was on during this session
    private SharedPreferences.OnSharedPreferenceChangeListener focusPrefListener;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        sessionRepo = new StudySessionRepository(this);
        subjectRepo = new SubjectRepository(this);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null || intent.getAction() == null) {
            stopSelf();
            return START_NOT_STICKY;
        }
        switch (intent.getAction()) {
            case ACTION_START:
                totalSeconds = intent.getIntExtra(EXTRA_TOTAL_SECONDS, 2700);
                subjectId    = intent.getIntExtra(EXTRA_SUBJECT_ID, -1);
                subjectName  = intent.getStringExtra(EXTRA_SUBJECT_NAME);
                if (subjectName == null) subjectName = "Study Session";
                startStopwatch();
                break;
            case ACTION_PAUSE:  pauseStopwatch();  break;
            case ACTION_RESUME: resumeStopwatch(); break;
            case ACTION_STOP:   stopStopwatch();   break;
            case ACTION_RESET:  resetStopwatch();  break;
        }
        return START_NOT_STICKY;
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) { return null; }

    @Override
    public void onDestroy() {
        super.onDestroy();
        timerHandler.removeCallbacks(tickRunnable);
        setTimerRunningPref(false);
        setTimerPausedPref(false);
    }

    // ─── Stopwatch control ───────────────────────────────────────────────────

    private void startStopwatch() {
        sessionStartMillis = System.currentTimeMillis();
        totalPausedMillis  = 0;
        elapsedSeconds     = 0;
        goalReached        = false;
        isRunning          = true;
        isPaused           = false;
        setTimerRunningPref(true);
        setTimerPausedPref(false);
        updateNotification(); // must call startForeground before ticking
        timerHandler.post(tickRunnable);

        // Server upload: open a study_session on the backend, observe focus toggles.
        focusAccumMillis     = 0L;
        focusOnStartMillis   = isFocusModeOn() ? sessionStartMillis : -1L;
        uploadStartSession();
        if (focusOnStartMillis > 0) {
            // Initial state was "focus on" -- log it as an enable event.
            logFocusEventToServer("enabled");
        }
        registerFocusPrefListener();
    }

    private void pauseStopwatch() {
        if (!isRunning) return;
        timerHandler.removeCallbacks(tickRunnable);
        isRunning        = false;
        isPaused         = true;
        pauseStartMillis = System.currentTimeMillis();
        setTimerRunningPref(false);
        setTimerPausedPref(true);
        updateNotification();
    }

    private void resumeStopwatch() {
        if (!isPaused) return;
        totalPausedMillis += System.currentTimeMillis() - pauseStartMillis;
        isRunning = true;
        isPaused  = false;
        setTimerRunningPref(true);
        setTimerPausedPref(false);
        updateNotification();
        timerHandler.post(tickRunnable);
    }

    private void stopStopwatch() {
        timerHandler.removeCallbacks(tickRunnable);
        isRunning = false;
        isPaused  = false;

        // Final focus accumulation (in case focus was still ON at stop).
        if (focusOnStartMillis > 0) {
            focusAccumMillis += System.currentTimeMillis() - focusOnStartMillis;
            focusOnStartMillis = -1L;
        }
        unregisterFocusPrefListener();

        if (elapsedSeconds >= 60) saveSession();
        // Always close the server-side session even for short sessions, so
        // mentors see the activity row in their feed.
        uploadEndSession();

        setTimerRunningPref(false);
        setTimerPausedPref(false);
        broadcastTick(); // send final state to UI
        stopSelf();
    }

    private void resetStopwatch() {
        timerHandler.removeCallbacks(tickRunnable);
        isRunning         = false;
        isPaused          = false;
        elapsedSeconds    = 0;
        totalPausedMillis = 0;
        goalReached       = false;
        unregisterFocusPrefListener();
        setTimerRunningPref(false);
        setTimerPausedPref(false);
        broadcastTick();
        stopSelf();
    }

    // ─── Broadcast ──────────────────────────────────────────────────────────

    private void broadcastTick() {
        float progress = totalSeconds > 0
                ? Math.min(1.0f, (float) elapsedSeconds / totalSeconds) : 0f;
        Intent i = new Intent(ACTION_TICK);
        i.putExtra(EXTRA_ELAPSED_SECONDS, elapsedSeconds);
        i.putExtra(EXTRA_TOTAL_SECONDS, totalSeconds);
        i.putExtra(EXTRA_PROGRESS, progress);
        LocalBroadcastManager.getInstance(this).sendBroadcast(i);
    }

    private void broadcastFinish() {
        Intent i = new Intent(ACTION_FINISH);
        i.putExtra(EXTRA_ELAPSED_SECONDS, elapsedSeconds);
        i.putExtra(EXTRA_TOTAL_SECONDS, totalSeconds);
        LocalBroadcastManager.getInstance(this).sendBroadcast(i);
    }

    // ─── Database ───────────────────────────────────────────────────────────

    private void saveSession() {
        StudySession s   = new StudySession();
        s.subjectId      = subjectId;
        s.subjectName    = subjectName;
        s.startTime      = sessionStartMillis;
        s.endTime        = System.currentTimeMillis();
        s.durationSeconds = elapsedSeconds;
        s.date            = new SimpleDateFormat("yyyy-MM-dd", Locale.US)
                                .format(new Date(sessionStartMillis));
        s.wasCompleted    = goalReached;
        sessionRepo.insert(s);
        if (subjectId != -1) {
            subjectRepo.incrementTotalStudySeconds(subjectId, elapsedSeconds);
        }
    }

    // ─── SharedPreferences ──────────────────────────────────────────────────

    private void setTimerRunningPref(boolean v) {
        getSharedPreferences("studylab_prefs", MODE_PRIVATE)
                .edit().putBoolean("timer_running", v).apply();
    }

    private void setTimerPausedPref(boolean v) {
        getSharedPreferences("studylab_prefs", MODE_PRIVATE)
                .edit().putBoolean("timer_paused", v).apply();
    }

    // ─── Notification ───────────────────────────────────────────────────────

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = new NotificationChannel(
                    CHANNEL_ID, "Study Timer", NotificationManager.IMPORTANCE_LOW);
            getSystemService(NotificationManager.class).createNotificationChannel(ch);
        }
    }

    private void updateNotification() {
        String stateLabel  = isPaused ? "Paused" : "Studying";
        String elapsedText = formatTime(elapsedSeconds);

        Intent tapIntent = new Intent(this, StudyTimerActivity.class);
        tapIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        int piFlags = PendingIntent.FLAG_UPDATE_CURRENT
                | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0);
        PendingIntent pi = PendingIntent.getActivity(this, 0, tapIntent, piFlags);

        Notification n = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle(subjectName + " · " + stateLabel)
                .setContentText("Elapsed: " + elapsedText)
                .setSmallIcon(R.drawable.ic_timer)
                .setContentIntent(pi)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setOngoing(true)
                .build();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startForeground(NOTIFICATION_ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
        } else {
            startForeground(NOTIFICATION_ID, n);
        }
    }

    private String formatTime(int seconds) {
        int h = seconds / 3600;
        int m = (seconds % 3600) / 60;
        int s = seconds % 60;
        return String.format(Locale.US, "%02d:%02d:%02d", h, m, s);
    }

    // ─── Server upload helpers ──────────────────────────────────────────────

    private boolean isFocusModeOn() {
        return getSharedPreferences("studylab_prefs", MODE_PRIVATE)
                .getBoolean(FOCUS_PREF_KEY, true);
    }

    private void uploadStartSession() {
        StartSessionRequest req = new StartSessionRequest(null, subjectName);
        // Note: subjectId on the local Room side is an INT; the server-side
        // subjects table is keyed by VARCHAR(36) UUID owned by the account.
        // The two domains are not yet linked, so we only send subject_label
        // here. When the vault subjects sync lands we can populate subject_id.
        ApiClient.get().startStudySession(req).enqueue(new Callback<StudySessionDto>() {
            @Override public void onResponse(Call<StudySessionDto> call, Response<StudySessionDto> r) {
                if (r.isSuccessful() && r.body() != null) {
                    serverSessionId = r.body().getId();
                    Log.d(TAG_API, "study session opened: " + serverSessionId);
                } else {
                    Log.w(TAG_API, "start failed: " + r.code());
                }
            }
            @Override public void onFailure(Call<StudySessionDto> call, Throwable t) {
                Log.w(TAG_API, "start network error: " + t.getMessage());
            }
        });
    }

    private void uploadEndSession() {
        if (serverSessionId == null) return;       // server never opened (offline / 401 / etc.)
        int focusSecs = (int) (focusAccumMillis / 1000L);
        EndSessionRequest req = new EndSessionRequest(serverSessionId, focusSecs, null);
        ApiClient.get().endStudySession(req).enqueue(new Callback<StudySessionDto>() {
            @Override public void onResponse(Call<StudySessionDto> call, Response<StudySessionDto> r) {
                if (r.isSuccessful()) {
                    Log.d(TAG_API, "study session closed: " + serverSessionId
                            + " focus=" + focusSecs + "s");
                } else {
                    Log.w(TAG_API, "end failed: " + r.code());
                }
                serverSessionId = null;
            }
            @Override public void onFailure(Call<StudySessionDto> call, Throwable t) {
                Log.w(TAG_API, "end network error: " + t.getMessage());
                serverSessionId = null;
            }
        });
    }

    private void logFocusEventToServer(String eventType) {
        FocusEventRequest req = new FocusEventRequest(eventType, serverSessionId);
        ApiClient.get().logFocusEvent(req).enqueue(new Callback<Map<String, String>>() {
            @Override public void onResponse(Call<Map<String, String>> call, Response<Map<String, String>> r) {
                if (!r.isSuccessful()) Log.w(TAG_API, "focus event failed: " + r.code());
            }
            @Override public void onFailure(Call<Map<String, String>> call, Throwable t) {
                Log.w(TAG_API, "focus event network error: " + t.getMessage());
            }
        });
    }

    private void registerFocusPrefListener() {
        if (focusPrefListener != null) return;
        SharedPreferences prefs = getSharedPreferences("studylab_prefs", MODE_PRIVATE);
        focusPrefListener = (sp, key) -> {
            if (!FOCUS_PREF_KEY.equals(key)) return;
            boolean nowOn = sp.getBoolean(FOCUS_PREF_KEY, true);
            long now = System.currentTimeMillis();
            if (nowOn) {
                if (focusOnStartMillis < 0) focusOnStartMillis = now;
                logFocusEventToServer("enabled");
            } else {
                if (focusOnStartMillis > 0) {
                    focusAccumMillis += now - focusOnStartMillis;
                    focusOnStartMillis = -1L;
                }
                logFocusEventToServer("disabled");
            }
        };
        prefs.registerOnSharedPreferenceChangeListener(focusPrefListener);
    }

    private void unregisterFocusPrefListener() {
        if (focusPrefListener == null) return;
        getSharedPreferences("studylab_prefs", MODE_PRIVATE)
                .unregisterOnSharedPreferenceChangeListener(focusPrefListener);
        focusPrefListener = null;
    }
}
