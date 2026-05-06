package com.example.studylab.vault;

import android.content.Context;
import android.content.Intent;
import android.graphics.PorterDuff;
import android.net.Uri;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.PopupMenu;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.core.content.FileProvider;
import androidx.recyclerview.widget.RecyclerView;
import com.example.studylab.R;
import java.io.File;
import java.util.List;

public class NotesAdapter extends RecyclerView.Adapter<NotesAdapter.NoteViewHolder> {

    public interface OnNoteActionListener {
        void onEdit(VaultFile note);
        void onDelete(VaultFile note);
    }

    private final List<VaultFile> notes;
    private final OnNoteActionListener actionListener;

    public NotesAdapter(List<VaultFile> notes, OnNoteActionListener listener) {
        this.notes = notes;
        this.actionListener = listener;
    }

    public NotesAdapter(List<VaultFile> notes) {
        this(notes, null);
    }

    @NonNull
    @Override
    public NoteViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_note, parent, false);
        return new NoteViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull NoteViewHolder h, int position) {
        VaultFile note = notes.get(position);
        Context ctx = h.itemView.getContext();

        h.tvName.setText(note.getDisplayTitle());

        if (note.getNoteDescription() != null && !note.getNoteDescription().isEmpty()) {
            h.tvDesc.setVisibility(View.VISIBLE);
            h.tvDesc.setText(note.getNoteDescription());
        } else {
            h.tvDesc.setVisibility(View.GONE);
        }

        String info = note.getFileName() == null ? "" : note.getFileName();
        if (note.getFileSizeKb() > 0) info += " • " + note.getFormattedSize();
        h.tvInfo.setText(info);

        h.ivIcon.setImageResource(FileTypeStyle.iconRes(note.getFileType()));
        h.ivIcon.setColorFilter(FileTypeStyle.tint(ctx, note.getFileType()), PorterDuff.Mode.SRC_IN);
        FileTypeStyle.applyTileBg(h.iconTile, FileTypeStyle.tintLight(ctx, note.getFileType()));

        h.itemView.setOnClickListener(v -> openFile(v.getContext(), note.getFileLocalPath()));

        if (actionListener != null) {
            h.ivMenu.setVisibility(View.VISIBLE);
            h.ivMenu.setOnClickListener(v -> showMenu(v, note));
        } else {
            h.ivMenu.setVisibility(View.GONE);
        }
    }

    private void openFile(Context ctx, String localPath) {
        if (localPath == null || localPath.isEmpty()) return;
        try {
            File file = new File(localPath);
            Uri uri = FileProvider.getUriForFile(ctx, ctx.getPackageName() + ".fileprovider", file);
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(uri, mimeTypeFor(localPath));
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            ctx.startActivity(intent);
        } catch (Exception e) {
            Toast.makeText(ctx, "No app can open this file", Toast.LENGTH_SHORT).show();
        }
    }

    private String mimeTypeFor(String path) {
        String p = path.toLowerCase();
        if (p.endsWith(".pdf"))  return "application/pdf";
        if (p.endsWith(".doc"))  return "application/msword";
        if (p.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        if (p.endsWith(".ppt"))  return "application/vnd.ms-powerpoint";
        if (p.endsWith(".pptx")) return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
        return "*/*";
    }

    private void showMenu(View anchor, VaultFile note) {
        PopupMenu menu = new PopupMenu(anchor.getContext(), anchor);
        menu.inflate(R.menu.menu_item_actions);
        menu.setOnMenuItemClickListener(item -> {
            int id = item.getItemId();
            if (id == R.id.action_edit)   { actionListener.onEdit(note);   return true; }
            if (id == R.id.action_delete) { actionListener.onDelete(note); return true; }
            return false;
        });
        menu.show();
    }

    @Override
    public int getItemCount() { return notes.size(); }

    static class NoteViewHolder extends RecyclerView.ViewHolder {
        FrameLayout iconTile;
        ImageView ivIcon, ivMenu;
        TextView tvName, tvDesc, tvInfo;

        NoteViewHolder(@NonNull View itemView) {
            super(itemView);
            iconTile = itemView.findViewById(R.id.icon_tile);
            ivIcon   = itemView.findViewById(R.id.iv_file_type);
            ivMenu   = itemView.findViewById(R.id.iv_menu);
            tvName   = itemView.findViewById(R.id.tv_note_name);
            tvDesc   = itemView.findViewById(R.id.tv_note_description);
            tvInfo   = itemView.findViewById(R.id.tv_file_info);
        }
    }
}
