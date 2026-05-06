package com.example.studylab.ui;

import android.app.Application;

import androidx.annotation.NonNull;
import androidx.lifecycle.AndroidViewModel;
import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;

import com.example.studylab.database.SubjectRepository;
import com.example.studylab.database.StudySessionRepository;

import java.util.List;

public class HomeViewModel extends AndroidViewModel {
    private MutableLiveData<String> dailyGreeting = new MutableLiveData<>();
    private MutableLiveData<List<com.example.studylab.database.StudySession>> todaysSessions = new MutableLiveData<>();
    private MutableLiveData<List<com.example.studylab.database.Assessment>> upcomingAssessments = new MutableLiveData<>();
    private MutableLiveData<com.example.studylab.database.Experiment> activeExperiment = new MutableLiveData<>();

    public HomeViewModel(@NonNull Application application) {
        super(application);
        // Initialize with default values
        updateDailyGreeting();
        // In a real implementation, we would load data from repositories
    }

    public LiveData<String> getDailyGreeting() {
        return dailyGreeting;
    }

    public void updateDailyGreeting() {
        // Simple time-based greeting
        int hour = java.time.LocalTime.now().getHour();
        String greeting;
        if (hour < 12) {
            greeting = "Good morning!";
        } else if (hour < 17) {
            greeting = "Good afternoon!";
        } else {
            greeting = "Good evening!";
        }
        dailyGreeting.setValue(greeting);
    }

    public LiveData<List<com.example.studylab.database.StudySession>> getTodaysSessions() {
        return todaysSessions;
    }

    public LiveData<List<com.example.studylab.database.Assessment>> getUpcomingAssessments() {
        return upcomingAssessments;
    }

    public LiveData<com.example.studylab.database.Experiment> getActiveExperiment() {
        return activeExperiment;
    }

    // Methods to refresh data would go here
    public void refreshData() {
        updateDailyGreeting();
        // In a real app, we would query repositories for today's sessions, upcoming assessments, etc.
    }
}