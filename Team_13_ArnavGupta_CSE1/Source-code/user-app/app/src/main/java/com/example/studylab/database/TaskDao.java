package com.example.studylab.database;

import androidx.lifecycle.LiveData;
import androidx.room.Dao;
import androidx.room.Delete;
import androidx.room.Insert;
import androidx.room.Query;
import androidx.room.Update;

import java.util.List;

@Dao
public interface TaskDao {
    @Query("SELECT * FROM tasks WHERE due_date_millis >= :startOfMonth AND due_date_millis < :endOfMonth ORDER BY due_date_millis")
    LiveData<List<Task>> getTasksForMonth(long startOfMonth, long endOfMonth);

    @Query("SELECT * FROM tasks WHERE due_date_millis >= :startOfDay AND due_date_millis < :endOfDay ORDER BY due_date_millis")
    LiveData<List<Task>> getTasksForDay(long startOfDay, long endOfDay);

    @Insert
    long insert(Task task);

    @Update
    void update(Task task);

    @Delete
    void delete(Task task);

    @Query("DELETE FROM tasks")
    void deleteAllTasks();

    // ---- Sync support --------------------------------------------------

    @Query("SELECT * FROM tasks WHERE server_id = :serverId LIMIT 1")
    Task findByServerId(String serverId);

    @Query("UPDATE tasks SET server_id = :serverId WHERE id = :localId")
    void setServerId(int localId, String serverId);
}
