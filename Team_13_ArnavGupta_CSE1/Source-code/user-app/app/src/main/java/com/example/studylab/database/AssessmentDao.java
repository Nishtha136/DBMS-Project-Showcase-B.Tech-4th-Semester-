package com.example.studylab.database;

import androidx.lifecycle.LiveData;
import androidx.room.Dao;
import androidx.room.Delete;
import androidx.room.Insert;
import androidx.room.Query;
import androidx.room.Update;

import java.util.List;

@Dao
public interface AssessmentDao {
    @Query("SELECT * FROM assessments WHERE subject_id = :subjectId AND date_time_millis >= :startOfDay AND date_time_millis < :endOfDay ORDER BY date_time_millis")
    LiveData<List<Assessment>> getAssessmentsByDate(int subjectId, long startOfDay, long endOfDay);

    @Query("SELECT * FROM assessments WHERE date_time_millis >= :startOfMonth AND date_time_millis < :endOfMonth ORDER BY date_time_millis")
    LiveData<List<Assessment>> getAssessmentsForMonth(long startOfMonth, long endOfMonth);

    @Query("SELECT * FROM assessments WHERE date_time_millis >= :startOfMillis ORDER BY date_time_millis LIMIT 1")
    LiveData<Assessment> getNextAssessment(long startOfMillis);

    @Insert
    long insert(Assessment assessment);

    @Update
    void update(Assessment assessment);

    @Delete
    void delete(Assessment assessment);

    @Query("DELETE FROM assessments")
    void deleteAllAssessments();

    @Query("SELECT * FROM assessments ORDER BY date_time_millis ASC")
    LiveData<List<Assessment>> getAllAssessments();

    @Query("SELECT * FROM assessments WHERE date_time_millis >= :startMillis AND date_time_millis < :endMillis ORDER BY date_time_millis ASC")
    LiveData<List<Assessment>> getAssessmentsInRange(long startMillis, long endMillis);

    // ---- Sync support --------------------------------------------------

    @Query("SELECT * FROM assessments WHERE server_id = :serverId LIMIT 1")
    Assessment findByServerId(String serverId);

    @Query("UPDATE assessments SET server_id = :serverId WHERE id = :localId")
    void setServerId(int localId, String serverId);
}