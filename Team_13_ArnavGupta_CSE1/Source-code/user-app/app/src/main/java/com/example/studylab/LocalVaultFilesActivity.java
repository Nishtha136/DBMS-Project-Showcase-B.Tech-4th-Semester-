package com.example.studylab;

import android.app.AlertDialog;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.provider.OpenableColumns;
import android.text.TextUtils;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.PopupMenu;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.FileProvider;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.studylab.database.AppDatabase;
import com.example.studylab.database.Subject;
import com.example.studylab.database.SubjectRepository;
import com.example.studylab.database.VaultItem;
import com.example.studylab.database.VaultItemDao;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class LocalVaultFilesActivity extends AppCompatActivity {

    private static final String AUTHORITY = "com.example.studylab.fileprovider";

    private RecyclerView recycler;
    private FilesAdapter adapter;
    private View emptyState;
    private final List<VaultItem> data = new ArrayList<>();
    private final List<Subject> subjects = new ArrayList<>();

    private SubjectRepository subjectRepo;
    private VaultItemDao vaultDao;

    private ActivityResultLauncher<String> filePickerLauncher;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_local_vault_files);

        subjectRepo = new SubjectRepository(this);
        vaultDao = AppDatabase.getInstance(this).vaultItemDao();

        recycler = findViewById(R.id.recyclerLocalFiles);
        emptyState = findViewById(R.id.emptyState);
        recycler.setLayoutManager(new LinearLayoutManager(this));
        adapter = new FilesAdapter();
        recycler.setAdapter(adapter);

        findViewById(R.id.btnBack).setOnClickListener(v -> finish());

        filePickerLauncher = registerForActivityResult(
                new ActivityResultContracts.GetContent(),
                this::onFilePicked);

        findViewById(R.id.fabUpload).setOnClickListener(v -> launchPicker());

        observeFiles();
    }

    private void observeFiles() {
        vaultDao.getAllFiles().observe(this, list -> {
            data.clear();
            if (list != null) data.addAll(list);
            adapter.notifyDataSetChanged();
            emptyState.setVisibility(data.isEmpty() ? View.VISIBLE : View.GONE);
        });
    }

    private void launchPicker() {
        filePickerLauncher.launch("*/*");
    }

    private void onFilePicked(Uri uri) {
        if (uri == null) return;

        // Get original filename + size before subject pick.
        final String[] origName = { "file" };
        final long[] sizeBytes = { 0 };
        try (android.database.Cursor c = getContentResolver().query(uri, null, null, null, null)) {
            if (c != null && c.moveToFirst()) {
                int nameIdx = c.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                int sizeIdx = c.getColumnIndex(OpenableColumns.SIZE);
                if (nameIdx >= 0) origName[0] = c.getString(nameIdx);
                if (sizeIdx >= 0) sizeBytes[0] = c.getLong(sizeIdx);
            }
        } catch (Exception ignored) {}

        AppDatabase.databaseWriteExecutor.execute(() -> {
            List<Subject> loaded = AppDatabase.getInstance(this).subjectDao().getAllSubjectsSync();
            runOnUiThread(() -> {
                subjects.clear();
                if (loaded != null) subjects.addAll(loaded);
                showSubjectPickerThenCopy(uri, origName[0], sizeBytes[0]);
            });
        });
    }

    private void showSubjectPickerThenCopy(Uri uri, String fileName, long sizeBytes) {
        if (subjects.isEmpty()) {
            Toast.makeText(this, "Create a subject in Timer first", Toast.LENGTH_LONG).show();
            return;
        }
        String[] names = new String[subjects.size()];
        for (int i = 0; i < subjects.size(); i++) names[i] = subjects.get(i).name;

        new AlertDialog.Builder(this)
                .setTitle("Choose Subject")
                .setItems(names, (d, which) -> {
                    Subject s = subjects.get(which);
                    copyFileAndInsert(uri, fileName, sizeBytes, s);
                })
                .setNegativeButton("Cancel", null)
                .show();
    }

    private void copyFileAndInsert(Uri uri, String fileName, long sizeBytes, Subject subject) {
        AppDatabase.databaseWriteExecutor.execute(() -> {
            try {
                File subjectDir = new File(getExternalFilesDir(null), "Vault/" + sanitize(subject.name));
                if (!subjectDir.exists() && !subjectDir.mkdirs()) {
                    runOnUiThread(() -> Toast.makeText(this, "Storage create failed", Toast.LENGTH_SHORT).show());
                    return;
                }
                File dest = uniqueFile(subjectDir, fileName);

                long copied = 0;
                try (InputStream in = getContentResolver().openInputStream(uri);
                     FileOutputStream out = new FileOutputStream(dest)) {
                    if (in == null) throw new IllegalStateException("null input stream");
                    byte[] buf = new byte[8192];
                    int read;
                    while ((read = in.read(buf)) > 0) {
                        out.write(buf, 0, read);
                        copied += read;
                    }
                }

                VaultItem v = new VaultItem();
                v.type = "FILE";
                v.title = fileName;
                v.filePath = dest.getAbsolutePath();
                v.fileSizeBytes = sizeBytes > 0 ? sizeBytes : copied;
                v.subjectId = subject.id;
                v.dateAdded = System.currentTimeMillis();
                vaultDao.insert(v);

                runOnUiThread(() ->
                        Toast.makeText(this, "Uploaded to " + subject.name, Toast.LENGTH_SHORT).show());
            } catch (Exception e) {
                runOnUiThread(() ->
                        Toast.makeText(this, "Upload failed: " + e.getMessage(), Toast.LENGTH_LONG).show());
            }
        });
    }

    private String sanitize(String s) {
        if (TextUtils.isEmpty(s)) return "Misc";
        return s.replaceAll("[\\\\/:*?\"<>|]", "_").trim();
    }

    private File uniqueFile(File dir, String desired) {
        File f = new File(dir, desired);
        if (!f.exists()) return f;
        String name = desired;
        String ext = "";
        int dot = desired.lastIndexOf('.');
        if (dot > 0) {
            name = desired.substring(0, dot);
            ext = desired.substring(dot);
        }
        int i = 1;
        while (true) {
            File candidate = new File(dir, name + " (" + i + ")" + ext);
            if (!candidate.exists()) return candidate;
            i++;
        }
    }

    private void openFile(VaultItem v) {
        if (TextUtils.isEmpty(v.filePath)) return;
        File f = new File(v.filePath);
        if (!f.exists()) {
            Toast.makeText(this, "File missing on device", Toast.LENGTH_SHORT).show();
            return;
        }
        try {
            Uri uri = FileProvider.getUriForFile(this, AUTHORITY, f);
            String mime = getContentResolver().getType(uri);
            Intent view = new Intent(Intent.ACTION_VIEW);
            view.setDataAndType(uri, mime != null ? mime : "*/*");
            view.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            startActivity(Intent.createChooser(view, "Open with"));
        } catch (Exception e) {
            Toast.makeText(this, "Cannot open: " + e.getMessage(), Toast.LENGTH_LONG).show();
        }
    }

    private void shareFile(VaultItem v) {
        if (TextUtils.isEmpty(v.filePath)) return;
        File f = new File(v.filePath);
        if (!f.exists()) return;
        try {
            Uri uri = FileProvider.getUriForFile(this, AUTHORITY, f);
            Intent share = new Intent(Intent.ACTION_SEND);
            share.setType(getContentResolver().getType(uri));
            share.putExtra(Intent.EXTRA_STREAM, uri);
            share.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            startActivity(Intent.createChooser(share, "Share via"));
        } catch (Exception e) {
            Toast.makeText(this, "Cannot share: " + e.getMessage(), Toast.LENGTH_SHORT).show();
        }
    }

    private void deleteItem(VaultItem v) {
        new AlertDialog.Builder(this)
                .setTitle("Delete file?")
                .setMessage("This removes it from your vault. The file stays on your device.")
                .setPositiveButton("Delete", (d, w) ->
                        AppDatabase.databaseWriteExecutor.execute(() -> vaultDao.delete(v)))
                .setNegativeButton("Cancel", null)
                .show();
    }

    private class FilesAdapter extends RecyclerView.Adapter<FilesAdapter.VH> {

        @NonNull
        @Override
        public VH onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
            View v = LayoutInflater.from(parent.getContext())
                    .inflate(R.layout.item_local_vault_file, parent, false);
            return new VH(v);
        }

        @Override
        public void onBindViewHolder(@NonNull VH h, int pos) {
            VaultItem v = data.get(pos);
            h.title.setText(v.title);
            h.subtitle.setText(formatBytes(v.fileSizeBytes) + " · "
                    + new SimpleDateFormat("MMM d", Locale.US).format(new Date(v.dateAdded)));

            h.itemView.setOnClickListener(view -> openFile(v));
            h.menu.setOnClickListener(view -> {
                PopupMenu pm = new PopupMenu(LocalVaultFilesActivity.this, view);
                pm.getMenu().add("Open");
                pm.getMenu().add("Share");
                pm.getMenu().add("Delete");
                pm.setOnMenuItemClickListener(item -> {
                    String t = String.valueOf(item.getTitle());
                    if ("Open".equals(t))   openFile(v);
                    if ("Share".equals(t))  shareFile(v);
                    if ("Delete".equals(t)) deleteItem(v);
                    return true;
                });
                pm.show();
            });
        }

        @Override public int getItemCount() { return data.size(); }

        class VH extends RecyclerView.ViewHolder {
            TextView title, subtitle;
            View menu;
            VH(View v) {
                super(v);
                title = v.findViewById(R.id.tvTitle);
                subtitle = v.findViewById(R.id.tvSubtitle);
                menu = v.findViewById(R.id.btnMenu);
            }
        }
    }

    private static String formatBytes(long bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format(Locale.US, "%.1f KB", bytes / 1024f);
        if (bytes < 1024L * 1024 * 1024) return String.format(Locale.US, "%.1f MB", bytes / 1024f / 1024f);
        return String.format(Locale.US, "%.1f GB", bytes / 1024f / 1024f / 1024f);
    }
}
