package com.example.studylab.ui;

import android.app.DatePickerDialog;
import android.graphics.Paint;
import android.graphics.Typeface;
import android.os.Bundle;
import android.text.TextUtils;
import android.util.TypedValue;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AlertDialog;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.LiveData;
import androidx.lifecycle.Observer;

import com.example.studylab.R;
import com.example.studylab.database.AppDatabase;
import com.example.studylab.database.Assessment;
import com.example.studylab.database.AssessmentRepository;
import com.example.studylab.database.Experiment;
import com.example.studylab.database.StudySession;
import com.example.studylab.database.Task;
import com.example.studylab.database.TaskRepository;
import com.example.studylab.api.SessionManager;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

public class HomeFragment extends Fragment {

    private TextView tvGreeting, tvDate, tvStatus, tvStreak;
    private LinearLayout todoListContainer, doneListContainer, upcomingContainer;
    private TextView tvDoneLabel;
    private ImageView icDoneChevron;
    private TextView tvExperimentName, tvExperimentDay, tvExperimentProgressLabel;
    private Button btnCheckIn;
    private ProgressBar progressExperiment;

    private TaskRepository taskRepo;
    private AssessmentRepository assessmentRepo;

    private LiveData<List<Task>> todayTasksLive;
    private LiveData<List<Assessment>> upcomingLive;

    private boolean doneExpanded = false;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater,
                             @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_home, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View v, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(v, savedInstanceState);

        taskRepo = new TaskRepository(requireContext());
        assessmentRepo = new AssessmentRepository(requireContext());

        tvGreeting               = v.findViewById(R.id.tvGreeting);
        tvDate                   = v.findViewById(R.id.tvDate);
        tvStatus                 = v.findViewById(R.id.tvStatus);
        tvStreak                 = v.findViewById(R.id.tvStreak);
        todoListContainer        = v.findViewById(R.id.todoListContainer);
        doneListContainer        = v.findViewById(R.id.doneListContainer);
        upcomingContainer        = v.findViewById(R.id.upcomingContainer);
        tvDoneLabel              = v.findViewById(R.id.tvDoneLabel);
        icDoneChevron            = v.findViewById(R.id.icDoneChevron);
        tvExperimentName         = v.findViewById(R.id.tvExperimentName);
        tvExperimentDay          = v.findViewById(R.id.tvExperimentDay);
        tvExperimentProgressLabel = v.findViewById(R.id.tvExperimentProgressLabel);
        btnCheckIn               = v.findViewById(R.id.btnCheckIn);
        progressExperiment       = v.findViewById(R.id.progressExperiment);

        v.findViewById(R.id.btnAddTask).setOnClickListener(view -> showAddTaskDialog());
        v.findViewById(R.id.doneHeader).setOnClickListener(view -> toggleDoneSection());

