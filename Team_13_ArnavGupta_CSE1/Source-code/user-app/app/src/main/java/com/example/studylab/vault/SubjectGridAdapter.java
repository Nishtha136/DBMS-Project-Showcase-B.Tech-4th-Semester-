package com.example.studylab.vault;

import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.example.studylab.R;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class SubjectGridAdapter extends RecyclerView.Adapter<RecyclerView.ViewHolder> {

    private static final int TYPE_SUBJECT = 0;
    private static final int TYPE_NEW = 1;

    public interface OnSubjectClickListener {
        void onSubjectClick(Subject subject);
        void onNewSubjectClick();
    }

    private final List<Subject> subjects;
    private final OnSubjectClickListener listener;
    private final Map<String, Integer> fileCounts = new HashMap<>();
    private final Map<String, Integer> linkCounts = new HashMap<>();

    public SubjectGridAdapter(List<Subject> subjects, OnSubjectClickListener listener) {
        this.subjects = subjects;
        this.listener = listener;
    }

    public void setCounts(Map<String, Integer> files, Map<String, Integer> links) {
        fileCounts.clear();
        fileCounts.putAll(files);
        linkCounts.clear();
        linkCounts.putAll(links);
        notifyDataSetChanged();
    }

    @Override
    public int getItemViewType(int position) {
        return position == subjects.size() ? TYPE_NEW : TYPE_SUBJECT;
    }

    @NonNull
    @Override
    public RecyclerView.ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        LayoutInflater inflater = LayoutInflater.from(parent.getContext());
        if (viewType == TYPE_NEW) {
            View v = inflater.inflate(R.layout.item_new_subject, parent, false);
            return new NewSubjectVH(v);
        }
        View v = inflater.inflate(R.layout.item_subject_grid, parent, false);
        return new SubjectVH(v);
    }

    @Override
    public void onBindViewHolder(@NonNull RecyclerView.ViewHolder holder, int position) {
        if (holder instanceof SubjectVH) {
            Subject subject = subjects.get(position);
            bindSubject((SubjectVH) holder, subject);
        } else {
            holder.itemView.setOnClickListener(v -> listener.onNewSubjectClick());
        }
    }

    private void bindSubject(SubjectVH h, Subject subject) {
        int color = parseColor(subject.getColorHex(), "#1E66F5");
        int lightColor = parseColor(subject.getColorLightHex(),
                Subject.lightColorForName(subject.getName()));

        h.accentBar.setBackgroundColor(color);

        GradientDrawable tileBg = new GradientDrawable();
        tileBg.setShape(GradientDrawable.RECTANGLE);
        tileBg.setCornerRadius(dp(h.tile, 14));
        tileBg.setColor(lightColor);
        h.tile.setBackground(tileBg);

        h.tvInitial.setText(subject.getInitial());
        h.tvInitial.setTextColor(color);
        h.tvName.setText(subject.getName());

        Integer files = fileCounts.get(subject.getId());
        Integer links = linkCounts.get(subject.getId());
        h.tvCount.setText("Files: " + (files == null ? 0 : files)
                + " · Links: " + (links == null ? 0 : links));

        h.itemView.setOnClickListener(v -> listener.onSubjectClick(subject));
    }

    private float dp(View v, int dp) {
        return dp * v.getResources().getDisplayMetrics().density;
    }

    private int parseColor(String hex, String fallback) {
        try { return Color.parseColor(hex); }
        catch (Exception e) { return Color.parseColor(fallback); }
    }

    @Override
    public int getItemCount() { return subjects.size() + 1; }

    static class SubjectVH extends RecyclerView.ViewHolder {
        View accentBar;
        FrameLayout tile;
        TextView tvInitial, tvName, tvCount;

        SubjectVH(@NonNull View itemView) {
            super(itemView);
            accentBar = itemView.findViewById(R.id.accent_bar);
            tile = itemView.findViewById(R.id.tile);
            tvInitial = itemView.findViewById(R.id.tv_initial);
            tvName = itemView.findViewById(R.id.tv_subject_name);
            tvCount = itemView.findViewById(R.id.tv_count);
        }
    }

    static class NewSubjectVH extends RecyclerView.ViewHolder {
        NewSubjectVH(@NonNull View itemView) { super(itemView); }
    }
}
