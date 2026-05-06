package com.example.studylab.database;

import android.content.Context;

import androidx.lifecycle.LiveData;

import java.util.List;

public class SubjectRepository {
    private SubjectDao subjectDao;
    private LiveData<List<Subject>> allSubjects;

    public SubjectRepository(Context context) {
        AppDatabase database = AppDatabase.getInstance(context);
        subjectDao = database.subjectDao();
        allSubjects = subjectDao.getAllSubjects();
    }

    public void insert(Subject subject) {
        AppDatabase.databaseWriteExecutor.execute(() -> {
            subjectDao.insert(subject);
        });
    }

    public void update(Subject subject) {
        AppDatabase.databaseWriteExecutor.execute(() -> {
            subjectDao.update(subject);
        });
    }

    public void delete(Subject subject) {
        AppDatabase.databaseWriteExecutor.execute(() -> {
            subjectDao.delete(subject);
        });
    }

    public LiveData<List<Subject>> getAllSubjects() {
        return allSubjects;
    }

    public LiveData<Subject> getSubjectById(int subjectId) {
        return subjectDao.getSubjectById(subjectId);
    }

    public List<Subject> getAllSubjectsSync() {
        return subjectDao.getAllSubjectsSync();
    }

    public void incrementTotalStudySeconds(int subjectId, long seconds) {
        AppDatabase.databaseWriteExecutor.execute(() ->
                subjectDao.incrementTotalStudySeconds(subjectId, seconds));
    }
}