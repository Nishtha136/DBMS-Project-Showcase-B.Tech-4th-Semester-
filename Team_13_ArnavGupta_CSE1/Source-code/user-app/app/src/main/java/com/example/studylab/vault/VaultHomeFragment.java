package com.example.studylab.vault;

import android.app.AlertDialog;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import com.example.studylab.R;
import com.example.studylab.api.ApiCallback;
import com.google.android.material.floatingactionbutton.FloatingActionButton;

public class VaultHomeFragment extends Fragment
        implements SubjectsGridFragment.NewSubjectRequestListener {

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater,
                             @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_vault_home, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        if (savedInstanceState == null) {
            getChildFragmentManager()
                    .beginTransaction()
                    .replace(R.id.subjects_container, SubjectsGridFragment.newInstance())
                    .commit();
        }

        FloatingActionButton fab = view.findViewById(R.id.fab_add);
        fab.setOnClickListener(v -> showNewSubjectDialog());
    }

    @Override
    public void onRequestNewSubject() {
        showNewSubjectDialog();
    }

    private void showNewSubjectDialog() {
        View dialogView = LayoutInflater.from(requireContext())
                .inflate(R.layout.dialog_new_subject, null);
        EditText etName = dialogView.findViewById(R.id.et_subject_name);

        AlertDialog dialog = new AlertDialog.Builder(requireContext(), R.style.Theme_Studylab_Dialog)
                .setView(dialogView)
                .create();

        dialogView.findViewById(R.id.btn_cancel).setOnClickListener(v -> dialog.dismiss());
        dialogView.findViewById(R.id.btn_create).setOnClickListener(v -> {
            String name = etName.getText().toString().trim();
            if (name.isEmpty()) { etName.setError("Enter a subject name"); return; }
            createSubject(name, dialog);
        });

        dialog.show();
    }

    private void createSubject(String name, AlertDialog dialog) {
        Subject subject = new Subject(name, "");
        SubjectRepository.addSubject(subject, new ApiCallback() {
            @Override
            public void onSuccess() {
                if (!isAdded()) return;
                dialog.dismiss();
                Toast.makeText(getContext(), "Subject created", Toast.LENGTH_SHORT).show();
                Fragment f = getChildFragmentManager()
                        .findFragmentById(R.id.subjects_container);
                if (f instanceof SubjectsGridFragment) ((SubjectsGridFragment) f).refresh();
            }

            @Override
            public void onError(String msg) {
                if (!isAdded()) return;
                Toast.makeText(getContext(), "Error: " + msg, Toast.LENGTH_SHORT).show();
            }
        });
    }
}
