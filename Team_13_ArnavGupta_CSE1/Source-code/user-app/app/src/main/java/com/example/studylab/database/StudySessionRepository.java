package com.example.studylab.database;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;

import androidx.lifecycle.LiveData;

import java.util.List;

public class StudySessionRepository {
    private StudySessionDao studySessionDao;
    private LiveData<List<StudySession>> allSessions;

    public StudySessionRepository(Context context) {
        AppDatabase database = AppDatabase.getInstance(context);
        studySessionDao = database.studySessionDao();
        // Note: We won't keep a reference to allSessions as we typically query with filters
    }

    public void insert(StudySession studySession) {
        AppDatabase.databaseWriteExecutor.execute(() -> {
            studySessionDao.insert(studySession);
        });
    }

    public void update(StudySession studySession) {
        AppDatabase.databaseWriteExecutor.execute(() -> {
            studySessionDao.update(studySession);
        });
    }

    public void delete(StudySession studySession) {
        AppDatabase.databaseWriteExecutor.execute(() -> {
            studySessionDao.delete(studySession);
        });
    }

    public LiveData<List<StudySession>> getSessionsBySubjectAndMonth(int subjectId, String monthPattern) {
        return studySessionDao.getSessionsBySubjectAndMonth(subjectId, monthPattern);
    }

    public LiveData<List<StudySession>> getSessionsByDate(String date) {
        return studySessionDao.getSessionsByDate(date);
    }

    public LiveData<List<StudySession>> getAllSessionsForMonth(String monthPattern) {
        return studySessionDao.getAllSessionsForMonth(monthPattern);
    }

    public interface IntCallback { void onResult(int value); }

    public void getTotalSecondsForMonth(String yearMonth, IntCallback cb) {
        AppDatabase.databaseWriteExecutor.execute(() -> {
            int v = studySessionDao.getTotalSecondsForMonthSync(yearMonth);
            new Handler(Looper.getMainLooper()).post(() -> cb.onResult(v));
        });
    }

    public void getStudyDaysCountForMonth(String yearMonth, IntCallback cb) {
        AppDatabase.databaseWriteExecutor.execute(() -> {
            int v = studySessionDao.getStudyDaysCountForMonthSync(yearMonth);
            new Handler(Looper.getMainLooper()).post(() -> cb.onResult(v));
        });
    }
}