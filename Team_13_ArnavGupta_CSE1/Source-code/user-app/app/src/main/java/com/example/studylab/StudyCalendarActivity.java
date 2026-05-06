package com.example.studylab;

import android.app.DatePickerDialog;
import android.app.TimePickerDialog;
import android.graphics.Typeface;
import android.os.Bundle;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewTreeObserver;
import android.widget.ArrayAdapter;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.GridLayout;
import android.widget.LinearLayout;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import androidx.lifecycle.LiveData;
import androidx.lifecycle.Observer;

import com.example.studylab.database.Assessment;
import com.example.studylab.database.AssessmentRepository;
import com.example.studylab.database.StudySession;
import com.example.studylab.database.StudySessionRepository;
import com.example.studylab.database.Task;
import com.example.studylab.database.TaskRepository;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public class StudyCalendarActivity extends AppCompatActivity {

    private boolean isHeatmapMode = true;
    private int currentMonth;
    private int currentYear;
    private int selectedDay;

    private final Calendar todayCal = Calendar.getInstance();
    private final int todayDay = todayCal.get(Calendar.DAY_OF_MONTH);
    private final int todayMonth = todayCal.get(Calendar.MONTH);
    private final int todayYear = todayCal.get(Calendar.YEAR);

    private TextView tabHeatmap, tabAssessment, tvMonthYear;
    private GridLayout calendarGrid;
    private LinearLayout dayHeaders, legendHeatmap, legendAssessment;
    private LinearLayout sheetHeatmap, sheetAssessment;
    private LinearLayout heatmapSessionList, assessmentList;
    private TextView tvHeatmapDate, tvHeatmapSubtitle, tvAssessmentDate, tvAssessmentSubtitle;
    private TextView tvTotalStudyTime, tvAvgCompletion;

    private AssessmentRepository assessmentRepo;
    private StudySessionRepository sessionRepo;
    private TaskRepository taskRepo;

    // day-of-month → data
    private final Map<Integer, List<Assessment>> assessmentsMap = new HashMap<>();
    private final Map<Integer, Float> sessionHoursMap = new HashMap<>();
    private final Map<Integer, List<StudySession>> sessionsMap = new HashMap<>();
    private final Map<Integer, List<Task>> tasksMap = new HashMap<>();

    private LiveData<List<Assessment>> assessmentsLiveData;
    private LiveData<List<StudySession>> sessionsLiveData;
    private LiveData<List<Task>> tasksLiveData;
    private final Observer<List<Assessment>> assessmentsObserver = this::onAssessmentsChanged;
    private final Observer<List<StudySession>> sessionsObserver = this::onSessionsChanged;
    private final Observer<List<Task>> tasksObserver = this::onTasksChanged;

    private static final String[] DAY_LABELS = {"MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"};
    private static final String[] ASSESSMENT_TYPES = {"Quiz", "Exam", "Assignment", "Project", "Lab"};
    private static final String[] PRIORITIES = {"High", "Medium", "Low"};

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_study_calendar);

        currentMonth = todayMonth;
        currentYear = todayYear;
        selectedDay = todayDay;

        assessmentRepo = new AssessmentRepository(this);
        sessionRepo = new StudySessionRepository(this);
        taskRepo = new TaskRepository(this);

        tabHeatmap = findViewById(R.id.tabHeatmap);
        tabAssessment = findViewById(R.id.tabAssessment);
        tvMonthYear = findViewById(R.id.tvMonthYear);
        calendarGrid = findViewById(R.id.calendarGrid);
        dayHeaders = findViewById(R.id.dayHeaders);
        legendHeatmap = findViewById(R.id.legendHeatmap);
        legendAssessment = findViewById(R.id.legendAssessment);
        sheetHeatmap = findViewById(R.id.sheetHeatmap);
        sheetAssessment = findViewById(R.id.sheetAssessment);
        heatmapSessionList = findViewById(R.id.heatmapSessionList);
        assessmentList = findViewById(R.id.assessmentList);
        tvHeatmapDate = findViewById(R.id.tvHeatmapDate);
        tvHeatmapSubtitle = findViewById(R.id.tvHeatmapSubtitle);
        tvAssessmentDate = findViewById(R.id.tvAssessmentDate);
        tvAssessmentSubtitle = findViewById(R.id.tvAssessmentSubtitle);
        tvTotalStudyTime = findViewById(R.id.tvTotalStudyTime);
        tvAvgCompletion  = findViewById(R.id.tvAvgCompletion);

        // Set the "Both" legend swatch background programmatically
        View legendBothSwatch = findViewById(R.id.legendBothSwatch);
        if (legendBothSwatch != null) {
            legendBothSwatch.post(() ->
                    legendBothSwatch.setBackground(new CalendarCellBothDrawable(dp(2))));
        }

        View btnAddAssessment = findViewById(R.id.btnAddAssessment);
        View btnAddTask = findViewById(R.id.btnAddTask);
        if (btnAddAssessment != null) btnAddAssessment.setOnClickListener(v ->
                startActivity(new android.content.Intent(this, AssessmentsActivity.class)));
        if (btnAddTask != null) btnAddTask.setOnClickListener(v -> showAddTaskDialog());

        findViewById(R.id.btnBack).setOnClickListener(v -> finish());
        BottomNavHelper.setup(this, "calendar");
        tabHeatmap.setOnClickListener(v -> setMode(true));
        tabAssessment.setOnClickListener(v -> setMode(false));
        findViewById(R.id.btnPrevMonth).setOnClickListener(v -> changeMonth(-1));
        findViewById(R.id.btnNextMonth).setOnClickListener(v -> changeMonth(1));

        updateMonthLabel();
        buildDayHeaders();
        updateSheetHeader();

        calendarGrid.getViewTreeObserver().addOnGlobalLayoutListener(new ViewTreeObserver.OnGlobalLayoutListener() {
            @Override
            public void onGlobalLayout() {
                calendarGrid.getViewTreeObserver().removeOnGlobalLayoutListener(this);
                buildCalendarGrid();
            }
        });

        loadMonthData();
    }

    // ─── Mode ───────────────────────────────────────────────────────────────

    private void setMode(boolean heatmap) {
        isHeatmapMode = heatmap;
        if (heatmap) {
            tabHeatmap.setBackgroundResource(R.drawable.bg_cal_toggle_active);
            tabHeatmap.setTextColor(ContextCompat.getColor(this, R.color.cal_primary_blue));
            tabHeatmap.setElevation(dp(1));
            tabAssessment.setBackground(null);
            tabAssessment.setTextColor(ContextCompat.getColor(this, R.color.cal_text_muted));
            tabAssessment.setElevation(0);
            legendHeatmap.setVisibility(View.VISIBLE);
            legendAssessment.setVisibility(View.GONE);
            sheetHeatmap.setVisibility(View.VISIBLE);
            sheetAssessment.setVisibility(View.GONE);
        } else {
            tabAssessment.setBackgroundResource(R.drawable.bg_cal_toggle_active);
            tabAssessment.setTextColor(ContextCompat.getColor(this, R.color.cal_primary_blue));
            tabAssessment.setElevation(dp(1));
            tabHeatmap.setBackground(null);
            tabHeatmap.setTextColor(ContextCompat.getColor(this, R.color.cal_text_muted));
            tabHeatmap.setElevation(0);
            legendHeatmap.setVisibility(View.GONE);
            legendAssessment.setVisibility(View.VISIBLE);
            sheetHeatmap.setVisibility(View.GONE);
            sheetAssessment.setVisibility(View.VISIBLE);
        }
        buildCalendarGrid();
        refreshBottomSheet();
    }

    // ─── Month navigation ───────────────────────────────────────────────────

    private void changeMonth(int delta) {
        currentMonth += delta;
        if (currentMonth > Calendar.DECEMBER) { currentMonth = Calendar.JANUARY; currentYear++; }
        if (currentMonth < Calendar.JANUARY)  { currentMonth = Calendar.DECEMBER; currentYear--; }
        // Reset to 1st of the new month
        selectedDay = (currentMonth == todayMonth && currentYear == todayYear) ? todayDay : 1;
        updateMonthLabel();
        updateSheetHeader();
        loadMonthData();
    }

    private void updateMonthLabel() {
        Calendar c = Calendar.getInstance();
        c.set(currentYear, currentMonth, 1);
        tvMonthYear.setText(new SimpleDateFormat("MMMM yyyy", Locale.US).format(c.getTime()));
    }

    // ─── Data loading ────────────────────────────────────────────────────────

    private void loadMonthData() {
        if (assessmentsLiveData != null) assessmentsLiveData.removeObserver(assessmentsObserver);
        if (sessionsLiveData != null)    sessionsLiveData.removeObserver(sessionsObserver);
        if (tasksLiveData != null)       tasksLiveData.removeObserver(tasksObserver);

        assessmentsMap.clear();
        sessionHoursMap.clear();
        sessionsMap.clear();
        tasksMap.clear();

        Calendar start = Calendar.getInstance();
        start.set(currentYear, currentMonth, 1, 0, 0, 0);
        start.set(Calendar.MILLISECOND, 0);

        Calendar end = Calendar.getInstance();
        end.set(currentYear, currentMonth, start.getActualMaximum(Calendar.DAY_OF_MONTH), 23, 59, 59);
        end.set(Calendar.MILLISECOND, 999);

        String monthPattern = String.format(Locale.US, "%04d-%02d-%%", currentYear, currentMonth + 1);

        assessmentsLiveData = assessmentRepo.getAssessmentsForMonth(start.getTimeInMillis(), end.getTimeInMillis());
        assessmentsLiveData.observe(this, assessmentsObserver);

        sessionsLiveData = sessionRepo.getAllSessionsForMonth(monthPattern);
        sessionsLiveData.observe(this, sessionsObserver);

        tasksLiveData = taskRepo.getTasksForMonth(start.getTimeInMillis(), end.getTimeInMillis());
        tasksLiveData.observe(this, tasksObserver);
    }

    private void onAssessmentsChanged(List<Assessment> list) {
        assessmentsMap.clear();
        if (list != null) {
            for (Assessment a : list) {
                Calendar c = Calendar.getInstance();
                c.setTimeInMillis(a.dateTimeMillis);
                if (c.get(Calendar.MONTH) == currentMonth && c.get(Calendar.YEAR) == currentYear) {
                    int day = c.get(Calendar.DAY_OF_MONTH);
                    getOrCreate(assessmentsMap, day).add(a);
                }
            }
        }
        buildCalendarGrid();
        refreshBottomSheet();
    }

    private void onSessionsChanged(List<StudySession> list) {
        sessionHoursMap.clear();
        sessionsMap.clear();
        if (list != null) {
            for (StudySession s : list) {
                try {
                    int day = Integer.parseInt(s.date.split("-")[2]);
                    sessionHoursMap.put(day, sessionHoursMap.getOrDefault(day, 0f) + s.durationSeconds / 3600f);
                    getOrCreate(sessionsMap, day).add(s);
                } catch (Exception ignored) {}
            }
        }
        buildCalendarGrid();
        refreshBottomSheet();
        updateStatsCards();
    }

    private void updateStatsCards() {
        if (tvTotalStudyTime == null || tvAvgCompletion == null) return;
        float totalHours = 0f;
        for (float h : sessionHoursMap.values()) totalHours += h;
        int totalMin = Math.round(totalHours * 60);
        tvTotalStudyTime.setText(String.format(Locale.US, "%dh %dm", totalMin / 60, totalMin % 60));

        // Avg. Completion: (days with sessions / days elapsed in displayed month) * 100.
        // For past months use full month length; for current month use days up to today;
        // for future months show 0%.
        boolean isCurrentMonth = (currentMonth == todayMonth && currentYear == todayYear);
        boolean isFutureMonth  = (currentYear > todayYear)
                || (currentYear == todayYear && currentMonth > todayMonth);
        int daysElapsed;
        if (isFutureMonth) {
            daysElapsed = 0;
        } else if (isCurrentMonth) {
            daysElapsed = todayDay;
        } else {
            Calendar c = Calendar.getInstance();
            c.set(currentYear, currentMonth, 1);
            daysElapsed = c.getActualMaximum(Calendar.DAY_OF_MONTH);
        }
        int pct = (daysElapsed > 0)
                ? Math.min(100, Math.round((sessionHoursMap.size() / (float) daysElapsed) * 100f))
                : 0;
        tvAvgCompletion.setText(pct + "%");
    }

    private void onTasksChanged(List<Task> list) {
        tasksMap.clear();
        if (list != null) {
            for (Task t : list) {
                Calendar c = Calendar.getInstance();
                c.setTimeInMillis(t.getDueDateMillis());
                if (c.get(Calendar.MONTH) == currentMonth && c.get(Calendar.YEAR) == currentYear) {
                    int day = c.get(Calendar.DAY_OF_MONTH);
                    getOrCreate(tasksMap, day).add(t);
                }
            }
        }
        buildCalendarGrid();
        refreshBottomSheet();
    }

    private <V> List<V> getOrCreate(Map<Integer, List<V>> map, int key) {
        if (!map.containsKey(key)) map.put(key, new ArrayList<>());
        return map.get(key);
    }

    // ─── Calendar grid ───────────────────────────────────────────────────────

    private void buildDayHeaders() {
        dayHeaders.removeAllViews();
        for (String label : DAY_LABELS) {
            TextView tv = new TextView(this);
            tv.setLayoutParams(new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f));
            tv.setGravity(Gravity.CENTER);
            tv.setText(label);
            tv.setTextSize(TypedValue.COMPLEX_UNIT_SP, 10);
            tv.setTextColor(ContextCompat.getColor(this, R.color.cal_text_disabled));
            tv.setTypeface(null, Typeface.BOLD);
            tv.setLetterSpacing(0.1f);
            dayHeaders.addView(tv);
        }
    }

    private List<CalendarDayModel> buildCalendarData() {
        List<CalendarDayModel> days = new ArrayList<>();
        Calendar cal = Calendar.getInstance();
        cal.set(currentYear, currentMonth, 1);
        int dow = cal.get(Calendar.DAY_OF_WEEK);
        int offset = (dow == Calendar.SUNDAY) ? 6 : dow - Calendar.MONDAY;
        int daysInMonth = cal.getActualMaximum(Calendar.DAY_OF_MONTH);

        cal.add(Calendar.MONTH, -1);
        int prevDays = cal.getActualMaximum(Calendar.DAY_OF_MONTH);
        for (int i = offset - 1; i >= 0; i--) {
            days.add(new CalendarDayModel(prevDays - i, false, CalendarDayModel.CellType.OUTSIDE_MONTH, 0));
        }

        boolean isTodayMonth = (currentMonth == todayMonth && currentYear == todayYear);
        for (int d = 1; d <= daysInMonth; d++) {
            float hours = sessionHoursMap.getOrDefault(d, 0f);
            boolean hasAssessment = assessmentsMap.containsKey(d);
            boolean hasSession    = sessionsMap.containsKey(d);
            boolean hasTask       = tasksMap.containsKey(d);
            boolean isToday       = isTodayMonth && d == todayDay;

            CalendarDayModel.CellType type;
            if (isToday) {
                type = CalendarDayModel.CellType.TODAY;
            } else if (hasAssessment && hasTask) {
                type = CalendarDayModel.CellType.BOTH;
            } else if (hasAssessment) {
                type = CalendarDayModel.CellType.ASSESSMENT;
            } else if (hasTask) {
                type = CalendarDayModel.CellType.TASK;
            } else {
                type = CalendarDayModel.CellType.NORMAL;
            }
            days.add(new CalendarDayModel(d, true, type, hours));
        }

        int rem = days.size() % 7;
        if (rem > 0) {
            for (int i = 1; i <= 7 - rem; i++) {
                days.add(new CalendarDayModel(i, false, CalendarDayModel.CellType.OUTSIDE_MONTH, 0));
            }
        }
        return days;
    }

    private void buildCalendarGrid() {
        calendarGrid.removeAllViews();
        List<CalendarDayModel> days = buildCalendarData();
        calendarGrid.setRowCount(days.size() / 7);

        int gridWidth = calendarGrid.getWidth();
        if (gridWidth == 0) gridWidth = getResources().getDisplayMetrics().widthPixels - dp(80);
        int gap = dp(4);
        int cellSize = (gridWidth - 6 * gap) / 7;

        for (int i = 0; i < days.size(); i++) {
            CalendarDayModel day = days.get(i);
            View cell = LayoutInflater.from(this).inflate(R.layout.item_calendar_day, calendarGrid, false);
            TextView tv = cell.findViewById(R.id.day_number_text_view);
            View dot = cell.findViewById(R.id.assessment_dot_view);

            GridLayout.LayoutParams params = new GridLayout.LayoutParams();
            params.width = cellSize;
            params.height = cellSize;
            params.rowSpec = GridLayout.spec(i / 7);
            params.columnSpec = GridLayout.spec(i % 7);
            params.setMargins(i % 7 == 0 ? 0 : gap / 2, i < 7 ? 0 : gap,
                    i % 7 == 6 ? 0 : gap / 2, 0);
            cell.setLayoutParams(params);

            tv.setVisibility(View.VISIBLE);
            tv.setText(String.valueOf(day.getDayNumber()));

            if (isHeatmapMode) {
                dot.setVisibility(View.GONE);
                applyHeatmapStyle(cell, tv, day);
            } else {
                applyAssessmentCellStyle(cell, tv, dot, day);
            }

            // Dim selected day as a subtle selection indicator
            cell.setAlpha(day.isCurrentMonth() && day.getDayNumber() == selectedDay ? 0.75f : 1.0f);

            if (day.isCurrentMonth()) {
                final int dayNum = day.getDayNumber();
                cell.setOnClickListener(v -> {
                    selectedDay = dayNum;
                    buildCalendarGrid();
                    updateSheetHeader();
                    refreshBottomSheet();
                });
            }
            calendarGrid.addView(cell);
        }
    }

    private void applyHeatmapStyle(View cell, TextView tv, CalendarDayModel day) {
        if (!day.isCurrentMonth()) {
            cell.setBackgroundResource(R.drawable.bg_cal_heat_0);
            tv.setTextColor(ContextCompat.getColor(this, R.color.cal_text_light));
        } else if (day.getCellType() == CalendarDayModel.CellType.TODAY) {
            cell.setBackgroundResource(R.drawable.bg_cal_heat_today);
            tv.setTextColor(0xFFFFFFFF);
        } else {
            cell.setBackgroundResource(getHeatmapDrawable(day.getStudyHours()));
            // Use white text on dark heat levels (3+), dark text otherwise
            tv.setTextColor(day.getStudyHours() >= 3
                    ? 0xFFFFFFFF
                    : ContextCompat.getColor(this, R.color.cal_text_primary));
        }
    }

    private void applyAssessmentCellStyle(View cell, TextView tv, View dot, CalendarDayModel day) {
        if (!day.isCurrentMonth()) {
            cell.setBackgroundResource(R.drawable.bg_cal_cell_outside);
            tv.setTextColor(ContextCompat.getColor(this, R.color.cal_text_light));
            dot.setVisibility(View.GONE);
            return;
        }
        switch (day.getCellType()) {
            case ASSESSMENT:
                cell.setBackgroundResource(R.drawable.bg_cal_cell_assessment);
                tv.setTextColor(0xFFFFFFFF);
                dot.setVisibility(View.GONE);
                break;
            case TASK:
                cell.setBackgroundResource(R.drawable.bg_cal_cell_task);
                tv.setTextColor(0xFFFFFFFF);
                dot.setVisibility(View.GONE);
                break;
            case SESSION:
                cell.setBackgroundResource(R.drawable.bg_cal_cell_session);
                tv.setTextColor(0xFFFFFFFF);
                dot.setVisibility(View.GONE);
                break;
            case BOTH:
                cell.setBackground(new CalendarCellBothDrawable(dp(8)));
                tv.setTextColor(0xFFFFFFFF);
                dot.setVisibility(View.GONE);
                break;
            case TODAY:
                cell.setBackgroundResource(R.drawable.bg_cal_cell_today);
                tv.setTextColor(ContextCompat.getColor(this, R.color.cal_text_primary));
                dot.setVisibility(tasksMap.containsKey(day.getDayNumber()) ? View.VISIBLE : View.GONE);
                break;
            default:
                cell.setBackgroundResource(R.drawable.bg_cal_cell_default);
                tv.setTextColor(ContextCompat.getColor(this, R.color.cal_text_primary));
                // Show dot for days that only have tasks
                dot.setVisibility(tasksMap.containsKey(day.getDayNumber()) ? View.VISIBLE : View.GONE);
                break;
        }
    }

    private int getHeatmapDrawable(float hours) {
        if (hours <= 0) return R.drawable.bg_cal_heat_0;
        if (hours < 1)  return R.drawable.bg_cal_heat_1;
        if (hours < 2)  return R.drawable.bg_cal_heat_2;
        if (hours < 3)  return R.drawable.bg_cal_heat_3;
        if (hours < 4)  return R.drawable.bg_cal_heat_4;
        if (hours < 5)  return R.drawable.bg_cal_heat_5;
        return R.drawable.bg_cal_heat_6;
    }

    // ─── Bottom sheet ────────────────────────────────────────────────────────

    private void updateSheetHeader() {
        String dateStr = getDateString(selectedDay);
        tvHeatmapDate.setText(dateStr);
        tvAssessmentDate.setText(dateStr);
    }

    private void refreshBottomSheet() {
        if (isHeatmapMode) refreshHeatmapSheet();
        else               refreshAssessmentSheet();
    }

    private void refreshHeatmapSheet() {
        heatmapSessionList.removeAllViews();
        List<StudySession> sessions = sessionsMap.getOrDefault(selectedDay, new ArrayList<>());
        List<Task> tasks = tasksMap.getOrDefault(selectedDay, new ArrayList<>());

        float totalHours = sessionHoursMap.getOrDefault(selectedDay, 0f);
        int totalMin = Math.round(totalHours * 60);
        if (sessions.isEmpty() && tasks.isEmpty()) {
            tvHeatmapSubtitle.setText("No activity on this day");
            heatmapSessionList.addView(emptyView("No sessions or tasks scheduled"));
        } else {
            tvHeatmapSubtitle.setText(String.format(Locale.US,
                    "%d session%s • %dh %dm",
                    sessions.size(), sessions.size() == 1 ? "" : "s",
                    totalMin / 60, totalMin % 60));
            for (StudySession s : sessions) heatmapSessionList.addView(buildSessionCard(s));
            for (Task t : tasks)           heatmapSessionList.addView(buildTaskCard(t));
        }
    }

    private void refreshAssessmentSheet() {
        assessmentList.removeAllViews();
        List<Assessment> assessments = assessmentsMap.getOrDefault(selectedDay, new ArrayList<>());
        List<Task> tasks = tasksMap.getOrDefault(selectedDay, new ArrayList<>());

        int total = assessments.size() + tasks.size();
        tvAssessmentSubtitle.setText(total == 0 ? "Nothing due"
                : String.format(Locale.US, "%d item%s due", total, total == 1 ? "" : "s"));

        if (assessments.isEmpty() && tasks.isEmpty()) {
            assessmentList.addView(emptyView("Nothing scheduled for this day"));
        } else {
            for (Assessment a : assessments) assessmentList.addView(buildAssessmentCard(a));
            for (Task t : tasks)             assessmentList.addView(buildTaskCard(t));
        }
    }

    // ─── Card builders ───────────────────────────────────────────────────────

    private View buildSessionCard(StudySession session) {
        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.HORIZONTAL);
        card.setBackgroundResource(R.drawable.bg_cal_session_card);
        int p = dp(12);
        card.setPadding(p, p, p, p);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(-1, -2);
        lp.bottomMargin = dp(10);
        card.setLayoutParams(lp);

        View bar = new View(this);
        bar.setLayoutParams(new LinearLayout.LayoutParams(dp(4), LinearLayout.LayoutParams.MATCH_PARENT));
        bar.setBackgroundColor(ContextCompat.getColor(this, R.color.cal_primary_blue));
        card.addView(bar);

        LinearLayout content = new LinearLayout(this);
        content.setOrientation(LinearLayout.VERTICAL);
        LinearLayout.LayoutParams clp = new LinearLayout.LayoutParams(0, -2, 1f);
        clp.setMarginStart(dp(12));
        content.setLayoutParams(clp);

        int totalMin = Math.max(0, session.durationSeconds) / 60;
        String durationStr = String.format(Locale.US, "%dh %dm", totalMin / 60, totalMin % 60);

        SimpleDateFormat timeFmt = new SimpleDateFormat("hh:mm a", Locale.US);
        String timeStr = "—";
        if (session.startTime > 0) {
            Calendar c = Calendar.getInstance();
            c.setTimeInMillis(session.startTime);
            timeStr = timeFmt.format(c.getTime());
        }

        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setGravity(Gravity.CENTER_VERTICAL);
        TextView tvTime = makeText(timeStr, 14, true, R.color.cal_primary_blue);
        tvTime.setLayoutParams(new LinearLayout.LayoutParams(0, -2, 1f));
        row.addView(tvTime);
        row.addView(makeText(durationStr, 12, false, R.color.cal_text_muted));
        content.addView(row);
        content.addView(makeText("Study session", 13, false, R.color.cal_text_secondary));
        card.addView(content);
        return card;
    }

    private View buildTaskCard(Task task) {
        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.HORIZONTAL);
        card.setGravity(Gravity.CENTER_VERTICAL);
        card.setBackgroundResource(R.drawable.bg_cal_session_card);
        int p = dp(12);
        card.setPadding(p, p, p, p);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(-1, -2);
        lp.bottomMargin = dp(10);
        card.setLayoutParams(lp);

        View circle = new View(this);
        circle.setLayoutParams(new LinearLayout.LayoutParams(dp(20), dp(20)));
        circle.setBackgroundResource(R.drawable.bg_cal_circle_border);
        card.addView(circle);

        LinearLayout content = new LinearLayout(this);
        content.setOrientation(LinearLayout.VERTICAL);
        LinearLayout.LayoutParams clp = new LinearLayout.LayoutParams(0, -2, 1f);
        clp.setMarginStart(dp(12));
        content.setLayoutParams(clp);
        content.addView(makeText(task.getTitle(), 14, true, R.color.cal_text_primary));
        if (task.getDescription() != null && !task.getDescription().isEmpty()) {
            content.addView(makeText(task.getDescription(), 12, false, R.color.cal_text_secondary));
        }
        card.addView(content);

        if (task.getPriority() != null && !task.getPriority().isEmpty()) {
            TextView badge = new TextView(this);
            badge.setText(task.getPriority().toUpperCase());
            badge.setTextSize(TypedValue.COMPLEX_UNIT_SP, 10);
            badge.setTypeface(null, Typeface.BOLD);
            int colorRes = "High".equals(task.getPriority())
                    ? R.color.cal_assessment_orange : R.color.cal_text_muted;
            badge.setTextColor(ContextCompat.getColor(this, colorRes));
            badge.setBackgroundResource(R.drawable.bg_cal_badge_priority);
            badge.setPadding(dp(8), dp(4), dp(8), dp(4));
            card.addView(badge);
        }
        return card;
    }

    private View buildAssessmentCard(Assessment assessment) {
        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.HORIZONTAL);
        card.setBackgroundResource(R.drawable.bg_cal_session_card);
        int p = dp(12);
        card.setPadding(p, p, p, p);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(-1, -2);
        lp.bottomMargin = dp(10);
        card.setLayoutParams(lp);

        View bar = new View(this);
        bar.setLayoutParams(new LinearLayout.LayoutParams(dp(4), LinearLayout.LayoutParams.MATCH_PARENT));
        bar.setBackgroundColor(ContextCompat.getColor(this, R.color.cal_assessment_orange));
        card.addView(bar);

        LinearLayout content = new LinearLayout(this);
        content.setOrientation(LinearLayout.VERTICAL);
        LinearLayout.LayoutParams clp = new LinearLayout.LayoutParams(0, -2, 1f);
        clp.setMarginStart(dp(12));
        content.setLayoutParams(clp);

        SimpleDateFormat timeFmt = new SimpleDateFormat("hh:mm a", Locale.US);
        Calendar ac = Calendar.getInstance();
        ac.setTimeInMillis(assessment.dateTimeMillis);
        String timeStr = timeFmt.format(ac.getTime());

        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setGravity(Gravity.CENTER_VERTICAL);
        TextView tvTitle = makeText(assessment.title, 14, true, R.color.cal_text_primary);
        tvTitle.setLayoutParams(new LinearLayout.LayoutParams(0, -2, 1f));
        row.addView(tvTitle);
        row.addView(makeText(timeStr, 12, false, R.color.cal_text_muted));
        content.addView(row);

        if (assessment.type != null && !assessment.type.isEmpty()) {
            TextView typeBadge = new TextView(this);
            typeBadge.setText(assessment.type.toUpperCase());
            typeBadge.setTextSize(TypedValue.COMPLEX_UNIT_SP, 10);
            typeBadge.setTypeface(null, Typeface.BOLD);
            typeBadge.setTextColor(ContextCompat.getColor(this, R.color.cal_assessment_orange));
            typeBadge.setBackgroundResource(R.drawable.bg_cal_badge_orange);
            typeBadge.setPadding(dp(6), dp(2), dp(6), dp(2));
            LinearLayout.LayoutParams blp = new LinearLayout.LayoutParams(-2, -2);
            blp.topMargin = dp(4);
            typeBadge.setLayoutParams(blp);
            content.addView(typeBadge);
        }
        card.addView(content);
        return card;
    }

    private View emptyView(String message) {
        TextView tv = makeText(message, 14, false, R.color.cal_text_muted);
        tv.setGravity(Gravity.CENTER);
        tv.setLayoutParams(new LinearLayout.LayoutParams(-1, dp(60)));
        return tv;
    }

    // ─── Add dialogs ─────────────────────────────────────────────────────────

    private void showAddAssessmentDialog() {
        View dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_add_assessment, null);
        EditText etTitle   = dialogView.findViewById(R.id.et_title);
        Spinner spinnerType = dialogView.findViewById(R.id.spinner_type);
        TextView tvDate    = dialogView.findViewById(R.id.tv_date);
        TextView tvTime    = dialogView.findViewById(R.id.tv_time);
        EditText etNotes   = dialogView.findViewById(R.id.et_notes);

        ArrayAdapter<String> typeAdapter = new ArrayAdapter<>(this,
                android.R.layout.simple_spinner_item, ASSESSMENT_TYPES);
        typeAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        spinnerType.setAdapter(typeAdapter);

        final Calendar selCal = Calendar.getInstance();
        selCal.set(currentYear, currentMonth, selectedDay, 9, 0, 0);
        selCal.set(Calendar.MILLISECOND, 0);

        final SimpleDateFormat dateFmt = new SimpleDateFormat("MMM d, yyyy", Locale.US);
        final SimpleDateFormat timeFmt = new SimpleDateFormat("hh:mm a", Locale.US);
        tvDate.setText(dateFmt.format(selCal.getTime()));
        tvTime.setText(timeFmt.format(selCal.getTime()));

        tvDate.setOnClickListener(v -> new DatePickerDialog(this, (dp, y, m, d) -> {
            selCal.set(y, m, d);
            tvDate.setText(dateFmt.format(selCal.getTime()));
        }, selCal.get(Calendar.YEAR), selCal.get(Calendar.MONTH), selCal.get(Calendar.DAY_OF_MONTH)).show());

        tvTime.setOnClickListener(v -> new TimePickerDialog(this, (tp, h, min) -> {
            selCal.set(Calendar.HOUR_OF_DAY, h);
            selCal.set(Calendar.MINUTE, min);
            tvTime.setText(timeFmt.format(selCal.getTime()));
        }, selCal.get(Calendar.HOUR_OF_DAY), selCal.get(Calendar.MINUTE), false).show());

        AlertDialog dialog = new AlertDialog.Builder(this)
                .setTitle("Add Assessment")
                .setView(dialogView)
                .setPositiveButton("Save", null)
                .setNegativeButton("Cancel", null)
                .create();
        dialog.show();
        dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(v -> {
            String title = etTitle.getText().toString().trim();
            if (title.isEmpty()) { etTitle.setError("Required"); return; }

            Assessment a = new Assessment();
            a.setTitle(title);
            a.setType((String) spinnerType.getSelectedItem());
            a.setDateTimeMillis(selCal.getTimeInMillis());
            a.setNotes(etNotes.getText().toString().trim());
            assessmentRepo.insert(a);
            Toast.makeText(this, "Assessment saved", Toast.LENGTH_SHORT).show();
            dialog.dismiss();
        });
    }

    private void showAddTaskDialog() {
        View dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_add_task, null);
        EditText etTitle       = dialogView.findViewById(R.id.et_title);
        EditText etDescription = dialogView.findViewById(R.id.et_description);
        TextView tvDueDate     = dialogView.findViewById(R.id.tv_due_date);
        Spinner spinnerPriority = dialogView.findViewById(R.id.spinner_priority);

        ArrayAdapter<String> priorityAdapter = new ArrayAdapter<>(this,
                android.R.layout.simple_spinner_item, PRIORITIES);
        priorityAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        spinnerPriority.setAdapter(priorityAdapter);

        final Calendar selCal = Calendar.getInstance();
        selCal.set(currentYear, currentMonth, selectedDay, 23, 59, 0);
        selCal.set(Calendar.MILLISECOND, 0);

        final SimpleDateFormat dateFmt = new SimpleDateFormat("MMM d, yyyy", Locale.US);
        tvDueDate.setText(dateFmt.format(selCal.getTime()));

        tvDueDate.setOnClickListener(v -> new DatePickerDialog(this, (dp, y, m, d) -> {
            selCal.set(y, m, d);
            tvDueDate.setText(dateFmt.format(selCal.getTime()));
        }, selCal.get(Calendar.YEAR), selCal.get(Calendar.MONTH), selCal.get(Calendar.DAY_OF_MONTH)).show());

        AlertDialog dialog = new AlertDialog.Builder(this)
                .setTitle("Add Task")
                .setView(dialogView)
                .setPositiveButton("Save", null)
                .setNegativeButton("Cancel", null)
                .create();
        dialog.show();
        dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(v -> {
            String title = etTitle.getText().toString().trim();
            if (title.isEmpty()) { etTitle.setError("Required"); return; }

            Task t = new Task();
            t.setTitle(title);
            t.setDescription(etDescription.getText().toString().trim());
            t.setDueDateMillis(selCal.getTimeInMillis());
            t.setPriority((String) spinnerPriority.getSelectedItem());
            t.setCompleted(false);
            taskRepo.insert(t);
            Toast.makeText(this, "Task saved", Toast.LENGTH_SHORT).show();
            dialog.dismiss();
        });
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private TextView makeText(String text, int sizeSp, boolean bold, int colorRes) {
        TextView tv = new TextView(this);
        tv.setText(text);
        tv.setTextSize(TypedValue.COMPLEX_UNIT_SP, sizeSp);
        if (bold) tv.setTypeface(null, Typeface.BOLD);
        tv.setTextColor(ContextCompat.getColor(this, colorRes));
        return tv;
    }

    private String getDateString(int day) {
        Calendar c = Calendar.getInstance();
        c.set(currentYear, currentMonth, day);
        return new SimpleDateFormat("MMMM d, yyyy", Locale.US).format(c.getTime());
    }

    private int dp(int val) {
        return Math.round(TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, val,
                getResources().getDisplayMetrics()));
    }
}
