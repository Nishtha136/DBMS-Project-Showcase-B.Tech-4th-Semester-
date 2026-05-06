package com.example.studylab.ui.vault;

import android.app.Application;

import androidx.annotation.NonNull;
import androidx.lifecycle.AndroidViewModel;
import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;

import com.example.studylab.database.VaultItem;
import com.example.studylab.database.VaultItemRepository;
import com.example.studylab.database.Subject;
import com.example.studylab.database.SubjectRepository;

import java.util.List;

public class VaultViewModel extends AndroidViewModel {
    private VaultItemRepository vaultItemRepository;
    private SubjectRepository subjectRepository;
    
    private LiveData<List<VaultItem>> allVaultItems;
    private LiveData<List<Subject>> allSubjects;
    
    // Selected subject filter (by subjectId, 0 for all)
    private MutableLiveData<Integer> selectedSubjectId = new MutableLiveData<>(0);
    
    public VaultViewModel(@NonNull Application application) {
        super(application);
        vaultItemRepository = new VaultItemRepository(application);
        subjectRepository = new SubjectRepository(application);
        
        allVaultItems = vaultItemRepository.getAllItems();
        allSubjects = subjectRepository.getAllSubjects();
        
        // Default to all subjects (0)
        selectedSubjectId.setValue(0);
    }
    
    public LiveData<List<VaultItem>> getAllVaultItems() {
        return allVaultItems;
    }
    
    public LiveData<List<Subject>> getAllSubjects() {
        return allSubjects;
    }
    
    public LiveData<Integer> getSelectedSubjectId() {
        return selectedSubjectId;
    }
    
    public void setSelectedSubjectId(int subjectId) {
        selectedSubjectId.setValue(subjectId);
    }
    
    // Get vault items filtered by subject (if subjectId is 0, return all)
    public LiveData<List<VaultItem>> getVaultItemsBySubject(int subjectId) {
        if (subjectId == 0) {
            return allVaultItems;
        } else {
            // We would normally have a method in the repository to get by subjectId
            // For now, we'll filter the allVaultItems in the ViewModel (not efficient for large datasets)
            // In a real app, we would use a separate LiveData from the repository that queries by subjectId
            return vaultItemRepository.getItemsBySubject(subjectId);
        }
    }
    
    public void insert(VaultItem vaultItem) {
        vaultItemRepository.insert(vaultItem);
    }
    
    public void update(VaultItem vaultItem) {
        vaultItemRepository.update(vaultItem);
    }
    
    public void delete(VaultItem vaultItem) {
        vaultItemRepository.delete(vaultItem);
    }
}