package com.example.studylab.database;

import android.content.Context;

import androidx.lifecycle.LiveData;

import java.util.List;

public class ExperimentRepository {
    private ExperimentDao experimentDao;
    private LiveData<List<Experiment>> allExperiments;
    private LiveData<List<Experiment>> activeExperiments;
    private LiveData<List<Experiment>> completedExperiments;

    public ExperimentRepository(Context context) {
        AppDatabase database = AppDatabase.getInstance(context);
        experimentDao = database.experimentDao();
        allExperiments = experimentDao.getAllExperiments();
        activeExperiments = experimentDao.getActiveExperiments();
        completedExperiments = experimentDao.getCompletedExperiments();
    }

    public void insert(Experiment experiment) {
        AppDatabase.databaseWriteExecutor.execute(() -> {
            experimentDao.insert(experiment);
        });
    }

    public void update(Experiment experiment) {
        AppDatabase.databaseWriteExecutor.execute(() -> {
            experimentDao.update(experiment);
        });
    }

    public void delete(Experiment experiment) {
        AppDatabase.databaseWriteExecutor.execute(() -> {
            experimentDao.delete(experiment);
        });
    }

    public LiveData<List<Experiment>> getAllExperiments() {
        return allExperiments;
    }

    public LiveData<List<Experiment>> getActiveExperiments() {
        return activeExperiments;
    }

    public LiveData<List<Experiment>> getCompletedExperiments() {
        return completedExperiments;
    }

    public LiveData<Experiment> getExperimentById(int experimentId) {
        return experimentDao.getExperimentById(experimentId);
    }
}