package com.example.studylab.ui.calendar;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.studylab.R;
import com.example.studylab.database.SubjectRepository;
import com.example.studylab.database.StudySessionRepository;
import com.example.studylab.database.Subject;

import java.util.Calendar;
import java.util.List;
import java.util.Locale;

public class StudyHoursHeatmapFragment extends Fragment {
    private RecyclerView heatmapRecyclerView;
    private TextView weeklySummaryTextView;
    private StudyHoursHeatmapAdapter adapter;
    
    private SubjectRepository subjectRepository;
    private StudySessionRepository studySessionRepository;
    
    private Calendar currentDate = Calendar.getInstance();

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // If we have access to the parent fragment's current date, use it
        if (getParentFragment() instanceof StudyCalendarFragment) {
            currentDate = ((StudyCalendarFragment) getParentFragment()).getCurrentDate();
        }
        
        // Initialize repositories
        subjectRepository = new SubjectRepository(requireContext());
        studySessionRepository = new StudySessionRepository(requireContext());
    }

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_study_calendar_heatmap, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        
        heatmapRecyclerView = view.findViewById(R.id.heatmap_recycler_view);
        weeklySummaryTextView = view.findViewById(R.id.weekly_summary_text_view);
        
        // Setup RecyclerView for heatmap grid (7 columns for days of week)
        heatmapRecyclerView.setLayoutManager(new GridLayoutManager(requireContext(), 7));
        adapter = new StudyHoursHeatmapAdapter();
        heatmapRecyclerView.setAdapter(adapter);
        
        loadData();
    }
    
    private void loadData() {
        // Get the month and year from currentDate
        int year = currentDate.get(Calendar.YEAR);
        int month = currentDate.get(Calendar.MONTH); // 0-based
        
        // We would normally query the database for study sessions in this month
        // For now, we'll set up a mock adapter
        adapter.setMonthYear(year, month);
        updateWeeklySummary();
    }
    
    private void updateWeeklySummary() {
        // In a real implementation, we would calculate the weekly summary from the data
        // For now, we'll set a placeholder
        weeklySummaryTextView.setText("Mon: 2h 13m\tTue: 0h\tWed: 1h 45m\tThu: 3h\tFri: 2h 30m\tSat: 0h\tSun: 1h 20m");
    }
    
    // Adapter for the heatmap grid
    private class StudyHoursHeatmapAdapter extends RecyclerView.Adapter<StudyHoursHeatmapAdapter.HeatmapViewHolder> {
        private int month;
        private int year;
        private int[] hoursPerDay; // Index 0-6 for Sun-Sat, but we'll adjust for Monday start
        
        public StudyHoursHeatmapAdapter() {
            // Initialize with zeros
            hoursPerDay = new int[7];
        }
        
        public void setMonthYear(int year, int month) {
            this.year = year;
            this.month = month;
            // In a real app, we would query the database here and populate hoursPerDay
            // For now, we'll leave it as zeros (or mock data)
            loadMockData();
            notifyDataSetChanged();
        }
        
        private void loadMockData() {
            // Mock data for demonstration
            hoursPerDay[0] = 0;   // Sunday
            hoursPerDay[1] = 130; // Monday (2h 10m in seconds? Actually we want hours, but let's use minutes for simplicity)
            hoursPerDay[2] = 0;   // Tuesday
            hoursPerDay[3] = 105; // Wednesday (1h 45m)
            hoursPerDay[4] = 180; // Thursday (3h)
            hoursPerDay[5] = 150; // Friday (2h 30m)
            hoursPerDay[6] = 80;  // Saturday (1h 20m)
            // Note: We're storing minutes here for simplicity in the mock
        }
        
        @NonNull
        @Override
        public HeatmapViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
            View view = LayoutInflater.from(parent.getContext())
                    .inflate(R.layout.item_heatmap_day, parent, false);
            return new HeatmapViewHolder(view);
        }
        
        @Override
        public void onBindViewHolder(@NonNull HeatmapViewHolder holder, int position) {
            // Position 0 is the first day of the month's grid, which may not be the 1st
            // We need to calculate the actual day of the month for this position
            // For simplicity, we'll just show the day of the week and use mock data
            
            // In a real implementation, we would:
            // 1. Calculate the first day of the month
            // 2. Determine how many blank cells to show before the 1st
            // 3. Then for each cell, if it's a day in the month, show the hours
            
            // For now, we'll just cycle through the week
            int dayOfWeek = position % 7; // 0=Sunday, 1=Monday, etc.
            int minutes = hoursPerDay[dayOfWeek];
            
            // Convert minutes to hours and minutes for display
            int hours = minutes / 60;
            int mins = minutes % 60;
            String timeText;
            if (hours == 0 && mins == 0) {
                timeText = "0h";
            } else if (hours == 0) {
                timeText = mins + "m";
            } else if (mins == 0) {
                timeText = hours + "h";
            } else {
                timeText = hours + "h " + mins + "m";
            }
            
            holder.dayNumberTextView.setText(""); // We're not showing day numbers in this mock
            holder.timeTextView.setText(timeText);
            
            // Set background color based on hours
            float hoursFloat = hours + (mins / 60f);
            int backgroundColor;
            if (hoursFloat == 0) {
                backgroundColor = getResources().getColor(R.color.white, null);
            } else if (hoursFloat < 1) {
                backgroundColor = getResources().getColor(R.color.heatmap_0_to_1, null);
            } else if (hoursFloat < 2) {
                backgroundColor = getResources().getColor(R.color.heatmap_1_to_2, null);
            } else if (hoursFloat < 4) {
                backgroundColor = getResources().getColor(R.color.heatmap_2_to_4, null);
            } else {
                backgroundColor = getResources().getColor(R.color.heatmap_4_plus, null);
            }
            holder.itemView.setBackgroundColor(backgroundColor);
        }
        
        @Override
        public int getItemCount() {
            // We'll show 6 weeks (42 days) to cover any month
            return 42;
        }
        
        class HeatmapViewHolder extends RecyclerView.ViewHolder {
            TextView dayNumberTextView;
            TextView timeTextView;
            
            HeatmapViewHolder(View itemView) {
                super(itemView);
                dayNumberTextView = itemView.findViewById(R.id.day_number_text_view);
                timeTextView = itemView.findViewById(R.id.time_text_view);
            }
        }
    }
}