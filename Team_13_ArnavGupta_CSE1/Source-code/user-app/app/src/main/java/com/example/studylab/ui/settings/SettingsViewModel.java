package com.example.studylab.ui.settings;

import android.app.Application;

import androidx.annotation.NonNull;
import androidx.lifecycle.AndroidViewModel;
import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;

import com.example.studylab.database.AppDatabase;
import com.example.studylab.database.SubjectRepository;

import java.util.List;

public class SettingsViewModel extends AndroidViewModel {
    private MutableLiveData<Boolean> focusModeEnabled = new MutableLiveData<>();
    private MutableLiveData<String> selectedTheme = new MutableLiveData<>();
    private MutableLiveData<Integer> dailyStudyGoal = new MutableLiveData<>();
    private MutableLiveData<Boolean> reminderEnabled = new MutableLiveData<>();
    private MutableLiveData<String> reminderTime = new MutableLiveData<>();
    private MutableLiveData<String> userName = new MutableLiveData<>();
    private MutableLiveData<String> userEmail = new MutableLiveData<>();

    public SettingsViewModel(@NonNull Application application) {
        super(application);
        // Load settings from SharedPreferences (would be implemented in a real app)
        // For now, setting default values
        focusModeEnabled.setValue(false);
        selectedTheme.setValue("blue");
        dailyStudyGoal.setValue(2);
        reminderEnabled.setValue(false);
        reminderTime.setValue("19:00");
        userName.setValue("Student");
        userEmail.setValue("student@example.com");
    }

    public LiveData<Boolean> getFocusModeEnabled() {
        return focusModeEnabled;
    }

    public void setFocusModeEnabled(boolean enabled) {
        focusModeEnabled.setValue(enabled);
    }

    public LiveData<String> getSelectedTheme() {
        return selectedTheme;
    }

    public void setSelectedTheme(String theme) {
        selectedTheme.setValue(theme);
    }

    public LiveData<Integer> getDailyStudyGoal() {
        return dailyStudyGoal;
    }

    public void setDailyStudyGoal(int goal) {
        dailyStudyGoal.setValue(goal);
    }

    public LiveData<Boolean> getReminderEnabled() {
        return reminderEnabled;
    }

    public void setReminderEnabled(boolean enabled) {
        reminderEnabled.setValue(enabled);
    }

    public LiveData<String> getReminderTime() {
        return reminderTime;
    }

    public void setReminderTime(String time) {
        reminderTime.setValue(time);
    }

    public LiveData<String> getUserName() {
        return userName;
    }

    public void setUserName(String name) {
        userName.setValue(name);
    }

    public LiveData<String> getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String email) {
        userEmail.setValue(email);
    }

    // Stub methods for data export and history clearing
    public void exportData() {
        // In a real app, this would export data to a file or cloud storage
    }

    public void clearStudyHistory() {
        // In a real app, this would clear all study-related data from the database
    }

    public void signOut() {
        // In a real app, this would clear authentication state and navigate to login
    }
}