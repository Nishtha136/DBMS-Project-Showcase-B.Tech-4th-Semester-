package com.example.studylab;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.NumberPicker;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.SwitchCompat;

import com.example.studylab.api.SessionManager;
import com.example.studylab.database.AppDatabase;

public class SettingsActivity extends AppCompatActivity {

    private static final String PREFS_NAME = "studylab_prefs";
    private static final String KEY_FOCUS_MODE = "focus_mode_enabled";
    private static final String KEY_DAILY_TARGET = "daily_study_target_hours";

    private SharedPreferences prefs;

    private TextView tvDailyTarget;
    private SwitchCompat focusModeSwitch;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_settings);

        prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);

        tvDailyTarget    = findViewById(R.id.tvDailyTarget);
        focusModeSwitch  = findViewById(R.id.focus_mode_switch);

        findViewById(R.id.btnBack).setOnClickListener(v -> finish());

        // Daily Study Target
        tvDailyTarget.setText(prefs.getInt(KEY_DAILY_TARGET, 4) + " Hours");
        findViewById(R.id.rowDailyTarget).setOnClickListener(v -> showDailyTargetPicker());

        // Focus Mode toggle
        focusModeSwitch.setChecked(prefs.getBoolean(KEY_FOCUS_MODE, true));
        focusModeSwitch.setOnCheckedChangeListener((b, isChecked) ->
                prefs.edit().putBoolean(KEY_FOCUS_MODE, isChecked).apply());

        // Allowed Apps
        findViewById(R.id.rowAllowedApps).setOnClickListener(v ->
                startActivity(new Intent(this, AllowedAppsActivity.class)));

        // Clear Study History
        findViewById(R.id.rowClearHistory).setOnClickListener(v -> showClearHistoryConfirm());

        // Reset All Experiments
        findViewById(R.id.rowResetExperiments).setOnClickListener(v -> showResetExperimentsConfirm());

        // Sign Out
        Button signOut = findViewById(R.id.sign_out_button);
        if (signOut != null) {
            signOut.setOnClickListener(v -> {
                new SessionManager(this).logout();
                Intent intent = new Intent(this, login.class);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                startActivity(intent);
                finish();
            });
        }
    }

    private void showDailyTargetPicker() {
        NumberPicker picker = new NumberPicker(this);
        picker.setMinValue(1);
        picker.setMaxValue(12);
        picker.setValue(prefs.getInt(KEY_DAILY_TARGET, 4));

        new AlertDialog.Builder(this)
                .setTitle("Daily Study Target")
                .setView(picker)
                .setPositiveButton("Save", (d, w) -> {
                    int hours = picker.getValue();
                    prefs.edit().putInt(KEY_DAILY_TARGET, hours).apply();
                    tvDailyTarget.setText(hours + " Hours");
                })
                .setNegativeButton("Cancel", null)
                .show();
    }

    private void showClearHistoryConfirm() {
        new AlertDialog.Builder(this)
                .setTitle("Clear Study History")
                .setMessage("This will delete all your study sessions. This cannot be undone.")
                .setPositiveButton("Clear", (d, w) -> {
                    AppDatabase.databaseWriteExecutor.execute(() -> {
                        AppDatabase.getInstance(this).studySessionDao().deleteAllStudySessions();
                        runOnUiThread(() ->
                                Toast.makeText(this, "Study history cleared", Toast.LENGTH_SHORT).show());
                    });
                })
                .setNegativeButton("Cancel", null)
                .show();
    }

    private void showResetExperimentsConfirm() {
        new AlertDialog.Builder(this)
                .setTitle("Reset All Experiments")
                .setMessage("This will delete all your experiment data. Files in Vault are not affected.")
                .setPositiveButton("Reset", (d, w) -> {
                    AppDatabase.databaseWriteExecutor.execute(() -> {
                        AppDatabase db = AppDatabase.getInstance(this);
                        db.checkInDao().deleteAllCheckIns();
                        db.experimentDao().deleteAllExperiments();
                        runOnUiThread(() ->
                                Toast.makeText(this, "All experiments reset", Toast.LENGTH_SHORT).show());
                    });
                })
                .setNegativeButton("Cancel", null)
                .show();
    }
}
