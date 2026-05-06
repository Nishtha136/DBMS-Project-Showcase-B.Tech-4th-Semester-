package com.example.studylab.database;

import androidx.lifecycle.LiveData;
import androidx.room.Dao;
import androidx.room.Delete;
import androidx.room.Insert;
import androidx.room.Query;
import androidx.room.Update;

import java.util.List;

@Dao
public interface StudySessionDao {
    @Query("SELECT * FROM study_sessions WHERE subject_id = :subjectId AND date LIKE :monthPattern ORDER BY date")
    LiveData<List<StudySession>> getSessionsBySubjectAndMonth(int subjectId, String monthPattern); // e.g., "2025-03-%"

    @Query("SELECT * FROM study_sessions WHERE date = :date ORDER BY start_time")
    LiveData<List<StudySession>> getSessionsByDate(String date); // e.g., "2025-03-15"

    @Query("SELECT * FROM study_sessions WHERE date LIKE :monthPattern ORDER BY date, start_time")
    LiveData<List<StudySession>> getAllSessionsForMonth(String monthPattern); // e.g., "2025-03-%"

    @Insert
    long insert(StudySession studySession);

    @Update
    void update(StudySession studySession);

    @Delete
    void delete(StudySession studySession);

    @Query("DELETE FROM study_sessions")
    void deleteAllStudySessions();

    @Query("SELECT COALESCE(SUM(duration_seconds), 0) / 3600.0 FROM study_sessions WHERE date = :date")
    float getTotalHoursByDate(String date);

    @Query("SELECT date, COALESCE(SUM(duration_seconds), 0) / 3600.0 as hours FROM study_sessions WHERE date LIKE :monthPattern GROUP BY date")
    List<DateHours> getHoursPerDayForMonth(String monthPattern); // e.g. "2025-03-%"

    @Query("SELECT COALESCE(SUM(duration_seconds), 0) FROM study_sessions WHERE date = :date")
    int getTotalSecondsForDateSync(String date);

    @Query("SELECT COALESCE(SUM(duration_seconds), 0) FROM study_sessions WHERE date LIKE :yearMonth || '%'")
    int getTotalSecondsForMonthSync(String yearMonth); // e.g. "2025-03"

    @Query("SELECT COUNT(DISTINCT date) FROM study_sessions WHERE date LIKE :yearMonth || '%'")
    int getStudyDaysCountForMonthSync(String yearMonth); // e.g. "2025-03"

    @Query("SELECT date, COALESCE(SUM(duration_seconds), 0) as totalSeconds FROM study_sessions WHERE date LIKE :yearMonth || '%' GROUP BY date ORDER BY date")
    List<DailyStudyTotal> getDailyTotalsForMonth(String yearMonth);

    @Query("SELECT * FROM study_sessions WHERE start_time >= :sinceMillis ORDER BY start_time DESC")
    List<StudySession> getAllSessionsSince(long sinceMillis);
}