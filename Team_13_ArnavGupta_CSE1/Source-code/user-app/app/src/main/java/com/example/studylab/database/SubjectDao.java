package com.example.studylab.database;

import androidx.lifecycle.LiveData;
import androidx.room.Dao;
import androidx.room.Delete;
import androidx.room.Insert;
import androidx.room.Query;
import androidx.room.Update;

import java.util.List;

@Dao
public interface SubjectDao {
    @Query("SELECT * FROM subjects ORDER BY name")
    LiveData<List<Subject>> getAllSubjects();

    @Query("SELECT * FROM subjects WHERE id = :subjectId")
    LiveData<Subject> getSubjectById(int subjectId);

    @Insert
    long insert(Subject subject);

    @Update
    void update(Subject subject);

    @Delete
    void delete(Subject subject);

    @Query("SELECT * FROM subjects ORDER BY name")
    List<Subject> getAllSubjectsSync();

    @Query("UPDATE subjects SET total_study_seconds = total_study_seconds + :seconds WHERE id = :subjectId")
    void incrementTotalStudySeconds(int subjectId, long seconds);

    @Query("DELETE FROM subjects")
    void deleteAllSubjects();
}