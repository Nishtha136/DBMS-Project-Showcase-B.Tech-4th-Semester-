package com.example.studylab.ui.focus;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Bundle;
import android.view.WindowManager;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import com.example.studylab.MainActivity;
import com.example.studylab.R;
import com.example.studylab.services.StudyTimerService;

import java.util.Locale;

public class FocusModeActivity extends AppCompatActivity {

    private TextView timerTextView;

    private final BroadcastReceiver timerReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (StudyTimerService.ACTION_TICK.equals(intent.getAction())) {
                int elapsed = intent.getIntExtra(StudyTimerService.EXTRA_ELAPSED_SECONDS, 0);
                updateTimerDisplay(elapsed);
            }
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        setContentView(R.layout.activity_focus_mode);

        timerTextView = findViewById(R.id.timer_text_view);

        findViewById(R.id.return_to_study_lab_button).setOnClickListener(v -> returnToStudyLab());
        findViewById(R.id.end_session_button).setOnClickListener(v -> endSession());

        updateTimerDisplay(0);
    }

    @Override
    protected void onResume() {
        super.onResume();
        IntentFilter f = new IntentFilter();
        f.addAction(StudyTimerService.ACTION_TICK);
        LocalBroadcastManager.getInstance(this).registerReceiver(timerReceiver, f);
    }

    @Override
    protected void onPause() {
        super.onPause();
        LocalBroadcastManager.getInstance(this).unregisterReceiver(timerReceiver);
    }

    @Override
    public void onBackPressed() {
        Toast.makeText(this, "Finish your session first.", Toast.LENGTH_SHORT).show();
    }

    private void returnToStudyLab() {
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        startActivity(intent);
        finish();
    }

    private void endSession() {
        Intent stop = new Intent(this, StudyTimerService.class);
        stop.setAction(StudyTimerService.ACTION_STOP);
        startService(stop);

        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        startActivity(intent);
        finish();
    }

    private void updateTimerDisplay(int elapsedSeconds) {
        int h = elapsedSeconds / 3600;
        int m = (elapsedSeconds % 3600) / 60;
        int s = elapsedSeconds % 60;
        timerTextView.setText(String.format(Locale.US, "%02d:%02d:%02d", h, m, s));
    }
}
