package com.example.studylab.database;

import androidx.lifecycle.LiveData;
import androidx.room.Dao;
import androidx.room.Delete;
import androidx.room.Insert;
import androidx.room.Query;
import androidx.room.Update;

import java.util.List;

@Dao
public interface CheckInDao {
    @Query("SELECT * FROM check_ins WHERE experiment_id = :experimentId ORDER BY date_millis DESC")
    LiveData<List<CheckIn>> getCheckInsByExperiment(int experimentId);

    @Query("SELECT * FROM check_ins WHERE experiment_id = :experimentId AND date_millis >= :startOfDay AND date_millis < :endOfDay")
    LiveData<List<CheckIn>> getCheckInsByExperimentAndDate(int experimentId, long startOfDay, long endOfDay);

    @Insert
    long insert(CheckIn checkIn);

    @Update
    void update(CheckIn checkIn);

    @Delete
    void delete(CheckIn checkIn);

    @Query("DELETE FROM check_ins")
    void deleteAllCheckIns();

    // ---- Sync support --------------------------------------------------

    @Query("SELECT * FROM check_ins WHERE server_id = :serverId LIMIT 1")
    CheckIn findByServerId(String serverId);

    @Query("UPDATE check_ins SET server_id = :serverId WHERE id = :localId")
    void setServerId(int localId, String serverId);
}