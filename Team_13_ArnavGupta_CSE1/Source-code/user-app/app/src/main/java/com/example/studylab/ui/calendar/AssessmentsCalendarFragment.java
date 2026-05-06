package com.example.studylab.ui.calendar;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.studylab.R;
import com.example.studylab.database.Assessment;
import com.example.studylab.database.AssessmentRepository;
import com.example.studylab.database.Subject;
import com.example.studylab.database.SubjectRepository;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class AssessmentsCalendarFragment extends Fragment {
    private RecyclerView calendarRecyclerView;
    private AssessmentsCalendarAdapter adapter;
    private TextView emptyStateTextView;
    
    private AssessmentRepository assessmentRepository;
    private SubjectRepository subjectRepository;
    
    private Calendar currentDate = Calendar.getInstance();
    private Map<Long, List<Assessment>> assessmentsByDate = new HashMap<>();

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // If we have access to the parent fragment's current date, use it
        if (getParentFragment() instanceof StudyCalendarFragment) {
            currentDate = ((StudyCalendarFragment) getParentFragment()).getCurrentDate();
        }
        
        // Initialize repositories
        assessmentRepository = new AssessmentRepository(requireContext());
        subjectRepository = new SubjectRepository(requireContext());
    }

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_study_calendar_assessments, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        
        calendarRecyclerView = view.findViewById(R.id.calendar_recycler_view);
        emptyStateTextView = view.findViewById(R.id.empty_state_text_view);
        
        // Setup RecyclerView for calendar grid
        calendarRecyclerView.setLayoutManager(new LinearLayoutManager(requireContext()));
        adapter = new AssessmentsCalendarAdapter();
        calendarRecyclerView.setAdapter(adapter);
        
        loadData();
    }
    
    private void loadData() {
        // Get the month and year from currentDate
        int year = currentDate.get(Calendar.YEAR);
        int month = currentDate.get(Calendar.MONTH); // 0-based
        
        // Calculate start and end of month
        Calendar startOfMonth = Calendar.getInstance();
        startOfMonth.set(year, month, 1);
        long startOfMonthMillis = startOfMonth.getTimeInMillis();
        
        Calendar endOfMonth = Calendar.getInstance();
        endOfMonth.set(year, month + 1, 0); // Last day of month
        endOfMonth.set(Calendar.HOUR_OF_DAY, 23);
        endOfMonth.set(Calendar.MINUTE, 59);
        endOfMonth.set(Calendar.SECOND, 59);
        long endOfMonthMillis = endOfMonth.getTimeInMillis();
        
        // In a real implementation, we would query the database for assessments in this month
        // For now, we'll load mock data
        loadMockAssessments(startOfMonthMillis, endOfMonthMillis);
        
        // Update the adapter
        adapter.setAssessmentsByDate(assessmentsByDate);
        adapter.setMonthYear(year, month);
        adapter.notifyDataSetChanged();
        
        // Show empty state if no assessments
        boolean hasAssessments = !assessmentsByDate.isEmpty();
        calendarRecyclerView.setVisibility(hasAssessments ? View.VISIBLE : View.GONE);
        emptyStateTextView.setVisibility(hasAssessments ? View.GONE : View.VISIBLE);
    }
    
    private void loadMockAssessments(long startOfMonthMillis, long endOfMonthMillis) {
        // Clear existing data
        assessmentsByDate.clear();
        
        // Add some mock assessments
        // Assessment 1: March 5, 2025 - Physics Quiz
        Calendar cal1 = Calendar.getInstance();
        cal1.set(2025, Calendar.MARCH, 5, 10, 0); // March 5, 2025 at 10:00 AM
        Assessment assessment1 = new Assessment();
        assessment1.setId(1);
        assessment1.setSubjectId(1); // Physics
        assessment1.setType("Quiz");
        assessment1.setTitle("Midterm Quiz");
        assessment1.setDateTimeMillis(cal1.getTimeInMillis());
        assessment1.setNotes("Chapters 1-3");
        
        // Assessment 2: March 12, 2025 - Math Exam
        Calendar cal2 = Calendar.getInstance();
        cal2.set(2025, Calendar.MARCH, 12, 14, 30); // March 12, 2025 at 2:30 PM
        Assessment assessment2 = new Assessment();
        assessment2.setId(2);
        assessment2.setSubjectId(2); // Math
        assessment2.setType("Exam");
        assessment2.setTitle("Unit 2 Exam");
        assessment2.setDateTimeMillis(cal2.getTimeInMillis());
        assessment2.setNotes("Algebra and Geometry");
        
        // Assessment 3: March 12, 2025 - History Assignment
        Calendar cal3 = Calendar.getInstance();
        cal3.set(2025, Calendar.MARCH, 12, 9, 0); // March 12, 2025 at 9:00 AM
        Assessment assessment3 = new Assessment();
        assessment3.setId(3);
        assessment3.setSubjectId(3); // History
        assessment3.setType("Assignment");
        assessment3.setTitle("WWII Essay");
        assessment3.setDateTimeMillis(cal3.getTimeInMillis());
        assessment3.setNotes("2000 words");
        
        // Assessment 4: March 20, 2025 - Biology Project
        Calendar cal4 = Calendar.getInstance();
        cal4.set(2025, Calendar.MARCH, 20, 16, 0); // March 20, 2025 at 4:00 PM
        Assessment assessment4 = new Assessment();
        assessment4.setId(4);
        assessment4.setSubjectId(4); // Biology
        assessment4.setType("Project");
        assessment4.setTitle("Cell Model Project");
        assessment4.setDateTimeMillis(cal4.getTimeInMillis());
        assessment4.setNotes("Due Friday");
        
        // Add assessments to map
        addAssessmentToMap(assessment1);
        addAssessmentToMap(assessment2);
        addAssessmentToMap(assessment3);
        addAssessmentToMap(assessment4);
    }
    
    private void addAssessmentToMap(Assessment assessment) {
        long dateMillis = assessment.getDateTimeMillis();
        // Normalize to start of day
        Calendar cal = Calendar.getInstance();
        cal.setTimeInMillis(dateMillis);
        cal.set(Calendar.HOUR_OF_DAY, 0);
        cal.set(Calendar.MINUTE, 0);
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);
        long startOfDay = cal.getTimeInMillis();
        
        assessmentsByDate.computeIfAbsent(startOfDay, k -> new ArrayList<>()).add(assessment);
    }
    
    // Adapter for the calendar grid
    private class AssessmentsCalendarAdapter extends RecyclerView.Adapter<AssessmentsCalendarAdapter.CalendarViewHolder> {
        private int month;
        private int year;
        private Map<Long, List<Assessment>> assessmentsByDate;
        
        public AssessmentsCalendarAdapter() {
            this.assessmentsByDate = new HashMap<>();
        }
        
        public void setAssessmentsByDate(Map<Long, List<Assessment>> assessmentsByDate) {
            this.assessmentsByDate = assessmentsByDate;
        }
        
        public void setMonthYear(int year, int month) {
            this.year = year;
            this.month = month;
            notifyDataSetChanged();
        }
        
        @NonNull
        @Override
        public CalendarViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
            View view = LayoutInflater.from(parent.getContext())
                    .inflate(R.layout.item_calendar_day, parent, false);
            return new CalendarViewHolder(view);
        }
        
        @Override
        public void onBindViewHolder(@NonNull CalendarViewHolder holder, int position) {
            // Calculate the date for this position
            Calendar dayCal = Calendar.getInstance();
            dayCal.set(year, month, 1); // First day of month
            
            // Add offset for days before the 1st
            int firstDayOfWeek = dayCal.get(Calendar.DAY_OF_WEEK); // 1=Sunday, 2=Monday, etc.
            int daysBeforeFirst = (firstDayOfWeek - 2 + 7) % 7; // Days to add to get to Monday as first column
            
            dayCal.add(Calendar.DAY_OF_MONTH, position - daysBeforeFirst);
            
            int dayOfMonth = dayCal.get(Calendar.DAY_OF_MONTH);
            int monthOfYear = dayCal.get(Calendar.MONTH);
            int yearOfDate = dayCal.get(Calendar.YEAR);
            
            // Check if this day is in the current month
            boolean isCurrentMonth = (monthOfYear == month && yearOfDate == year);
            
            if (isCurrentMonth) {
                holder.dayNumberTextView.setText(String.valueOf(dayOfMonth));
                holder.dayNumberTextView.setVisibility(View.VISIBLE);
                
                // Check if there are assessments for this day
                long startOfDayMillis = dayCal.getTimeInMillis();
                List<Assessment> dayAssessments = assessmentsByDate.get(startOfDayMillis);
                
                if (dayAssessments != null && !dayAssessments.isEmpty()) {
                    // Show dot indicator
                    holder.assessmentDotView.setVisibility(View.VISIBLE);
                    
                    // Set click listener to show assessments for this day
                    holder.itemView.setOnClickListener(v -> {
                        showAssessmentsForDay(dayAssessments, dayCal.getTimeInMillis());
                    });
                } else {
                    holder.assessmentDotView.setVisibility(View.GONE);
                    holder.itemView.setOnClickListener(null);
                }
            } else {
                // This day is not in the current month
                holder.dayNumberTextView.setVisibility(View.GONE);
                holder.assessmentDotView.setVisibility(View.GONE);
                holder.itemView.setOnClickListener(null);
            }
        }
        
        private void showAssessmentsForDay(List<Assessment> assessments, long dateMillis) {
            // In a real implementation, we would show a bottom sheet or dialog with the assessments
            // For now, we'll just show a toast
            StringBuilder sb = new StringBuilder();
            sb.append("Assessments for ").append(android.text.format.DateFormat.format("MMMM dd, yyyy", dateMillis)).append(":\n\n");
            
            for (Assessment assessment : assessments) {
                // Get subject name (in a real app, we would query the repository)
                String subjectName = "Subject " + assessment.getSubjectId(); // Placeholder
                sb.append("• ").append(subjectName).append(" - ")
                  .append(assessment.getType()).append(": ")
                  .append(assessment.getTitle()).append("\n");
            }
            
            android.widget.Toast.makeText(requireContext(), sb.toString(), android.widget.Toast.LENGTH_LONG).show();
        }
        
        @Override
        public int getItemCount() {
            // We'll show 6 weeks (42 days) to cover any month
            return 42;
        }
        
        class CalendarViewHolder extends RecyclerView.ViewHolder {
            TextView dayNumberTextView;
            View assessmentDotView;
            
            CalendarViewHolder(View itemView) {
                super(itemView);
                dayNumberTextView = itemView.findViewById(R.id.day_number_text_view);
                assessmentDotView = itemView.findViewById(R.id.assessment_dot_view);
            }
        }
    }
}