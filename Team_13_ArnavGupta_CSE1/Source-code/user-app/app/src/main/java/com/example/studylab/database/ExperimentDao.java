package com.example.studylab.database;

import androidx.lifecycle.LiveData;
import androidx.room.Dao;
import androidx.room.Delete;
import androidx.room.Insert;
import androidx.room.Query;
import androidx.room.Update;

import java.util.List;

@Dao
public interface ExperimentDao {
    @Query("SELECT * FROM experiments ORDER BY start_date_millis DESC")
    LiveData<List<Experiment>> getAllExperiments();

    @Query("SELECT * FROM experiments WHERE status = 'ACTIVE' ORDER BY start_date_millis DESC")
    LiveData<List<Experiment>> getActiveExperiments();

    @Query("SELECT * FROM experiments WHERE status = 'COMPLETED' ORDER BY start_date_millis DESC")
    LiveData<List<Experiment>> getCompletedExperiments();

    @Query("SELECT * FROM experiments WHERE id = :experimentId")
    LiveData<Experiment> getExperimentById(int experimentId);

    @Insert
    long insert(Experiment experiment);

    @Update
    void update(Experiment experiment);

    @Delete
    void delete(Experiment experiment);

    @Query("DELETE FROM experiments")
    void deleteAllExperiments();

    @Query("SELECT * FROM experiments WHERE status = 'ACTIVE' ORDER BY start_date_millis DESC LIMIT 1")
    Experiment getFirstActiveSync();

    @Query("UPDATE experiments SET current_day = :currentDay, last_check_in_millis = :lastCheckIn WHERE id = :experimentId")
    void recordCheckIn(int experimentId, int currentDay, long lastCheckIn);
}