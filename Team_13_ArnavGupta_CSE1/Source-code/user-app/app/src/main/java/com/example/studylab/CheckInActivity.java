package com.example.studylab;

import android.os.Bundle;
import android.widget.SeekBar;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;

/**
 * Displays the 3 questions of a user-created experiment and lets the user rate
 * each from 1 to 10. On submit the average score is persisted to SQLite.
 */
public class CheckInActivity extends AppCompatActivity {

    public static final String EXTRA_EXPERIMENT_INDEX = "experiment_index";

    private int experimentIndex = -1;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_check_in);

        // Back button
        findViewById(R.id.btn_checkin_back).setOnClickListener(v -> finish());

        // Retrieve the experiment by in-list index
        experimentIndex = getIntent().getIntExtra(EXTRA_EXPERIMENT_INDEX, -1);
        ExperimentStore store = ExperimentStore.get(this);

        if (experimentIndex < 0 || experimentIndex >= store.size()) {
            Toast.makeText(this, "Experiment not found", Toast.LENGTH_SHORT).show();
            finish();
            return;
        }
        Experiment experiment = store.getAt(experimentIndex);

        // Experiment name in the banner
        ((TextView) findViewById(R.id.tv_experiment_name)).setText(experiment.getTitle());

        // Wire up the 3 questions
        bindQuestion(R.id.tv_question1, R.id.seek_q1, R.id.tv_rating1, experiment.getQuestion(0));
        bindQuestion(R.id.tv_question2, R.id.seek_q2, R.id.tv_rating2, experiment.getQuestion(1));
        bindQuestion(R.id.tv_question3, R.id.seek_q3, R.id.tv_rating3, experiment.getQuestion(2));

        SeekBar seekQ1 = findViewById(R.id.seek_q1);
        SeekBar seekQ2 = findViewById(R.id.seek_q2);
        SeekBar seekQ3 = findViewById(R.id.seek_q3);

        // Submit — persist score to DB via store
        findViewById(R.id.btn_submit_checkin).setOnClickListener(v -> {
            float avg = ((seekQ1.getProgress() + 1)
                       + (seekQ2.getProgress() + 1)
                       + (seekQ3.getProgress() + 1)) / 3.0f;

            store.addCheckIn(experiment.getDbId(), avg);

            Toast.makeText(this,
                "Check-in saved! Avg score: "
                + String.format(java.util.Locale.US, "%.1f", avg) + "/10",
                Toast.LENGTH_LONG).show();
            finish();
        });
    }

    private void bindQuestion(int tvId, int seekId, int ratingId, String text) {
        TextView tv     = findViewById(tvId);
        SeekBar  seek   = findViewById(seekId);
        TextView rating = findViewById(ratingId);

        tv.setText(text);
        seek.setMax(9);
        seek.setProgress(4);          // default = 5
        rating.setText("5");

        seek.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener() {
            @Override public void onProgressChanged(SeekBar s, int p, boolean f) {
                rating.setText(String.valueOf(p + 1));
            }
            @Override public void onStartTrackingTouch(SeekBar s) {}
            @Override public void onStopTrackingTouch(SeekBar s) {}
        });
    }
}
