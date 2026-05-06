package com.example.studylab.vault;

import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ProgressBar;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.example.studylab.R;
import com.example.studylab.api.Subscription;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class SubjectsGridFragment extends Fragment implements SubjectGridAdapter.OnSubjectClickListener {

    public interface NewSubjectRequestListener {
        void onRequestNewSubject();
    }

    private SubjectGridAdapter adapter;
    private final List<Subject> subjects = new ArrayList<>();
    private final Map<String, Integer> fileCounts = new HashMap<>();
    private final Map<String, Integer> linkCounts = new HashMap<>();
    private ProgressBar progressBar;
    private View emptyState;
    private Subscription subjectsSubscription = Subscription.empty();
    private Subscription filesSubscription = Subscription.empty();
    private Subscription linksSubscription = Subscription.empty();

    public static SubjectsGridFragment newInstance() {
        return new SubjectsGridFragment();
    }

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater,
                             @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_subjects_grid, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        RecyclerView recyclerView = view.findViewById(R.id.recycler_view);
        progressBar = view.findViewById(R.id.progress_bar);
        emptyState = view.findViewById(R.id.empty_state);

        GridLayoutManager lm = new GridLayoutManager(getContext(), 2);
        recyclerView.setLayoutManager(lm);
        adapter = new SubjectGridAdapter(subjects, this);
        recyclerView.setAdapter(adapter);

        loadSubjects();
        loadCounts();
    }

    public void refresh() {
        loadSubjects();
        loadCounts();
    }

    private void loadSubjects() {
        progressBar.setVisibility(View.VISIBLE);
        subjectsSubscription = SubjectRepository.getAllSubjects((subjectList, error) -> {
            if (!isAdded()) return;
            progressBar.setVisibility(View.GONE);
            if (error != null) {
                Toast.makeText(getContext(), "Error: " + error, Toast.LENGTH_SHORT).show();
                return;
            }
            subjects.clear();
            if (subjectList != null) subjects.addAll(subjectList);
            adapter.notifyDataSetChanged();
            emptyState.setVisibility(subjects.isEmpty() ? View.VISIBLE : View.GONE);
        });
    }

    private void loadCounts() {
        filesSubscription = VaultFileRepository.getAllFiles((files, error) -> {
            if (!isAdded() || error != null) return;
            fileCounts.clear();
            if (files != null) {
                for (VaultFile f : files) {
                    String sid = f.getSubjectId();
                    if (sid == null) continue;
                    fileCounts.put(sid, fileCounts.getOrDefault(sid, 0) + 1);
                }
            }
            adapter.setCounts(fileCounts, linkCounts);
        });

        linksSubscription = VaultLinkRepository.getAllLinks((links, error) -> {
            if (!isAdded() || error != null) return;
            linkCounts.clear();
            if (links != null) {
                for (VaultLink l : links) {
                    String sid = l.getSubjectId();
                    if (sid == null) continue;
                    linkCounts.put(sid, linkCounts.getOrDefault(sid, 0) + 1);
                }
            }
            adapter.setCounts(fileCounts, linkCounts);
        });
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        subjectsSubscription.cancel();
        filesSubscription.cancel();
        linksSubscription.cancel();
    }

    @Override
    public void onSubjectClick(Subject subject) {
        Intent intent = new Intent(getActivity(), SubjectDetailActivity.class);
        intent.putExtra("subjectId", subject.getId());
        intent.putExtra("subjectName", subject.getName());
        intent.putExtra("subjectColorHex", subject.getColorHex());
        startActivity(intent);
    }

    @Override
    public void onNewSubjectClick() {
        Fragment parent = getParentFragment();
        if (parent instanceof NewSubjectRequestListener) {
            ((NewSubjectRequestListener) parent).onRequestNewSubject();
        }
    }
}
