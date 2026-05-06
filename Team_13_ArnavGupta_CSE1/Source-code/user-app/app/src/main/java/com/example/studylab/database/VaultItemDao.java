package com.example.studylab.database;

import androidx.lifecycle.LiveData;
import androidx.room.Dao;
import androidx.room.Delete;
import androidx.room.Insert;
import androidx.room.Query;
import androidx.room.Update;

import java.util.List;

@Dao
public interface VaultItemDao {
    @Query("SELECT * FROM vault_items WHERE subject_id = :subjectId ORDER BY date_added DESC")
    LiveData<List<VaultItem>> getItemsBySubject(int subjectId);

    @Query("SELECT * FROM vault_items ORDER BY date_added DESC")
    LiveData<List<VaultItem>> getAllItems();

    @Query("SELECT * FROM vault_items WHERE type = 'FILE' ORDER BY subject_id, date_added DESC")
    LiveData<List<VaultItem>> getAllFiles();

    @Query("SELECT * FROM vault_items WHERE type = 'LINK' ORDER BY subject_id, date_added DESC")
    LiveData<List<VaultItem>> getAllLinks();

    @Query("SELECT COUNT(*) FROM vault_items WHERE subject_id = :subjectId AND type = 'FILE'")
    int countFilesForSubject(int subjectId);

    @Query("SELECT COUNT(*) FROM vault_items WHERE subject_id = :subjectId AND type = 'LINK'")
    int countLinksForSubject(int subjectId);

    @Insert
    long insert(VaultItem vaultItem);

    @Update
    void update(VaultItem vaultItem);

    @Delete
    void delete(VaultItem vaultItem);

    @Query("DELETE FROM vault_items")
    void deleteAllVaultItems();
}