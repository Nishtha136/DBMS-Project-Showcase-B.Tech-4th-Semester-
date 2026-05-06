package com.example.studylab.ui.collection;

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
import com.example.studylab.database.Subject;
import com.example.studylab.database.SubjectRepository;
import com.example.studylab.database.StudySessionRepository;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;
import java.util.Locale;

public class StudyCollectionFragment extends Fragment {
    private RecyclerView subjectRecyclerView;
    private StudyCollectionAdapter adapter;
    private TextView monthLabel;
    
    private SubjectRepository subjectRepository;
    private StudySessionRepository studySessionRepository;
    
    private Calendar currentDate = Calendar.getInstance();

    public StudyCollectionFragment() {
        // Required empty public constructor
    }

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Initialize repositories
        subjectRepository = new SubjectRepository(requireContext());
        studySessionRepository = new StudySessionRepository(requireContext());
    }

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_study_collection, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        
        subjectRecyclerView = view.findViewById(R.id.subject_recycler_view);
        monthLabel = view.findViewById(R.id.month_label);
        
        // Setup month navigation
        view.findViewById(R.id.prev_month_btn).setOnClickListener(v -> {
            currentDate.add(Calendar.MONTH, -1);
            updateMonthLabel();
            loadData();
        });
        
        view.findViewById(R.id.next_month_btn).setOnClickListener(v -> {
            currentDate.add(Calendar.MONTH, 1);
            updateMonthLabel();
            loadData();
        });
        
        // Setup RecyclerView
        subjectRecyclerView.setLayoutManager(new LinearLayoutManager(requireContext()));
        adapter = new StudyCollectionAdapter();
        subjectRecyclerView.setAdapter(adapter);
        
        updateMonthLabel();
        loadData();
    }
    
    private void updateMonthLabel() {
        String monthName = currentDate.getDisplayName(Calendar.MONTH, Calendar.LONG, Locale.getDefault());
        int year = currentDate.get(Calendar.YEAR);
        monthLabel.setText(monthName + " " + year);
    }
    
    private void loadData() {
        // Get the month and year from currentDate
        int year = currentDate.get(Calendar.YEAR);
        int month = currentDate.get(Calendar.MONTH); // 0-based
        
        // In a real implementation, we would query the database for subjects and their study sessions
        // For now, we'll load mock data
        loadMockData();
        
        // Update adapter
        adapter.setSubjectsWithSessionCounts(mockSubjects);
        adapter.notifyDataSetChanged();
    }
    
    // Mock data for demonstration
    private List<SubjectWithSessionCount> mockSubjects = new ArrayList<>();
    
    private void loadMockData() {
        mockSubjects.clear();
        
        // Add mock subjects with session counts
        SubjectWithSessionCount physics = new SubjectWithSessionCount();
        physics.subjectId = 1;
        physics.subjectName = "Physics";
        physics.subjectColor = getResources().getColor(R.color.subject_physics, null);
        physics.totalStudySeconds = 12500; // ~3.5 hours
        mockSubjects.add(physics);
        
        SubjectWithSessionCount maths = new SubjectWithSessionCount();
        maths.subjectId = 2;
        maths.subjectName = "Maths";
        maths.subjectColor = getResources().getColor(R.color.subject_math, null);
        maths.totalStudySeconds = 9800; // ~2.7 hours
        mockSubjects.add(maths);
        
        SubjectWithSessionCount history = new SubjectWithSessionCount();
        history.subjectId = 3;
        history.subjectName = "History";
        history.subjectColor = getResources().getColor(R.color.subject_history, null);
        history.totalStudySeconds = 7200; // 2 hours
        mockSubjects.add(history);
        
        SubjectWithSessionCount biology = new SubjectWithSessionCount();
        biology.subjectId = 4;
        biology.subjectName = "Biology";
        biology.subjectColor = getResources().getColor(R.color.subject_biology, null);
        biology.totalStudySeconds = 10800; // 3 hours
        mockSubjects.add(biology);
    }
    
    // Adapter for the subject list
    private class StudyCollectionAdapter extends RecyclerView.Adapter<StudyCollectionAdapter.SubjectViewHolder> {
        private List<SubjectWithSessionCount> subjects = new ArrayList<>();
        
        public void setSubjectsWithSessionCounts(List<SubjectWithSessionCount> subjects) {
            this.subjects = subjects;
        }
        
        @NonNull
        @Override
        public SubjectViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
            View view = LayoutInflater.from(parent.getContext())
                    .inflate(R.layout.item_subject_collection, parent, false);
            return new SubjectViewHolder(view);
        }
        
        @Override
        public void onBindViewHolder(@NonNull SubjectViewHolder holder, int position) {
            SubjectWithSessionCount subject = subjects.get(position);
            
            holder.subjectNameTextView.setText(subject.subjectName);
            
            // Format total study time
            int hours = (int)(subject.totalStudySeconds / 3600);
            int minutes = (int)((subject.totalStudySeconds % 3600) / 60);
            String timeText;
            if (hours > 0) {
                timeText = hours + "h " + minutes + "m";
            } else {
                timeText = minutes + "m";
            }
            holder.studyTimeBadge.setText(timeText);
            
            // Set subject color indicator
            holder.colorStripView.setBackgroundColor(subject.subjectColor);
            
            // Set click listener to expand/collapse subject
            holder.itemView.setOnClickListener(v -> {
                // In a real implementation, we would expand/collapse to show sessions
                // For now, we'll just show a toast
                android.widget.Toast.makeText(requireContext(),
                        "Showing sessions for " + subject.subjectName,
                        android.widget.Toast.LENGTH_SHORT).show();
            });
        }
        
        @Override
        public int getItemCount() {
            return subjects.size();
        }
        
        class SubjectViewHolder extends RecyclerView.ViewHolder {
            TextView subjectNameTextView;
            TextView studyTimeBadge;
            View colorStripView;
            
            SubjectViewHolder(View itemView) {
                super(itemView);
                subjectNameTextView = itemView.findViewById(R.id.subject_name_text_view);
                studyTimeBadge = itemView.findViewById(R.id.study_time_badge);
                colorStripView = itemView.findViewById(R.id.color_strip_view);
            }
        }
    }
    
    // Simple data class to hold subject info with session count
    private class SubjectWithSessionCount {
        int subjectId;
        String subjectName;
        int subjectColor;
        long totalStudySeconds;
    }
}