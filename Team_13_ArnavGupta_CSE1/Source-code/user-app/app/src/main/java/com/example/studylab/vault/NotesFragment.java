package com.example.studylab.vault;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.OpenableColumns;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;
import com.google.android.material.button.MaterialButton;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.example.studylab.R;
import com.example.studylab.api.ApiCallback;
import com.example.studylab.api.Subscription;
import com.google.android.material.textfield.TextInputEditText;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class NotesFragment extends Fragment implements NotesAdapter.OnNoteActionListener {

    private String subjectId;
    private NotesAdapter adapter;
    private final List<VaultFile> notes = new ArrayList<>();
    private ProgressBar progressBar;
    private View emptyState;
    private Subscription filesSubscription = Subscription.empty();

    private Uri pendingFileUri;
    private String pendingFileName;
    private long pendingFileSize;
    private TextView pendingFileLabel;

    private final ActivityResultLauncher<Intent> filePickerLauncher = registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(),
            result -> {
                if (result.getResultCode() == Activity.RESULT_OK && result.getData() != null) {
                    Uri uri = result.getData().getData();
                    if (uri != null) {
                        pendingFileUri = uri;
                        pendingFileName = resolveName(uri);
                        pendingFileSize = resolveSize(uri);
                        if (pendingFileLabel != null) pendingFileLabel.setText(pendingFileName);
                    }
                }
            });

    public static NotesFragment newInstance(String subjectId) {
        NotesFragment f = new NotesFragment();
        Bundle args = new Bundle();
        args.putString("subjectId", subjectId);
        f.setArguments(args);
        return f;
    }

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (getArguments() != null) subjectId = getArguments().getString("subjectId");
    }

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater,
                             @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_notes, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        RecyclerView recyclerView = view.findViewById(R.id.recycler_view);
        progressBar = view.findViewById(R.id.progress_bar);
        emptyState = view.findViewById(R.id.empty_state);

        recyclerView.setLayoutManager(new LinearLayoutManager(getContext()));
        adapter = new NotesAdapter(notes, this);
        recyclerView.setAdapter(adapter);

        loadNotes();
    }

    private void loadNotes() {
        if (subjectId == null) return;
        progressBar.setVisibility(View.VISIBLE);
        filesSubscription = VaultFileRepository.getFilesBySubjectId(subjectId, (files, error) -> {
            if (!isAdded()) return;
            progressBar.setVisibility(View.GONE);
            if (error != null) return;
            notes.clear();
            if (files != null) notes.addAll(files);
            adapter.notifyDataSetChanged();
            emptyState.setVisibility(notes.isEmpty() ? View.VISIBLE : View.GONE);
        });
    }

    public void showAddNoteDialog() {
        pendingFileUri = null;
        pendingFileName = null;
        pendingFileSize = 0;

        View v = LayoutInflater.from(requireContext()).inflate(R.layout.dialog_add_note, null);
        TextInputEditText etName = v.findViewById(R.id.et_note_name);
        TextInputEditText etDesc = v.findViewById(R.id.et_note_description);
        pendingFileLabel = v.findViewById(R.id.tv_file_name);

        AlertDialog dialog = new AlertDialog.Builder(requireContext(), R.style.Theme_Studylab_Dialog)
                .setView(v)
                .create();

        MaterialButton btnPick = v.findViewById(R.id.btn_pick_file);
        MaterialButton btnCancel = v.findViewById(R.id.btn_cancel);
        MaterialButton btnSave = v.findViewById(R.id.btn_save);

        btnPick.setOnClickListener(x -> openFilePicker());
        btnCancel.setOnClickListener(x -> dialog.dismiss());
        btnSave.setOnClickListener(x -> {
            String name = etName.getText() != null ? etName.getText().toString().trim() : "";
            String desc = etDesc.getText() != null ? etDesc.getText().toString().trim() : "";

            if (name.isEmpty()) { etName.setError("Enter a name"); return; }
            if (pendingFileUri == null) { toast("Choose a file first"); return; }

            btnSave.setEnabled(false);
            btnCancel.setEnabled(false);
            btnPick.setEnabled(false);
            btnSave.setText("Saving…");
            uploadAndSave(name, desc, dialog, btnSave, btnCancel, btnPick);
        });

        dialog.show();
    }

    private void openFilePicker() {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("*/*");
        intent.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{
                "application/pdf",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "application/vnd.ms-powerpoint",
                "application/vnd.openxmlformats-officedocument.presentationml.presentation"
        });
        filePickerLauncher.launch(intent);
    }

    private void uploadAndSave(String noteName, String noteDesc, AlertDialog dialog,
                               MaterialButton btnSave, MaterialButton btnCancel,
                               MaterialButton btnPick) {
        progressBar.setVisibility(View.VISIBLE);

        final Runnable restoreButtons = () -> {
            btnSave.setEnabled(true);
            btnCancel.setEnabled(true);
            btnPick.setEnabled(true);
            btnSave.setText(R.string.action_save);
        };

        final Uri fileUri = pendingFileUri;
        final String fileName = pendingFileName;
        final long sizeKb = pendingFileSize / 1024;

        ExecutorService executor = Executors.newSingleThreadExecutor();
        Handler mainHandler = new Handler(Looper.getMainLooper());

        executor.execute(() -> {
            String localPath = null;
            String errorMsg = null;
            try {
                File vaultDir = new File(requireContext().getFilesDir(), "vault");
                if (!vaultDir.exists()) vaultDir.mkdirs();
                File destFile = new File(vaultDir, System.currentTimeMillis() + "_" + fileName);
                try (InputStream in = requireContext().getContentResolver().openInputStream(fileUri);
                     OutputStream out = new FileOutputStream(destFile)) {
                    byte[] buf = new byte[8192];
                    int len;
                    while ((len = in.read(buf)) > 0) out.write(buf, 0, len);
                }
                localPath = destFile.getAbsolutePath();
            } catch (Exception e) {
                errorMsg = e.getMessage();
            }

            final String finalPath = localPath;
            final String finalError = errorMsg;

            mainHandler.post(() -> {
                if (!isAdded()) return;
                if (finalPath == null) {
                    progressBar.setVisibility(View.GONE);
                    restoreButtons.run();
                    toast("Failed to save file: " + finalError);
                    return;
                }

                VaultFile note = new VaultFile();
                note.setSubjectId(subjectId);
                note.setNoteName(noteName);
                note.setNoteDescription(noteDesc);
                note.setFileName(fileName);
                note.setFileLocalPath(finalPath);
                note.setFileType(fileTypeFrom(fileName));
                note.setFileSizeKb(sizeKb);

                VaultFileRepository.addFile(note, new ApiCallback() {
                    @Override
                    public void onSuccess() {
                        if (!isAdded()) return;
                        progressBar.setVisibility(View.GONE);
                        dialog.dismiss();
                        loadNotes();
                    }

                    @Override
                    public void onError(String msg) {
                        if (!isAdded()) return;
                        progressBar.setVisibility(View.GONE);
                        restoreButtons.run();
                        toast("Could not save note");
                    }
                });
            });
        });
    }

    @Override
    public void onEdit(VaultFile note) {
        View v = LayoutInflater.from(requireContext()).inflate(R.layout.dialog_add_note, null);
        TextView title = v.findViewById(R.id.tv_title);
        TextInputEditText etName = v.findViewById(R.id.et_note_name);
        TextInputEditText etDesc = v.findViewById(R.id.et_note_description);
        TextView fileLabel = v.findViewById(R.id.tv_file_name);
        title.setText(R.string.action_edit);
        etName.setText(note.getNoteName());
        etDesc.setText(note.getNoteDescription());
        fileLabel.setText(note.getFileName());
        v.findViewById(R.id.btn_pick_file).setEnabled(false);
        v.findViewById(R.id.btn_pick_file).setAlpha(0.4f);

        AlertDialog dialog = new AlertDialog.Builder(requireContext(), R.style.Theme_Studylab_Dialog)
                .setView(v).create();

        v.findViewById(R.id.btn_cancel).setOnClickListener(x -> dialog.dismiss());
        v.findViewById(R.id.btn_save).setOnClickListener(x -> {
            String name = etName.getText() != null ? etName.getText().toString().trim() : "";
            String desc = etDesc.getText() != null ? etDesc.getText().toString().trim() : "";
            if (name.isEmpty()) { etName.setError("Enter a name"); return; }
            VaultFileRepository.updateNote(note.getId(), name, desc, new ApiCallback() {
                @Override public void onSuccess() { dialog.dismiss(); loadNotes(); }
                @Override public void onError(String msg) { toast("Update failed"); }
            });
        });
        dialog.show();
    }

    @Override
    public void onDelete(VaultFile note) {
        new AlertDialog.Builder(requireContext(), R.style.Theme_Studylab_Dialog)
                .setTitle("Delete note?")
                .setMessage(note.getDisplayTitle())
                .setNegativeButton(R.string.action_cancel, null)
                .setPositiveButton(R.string.action_delete, (d, w) ->
                        VaultFileRepository.deleteFile(note.getId(), note.getFileLocalPath(),
                                new ApiCallback() {
                                    @Override public void onSuccess() { loadNotes(); }
                                    @Override public void onError(String msg) { toast("Could not delete"); }
                                }))
                .show();
    }

    private String resolveName(Uri uri) {
        String result = null;
        try (Cursor cursor = requireContext().getContentResolver()
                .query(uri, null, null, null, null)) {
            if (cursor != null && cursor.moveToFirst()) {
                int index = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                if (index != -1) result = cursor.getString(index);
            }
        } catch (Exception ignored) {}
        return result != null ? result : "file";
    }

    private long resolveSize(Uri uri) {
        try (Cursor cursor = requireContext().getContentResolver()
                .query(uri, null, null, null, null)) {
            if (cursor != null && cursor.moveToFirst()) {
                int index = cursor.getColumnIndex(OpenableColumns.SIZE);
                if (index != -1) return cursor.getLong(index);
            }
        } catch (Exception ignored) {}
        return 0;
    }

    private String fileTypeFrom(String name) {
        if (name == null) return "other";
        String n = name.toLowerCase();
        if (n.endsWith(".pdf")) return "pdf";
        if (n.endsWith(".doc") || n.endsWith(".docx")) return "doc";
        if (n.endsWith(".ppt") || n.endsWith(".pptx")) return "ppt";
        if (n.endsWith(".jpg") || n.endsWith(".jpeg") || n.endsWith(".png")) return "image";
        return "other";
    }

    private void toast(String s) {
        if (getContext() != null) Toast.makeText(getContext(), s, Toast.LENGTH_SHORT).show();
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        filesSubscription.cancel();
    }
}
