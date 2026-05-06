package com.example.studylab;

import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;

public class ExperimentDetailsActivity extends AppCompatActivity {

    public static final String EXTRA_EXPERIMENT_INDEX = "experiment_index";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_experiment_details);

        View btnBack = findViewById(R.id.btn_back);
        if (btnBack != null) btnBack.setOnClickListener(v -> finish());

        int idx = getIntent().getIntExtra(EXTRA_EXPERIMENT_INDEX, -1);
        ExperimentStore store = ExperimentStore.get(this);

        if (idx < 0 || idx >= store.size()) return;

        populateUI(store.getAt(idx));
    }

    private void populateUI(Experiment exp) {
        int   days       = exp.getDaysCompleted();
        int   goal       = exp.getGoalDays();
        float avg        = exp.getOverallAvgScore();
        int   bestDay    = exp.getBestDay();
        int   completion = goal > 0
            ? Math.min(100, (int) Math.round(days * 100.0 / goal))
            : 0;

        // ── Hero banner ───────────────────────────────────────
        ((TextView) findViewById(R.id.tv_detail_name)).setText(exp.getTitle());

        ((TextView) findViewById(R.id.tv_detail_progress_label))
            .setText("Day " + days + " of " + goal);

        ProgressBar pb = findViewById(R.id.progress_detail);
        pb.setMax(100);
        pb.setProgress(completion);

        String dateInfo = days == 0 ? "No check-ins yet"
            : days + " check-in" + (days == 1 ? "" : "s") + " completed  •  "
              + Math.max(0, goal - days) + " days remaining";
        ((TextView) findViewById(R.id.tv_detail_date)).setText(dateInfo);

        // ── Chart ─────────────────────────────────────────────
        FocusEnergyChartView chart = findViewById(R.id.chart_avg_score);
        TextView  tvEmpty          = findViewById(R.id.tv_chart_empty);
        LinearLayout dayLabels     = findViewById(R.id.chart_day_labels);

        float[] scores = exp.getScoreArray();
        if (scores.length == 0) {
            chart.setVisibility(View.GONE);
            tvEmpty.setVisibility(View.VISIBLE);
            dayLabels.setVisibility(View.GONE);
        } else {
            chart.setVisibility(View.VISIBLE);
            tvEmpty.setVisibility(View.GONE);
            dayLabels.setVisibility(View.VISIBLE);
            chart.setData(scores);

            dayLabels.removeAllViews();
            for (int i = 0; i < scores.length; i++) {
                TextView lbl = new TextView(this);
                lbl.setLayoutParams(new LinearLayout.LayoutParams(
                    0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f));
                lbl.setText("D" + (i + 1));
                lbl.setTextColor(getResources().getColor(R.color.text_hint, getTheme()));
                lbl.setTextSize(9);
                lbl.setGravity(Gravity.CENTER);
                dayLabels.addView(lbl);
            }
        }

        // ── Stats ─────────────────────────────────────────────
        ((TextView) findViewById(R.id.tv_stat_avg))
            .setText(days == 0 ? "—"
                : String.format(java.util.Locale.US, "%.1f", avg));
        ((TextView) findViewById(R.id.tv_stat_best_day))
            .setText(bestDay == 0 ? "—" : "Day " + bestDay);
        ((TextView) findViewById(R.id.tv_stat_completion))
            .setText(String.valueOf(completion));
        ((TextView) findViewById(R.id.tv_stat_goal))
            .setText(String.valueOf(goal));
    }

}