        bindHeader();
        observeTasks();
        observeUpcoming();
        loadStreak();
        loadActiveExperiment();
    }

    @Override
    public void onResume() {
        super.onResume();
        loadStreak();
        loadActiveExperiment();
    }

    private void bindHeader() {
        String fullName = new SessionManager(requireContext()).getName();
        String displayName = (!TextUtils.isEmpty(fullName)) ? fullName.split(" ")[0] : "there";

        Calendar c = Calendar.getInstance();
        int hour = c.get(Calendar.HOUR_OF_DAY);
        String period = hour < 12 ? "Good Morning" : (hour < 17 ? "Good Afternoon" : "Good Evening");
        tvGreeting.setText(period + ", " + displayName + " 👋");
        tvDate.setText(new SimpleDateFormat("EEEE, MMMM d, yyyy", Locale.US).format(c.getTime()));
    }

    // ─── Today's Tasks ──────────────────────────────────────────────────────

    private void observeTasks() {
        long[] range = todayRange();
        todayTasksLive = taskRepo.getTasksForDay(range[0], range[1]);
        todayTasksLive.observe(getViewLifecycleOwner(), this::renderTasks);
    }

    private void renderTasks(List<Task> tasks) {
        todoListContainer.removeAllViews();
        doneListContainer.removeAllViews();

        int pending = 0, done = 0;
        if (tasks != null) {
            for (Task t : tasks) {
                if (t.isCompleted()) done++; else pending++;
            }
            for (Task t : tasks) {
                View row = buildTaskRow(t);
                if (t.isCompleted()) doneListContainer.addView(row);
                else                 todoListContainer.addView(row);
            }
        }

        int total = pending + done;
        tvStatus.setText(done + "/" + total + " Tasks Done");
        tvDoneLabel.setText("Done (" + done + ")");
    }

    private View buildTaskRow(Task task) {
        LinearLayout row = new LinearLayout(requireContext());
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setGravity(android.view.Gravity.CENTER_VERTICAL);
        int pad = dp(14);
        row.setPadding(pad, pad, pad, pad);
        row.setBackgroundResource(R.drawable.bg_cal_card);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        lp.bottomMargin = dp(10);
        row.setLayoutParams(lp);

        ImageView circle = new ImageView(requireContext());
        circle.setLayoutParams(new LinearLayout.LayoutParams(dp(22), dp(22)));
        circle.setImageResource(task.isCompleted() ? R.drawable.ic_check_circle : R.drawable.ic_circle_outline);
        circle.setColorFilter(ContextCompat.getColor(requireContext(),
                task.isCompleted() ? R.color.cal_session_teal : R.color.cal_primary_blue));
        row.addView(circle);

        LinearLayout col = new LinearLayout(requireContext());
        col.setOrientation(LinearLayout.VERTICAL);
        LinearLayout.LayoutParams clp = new LinearLayout.LayoutParams(0, -2, 1f);
        clp.setMarginStart(dp(12));
        col.setLayoutParams(clp);

        TextView title = new TextView(requireContext());
        title.setText(task.getTitle());
        title.setTextSize(15);
        title.setTypeface(null, Typeface.BOLD);
        title.setTextColor(ContextCompat.getColor(requireContext(),
                task.isCompleted() ? R.color.cal_text_muted : R.color.cal_text_primary));
        if (task.isCompleted()) {
            title.setPaintFlags(title.getPaintFlags() | Paint.STRIKE_THRU_TEXT_FLAG);
        }
        col.addView(title);

        if (!TextUtils.isEmpty(task.getDescription())) {
            TextView sub = new TextView(requireContext());
            sub.setText(task.getDescription());
            sub.setTextSize(12);
            sub.setTextColor(ContextCompat.getColor(requireContext(), R.color.cal_text_muted));
            col.addView(sub);
        }
        row.addView(col);

        circle.setOnClickListener(v -> {
            task.setCompleted(!task.isCompleted());
            taskRepo.update(task);
        });
        return row;
    }

    private void toggleDoneSection() {
        doneExpanded = !doneExpanded;
        doneListContainer.setVisibility(doneExpanded ? View.VISIBLE : View.GONE);
        icDoneChevron.setRotation(doneExpanded ? 90 : 0);
    }

    private void showAddTaskDialog() {
        EditText et = new EditText(requireContext());
        et.setHint("Task name");

        FrameWrapper wrap = new FrameWrapper(requireContext(), et);

        new AlertDialog.Builder(requireContext())
                .setTitle("Add Task for Today")
                .setView(wrap)
                .setPositiveButton("Add", (d, w) -> {
                    String title = et.getText().toString().trim();
                    if (title.isEmpty()) return;
                    Task t = new Task();
                    t.setTitle(title);
                    Calendar c = Calendar.getInstance();
                    c.set(Calendar.HOUR_OF_DAY, 23);
                    c.set(Calendar.MINUTE, 59);
                    t.setDueDateMillis(c.getTimeInMillis());
                    t.setCompleted(false);
                    taskRepo.insert(t);
                })
                .setNegativeButton("Cancel", null)
                .show();
    }

    // ─── Upcoming assessments (next 7 days) ─────────────────────────────────

    private void observeUpcoming() {
        Calendar startCal = Calendar.getInstance();
        startCal.add(Calendar.DAY_OF_MONTH, 1);
        startCal.set(Calendar.HOUR_OF_DAY, 0);
        startCal.set(Calendar.MINUTE, 0);
        startCal.set(Calendar.SECOND, 0);
        startCal.set(Calendar.MILLISECOND, 0);

        Calendar endCal = (Calendar) startCal.clone();
        endCal.add(Calendar.DAY_OF_MONTH, 7);

        upcomingLive = assessmentRepo.getAssessmentsInRange(startCal.getTimeInMillis(), endCal.getTimeInMillis());
        upcomingLive.observe(getViewLifecycleOwner(), this::renderUpcoming);
    }

    private void renderUpcoming(List<Assessment> list) {
        upcomingContainer.removeAllViews();
        if (list == null || list.isEmpty()) {
            TextView empty = new TextView(requireContext());
            empty.setText("No upcoming assessments");
            empty.setTextColor(ContextCompat.getColor(requireContext(), R.color.cal_text_muted));
            empty.setPadding(dp(8), dp(8), dp(8), dp(8));
            upcomingContainer.addView(empty);
            return;
        }
        for (Assessment a : list) {
            if (a.isDone) continue;
            upcomingContainer.addView(buildUpcomingCard(a));
        }
    }

    private View buildUpcomingCard(Assessment a) {
        LinearLayout card = new LinearLayout(requireContext());
        card.setOrientation(LinearLayout.VERTICAL);
        int pad = dp(16);
        card.setPadding(pad, pad, pad, pad);
        card.setBackgroundResource(R.drawable.bg_cal_card);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(dp(180), -2);
        lp.setMarginEnd(dp(12));
        card.setLayoutParams(lp);

        long days = (a.dateTimeMillis - System.currentTimeMillis()) / (24L * 60 * 60 * 1000);
        TextView pill = new TextView(requireContext());
        pill.setText("IN " + Math.max(0, days) + " DAY" + (days == 1 ? "" : "S"));
        pill.setTextSize(10);
        pill.setTypeface(null, Typeface.BOLD);
        pill.setTextColor(ContextCompat.getColor(requireContext(), R.color.cal_assessment_orange));
        pill.setBackgroundResource(R.drawable.bg_cal_badge_orange);
        pill.setPadding(dp(8), dp(4), dp(8), dp(4));
        LinearLayout.LayoutParams plp = new LinearLayout.LayoutParams(-2, -2);
        pill.setLayoutParams(plp);
        card.addView(pill);

        TextView title = new TextView(requireContext());
        title.setText(a.title);
        title.setTextSize(15);
        title.setTypeface(null, Typeface.BOLD);
        title.setTextColor(ContextCompat.getColor(requireContext(), R.color.cal_text_primary));
        LinearLayout.LayoutParams tlp = new LinearLayout.LayoutParams(-1, -2);
        tlp.topMargin = dp(8);
        title.setLayoutParams(tlp);
        card.addView(title);

        if (!TextUtils.isEmpty(a.type)) {
            TextView type = new TextView(requireContext());
            type.setText(a.type);
            type.setTextSize(12);
            type.setTextColor(ContextCompat.getColor(requireContext(), R.color.cal_text_muted));
            card.addView(type);
        }
        return card;
    }

    // ─── Streak ─────────────────────────────────────────────────────────────

    private void loadStreak() {
        AppDatabase.databaseWriteExecutor.execute(() -> {
            Calendar cal = Calendar.getInstance();
            cal.set(Calendar.DAY_OF_MONTH, 1);
            cal.add(Calendar.MONTH, -2); // look back ~2 months
            String monthLike = "%";
            // Quick approach: pull all sessions since 2 months back via DAO query
            List<StudySession> sessions = AppDatabase.getInstance(requireContext())
                    .studySessionDao()
                    .getAllSessionsSince(cal.getTimeInMillis());

            Set<String> dates = new HashSet<>();
            if (sessions != null) {
                for (StudySession s : sessions) if (s.date != null) dates.add(s.date);
            }

            SimpleDateFormat fmt = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
            Calendar c = Calendar.getInstance();
            int streak = 0;

            // If today has no session yet, allow grace and start counting from yesterday.
            String today = fmt.format(c.getTime());
            if (!dates.contains(today)) {
                c.add(Calendar.DAY_OF_MONTH, -1);
            }
            // Walk back consecutively while sessions exist.
            while (dates.contains(fmt.format(c.getTime()))) {
                streak++;
                c.add(Calendar.DAY_OF_MONTH, -1);
            }
            int finalStreak = streak;
            requireActivity().runOnUiThread(() ->
                    tvStreak.setText(finalStreak + " Day Streak 🔥"));
        });
    }

    // ─── Active Experiment ──────────────────────────────────────────────────

    private void loadActiveExperiment() {
        AppDatabase.databaseWriteExecutor.execute(() -> {
            Experiment exp = AppDatabase.getInstance(requireContext())
                    .experimentDao().getFirstActiveSync();
            requireActivity().runOnUiThread(() -> renderExperiment(exp));
        });
    }

    private void renderExperiment(Experiment exp) {
        if (exp == null) {
            tvExperimentName.setText("No active sprint");
            tvExperimentDay.setText("Start one in Labs.");
            btnCheckIn.setVisibility(View.GONE);
            progressExperiment.setVisibility(View.GONE);
            tvExperimentProgressLabel.setVisibility(View.GONE);
            return;
        }
        tvExperimentName.setText(exp.name);
        int currentDay = Math.max(1, exp.currentDay);
        int duration = Math.max(1, exp.durationDays);
        tvExperimentDay.setText("Day " + currentDay + " of " + duration);

        progressExperiment.setVisibility(View.VISIBLE);
        progressExperiment.setMax(duration);
        progressExperiment.setProgress(currentDay);

        int pct = (int) ((currentDay / (float) duration) * 100);
        tvExperimentProgressLabel.setVisibility(View.VISIBLE);
        tvExperimentProgressLabel.setText("PROGRESS " + pct + "%");

        boolean checkedInToday = isSameDay(exp.lastCheckInDateMillis, System.currentTimeMillis());
        btnCheckIn.setVisibility(View.VISIBLE);
        if (checkedInToday) {
            btnCheckIn.setText("Checked In ✓");
            btnCheckIn.setEnabled(false);
        } else {
            btnCheckIn.setText("Check In");
            btnCheckIn.setEnabled(true);
            btnCheckIn.setOnClickListener(v -> performCheckIn(exp));
        }
    }

    private void performCheckIn(Experiment exp) {
        AppDatabase.databaseWriteExecutor.execute(() -> {
            int newDay = Math.min(exp.durationDays, Math.max(1, exp.currentDay) + 1);
            AppDatabase.getInstance(requireContext()).experimentDao()
                    .recordCheckIn(exp.id, newDay, System.currentTimeMillis());
            requireActivity().runOnUiThread(() -> {
                Toast.makeText(requireContext(), "Checked in for today", Toast.LENGTH_SHORT).show();
                loadActiveExperiment();
            });
        });
    }

    private boolean isSameDay(long a, long b) {
        if (a == 0) return false;
        Calendar ca = Calendar.getInstance(); ca.setTimeInMillis(a);
        Calendar cb = Calendar.getInstance(); cb.setTimeInMillis(b);
        return ca.get(Calendar.YEAR) == cb.get(Calendar.YEAR)
            && ca.get(Calendar.DAY_OF_YEAR) == cb.get(Calendar.DAY_OF_YEAR);
    }

    // ─── Helpers ────────────────────────────────────────────────────────────

    private long[] todayRange() {
        Calendar c = Calendar.getInstance();
        c.set(Calendar.HOUR_OF_DAY, 0);
        c.set(Calendar.MINUTE, 0);
        c.set(Calendar.SECOND, 0);
        c.set(Calendar.MILLISECOND, 0);
        long start = c.getTimeInMillis();
        c.add(Calendar.DAY_OF_MONTH, 1);
        return new long[]{ start, c.getTimeInMillis() };
    }

    private int dp(int v) {
        return Math.round(TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v,
                getResources().getDisplayMetrics()));
    }

    private static class FrameWrapper extends LinearLayout {
        FrameWrapper(android.content.Context ctx, View child) {
            super(ctx);
            int p = (int) (24 * ctx.getResources().getDisplayMetrics().density);
            setPadding(p, p / 2, p, 0);
            setOrientation(VERTICAL);
            addView(child);
        }
    }
}
