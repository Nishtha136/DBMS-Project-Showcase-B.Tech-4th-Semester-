package com.example.studylab.database;

import android.content.Context;

import androidx.room.Database;
import androidx.room.Room;
import androidx.room.RoomDatabase;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Database(entities = {Subject.class, StudySession.class, VaultItem.class, Assessment.class, Experiment.class, CheckIn.class, Task.class}, version = 7, exportSchema = false)
public abstract class AppDatabase extends RoomDatabase {
    private static AppDatabase instance;

    public static final ExecutorService databaseWriteExecutor = Executors.newFixedThreadPool(4);

    public abstract SubjectDao subjectDao();
    public abstract StudySessionDao studySessionDao();
    public abstract VaultItemDao vaultItemDao();
    public abstract AssessmentDao assessmentDao();
    public abstract ExperimentDao experimentDao();
    public abstract CheckInDao checkInDao();
    public abstract TaskDao taskDao();

    public static synchronized AppDatabase getInstance(Context context) {
        if (instance == null) {
            instance = Room.databaseBuilder(context.getApplicationContext(),
                            AppDatabase.class, "study_lab_database")
                    .fallbackToDestructiveMigration()
                    .build();
        }
        return instance;
    }
}