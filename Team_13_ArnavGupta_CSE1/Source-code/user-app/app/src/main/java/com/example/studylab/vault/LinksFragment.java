package com.example.studylab.vault;

import android.app.AlertDialog;
import android.os.Bundle;
import android.util.Patterns;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.example.studylab.R;
import com.example.studylab.api.ApiCallback;
import com.example.studylab.api.Subscription;
import com.google.android.material.textfield.TextInputEditText;
import java.util.ArrayList;
import java.util.List;

public class LinksFragment extends Fragment implements LinksAdapter.OnLinkActionListener {

    private String subjectId;
    private LinksAdapter adapter;
    private final List<VaultLink> linkList = new ArrayList<>();
    private ProgressBar progressBar;
    private View emptyState;
    private Subscription linksSubscription = Subscription.empty();

    public static LinksFragment newInstance(String subjectId) {
        LinksFragment fragment = new LinksFragment();
        Bundle args = new Bundle();
        args.putString("subjectId", subjectId);
        fragment.setArguments(args);
        return fragment;
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
        return inflater.inflate(R.layout.fragment_links, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        RecyclerView recyclerView = view.findViewById(R.id.recycler_view);
        progressBar = view.findViewById(R.id.progress_bar);
        emptyState = view.findViewById(R.id.empty_state);

        recyclerView.setLayoutManager(new LinearLayoutManager(getContext()));
        adapter = new LinksAdapter(linkList, this);
        recyclerView.setAdapter(adapter);

        loadLinks();
    }

    private void loadLinks() {
        if (subjectId == null) return;
        progressBar.setVisibility(View.VISIBLE);
        linksSubscription = VaultLinkRepository.getLinksBySubjectId(subjectId, (links, error) -> {
            if (!isAdded()) return;
            progressBar.setVisibility(View.GONE);
            if (error != null) return;
            linkList.clear();
            if (links != null) linkList.addAll(links);
            adapter.notifyDataSetChanged();
            emptyState.setVisibility(linkList.isEmpty() ? View.VISIBLE : View.GONE);
        });
    }

    public void showAddLinkDialog() {
        showLinkDialog(null);
    }

    private void showLinkDialog(@Nullable VaultLink existing) {
        View v = LayoutInflater.from(requireContext()).inflate(R.layout.dialog_add_link, null);
        TextView title = v.findViewById(R.id.tv_title);
        TextInputEditText etName = v.findViewById(R.id.et_link_name);
        TextInputEditText etUrl = v.findViewById(R.id.et_url);

        if (existing != null) {
            title.setText(R.string.action_edit);
            etName.setText(existing.getLinkName());
            etUrl.setText(existing.getUrl());
        }

        AlertDialog dialog = new AlertDialog.Builder(requireContext(), R.style.Theme_Studylab_Dialog)
                .setView(v)
                .create();

        v.findViewById(R.id.btn_cancel).setOnClickListener(x -> dialog.dismiss());
        v.findViewById(R.id.btn_save).setOnClickListener(x -> {
            String name = etName.getText() != null ? etName.getText().toString().trim() : "";
            String url = etUrl.getText() != null ? etUrl.getText().toString().trim() : "";

            if (name.isEmpty()) { etName.setError("Enter a name"); return; }
            if (url.isEmpty()) { etUrl.setError("Enter a URL"); return; }
            if (!url.startsWith("http://") && !url.startsWith("https://")) url = "https://" + url;
            if (!Patterns.WEB_URL.matcher(url).matches()) { etUrl.setError("Invalid URL"); return; }

            final String finalUrl = url;
            if (existing == null) {
                VaultLink link = new VaultLink();
                link.setSubjectId(subjectId);
                link.setLinkName(name);
                link.setUrl(finalUrl);
                VaultLinkRepository.addLink(link, new ApiCallback() {
                    @Override public void onSuccess() { dialog.dismiss(); loadLinks(); }
                    @Override public void onError(String msg) { toast("Error saving link"); }
                });
            } else {
                VaultLinkRepository.updateLink(existing.getId(), name, finalUrl, new ApiCallback() {
                    @Override public void onSuccess() { dialog.dismiss(); loadLinks(); }
                    @Override public void onError(String msg) { toast("Error updating link"); }
                });
            }
        });

        dialog.show();
    }

    @Override
    public void onEdit(VaultLink link) { showLinkDialog(link); }

    @Override
    public void onDelete(VaultLink link) {
        new AlertDialog.Builder(requireContext(), R.style.Theme_Studylab_Dialog)
                .setTitle("Delete link?")
                .setMessage(link.getLinkName())
                .setNegativeButton(R.string.action_cancel, null)
                .setPositiveButton(R.string.action_delete, (d, w) ->
                        VaultLinkRepository.deleteLink(link.getId(), new ApiCallback() {
                            @Override public void onSuccess() { loadLinks(); }
                            @Override public void onError(String msg) { toast("Could not delete"); }
                        }))
                .show();
    }

    private void toast(String s) {
        if (getContext() != null) Toast.makeText(getContext(), s, Toast.LENGTH_SHORT).show();
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        linksSubscription.cancel();
    }
}
