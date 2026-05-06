package com.example.studylab.ui.vault;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.ViewModelProvider;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.studylab.R;
import com.example.studylab.database.VaultItem;
import com.example.studylab.database.VaultItem.Type;
import com.google.android.material.bottomsheet.BottomSheetDialog;
import com.google.android.material.chip.Chip;

import java.util.ArrayList;
import java.util.List;

public class VaultFragment extends Fragment {
    private VaultViewModel viewModel;
    private RecyclerView materialRecyclerView;
    private LinearLayout chipContainer;
    private VaultMaterialAdapter materialAdapter;
    
    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        viewModel = new ViewModelProvider(this).get(VaultViewModel.class);
    }

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_vault, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        
        materialRecyclerView = view.findViewById(R.id.material_recycler_view);
        chipContainer = view.findViewById(R.id.chip_container);
        
        // Setup RecyclerView
        materialRecyclerView.setLayoutManager(new LinearLayoutManager(requireContext()));
        materialAdapter = new VaultMaterialAdapter();
        materialRecyclerView.setAdapter(materialAdapter);
        
        // Setup FAB click listener
        view.findViewById(R.id.fab_add).setOnClickListener(v -> showAddMaterialBottomSheet());
        
        // Observe ViewModel changes
        observeViewModel();
    }
    
    private void observeViewModel() {
        // Observe selected subject changes
        viewModel.getSelectedSubjectId().observe(getViewLifecycleOwner(), subjectId -> {
            // Update chip selection
            updateChipSelection(subjectId);
            
            // Reload materials for the selected subject
            loadMaterials();
        });
        
        // Observe all subjects for chip creation
        viewModel.getAllSubjects().observe(getViewLifecycleOwner(), subjects -> {
            setupSubjectChips(subjects);
        });
        
        // Observe vault items
        viewModel.getAllVaultItems().observe(getViewLifecycleOwner(), vaultItems -> {
            // Filter by selected subject
            int selectedSubjectId = viewModel.getSelectedSubjectId().getValue();
            if (selectedSubjectId == 0) {
                // Show all items
                materialAdapter.setVaultItems(vaultItems);
            } else {
                // Filter items by subject
                List<VaultItem> filteredItems = new ArrayList<>();
                for (VaultItem item : vaultItems) {
                    if (item.getSubjectId() == selectedSubjectId) {
                        filteredItems.add(item);
                    }
                }
                materialAdapter.setVaultItems(filteredItems);
            }
        });
    }
    
    private void loadMaterials() {
        // Triggered by observers when data changes
    }
    
    private void setupSubjectChips(List<com.example.studylab.database.Subject> subjects) {
        // Clear existing chips
        chipContainer.removeAllViews();
        
        // Add "All" chip first
        Chip allChip = new Chip(requireContext());
        allChip.setText("All");
        allChip.setCheckable(true);
        allChip.setChecked(true); // Default selection
        allChip.setChipBackgroundColorResource(R.color.chip_unselected);
        allChip.setTextColor(getResources().getColor(R.color.text_primary, null));
        allChip.setOnClickListener(v -> {
            // Set all chips to unselected state
            for (int i = 0; i < chipContainer.getChildCount(); i++) {
                if (chipContainer.getChildAt(i) instanceof Chip) {
                    Chip chip = (Chip) chipContainer.getChildAt(i);
                    chip.setChecked(false);
                    chip.setChipBackgroundColorResource(R.color.chip_unselected);
                    chip.setTextColor(getResources().getColor(R.color.text_primary, null));
                }
            }
            // Select this chip
            allChip.setChecked(true);
            allChip.setChipBackgroundColorResource(R.color.chip_selected);
            allChip.setTextColor(getResources().getColor(R.color.white, null));
            
            // Update ViewModel
            viewModel.setSelectedSubjectId(0); // 0 means all subjects
        });
        chipContainer.addView(allChip);
        
        // Add chips for each subject
        for (com.example.studylab.database.Subject subject : subjects) {
            Chip chip = new Chip(requireContext());
            chip.setText(subject.getName());
            chip.setCheckable(true);
            chip.setChipBackgroundColorResource(R.color.chip_unselected);
            chip.setTextColor(getResources().getColor(R.color.text_primary, null));
            
            final int subjectId = subject.getId();
            chip.setOnClickListener(v -> {
                // Set all chips to unselected state
                for (int i = 0; i < chipContainer.getChildCount(); i++) {
                    if (chipContainer.getChildAt(i) instanceof Chip) {
                        Chip c = (Chip) chipContainer.getChildAt(i);
                        c.setChecked(false);
                        c.setChipBackgroundColorResource(R.color.chip_unselected);
                        c.setTextColor(getResources().getColor(R.color.text_primary, null));
                    }
                }
                // Select this chip
                chip.setChecked(true);
                chip.setChipBackgroundColorResource(R.color.chip_selected);
                chip.setTextColor(getResources().getColor(R.color.white, null));
                
                // Update ViewModel
                viewModel.setSelectedSubjectId(subjectId);
            });
            chipContainer.addView(chip);
        }
    }
    
    private void updateChipSelection(int selectedSubjectId) {
        // Update chip UI based on ViewModel state
        for (int i = 0; i < chipContainer.getChildCount(); i++) {
            View view = chipContainer.getChildAt(i);
            if (view instanceof Chip) {
                Chip chip = (Chip) view;
                if (i == 0) {
                    // "All" chip
                    chip.setChecked(selectedSubjectId == 0);
                } else {
                    // Subject chips (index 1 onwards)
                    // We would need to map index to subjectId, but for simplicity
                    // we'll just set based on position (assuming subjects are in same order)
                    chip.setChecked(i - 1 == selectedSubjectId); // Simplified
                }
                
                // Update appearance
                if (chip.isChecked()) {
                    chip.setChipBackgroundColorResource(R.color.chip_selected);
                    chip.setTextColor(getResources().getColor(R.color.white, null));
                } else {
                    chip.setChipBackgroundColorResource(R.color.chip_unselected);
                    chip.setTextColor(getResources().getColor(R.color.text_primary, null));
                }
            }
        }
    }
    
    private void showAddMaterialBottomSheet() {
        BottomSheetDialog bottomSheetDialog = new BottomSheetDialog(requireContext());
        bottomSheetDialog.setContentView(R.layout.bottom_sheet_add_material);
        
        // Setup buttons in bottom sheet
        bottomSheetDialog.findViewById(R.id.btn_upload_file).setOnClickListener(v -> {
            bottomSheetDialog.dismiss();
            showFilePicker();
        });
        
        bottomSheetDialog.findViewById(R.id.btn_add_link).setOnClickListener(v -> {
            bottomSheetDialog.dismiss();
            showAddLinkForm();
        });
        
        bottomSheetDialog.findViewById(R.id.btn_new_snippet).setOnClickListener(v -> {
            bottomSheetDialog.dismiss();
            showAddSnippetForm();
        });
        
        bottomSheetDialog.show();
    }
    
    private void showFilePicker() {
        // Launch file picker intent
        Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
        intent.setType("*/*"); // All files
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        
        try {
            startActivityForResult(Intent.createChooser(intent, "Select File"), 1001);
        } catch (android.content.ActivityNotFoundException ex) {
            // Potentially direct the user to the Market with a Dialog
            Toast.makeText(requireContext(), "Please install a File Manager", Toast.LENGTH_SHORT).show();
        }
    }
    
    private void showAddLinkForm() {
        // In a real implementation, we would show a form/dialog to add a link
        // For now, we'll just show a toast
        Toast.makeText(requireContext(), "Add Link form would be shown here", Toast.LENGTH_SHORT).show();
    }
    
    private void showAddSnippetForm() {
        // In a real implementation, we would show a form/dialog to add a snippet
        // For now, we'll just show a toast
        Toast.makeText(requireContext(), "New Snippet form would be shown here", Toast.LENGTH_SHORT).show();
    }
    
    // Handle file picker result
    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == 1001 && resultCode == Activity.RESULT_OK) {
            // Handle the selected file
            Uri fileUri = data.getData();
            if (fileUri != null) {
                // In a real implementation, we would:
                // 1. Get file metadata (name, size, type)
                // 2. Copy the file to app-specific storage
                // 3. Create a VaultItem and save it to the database
                
                // For now, we'll just show a toast
                Toast.makeText(requireContext(), "File selected: " + fileUri.getLastPathSegment(), Toast.LENGTH_SHORT).show();
            }
        }
    }
    
    // Adapter for vault materials
    private class VaultMaterialAdapter extends RecyclerView.Adapter<VaultMaterialAdapter.MaterialViewHolder> {
        private List<VaultItem> vaultItems = new ArrayList<>();
        
        public void setVaultItems(List<VaultItem> vaultItems) {
            this.vaultItems = vaultItems;
            notifyDataSetChanged();
        }
        
        @NonNull
        @Override
        public MaterialViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
            View view = LayoutInflater.from(parent.getContext())
                    .inflate(R.layout.item_vault_material, parent, false);
            return new MaterialViewHolder(view);
        }
        
        @Override
        public void onBindViewHolder(@NonNull MaterialViewHolder holder, int position) {
            VaultItem item = vaultItems.get(position);
            
            // Set title
            holder.titleTextView.setText(item.getTitle());
            
            // Set type icon and preview
            setTypeInfo(holder, item);
            
            // Set subject tag (would need to get subject name from repository)
            holder.subjectTagTextView.setText("Subject " + item.getSubjectId()); // Placeholder
            holder.subjectTagTextView.setBackgroundColor(getRandomSubjectColor());
            
            // Set date (would need to format properly)
            holder.dateTextView.setText("Jan 15"); // Placeholder
        }
        
        private void setTypeInfo(MaterialViewHolder holder, VaultItem item) {
            switch (item.getType()) {
                case "FILE":
                    holder.typeIconImageView.setImageResource(R.drawable.ic_file);
                    holder.previewTextView.setText(getFileExtension(item.getFilePath()));
                    break;
                case "LINK":
                    holder.typeIconImageView.setImageResource(R.drawable.ic_link);
                    holder.previewTextView.setText(extractDomain(item.getContent()));
                    break;
                case "TEXT":
                    holder.typeIconImageView.setImageResource(R.drawable.ic_note);
                    String preview = item.getContent().length() > 60 ?
                            item.getContent().substring(0, 57) + "..." :
                            item.getContent();
                    holder.previewTextView.setText(preview);
                    break;
                default:
                    holder.typeIconImageView.setImageResource(R.drawable.ic_file);
                    holder.previewTextView.setText("?");
            }
        }
        
        private String getFileExtension(String filePath) {
            if (filePath == null) return "";
            int i = filePath.lastIndexOf('.');
            if (i > 0) {
                return filePath.substring(i + 1).toUpperCase();
            }
            return "";
        }
        
        private String extractDomain(String url) {
            try {
                java.net.URL u = new java.net.URL(url);
                return u.getHost();
            } catch (Exception e) {
                return url;
            }
        }
        
        private int getRandomSubjectColor() {
            // Return a random subject color for the tag background
            int[] colors = {
                    R.color.subject_physics,
                    R.color.subject_math,
                    R.color.subject_history,
                    R.color.subject_biology
            };
            return colors[(int) (Math.random() * colors.length)];
        }
        
        @Override
        public int getItemCount() {
            return vaultItems.size();
        }
        
        class MaterialViewHolder extends RecyclerView.ViewHolder {
            ImageView typeIconImageView;
            TextView titleTextView;
            TextView previewTextView;
            TextView subjectTagTextView;
            TextView dateTextView;
            
            MaterialViewHolder(View itemView) {
                super(itemView);
                typeIconImageView = itemView.findViewById(R.id.type_icon_image_view);
                titleTextView = itemView.findViewById(R.id.title_text_view);
                previewTextView = itemView.findViewById(R.id.preview_text_view);
                subjectTagTextView = itemView.findViewById(R.id.subject_tag_text_view);
                dateTextView = itemView.findViewById(R.id.date_text_view);
            }
        }
    }
}