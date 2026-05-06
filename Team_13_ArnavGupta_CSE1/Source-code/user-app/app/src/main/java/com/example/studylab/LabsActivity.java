package com.example.studylab;

import android.app.Dialog;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.text.TextUtils;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;

import java.util.Calendar;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class LabsActivity extends AppCompatActivity {

    // ── Views ──────────────────────────────────────────────────
    private TextView tabExperiments, tabAnalytics, tabDashboard;
    private View     sectionExperiments, sectionAnalytics, sectionDashboard;
    private LinearLayout activeExperimentsContainer;
    private LinearLayout analyticsContainer;
    private LinearLayout dashboardGridContainer;
    private LinearLayout dashboardTimelineContainer;
    private TextView tvRunningBadge;
    private LinearLayout tvActiveEmpty;
    private LinearLayout tvAnalyticsEmpty;
    private TextView tvDashboardEmpty;
    private TextView tvDashMonth;
    private TextView tvDashTotalCheckins;
    private TextView tvDashActiveExps;

    // Month offset for dashboard calendar (0 = current month)
    private int monthOffset = 0;

    // ─────────────────────────────────────────────────────────
    //  Lifecycle
    // ─────────────────────────────────────────────────────────

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_labs);

        // Bind views
        tabExperiments = findViewById(R.id.tab_experiments);
        tabAnalytics   = findViewById(R.id.tab_analytics);
        tabDashboard   = findViewById(R.id.tab_dashboard);

        sectionExperiments = findViewById(R.id.section_experiments);
        sectionAnalytics   = findViewById(R.id.section_analytics);
        sectionDashboard   = findViewById(R.id.section_dashboard);

        activeExperimentsContainer  = findViewById(R.id.active_experiments_container);
        analyticsContainer          = findViewById(R.id.analytics_container);
        dashboardGridContainer      = findViewById(R.id.dashboard_grid_container);
        dashboardTimelineContainer  = findViewById(R.id.dashboard_timeline_container);

        tvRunningBadge       = findViewById(R.id.tv_running_badge);
        tvActiveEmpty        = findViewById(R.id.tv_active_empty);
        tvAnalyticsEmpty     = findViewById(R.id.tv_analytics_empty);
        tvDashboardEmpty     = findViewById(R.id.tv_dashboard_empty);
        tvDashMonth          = findViewById(R.id.tv_dashboard_month);
        tvDashTotalCheckins  = findViewById(R.id.tv_dash_total_checkins);
        tvDashActiveExps     = findViewById(R.id.tv_dash_active_exps);

        // Set legend multi colour
        View legendMulti = findViewById(R.id.legend_multi);
        if (legendMulti != null) {
            GradientDrawable lg = new GradientDrawable();
            lg.setCornerRadius(4 * getResources().getDisplayMetrics().density);
            lg.setColor(0xFF1565C0);
            legendMulti.setBackground(lg);
        }

        // Tab clicks
        tabExperiments.setOnClickListener(v -> switchTab(0));
        tabAnalytics.setOnClickListener(v   -> switchTab(1));
        tabDashboard.setOnClickListener(v   -> switchTab(2));
        switchTab(0);

        // Month nav
        findViewById(R.id.btn_prev_month).setOnClickListener(v -> {
            monthOffset--;
            rebuildDashboard();
        });
        findViewById(R.id.btn_next_month).setOnClickListener(v -> {
            monthOffset++;
            rebuildDashboard();
        });

        // Back button
        View menuBack = findViewById(R.id.menu_back);
        if (menuBack != null) menuBack.setOnClickListener(v -> finish());

        // Bottom nav — uniform handling via helper
        BottomNavHelper.setup(this, "labs");

        // + New Experiment FAB
        View btnNew = findViewById(R.id.btn_new_experiment);
        if (btnNew != null) btnNew.setOnClickListener(v -> showNewExperimentDialog());

        // Initial load
        ExperimentStore.get(this).reload();
        rebuildAll();
    }

    @Override
    protected void onResume() {
        super.onResume();
        // Reload from DB every time we return (e.g. after a check-in)
        ExperimentStore.get(this).reload();
        rebuildAll();
    }

    // ─────────────────────────────────────────────────────────
    //  Rebuild helpers
    // ─────────────────────────────────────────────────────────

    private void rebuildAll() {
        rebuildExperimentCards();
        rebuildAnalytics();
        rebuildDashboard();
    }

    // ─────────────────────────────────────────────────────────
    //  EXPERIMENTS TAB
    // ─────────────────────────────────────────────────────────

    private void rebuildExperimentCards() {
        if (activeExperimentsContainer == null) return;
        activeExperimentsContainer.removeAllViews();

        List<Experiment> exps = ExperimentStore.get(this).getAll();

        boolean empty = exps.isEmpty();
        tvActiveEmpty.setVisibility(empty ? View.VISIBLE : View.GONE);
        tvRunningBadge.setText(exps.size() + " RUNNING");

        for (Experiment exp : exps) {
            activeExperimentsContainer.addView(buildExperimentCard(exp));
        }
    }

    private View buildExperimentCard(Experiment exp) {
        float dp = getResources().getDisplayMetrics().density;

        // Outer card
        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setBackgroundResource(R.drawable.bg_card);
        card.setElevation(2 * dp);
        card.setClipToOutline(true);
        LinearLayout.LayoutParams cardParams = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        cardParams.setMargins(0, 0, 0, (int)(20 * dp));
        card.setLayoutParams(cardParams);

        // Cyan banner with emoji centred
        android.widget.FrameLayout banner = new android.widget.FrameLayout(this);
        banner.setLayoutParams(new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, (int)(72 * dp)));
        banner.setBackgroundResource(R.drawable.bg_gradient_cyan);

        TextView tvIcon = new TextView(this);
        tvIcon.setText(exp.getIcon());
        tvIcon.setTextSize(32);
        android.widget.FrameLayout.LayoutParams iconLp =
            new android.widget.FrameLayout.LayoutParams(
                android.widget.FrameLayout.LayoutParams.WRAP_CONTENT,
                android.widget.FrameLayout.LayoutParams.WRAP_CONTENT);
        iconLp.gravity = Gravity.CENTER;
        tvIcon.setLayoutParams(iconLp);
        banner.addView(tvIcon);

        card.addView(banner);

        // Info section
        LinearLayout info = new LinearLayout(this);
        info.setOrientation(LinearLayout.VERTICAL);
        int pad = (int)(20 * dp);
        info.setPadding(pad, pad, pad, pad);
        card.addView(info);

        // Title
        TextView tvTitle = new TextView(this);
        tvTitle.setText(exp.getTitle());
        tvTitle.setTextSize(17);
        tvTitle.setTextColor(getResources().getColor(R.color.text_primary, getTheme()));
        tvTitle.setTypeface(null, Typeface.BOLD);
        info.addView(tvTitle);

        // Progress label
        int days = exp.getDaysCompleted();
        TextView tvSub = new TextView(this);
        tvSub.setText("Day " + days + " of " + exp.getGoalDays()
            + "  •  Tap \"Check In\" to log today");
        tvSub.setTextSize(13);
        tvSub.setTextColor(getResources().getColor(R.color.text_secondary, getTheme()));
        LinearLayout.LayoutParams subParams = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        subParams.setMargins(0, (int)(4 * dp), 0, (int)(14 * dp));
        tvSub.setLayoutParams(subParams);
        info.addView(tvSub);

        // Button row
        LinearLayout btnRow = new LinearLayout(this);
        btnRow.setOrientation(LinearLayout.HORIZONTAL);
        info.addView(btnRow);

        int btnH    = (int)(48 * dp);
        int gapW    = (int)(8 * dp);

        // Check In button (flex 1)
        TextView btnCheckIn = new TextView(this);
        btnCheckIn.setLayoutParams(new LinearLayout.LayoutParams(0, btnH, 1f));
        btnCheckIn.setBackgroundResource(R.drawable.bg_check_in_btn);
        btnCheckIn.setGravity(Gravity.CENTER);
        btnCheckIn.setText("✓  Check In");
        btnCheckIn.setTextColor(Color.WHITE);
        btnCheckIn.setTextSize(13);
        btnCheckIn.setTypeface(null, Typeface.BOLD);

        // Spacer
        View gap1 = new View(this);
        gap1.setLayoutParams(new LinearLayout.LayoutParams(gapW, 1));

        // Details button (flex 1)
        TextView btnDetails = new TextView(this);
        btnDetails.setLayoutParams(new LinearLayout.LayoutParams(0, btnH, 1f));
        btnDetails.setBackgroundResource(R.drawable.bg_details_btn);
        btnDetails.setGravity(Gravity.CENTER);
        btnDetails.setText("Details");
        btnDetails.setTextColor(getResources().getColor(R.color.text_primary, getTheme()));
        btnDetails.setTextSize(13);
        btnDetails.setTypeface(null, Typeface.BOLD);

        // Spacer
        View gap2 = new View(this);
        gap2.setLayoutParams(new LinearLayout.LayoutParams(gapW, 1));

        // Delete button — fixed width, plain cross
        TextView btnDelete = new TextView(this);
        btnDelete.setLayoutParams(new LinearLayout.LayoutParams(btnH, btnH));
        btnDelete.setBackgroundResource(R.drawable.bg_details_btn);
        btnDelete.setGravity(Gravity.CENTER);
        btnDelete.setText("✕");
        btnDelete.setTextSize(18);
        btnDelete.setTextColor(Color.BLACK);
        btnDelete.setTypeface(null, Typeface.BOLD);

        btnRow.addView(btnCheckIn);
        btnRow.addView(gap1);
        btnRow.addView(btnDetails);
        btnRow.addView(gap2);
        btnRow.addView(btnDelete);

        // ── Click listeners ──────────────────────────────────
        btnCheckIn.setOnClickListener(v -> {
            int idx = ExperimentStore.get(this).getAll().indexOf(exp);
            Intent i = new Intent(this, CheckInActivity.class);
            i.putExtra(CheckInActivity.EXTRA_EXPERIMENT_INDEX, idx);
            startActivity(i);
        });
        btnDetails.setOnClickListener(v -> {
            int idx = ExperimentStore.get(this).getAll().indexOf(exp);
            Intent i = new Intent(this, ExperimentDetailsActivity.class);
            i.putExtra(ExperimentDetailsActivity.EXTRA_EXPERIMENT_INDEX, idx);
            startActivity(i);
        });
        btnDelete.setOnClickListener(v -> {
            new android.app.AlertDialog.Builder(this)
                .setTitle("Delete \"" + exp.getTitle() + "\"?")
                .setMessage("This will permanently delete the experiment and all its check-in history.")
                .setPositiveButton("Delete", (dlg, w) -> {
                    ExperimentStore.get(this).remove(exp);
                    rebuildAll();
                    Toast.makeText(this, "Experiment deleted", Toast.LENGTH_SHORT).show();
                })
                .setNegativeButton("Cancel", null)
                .show();
        });

        return card;
    }

    // ─────────────────────────────────────────────────────────
    //  ANALYTICS TAB
    // ─────────────────────────────────────────────────────────

    private void rebuildAnalytics() {
        if (analyticsContainer == null) return;
        analyticsContainer.removeAllViews();

        List<Experiment> exps = ExperimentStore.get(this).getAll();
        boolean empty = exps.isEmpty();
        tvAnalyticsEmpty.setVisibility(empty ? View.VISIBLE : View.GONE);

        float dp = getResources().getDisplayMetrics().density;

        for (Experiment exp : exps) {
            LinearLayout card = new LinearLayout(this);
            card.setOrientation(LinearLayout.VERTICAL);
            card.setBackgroundResource(R.drawable.bg_card);
            card.setElevation(2 * dp);
            LinearLayout.LayoutParams cardParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
            cardParams.setMargins(0, 0, 0, (int)(16 * dp));
            card.setLayoutParams(cardParams);
            int pad = (int)(20 * dp);
            card.setPadding(pad, pad, pad, pad);

            // Experiment title
            TextView tvTitle = new TextView(this);
            tvTitle.setText(exp.getTitle());
            tvTitle.setTextSize(16);
            tvTitle.setTextColor(getResources().getColor(R.color.text_primary, getTheme()));
            tvTitle.setTypeface(null, Typeface.BOLD);
            LinearLayout.LayoutParams titleParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT);
            titleParams.setMargins(0, 0, 0, (int)(4 * dp));
            tvTitle.setLayoutParams(titleParams);
            card.addView(tvTitle);

            // Stats line
            int days = exp.getDaysCompleted();
            float avg = exp.getOverallAvgScore();
            TextView tvStats = new TextView(this);
            tvStats.setText(days == 0
                ? "No check-ins yet"
                : days + " check-in" + (days == 1 ? "" : "s") + "  •  Avg "
                  + String.format(java.util.Locale.US, "%.1f", avg) + "/10");
            tvStats.setTextSize(12);
            tvStats.setTextColor(getResources().getColor(R.color.text_secondary, getTheme()));
            LinearLayout.LayoutParams statsParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT);
            statsParams.setMargins(0, 0, 0, (int)(14 * dp));
            tvStats.setLayoutParams(statsParams);
            card.addView(tvStats);

            float[] scores = exp.getScoreArray();
            if (scores.length == 0) {
                TextView tvNoData = new TextView(this);
                tvNoData.setText("Complete a check-in to see the avg score graph");
                tvNoData.setTextSize(13);
                tvNoData.setTextColor(getResources().getColor(R.color.text_secondary, getTheme()));
                tvNoData.setGravity(Gravity.CENTER);
                LinearLayout.LayoutParams ep = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT, (int)(80 * dp));
                tvNoData.setLayoutParams(ep);
                card.addView(tvNoData);
            } else {
                // Chart
                FocusEnergyChartView chart = new FocusEnergyChartView(this);
                chart.setData(scores);
                LinearLayout.LayoutParams chartParams = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT, (int)(140 * dp));
                chart.setLayoutParams(chartParams);
                card.addView(chart);

                // Day labels
                LinearLayout labelRow = new LinearLayout(this);
                labelRow.setOrientation(LinearLayout.HORIZONTAL);
                LinearLayout.LayoutParams lrParams = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
                lrParams.setMargins(0, (int)(4 * dp), 0, 0);
                labelRow.setLayoutParams(lrParams);
                for (int i = 0; i < scores.length; i++) {
                    TextView lbl = new TextView(this);
                    lbl.setLayoutParams(new LinearLayout.LayoutParams(0,
                        LinearLayout.LayoutParams.WRAP_CONTENT, 1f));
                    lbl.setText("D" + (i + 1));
                    lbl.setTextColor(getResources().getColor(R.color.text_hint, getTheme()));
                    lbl.setTextSize(9);
                    lbl.setGravity(Gravity.CENTER);
                    labelRow.addView(lbl);
                }
                card.addView(labelRow);
            }

            analyticsContainer.addView(card);
        }
    }

    // ─────────────────────────────────────────────────────────
    //  DASHBOARD TAB — GitHub-style monthly calendar
    // ─────────────────────────────────────────────────────────

    private void rebuildDashboard() {
        if (dashboardGridContainer == null) return;

        // ── Calendar grid ──────────────────────────────────
        List<Long> allDates = ExperimentStore.get(this).getAllCheckInDates();

        // Determine which month/year to display
        Calendar display = Calendar.getInstance();
        display.add(Calendar.MONTH, monthOffset);
        int year  = display.get(Calendar.YEAR);
        int month = display.get(Calendar.MONTH); // 0-indexed

        // Update month label
        String[] monthNames = {"January","February","March","April","May","June",
            "July","August","September","October","November","December"};
        if (tvDashMonth != null) tvDashMonth.setText(monthNames[month] + " " + year);

        // Count check-ins per day of the displayed month
        Map<Integer, Integer> counts = new HashMap<>();
        Calendar cal = Calendar.getInstance();
        for (long ts : allDates) {
            cal.setTimeInMillis(ts);
            if (cal.get(Calendar.YEAR) == year && cal.get(Calendar.MONTH) == month) {
                int day = cal.get(Calendar.DAY_OF_MONTH);
                counts.put(day, counts.getOrDefault(day, 0) + 1);
            }
        }

        // Calendar.DAY_OF_WEEK: 1=Sun, 2=Mon … 7=Sat → Monday-first offset
        Calendar firstOfMonth = Calendar.getInstance();
        firstOfMonth.set(year, month, 1);
        int firstDow = firstOfMonth.get(Calendar.DAY_OF_WEEK); // 1=Sun
        int offset   = (firstDow - 2 + 7) % 7;                 // Mon=0 … Sun=6
        int daysInMonth = firstOfMonth.getActualMaximum(Calendar.DAY_OF_MONTH);

        float dp         = getResources().getDisplayMetrics().density;
        int cellMargin   = (int)(3 * dp);
        int cornerRadius = (int)(6 * dp);

        dashboardGridContainer.removeAllViews();

        int totalCells = offset + daysInMonth;
        int totalRows  = (int) Math.ceil(totalCells / 7.0);

        // Highlight today
        Calendar today = Calendar.getInstance();
        int todayDay   = (today.get(Calendar.YEAR) == year && today.get(Calendar.MONTH) == month)
            ? today.get(Calendar.DAY_OF_MONTH) : -1;

        for (int row = 0; row < totalRows; row++) {
            LinearLayout rowLayout = new LinearLayout(this);
            rowLayout.setOrientation(LinearLayout.HORIZONTAL);
            LinearLayout.LayoutParams rowParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
            rowParams.setMargins(0, 0, 0, cellMargin);
            rowLayout.setLayoutParams(rowParams);

            for (int col = 0; col < 7; col++) {
                int cellIdx = row * 7 + col;
                int dayNum  = cellIdx - offset + 1; // 1-indexed day

                TextView cell = new TextView(this);
                LinearLayout.LayoutParams cp = new LinearLayout.LayoutParams(
                    0, (int)(36 * dp), 1f);
                cp.setMargins(col < 6 ? cellMargin : 0, 0, 0, 0);
                cell.setLayoutParams(cp);
                cell.setGravity(Gravity.CENTER);
                cell.setTextSize(10);

                GradientDrawable gd = new GradientDrawable();
                gd.setCornerRadius(cornerRadius);

                if (dayNum < 1 || dayNum > daysInMonth) {
                    // Out-of-month cell — transparent
                    cell.setBackground(null);
                } else {
                    cell.setText(String.valueOf(dayNum));
                    int count = counts.getOrDefault(dayNum, 0);

                    if (dayNum == todayDay && count == 0) {
                        // Today with no check-in — ring highlight
                        gd.setColor(0xFFE8EBEF);
                        gd.setStroke((int)(2 * dp), 0xFF288BE4);
                        cell.setTextColor(0xFF288BE4);
                        cell.setTypeface(null, Typeface.BOLD);
                    } else if (count == 0) {
                        gd.setColor(0xFFE8EBEF);
                        cell.setTextColor(0xFF8C9BAB);
                    } else if (count == 1) {
                        gd.setColor(0xFFBBDDFF);
                        cell.setTextColor(0xFF1565C0);
                        cell.setTypeface(null, Typeface.BOLD);
                    } else {
                        // 2+ check-ins → darker blue
                        gd.setColor(0xFF1565C0);
                        cell.setTextColor(Color.WHITE);
                        cell.setTypeface(null, Typeface.BOLD);
                    }
                    cell.setBackground(gd);
                }

                rowLayout.addView(cell);
            }
            dashboardGridContainer.addView(rowLayout);
        }

        // ── Stats ──────────────────────────────────────────
        if (tvDashTotalCheckins != null)
            tvDashTotalCheckins.setText(String.valueOf(allDates.size()));
        if (tvDashActiveExps != null)
            tvDashActiveExps.setText(String.valueOf(ExperimentStore.get(this).size()));

        // ── Timeline ───────────────────────────────────────
        rebuildTimeline();
    }

    private void rebuildTimeline() {
        if (dashboardTimelineContainer == null) return;
        dashboardTimelineContainer.removeAllViews();

        List<Experiment> exps = ExperimentStore.get(this).getAll();
        boolean empty = exps.isEmpty();
        if (tvDashboardEmpty != null)
            tvDashboardEmpty.setVisibility(empty ? View.VISIBLE : View.GONE);

        float dp = getResources().getDisplayMetrics().density;

        for (Experiment exp : exps) {
            LinearLayout row = new LinearLayout(this);
            row.setOrientation(LinearLayout.HORIZONTAL);
            row.setBackgroundResource(R.drawable.bg_card);
            row.setGravity(Gravity.CENTER_VERTICAL);
            int pad = (int)(16 * dp);
            row.setPadding(pad, pad, pad, pad);
            row.setElevation(dp);
            LinearLayout.LayoutParams rowParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
            rowParams.setMargins(0, 0, 0, (int)(12 * dp));
            row.setLayoutParams(rowParams);

            // Icon circle
            android.widget.FrameLayout iconBg = new android.widget.FrameLayout(this);
            iconBg.setBackgroundResource(R.drawable.bg_icon_circle);
            iconBg.setLayoutParams(new LinearLayout.LayoutParams((int)(44 * dp), (int)(44 * dp)));
            ImageView icon = new ImageView(this);
            icon.setImageResource(R.drawable.ic_labs_icon);
            android.widget.FrameLayout.LayoutParams iconParams =
                new android.widget.FrameLayout.LayoutParams((int)(24 * dp), (int)(24 * dp));
            iconParams.gravity = Gravity.CENTER;
            icon.setLayoutParams(iconParams);
            iconBg.addView(icon);
            row.addView(iconBg);

            // Text column
            LinearLayout textCol = new LinearLayout(this);
            textCol.setOrientation(LinearLayout.VERTICAL);
            LinearLayout.LayoutParams tcParams = new LinearLayout.LayoutParams(
                0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
            tcParams.setMargins((int)(14 * dp), 0, 0, 0);
            textCol.setLayoutParams(tcParams);

            TextView tvName = new TextView(this);
            tvName.setText(exp.getTitle());
            tvName.setTypeface(null, Typeface.BOLD);
            tvName.setTextColor(getResources().getColor(R.color.text_primary, getTheme()));
            tvName.setTextSize(14);
            textCol.addView(tvName);

            int days = exp.getDaysCompleted();
            int goal = exp.getGoalDays();
            int pct  = goal > 0 ? Math.min(100, days * 100 / goal) : 0;
            TextView tvInfo = new TextView(this);
            tvInfo.setText("Day " + days + " of " + goal + "  •  " + pct + "% complete");
            tvInfo.setTextSize(12);
            tvInfo.setTextColor(getResources().getColor(R.color.text_secondary, getTheme()));
            LinearLayout.LayoutParams infoP = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT);
            infoP.setMargins(0, (int)(4 * dp), 0, 0);
            tvInfo.setLayoutParams(infoP);
            textCol.addView(tvInfo);

            row.addView(textCol);

            // Chevron
            ImageView chevron = new ImageView(this);
            chevron.setImageResource(R.drawable.ic_chevron_down);
            chevron.setRotation(-90);
            LinearLayout.LayoutParams chevP = new LinearLayout.LayoutParams(
                (int)(16 * dp), (int)(16 * dp));
            chevP.setMargins((int)(8 * dp), 0, 0, 0);
            chevron.setLayoutParams(chevP);
            row.addView(chevron);

            // Click → details
            row.setOnClickListener(v -> {
                int idx = ExperimentStore.get(this).getAll().indexOf(exp);
                Intent intent = new Intent(this, ExperimentDetailsActivity.class);
                intent.putExtra(ExperimentDetailsActivity.EXTRA_EXPERIMENT_INDEX, idx);
                startActivity(intent);
            });

            dashboardTimelineContainer.addView(row);
        }
    }

    // ─────────────────────────────────────────────────────────
    //  Tab switching
    // ─────────────────────────────────────────────────────────

    private void switchTab(int tab) {
        sectionExperiments.setVisibility(View.GONE);
        sectionAnalytics.setVisibility(View.GONE);
        sectionDashboard.setVisibility(View.GONE);

        int active   = getResources().getColor(R.color.primary_blue, getTheme());
        int inactive = getResources().getColor(R.color.text_secondary, getTheme());

        tabExperiments.setTextColor(inactive);
        tabAnalytics.setTextColor(inactive);
        tabDashboard.setTextColor(inactive);

        switch (tab) {
            case 0: sectionExperiments.setVisibility(View.VISIBLE); tabExperiments.setTextColor(active); break;
            case 1: sectionAnalytics.setVisibility(View.VISIBLE);   tabAnalytics.setTextColor(active);   break;
            case 2: sectionDashboard.setVisibility(View.VISIBLE);   tabDashboard.setTextColor(active);   break;
        }
    }

    // ─────────────────────────────────────────────────────────
    //  New Experiment Dialog
    // ─────────────────────────────────────────────────────────

    private void showNewExperimentDialog() {
        Dialog dialog = new Dialog(this);
        dialog.requestWindowFeature(Window.FEATURE_NO_TITLE);
        dialog.setContentView(R.layout.dialog_new_experiment);

        if (dialog.getWindow() != null) {
            dialog.getWindow().setBackgroundDrawable(new ColorDrawable(Color.TRANSPARENT));
            int screenH = getResources().getDisplayMetrics().heightPixels;
            dialog.getWindow().setLayout(
                (int)(getResources().getDisplayMetrics().widthPixels * 0.92),
                (int)(screenH * 0.85));   // max 85 % of screen — ScrollView handles the rest
        }

        EditText etTitle    = dialog.findViewById(R.id.et_experiment_title);
        EditText etQ1       = dialog.findViewById(R.id.et_question1);
        EditText etQ2       = dialog.findViewById(R.id.et_question2);
        EditText etQ3       = dialog.findViewById(R.id.et_question3);
        EditText etGoalDays = dialog.findViewById(R.id.et_goal_days);

        // ── Emoji picker ──────────────────────────────────────
        // List of all IDs paired with their emoji
        int[] iconIds = {
            R.id.icon_flask, R.id.icon_muscle, R.id.icon_brain, R.id.icon_bolt,
            R.id.icon_sunrise, R.id.icon_book, R.id.icon_run,
            R.id.icon_sleep, R.id.icon_meditate, R.id.icon_target,
            R.id.icon_timer, R.id.icon_leaf, R.id.icon_bulb, R.id.icon_art
        };

        final String[] selectedIcon = {"◆"}; // default = ◆

        View.OnClickListener iconClick = v -> {
            // Deselect all
            for (int id : iconIds) {
                View btn = dialog.findViewById(id);
                if (btn != null) btn.setBackgroundResource(R.drawable.bg_icon_unselected);
            }
            // Select tapped one
            v.setBackgroundResource(R.drawable.bg_icon_selected);
            selectedIcon[0] = ((TextView) v).getText().toString();
        };

        for (int id : iconIds) {
            View btn = dialog.findViewById(id);
            if (btn != null) btn.setOnClickListener(iconClick);
        }

        dialog.findViewById(R.id.btn_dialog_cancel).setOnClickListener(v -> dialog.dismiss());

        dialog.findViewById(R.id.btn_dialog_create).setOnClickListener(v -> {
            String title   = etTitle.getText().toString().trim();
            String q1      = etQ1.getText().toString().trim();
            String q2      = etQ2.getText().toString().trim();
            String q3      = etQ3.getText().toString().trim();
            String daysStr = etGoalDays.getText().toString().trim();

            if (TextUtils.isEmpty(title))   { etTitle.setError("Enter a title"); return; }
            if (TextUtils.isEmpty(q1))      { etQ1.setError("Required"); return; }
            if (TextUtils.isEmpty(q2))      { etQ2.setError("Required"); return; }
            if (TextUtils.isEmpty(q3))      { etQ3.setError("Required"); return; }
            if (TextUtils.isEmpty(daysStr)) { etGoalDays.setError("Enter number of days"); return; }

            int goalDays;
            try {
                goalDays = Integer.parseInt(daysStr);
                if (goalDays <= 0) throw new NumberFormatException();
            } catch (NumberFormatException e) {
                etGoalDays.setError("Enter a valid number > 0");
                return;
            }

            Experiment exp = new Experiment(title, q1, q2, q3, goalDays, selectedIcon[0]);
            ExperimentStore.get(this).add(exp); // persists to DB
            dialog.dismiss();

            rebuildAll();
            Toast.makeText(this, "\"" + title + "\" created!", Toast.LENGTH_SHORT).show();
        });

        dialog.show();
    }
}
