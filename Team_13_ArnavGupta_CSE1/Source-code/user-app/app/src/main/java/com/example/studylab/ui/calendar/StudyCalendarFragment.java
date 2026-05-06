package com.example.studylab.ui.calendar;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.viewpager2.widget.ViewPager2;

import com.example.studylab.R;
import com.example.studylab.database.SubjectRepository;
import com.example.studylab.database.StudySessionRepository;
import com.example.studylab.database.AssessmentRepository;
import com.google.android.material.tabs.TabLayout;
import com.google.android.material.tabs.TabLayoutMediator;

import java.util.Calendar;

public class StudyCalendarFragment extends Fragment {
    private TabLayout tabLayout;
    private ViewPager2 viewPager;
    private TextView monthLabel;
    
    private SubjectRepository subjectRepository;
    private StudySessionRepository studySessionRepository;
    private AssessmentRepository assessmentRepository;
    
    private Calendar currentDate = Calendar.getInstance();

    public StudyCalendarFragment() {
        // Required empty public constructor
    }

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Initialize repositories
        subjectRepository = new SubjectRepository(requireContext());
        studySessionRepository = new StudySessionRepository(requireContext());
        assessmentRepository = new AssessmentRepository(requireContext());
    }

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_study_calendar, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        
        tabLayout = view.findViewById(R.id.tab_layout);
        viewPager = view.findViewById(R.id.view_pager);
        monthLabel = view.findViewById(R.id.month_label);
        
        // Setup month navigation
        view.findViewById(R.id.prev_month_btn).setOnClickListener(v -> {
            currentDate.add(Calendar.MONTH, -1);
            updateMonthLabel();
            updateTabs();
        });
        
        view.findViewById(R.id.next_month_btn).setOnClickListener(v -> {
            currentDate.add(Calendar.MONTH, 1);
            updateMonthLabel();
            updateTabs();
        });
        
        // Setup ViewPager with tabs
        viewPager.setAdapter(new CalendarPagerAdapter(this));
        
        new TabLayoutMediator(tabLayout, viewPager,
                (tab, position) -> {
                    switch (position) {
                        case 0: tab.setText("Study Hours"); break;
                        case 1: tab.setText("Assessments"); break;
                    }
                }).attach();
        
        updateMonthLabel();
    }
    
    private void updateMonthLabel() {
        String monthName = currentDate.getDisplayName(Calendar.MONTH, Calendar.LONG, java.util.Locale.getDefault());
        int year = currentDate.get(Calendar.YEAR);
        monthLabel.setText(monthName + " " + year);
    }
    
    private void updateTabs() {
        // Notify tabs to refresh their data based on the new month
        // In a real implementation, we would pass the current date to the fragments
        // For now, we'll just recreate the ViewPager adapter
        viewPager.setAdapter(new CalendarPagerAdapter(this));
        tabLayout.selectTab(tabLayout.getTabAt(viewPager.getCurrentItem()));
    }
    
    public Calendar getCurrentDate() {
        return currentDate;
    }
    
    // Simple adapter for the ViewPager
    private static class CalendarPagerAdapter extends androidx.viewpager2.adapter.FragmentStateAdapter {
        public CalendarPagerAdapter(@NonNull Fragment fragment) {
            super(fragment);
        }
        
        @NonNull
        @Override
        public Fragment createFragment(int position) {
            switch (position) {
                case 0: return new StudyHoursHeatmapFragment();
                case 1: return new AssessmentsCalendarFragment();
                default: return new StudyHoursHeatmapFragment();
            }
        }
        
        @Override
        public int getItemCount() {
            return 2;
        }
    }
}