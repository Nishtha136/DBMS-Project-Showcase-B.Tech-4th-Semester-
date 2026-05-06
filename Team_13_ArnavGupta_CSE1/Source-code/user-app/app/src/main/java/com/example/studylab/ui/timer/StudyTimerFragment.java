package com.example.studylab.ui.timer;

import android.os.Bundle;
import android.os.CountDownTimer;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.studylab.R;
import com.example.studylab.database.Subject;
import com.example.studylab.database.SubjectRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class StudyTimerFragment extends Fragment {
    private RecyclerView subjectPickerRecyclerView;
    private TextView timerTextView;
    private Button pauseButton;
    private Button stopButton;
    private Button resetButton;
    private Button startStudyingButton;
    
    private SubjectPickerAdapter subjectPickerAdapter;
    private SubjectRepository subjectRepository;
    
    private CountDownTimer countDownTimer;
    private long timeRemainingMillis;
    private boolean timerRunning;
    private int selectedSubjectPosition = 0;
    
    // Default subjects (would normally come from database)
    private List<Subject> subjects = new ArrayList<>();

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Initialize repository
        subjectRepository = new SubjectRepository(requireContext());
        
        // Load default subjects
        loadDefaultSubjects();
    }

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_study_timer, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        
        subjectPickerRecyclerView = view.findViewById(R.id.subject_picker_recycler_view);
        timerTextView = view.findViewById(R.id.timer_text_view);
        pauseButton = view.findViewById(R.id.pause_button);
        stopButton = view.findViewById(R.id.stop_button);
        resetButton = view.findViewById(R.id.reset_button);
        startStudyingButton = view.findViewById(R.id.start_studying_button);
        
        // Setup subject picker
        subjectPickerRecyclerView.setLayoutManager(new LinearLayoutManager(requireContext(), LinearLayoutManager.HORIZONTAL, false));
        subjectPickerAdapter = new SubjectPickerAdapter();
        subjectPickerRecyclerView.setAdapter(subjectPickerAdapter);
        
        // Setup timer display
        updateTimerDisplay(0); // Start with 00:00
        
        // Setup button listeners
        pauseButton.setOnClickListener(v -> pauseTimer());
        stopButton.setOnClickListener(v -> stopTimer());
        resetButton.setOnClickListener(v -> resetTimer());
        startStudyingButton.setOnClickListener(v -> startStudying());
        
        // Load subjects
        subjectPickerAdapter.setSubjects(subjects);
        subjectPickerAdapter.setSelectedPosition(selectedSubjectPosition);
        subjectPickerAdapter.notifyDataSetChanged();
    }
    
    private void loadDefaultSubjects() {
        subjects.clear();
        
        // Add default subjects
        Subject physics = new Subject();
        physics.setId(1);
        physics.setName("Physics");
        physics.setColorHex("#1A73E8"); // Blue
        subjects.add(physics);
        
        Subject maths = new Subject();
        maths.setId(2);
        maths.setName("Maths");
        maths.setColorHex("#FF9500"); // Orange
        subjects.add(maths);
        
        Subject history = new Subject();
        history.setId(3);
        history.setName("History");
        history.setColorHex("#34A853"); // Green
        subjects.add(history);
        
        Subject biology = new Subject();
        biology.setId(4);
        biology.setName("Biology");
        biology.setColorHex("#00ACC1"); // Teal
        subjects.add(biology);
        
        // Add "Add Subject" placeholder
        Subject addSubject = new Subject();
        addSubject.setId(-1); // Special ID for add subject
        addSubject.setName("+ Add Subject");
        subjects.add(addSubject);
    }
    
    private void updateTimerDisplay(long millis) {
        long minutes = (millis / 1000) / 60;
        long seconds = (millis / 1000) % 60;
        String timeText = String.format(Locale.getDefault(), "%02d:%02d", minutes, seconds);
        timerTextView.setText(timeText);
    }
    
    private void startTimer(long durationMillis) {
        timeRemainingMillis = durationMillis;
        timerRunning = true;
        
        countDownTimer = new CountDownTimer(timeRemainingMillis, 1000) {
            @Override
            public void onTick(long millisUntilFinished) {
                timeRemainingMillis = millisUntilFinished;
                updateTimerDisplay(timeRemainingMillis);
            }
            
            @Override
            public void onFinish() {
                timerRunning = false;
                // Timer completed - navigate to Focus Mode if enabled, or show completion
                // For now, we'll just reset
                resetTimer();
                // In a real app, we would show a completion dialog or start Focus Mode
                android.widget.Toast.makeText(requireContext(), "Timer completed!", android.widget.Toast.LENGTH_SHORT).show();
            }
        }.start();
        
        // Update UI state
        startStudyingButton.setEnabled(false);
        pauseButton.setEnabled(true);
        stopButton.setEnabled(true);
        resetButton.setEnabled(true);
    }
    
    private void pauseTimer() {
        if (countDownTimer != null) {
            countDownTimer.cancel();
            timerRunning = false;
            
            // Update UI state
            startStudyingButton.setEnabled(true);
            pauseButton.setEnabled(false);
            stopButton.setEnabled(true);
            resetButton.setEnabled(true);
        }
    }
    
    private void stopTimer() {
        if (countDownTimer != null) {
            countDownTimer.cancel();
        }
        resetTimer();
    }
    
    private void resetTimer() {
        if (countDownTimer != null) {
            countDownTimer.cancel();
        }
        timerRunning = false;
        timeRemainingMillis = 0;
        updateTimerDisplay(0);
        
        // Update UI state
        startStudyingButton.setEnabled(true);
        pauseButton.setEnabled(false);
        stopButton.setEnabled(false);
        resetButton.setEnabled(false);
    }
    
    private void startStudying() {
        // Default to 25 minutes (Pomodoro technique)
        long defaultDuration = 25 * 60 * 1000; // 25 minutes in milliseconds
        startTimer(defaultDuration);
        
        // In a real implementation, we would:
        // 1. Save the timer start to the database
        // 2. Check if Focus Mode is enabled and start it if so
        // 3. Show a notification that the timer has started
        
        android.widget.Toast.makeText(requireContext(), "Study session started!", android.widget.Toast.LENGTH_SHORT).show();
    }
    
    // Adapter for the horizontal subject picker
    private class SubjectPickerAdapter extends RecyclerView.Adapter<SubjectPickerAdapter.SubjectViewHolder> {
        private List<Subject> subjects = new ArrayList<>();
        private int selectedPosition = 0;
        
        public void setSubjects(List<Subject> subjects) {
            this.subjects = subjects;
        }
        
        public void setSelectedPosition(int position) {
            this.selectedPosition = position;
        }
        
        @NonNull
        @Override
        public SubjectViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
            View view = LayoutInflater.from(parent.getContext())
                    .inflate(R.layout.item_subject_pill, parent, false);
            return new SubjectViewHolder(view);
        }
        
        @Override
        public void onBindViewHolder(@NonNull SubjectViewHolder holder, int position) {
            Subject subject = subjects.get(position);
            
            holder.subjectNameTextView.setText(subject.getName());
            
            // Set selected/unselected state
            boolean isSelected = position == selectedPosition;
            if (isSelected) {
                holder.itemView.setBackgroundResource(R.drawable.bg_subject_pill_selected);
                holder.subjectNameTextView.setTextColor(getResources().getColor(R.color.white, null));
            } else {
                holder.itemView.setBackgroundResource(R.drawable.bg_subject_pill_unselected);
                holder.subjectNameTextView.setTextColor(getResources().getColor(R.color.text_primary, null));
            }
            
            // Set click listener
            holder.itemView.setOnClickListener(v -> {
                if (subject.getId() == -1) {
                    // Handle "Add Subject" click
                    // In a real app, we would show a dialog to add a new subject
                    android.widget.Toast.makeText(requireContext(), "Add Subject clicked", android.widget.Toast.LENGTH_SHORT).show();
                } else {
                    // Select this subject
                    selectedPosition = position;
                    notifyDataSetChanged();
                }
            });
        }
        
        @Override
        public int getItemCount() {
            return subjects.size();
        }
        
        class SubjectViewHolder extends RecyclerView.ViewHolder {
            TextView subjectNameTextView;
            
            SubjectViewHolder(View itemView) {
                super(itemView);
                subjectNameTextView = itemView.findViewById(R.id.subject_name_text_view);
            }
        }
    }
}