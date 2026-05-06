package com.example.studylab.database;

import android.content.Context;

import androidx.lifecycle.LiveData;

import java.util.List;

public class VaultItemRepository {
    private VaultItemDao vaultItemDao;
    private LiveData<List<VaultItem>> allItems;

    public VaultItemRepository(Context context) {
        AppDatabase database = AppDatabase.getInstance(context);
        vaultItemDao = database.vaultItemDao();
        allItems = vaultItemDao.getAllItems();
    }

    public void insert(VaultItem vaultItem) {
        AppDatabase.databaseWriteExecutor.execute(() -> {
            vaultItemDao.insert(vaultItem);
        });
    }

    public void update(VaultItem vaultItem) {
        AppDatabase.databaseWriteExecutor.execute(() -> {
            vaultItemDao.update(vaultItem);
        });
    }

    public void delete(VaultItem vaultItem) {
        AppDatabase.databaseWriteExecutor.execute(() -> {
            vaultItemDao.delete(vaultItem);
        });
    }

    public LiveData<List<VaultItem>> getItemsBySubject(int subjectId) {
        return vaultItemDao.getItemsBySubject(subjectId);
    }

    public LiveData<List<VaultItem>> getAllItems() {
        return allItems;
    }
}