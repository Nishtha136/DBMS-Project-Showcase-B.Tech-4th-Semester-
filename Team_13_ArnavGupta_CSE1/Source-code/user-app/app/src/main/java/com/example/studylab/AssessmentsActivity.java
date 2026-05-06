package com.example.studylab;

import android.app.DatePickerDialog;
import android.app.TimePickerDialog;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Typeface;
import android.os.Bundle;
import android.text.TextUtils;
import android.util.TypedValue;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import androidx.lifecycle.LiveData;
import androidx.lifecycle.Observer;
import androidx.recyclerview.widget.ItemTouchHelper;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.studylab.database.Assessment;
import com.example.studylab.database.AssessmentRepository;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;
import java.util.Locale;

public class AssessmentsActivity extends AppCompatActivity {

    private enum Filter { ALL, WEEK, MONTH, SCHEDULED }

    private static final String[] ASSESSMENT_TYPES = {"Quiz", "Midterm", "Assignment", "Project"};

    private AssessmentRepository repo;
    private RecyclerView recycler;
    private AssessmentsAdapter adapter;
    private final List<Assessment> data = new ArrayList<>();

    private Filter currentFilter = Filter.ALL;
    private TextView chipAll, chipWeek, chipMonth, chipScheduled;

    private LiveData<List<Assessment>> currentLive;
    private final Observer<List<Assessment>> dataObserver = this::onDataChanged;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_assessments);

        repo = new AssessmentRepository(this);

        chipAll       = findViewById(R.id.chipAll);
        chipWeek      = findViewById(R.id.chipWeek);
        chipMonth     = findViewById(R.id.chipMonth);
        chipScheduled = findViewById(R.id.chipScheduled);

        chipAll.setOnClickListener(v -> setFilter(Filter.ALL));
        chipWeek.setOnClickListener(v -> setFilter(Filter.WEEK));
        chipMonth.setOnClickListener(v -> setFilter(Filter.MONTH));
        chipScheduled.setOnClickListener(v -> setFilter(Filter.SCHEDULED));

        findViewById(R.id.btnBack).setOnClickListener(v -> finish());
        findViewById(R.id.btnFabAdd).setOnClickListener(v -> showAddDialog());

        recycler = findViewById(R.id.recyclerAssessments);
        recycler.setLayoutManager(new LinearLayoutManager(this));
        adapter = new AssessmentsAdapter();
        recycler.setAdapter(adapter);

        attachSwipeToDelete();
        setFilter(Filter.ALL);
    }

    private void setFilter(Filter f) {
        currentFilter = f;

        styleChip(chipAll,       f == Filter.ALL);
        styleChip(chipWeek,      f == Filter.WEEK);
        styleChip(chipMonth,     f == Filter.MONTH);
        styleChip(chipScheduled, f == Filter.SCHEDULED);

        if (currentLive != null) currentLive.removeObserver(dataObserver);

        Calendar c = Calendar.getInstance();
        c.set(Calendar.HOUR_OF_DAY, 0);
        c.set(Calendar.MINUTE, 0);
        c.set(Calendar.SECOND, 0);
        c.set(Calendar.MILLISECOND, 0);
        long startToday = c.getTimeInMillis();

        switch (f) {
            case WEEK: {
                Calendar end = (Calendar) c.clone();
                end.add(Calendar.DAY_OF_MONTH, 7);
                currentLive = repo.getAssessmentsInRange(startToday, end.getTimeInMillis());
                break;
            }
            case MONTH: {
                Calendar end = (Calendar) c.clone();
                end.set(Calendar.DAY_OF_MONTH, 1);
                end.add(Calendar.MONTH, 1);
                Calendar start = (Calendar) c.clone();
                start.set(Calendar.DAY_OF_MONTH, 1);
                currentLive = repo.getAssessmentsInRange(start.getTimeInMillis(), end.getTimeInMillis());
                break;
            }
            case SCHEDULED:
            case ALL:
            default:
                currentLive = repo.getAllAssessments();
                break;
        }
        currentLive.observe(this, dataObserver);
    }

    private void styleChip(TextView chip, boolean active) {
        chip.setBackgroundResource(active ? R.drawable.bg_chip_active : R.drawable.bg_chip_inactive);
        chip.setTextColor(active
                ? 0xFFFFFFFF
                : ContextCompat.getColor(this, R.color.cal_text_primary));
        chip.setTypeface(null, active ? Typeface.BOLD : Typeface.NORMAL);
    }

    private void onDataChanged(List<Assessment> list) {
        data.clear();
        if (list != null) {
            if (currentFilter == Filter.SCHEDULED) {
                for (Assessment a : list) if (!a.isDone) data.add(a);
            } else {
                data.addAll(list);
            }
        }
        adapter.notifyDataSetChanged();
    }

    private void attachSwipeToDelete() {
        ItemTouchHelper.SimpleCallback cb = new ItemTouchHelper.SimpleCallback(0, ItemTouchHelper.LEFT) {
            @Override
            public boolean onMove(@NonNull RecyclerView rv, @NonNull RecyclerView.ViewHolder vh,
                                  @NonNull RecyclerView.ViewHolder target) { return false; }

            @Override
            public void onSwiped(@NonNull RecyclerView.ViewHolder vh, int direction) {
                int pos = vh.getAdapterPosition();
                if (pos == RecyclerView.NO_POSITION || pos >= data.size()) return;
                Assessment a = data.get(pos);
                repo.delete(a);
                Toast.makeText(AssessmentsActivity.this, "Deleted '" + a.title + "'", Toast.LENGTH_SHORT).show();
            }

            @Override
            public void onChildDraw(@NonNull Canvas c, @NonNull RecyclerView rv,
                                    @NonNull RecyclerView.ViewHolder vh,
                                    float dX, float dY, int actionState, boolean isCurrentlyActive) {
                View fg = vh.itemView.findViewById(R.id.foreground);
                if (fg != null) fg.setTranslationX(dX);
                else super.onChildDraw(c, rv, vh, dX, dY, actionState, isCurrentlyActive);
            }

            @Override
            public void clearView(@NonNull RecyclerView rv, @NonNull RecyclerView.ViewHolder vh) {
                View fg = vh.itemView.findViewById(R.id.foreground);
                if (fg != null) fg.setTranslationX(0);
                super.clearView(rv, vh);
            }
        };
        new ItemTouchHelper(cb).attachToRecyclerView(recycler);
    }

    private void showAddDialog() {
        View dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_add_assessment, null);
        EditText etTitle = dialogView.findViewById(R.id.et_title);
        Spinner spinnerType = dialogView.findViewById(R.id.spinner_type);
        TextView tvDate = dialogView.findViewById(R.id.tv_date);
        TextView tvTime = dialogView.findViewById(R.id.tv_time);
        EditText etNotes = dialogView.findViewById(R.id.et_notes);

        ArrayAdapter<String> typeAdapter = new ArrayAdapter<>(this,
                android.R.layout.simple_spinner_item, ASSESSMENT_TYPES);
        typeAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        spinnerType.setAdapter(typeAdapter);

        final Calendar selCal = Calendar.getInstance();
        selCal.add(Calendar.DAY_OF_MONTH, 1);
        selCal.set(Calendar.HOUR_OF_DAY, 9);
        selCal.set(Calendar.MINUTE, 0);

        SimpleDateFormat dateFmt = new SimpleDateFormat("MMM d, yyyy", Locale.US);
        SimpleDateFormat timeFmt = new SimpleDateFormat("hh:mm a", Locale.US);
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
            a.setDone(false);
            repo.insert(a);
            Toast.makeText(this, "Assessment saved", Toast.LENGTH_SHORT).show();
            dialog.dismiss();
        });
    }

    private class AssessmentsAdapter extends RecyclerView.Adapter<AssessmentsAdapter.VH> {

        @NonNull
        @Override
        public VH onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
            View v = LayoutInflater.from(parent.getContext())
                    .inflate(R.layout.item_assessment_row, parent, false);
            return new VH(v);
        }

        @Override
        public void onBindViewHolder(@NonNull VH h, int pos) {
            Assessment a = data.get(pos);
            h.title.setText(a.title);

            String subtitle = subtitleFor(a);
            h.subtitle.setText(subtitle);

            if (a.isDone) {
                h.title.setPaintFlags(h.title.getPaintFlags() | Paint.STRIKE_THRU_TEXT_FLAG);
                h.title.setTextColor(ContextCompat.getColor(AssessmentsActivity.this, R.color.cal_text_muted));
                h.icDone.setImageResource(R.drawable.ic_check_circle);
                h.icDone.setColorFilter(ContextCompat.getColor(AssessmentsActivity.this, R.color.cal_session_teal));
                h.tvDone.setTextColor(ContextCompat.getColor(AssessmentsActivity.this, R.color.cal_session_teal));
            } else {
                h.title.setPaintFlags(h.title.getPaintFlags() & ~Paint.STRIKE_THRU_TEXT_FLAG);
                h.title.setTextColor(ContextCompat.getColor(AssessmentsActivity.this, R.color.cal_text_primary));
                h.icDone.setImageResource(R.drawable.ic_circle_outline);
                h.icDone.setColorFilter(ContextCompat.getColor(AssessmentsActivity.this, R.color.cal_text_secondary));
                h.tvDone.setTextColor(ContextCompat.getColor(AssessmentsActivity.this, R.color.cal_text_secondary));
            }

            h.btnDone.setOnClickListener(v -> {
                a.setDone(!a.isDone);
                repo.update(a);
            });
        }

        @Override
        public int getItemCount() { return data.size(); }

        class VH extends RecyclerView.ViewHolder {
            TextView title, subtitle, tvDone;
            View btnDone;
            ImageView icDone;

            VH(View v) {
                super(v);
                title = v.findViewById(R.id.tvAssessmentTitle);
                subtitle = v.findViewById(R.id.tvAssessmentSubtitle);
                btnDone = v.findViewById(R.id.btnDone);
                icDone = v.findViewById(R.id.icDoneCheck);
                tvDone = v.findViewById(R.id.tvDoneLabel);
            }
        }
    }

    private String subtitleFor(Assessment a) {
        long diff = a.dateTimeMillis - System.currentTimeMillis();
        long dayMs = 24L * 60 * 60 * 1000;
        long days = diff / dayMs;

        if (diff < 0) {
            return new SimpleDateFormat("MMM d", Locale.US).format(a.dateTimeMillis);
        }
        if (days == 0) return "today";
        if (days == 1) return "in 1 day";
        if (days <= 6) return "in " + days + " days";
        return new SimpleDateFormat("MMM d", Locale.US).format(a.dateTimeMillis);
    }
}
