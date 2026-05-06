package com.example.studylab;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.WindowManager;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import com.example.studylab.database.AppDatabase;
import com.example.studylab.database.Subject;
import com.example.studylab.database.SubjectRepository;
import com.example.studylab.services.StudyTimerService;
import com.google.android.material.textfield.TextInputEditText;

import java.util.List;
import java.util.Locale;

public class StudyTimerActivity extends AppCompatActivity {

    private static final String[] PRESET_COLORS = {
        "#22C1A8", "#1E66F5", "#F59E0B", "#10B981", "#7C3AED",
        "#F43F5E", "#F97316", "#06B6D4", "#4F46E5", "#E53935"
    };

    private boolean timerRunning = false;
    private boolean timerPaused  = false;
    private int     totalSeconds = 2700;
    private int     currentSubjectId    = -1;
    private String  currentSubjectName  = "";
    private String  currentSubjectColor = "#2A88CB";

    private CircularTimerView circularTimer;
    private TextView tvSubjectName, tvStartBtn, tvPause;
    private ImageView icPause;
    private View subjectDot;
    private LinearLayout btnPause, btnStart;

    private SubjectRepository subjectRepo;

    private final BroadcastReceiver timerReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            String action = intent.getAction();
            if (StudyTimerService.ACTION_TICK.equals(action)) {
                int elapsed   = intent.getIntExtra(StudyTimerService.EXTRA_ELAPSED_SECONDS, 0);
                float progress = intent.getFloatExtra(StudyTimerService.EXTRA_PROGRESS, 0);
                circularTimer.setProgress(progress);
                circularTimer.setTimeText(formatTime(elapsed));
            } else if (StudyTimerService.ACTION_FINISH.equals(action)) {
                onGoalReached();
            }
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_study_timer);

        subjectRepo = new SubjectRepository(this);

        circularTimer = findViewById(R.id.circularTimer);
        tvSubjectName = findViewById(R.id.tvSubjectName);
        tvStartBtn    = findViewById(R.id.tvStartBtn);
        tvPause       = findViewById(R.id.tvPause);
        icPause       = findViewById(R.id.icPause);
        subjectDot    = findViewById(R.id.subjectDot);
        btnPause      = findViewById(R.id.btnPause);
        btnStart      = findViewById(R.id.btnStart);

        SharedPreferences prefs = getSharedPreferences("studylab_prefs", MODE_PRIVATE);
        currentSubjectId    = prefs.getInt("timer_subject_id", -1);
        currentSubjectName  = prefs.getString("timer_subject_name", "");
        currentSubjectColor = prefs.getString("timer_subject_color", "#2A88CB");
        totalSeconds        = prefs.getInt("timer_default_seconds", 2700);

        // If no subject was ever chosen, auto-pick the first one from DB
        if (currentSubjectId == -1) {
            loadDefaultSubject();
        } else {
            updateSubjectUI();
        }

        circularTimer.setTimeText(formatTime(0));
        circularTimer.setProgress(0.0f);

        findViewById(R.id.btnBack).setOnClickListener(v -> onBackWithConfirmation());
        findViewById(R.id.btnChangeSubject).setOnClickListener(v -> showSubjectPicker());
        findViewById(R.id.subjectCard).setOnClickListener(v -> showSubjectPicker());

        btnPause.setOnClickListener(v -> onPauseClicked());
        btnStart.setOnClickListener(v -> onStartClicked());

        findViewById(R.id.btnMenu).setOnClickListener(v -> showDurationDialog());
        findViewById(R.id.focusBanner).setOnClickListener(v ->
                startActivity(new Intent(this, SettingsActivity.class)));

        BottomNavHelper.setup(this, "timer");

        if (prefs.getBoolean("timer_running", false)) {
            timerRunning = true;
            timerPaused  = false;
            setRunningUI();
        } else if (prefs.getBoolean("timer_paused", false)) {
            timerRunning = false;
            timerPaused  = true;
            setRunningUI();
            tvPause.setText("Resume");
            icPause.setImageResource(R.drawable.ic_tmr_play);
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        IntentFilter filter = new IntentFilter();
        filter.addAction(StudyTimerService.ACTION_TICK);
        filter.addAction(StudyTimerService.ACTION_FINISH);
        LocalBroadcastManager.getInstance(this).registerReceiver(timerReceiver, filter);
    }

    @Override
    protected void onPause() {
        super.onPause();
        LocalBroadcastManager.getInstance(this).unregisterReceiver(timerReceiver);
    }

    @Override
    public void onBackPressed() {
        onBackWithConfirmation();
    }

    // ─── Timer controls ──────────────────────────────────────────────────────

    private void onBackWithConfirmation() {
        if (!timerRunning && !timerPaused) {
            finish();
            return;
        }
        new AlertDialog.Builder(this)
                .setTitle("Timer is running")
                .setMessage("What would you like to do?")
                .setPositiveButton("Keep Going", null)
                .setNeutralButton("Stop & Save", (d, w) -> onStopClicked())
                .setNegativeButton("Discard", (d, w) -> {
                    Intent intent = new Intent(this, StudyTimerService.class);
                    intent.setAction(StudyTimerService.ACTION_RESET);
                    startService(intent);
                    finish();
                })
                .show();
    }

    private void onStartClicked() {
        if (!timerRunning && !timerPaused) {
            timerRunning = true;
            timerPaused  = false;
            Intent intent = new Intent(this, StudyTimerService.class);
            intent.setAction(StudyTimerService.ACTION_START);
            intent.putExtra(StudyTimerService.EXTRA_TOTAL_SECONDS, totalSeconds);
            intent.putExtra(StudyTimerService.EXTRA_SUBJECT_ID, currentSubjectId);
            intent.putExtra(StudyTimerService.EXTRA_SUBJECT_NAME, currentSubjectName);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(intent);
            } else {
                startService(intent);
            }
            setRunningUI();
        } else {
            onStopClicked();
        }
    }

    private void onPauseClicked() {
        if (!timerRunning && !timerPaused) return;
        Intent intent = new Intent(this, StudyTimerService.class);
        if (!timerPaused) {
            intent.setAction(StudyTimerService.ACTION_PAUSE);
            timerPaused  = true;
            timerRunning = false;
            tvPause.setText("Resume");
            icPause.setImageResource(R.drawable.ic_tmr_play);
        } else {
            intent.setAction(StudyTimerService.ACTION_RESUME);
            timerPaused  = false;
            timerRunning = true;
            tvPause.setText("Pause");
            icPause.setImageResource(R.drawable.ic_tmr_pause);
        }
        startService(intent);
    }

    private void onStopClicked() {
        Intent intent = new Intent(this, StudyTimerService.class);
        intent.setAction(StudyTimerService.ACTION_STOP);
        startService(intent);
        resetUI();
    }

    private void setRunningUI() {
        timerRunning = true;
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        btnPause.setAlpha(1.0f);
        btnPause.setClickable(true);
        tvStartBtn.setText("Stop Studying");
        btnStart.setBackgroundResource(R.drawable.bg_tmr_btn_red);
    }

    private void setIdleUI() {
        timerRunning = false;
        timerPaused  = false;
        getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        btnPause.setAlpha(0.5f);
        btnPause.setClickable(false);
        tvStartBtn.setText("Start Studying");
        btnStart.setBackgroundResource(R.drawable.bg_tmr_btn_primary);
    }

    private void resetUI() {
        circularTimer.setProgress(0.0f);
        circularTimer.setTimeText(formatTime(0));
        tvPause.setText("Pause");
        icPause.setImageResource(R.drawable.ic_tmr_pause);
        setIdleUI();
    }

    private void onGoalReached() {
        int mins = totalSeconds / 60;
        new AlertDialog.Builder(this)
                .setTitle("Goal Reached!")
                .setMessage("You've hit your " + mins + " min goal for " + currentSubjectName + "! Timer keeps going.")
                .setPositiveButton("Keep Going", null)
                .setNegativeButton("Stop & Save", (d, w) -> onStopClicked())
                .show();
    }

    // ─── Subject picker ──────────────────────────────────────────────────────

    private void loadDefaultSubject() {
        AppDatabase.databaseWriteExecutor.execute(() -> {
            List<Subject> subjects = AppDatabase.getInstance(this).subjectDao().getAllSubjectsSync();
            runOnUiThread(() -> {
                if (!subjects.isEmpty()) {
                    Subject s = subjects.get(0);
                    currentSubjectId    = s.id;
                    currentSubjectName  = s.name;
                    currentSubjectColor = s.colorHex != null ? s.colorHex : "#2A88CB";
                    saveSubjectPrefs();
                } else {
                    currentSubjectName = "No Subject";
                }
                updateSubjectUI();
            });
        });
    }

    private void showSubjectPicker() {
        AppDatabase.databaseWriteExecutor.execute(() -> {
            List<Subject> subjects = AppDatabase.getInstance(this).subjectDao().getAllSubjectsSync();
            runOnUiThread(() -> presentPickerDialog(subjects));
        });
    }

    private void presentPickerDialog(List<Subject> subjects) {
        View root = LayoutInflater.from(this).inflate(R.layout.dialog_subject_picker, null);
        LinearLayout listContainer = root.findViewById(R.id.subjectListContainer);

        AlertDialog[] dlg = {null};

        for (Subject s : subjects) {
            View row = LayoutInflater.from(this).inflate(R.layout.item_subject_picker_row, listContainer, false);

            View dot = row.findViewById(R.id.subjectColorDot);
            GradientDrawable dotD = new GradientDrawable();
            dotD.setShape(GradientDrawable.OVAL);
            dotD.setColor(safeParseColor(s.colorHex, "#2A88CB"));
            dot.setBackground(dotD);

            ((TextView) row.findViewById(R.id.tvSubjectRowName)).setText(s.name);
            ((TextView) row.findViewById(R.id.tvSubjectRowTime)).setText(formatStudyTime(s.totalStudySeconds));

            if (s.id == currentSubjectId) {
                row.findViewById(R.id.tvSubjectCheck).setVisibility(View.VISIBLE);
            }

            row.setOnClickListener(v -> {
                currentSubjectId    = s.id;
                currentSubjectName  = s.name;
                currentSubjectColor = s.colorHex != null ? s.colorHex : "#2A88CB";
                updateSubjectUI();
                saveSubjectPrefs();
                if (dlg[0] != null) dlg[0].dismiss();
            });

            listContainer.addView(row);
        }

        root.findViewById(R.id.btnAddNewSubject).setOnClickListener(v -> {
            if (dlg[0] != null) dlg[0].dismiss();
            showAddSubjectDialog();
        });

        dlg[0] = new AlertDialog.Builder(this)
                .setTitle("Select Subject")
                .setView(root)
                .setNegativeButton("Cancel", null)
                .show();
    }

    private void showAddSubjectDialog() {
        View root = LayoutInflater.from(this).inflate(R.layout.dialog_add_subject, null);
        TextInputEditText etName = root.findViewById(R.id.etSubjectName);
        LinearLayout colorPalette = root.findViewById(R.id.colorPalette);

        String[] selectedColor = {PRESET_COLORS[0]};
        View[] colorViews = new View[PRESET_COLORS.length];

        int circlePx = dpToPx(36);
        int marginPx = dpToPx(8);

        for (int i = 0; i < PRESET_COLORS.length; i++) {
            View circle = new View(this);
            LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(circlePx, circlePx);
            if (i > 0) params.leftMargin = marginPx;
            circle.setLayoutParams(params);
            colorViews[i] = circle;
            applyColorCircle(circle, PRESET_COLORS[i], i == 0);

            final int idx = i;
            final String hex = PRESET_COLORS[i];
            circle.setOnClickListener(v -> {
                selectedColor[0] = hex;
                for (int j = 0; j < colorViews.length; j++) {
                    applyColorCircle(colorViews[j], PRESET_COLORS[j], j == idx);
                }
            });

            colorPalette.addView(circle);
        }

        AlertDialog dialog = new AlertDialog.Builder(this)
                .setTitle("New Subject")
                .setView(root)
                .setPositiveButton("Add", null)
                .setNegativeButton("Cancel", null)
                .show();

        dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(v -> {
            String name = etName.getText() != null ? etName.getText().toString().trim() : "";
            if (name.isEmpty()) {
                etName.setError("Enter a subject name");
                return;
            }
            Subject subject = new Subject();
            subject.name             = name;
            subject.colorHex         = selectedColor[0];
            subject.totalStudySeconds = 0;
            subject.createdAt = System.currentTimeMillis();

            AppDatabase.databaseWriteExecutor.execute(() -> {
                long newId = AppDatabase.getInstance(this).subjectDao().insert(subject);
                runOnUiThread(() -> {
                    currentSubjectId    = (int) newId;
                    currentSubjectName  = name;
                    currentSubjectColor = selectedColor[0];
                    updateSubjectUI();
                    saveSubjectPrefs();
                    dialog.dismiss();
                });
            });
        });
    }

    private void applyColorCircle(View view, String colorHex, boolean selected) {
        GradientDrawable d = new GradientDrawable();
        d.setShape(GradientDrawable.OVAL);
        d.setColor(safeParseColor(colorHex, "#2A88CB"));
        if (selected) {
            d.setStroke(dpToPx(3), Color.WHITE);
            view.setElevation(dpToPx(4));
        } else {
            view.setElevation(0);
        }
        view.setBackground(d);
    }

    // ─── Goal duration dialog ─────────────────────────────────────────────────

    private void showDurationDialog() {
        String[] options = {"15 minutes", "25 minutes", "30 minutes", "45 minutes", "60 minutes", "90 minutes"};
        int[]    values  = {900, 1500, 1800, 2700, 3600, 5400};

        new AlertDialog.Builder(this)
                .setTitle("Set Goal Duration")
                .setItems(options, (dialog, which) -> {
                    totalSeconds = values[which];
                    getSharedPreferences("studylab_prefs", MODE_PRIVATE)
                            .edit().putInt("timer_default_seconds", totalSeconds).apply();
                    if (!timerRunning && !timerPaused) {
                        circularTimer.setTimeText(formatTime(0));
                        circularTimer.setProgress(0.0f);
                    }
                })
                .show();
    }

    // ─── UI helpers ───────────────────────────────────────────────────────────

    private void updateSubjectUI() {
        tvSubjectName.setText(currentSubjectName.isEmpty() ? "No Subject" : currentSubjectName);
        GradientDrawable dot = new GradientDrawable();
        dot.setShape(GradientDrawable.OVAL);
        dot.setColor(safeParseColor(currentSubjectColor, "#2A88CB"));
        dot.setSize(dpToPx(12), dpToPx(12));
        subjectDot.setBackground(dot);
    }

    private void saveSubjectPrefs() {
        getSharedPreferences("studylab_prefs", MODE_PRIVATE)
                .edit()
                .putInt("timer_subject_id", currentSubjectId)
                .putString("timer_subject_name", currentSubjectName)
                .putString("timer_subject_color", currentSubjectColor)
                .apply();
    }

    private String formatTime(int seconds) {
        int h = seconds / 3600;
        int m = (seconds % 3600) / 60;
        int s = seconds % 60;
        return String.format(Locale.US, "%02d:%02d:%02d", h, m, s);
    }

    private String formatStudyTime(long totalSeconds) {
        if (totalSeconds <= 0) return "No sessions yet";
        long h = totalSeconds / 3600;
        long m = (totalSeconds % 3600) / 60;
        if (h > 0) return h + "h " + m + "m total";
        return m + "m total";
    }

    private int safeParseColor(String hex, String fallback) {
        try {
            return Color.parseColor(hex != null ? hex : fallback);
        } catch (Exception e) {
            return Color.parseColor(fallback);
        }
    }

    private int dpToPx(int dp) {
        return (int) (dp * getResources().getDisplayMetrics().density);
    }
}
