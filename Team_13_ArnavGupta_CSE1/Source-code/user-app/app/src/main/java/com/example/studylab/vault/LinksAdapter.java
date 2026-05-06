package com.example.studylab.vault;

import android.content.Context;
import android.content.Intent;
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
import androidx.core.content.ContextCompat;
import androidx.recyclerview.widget.RecyclerView;
import com.example.studylab.R;
import java.util.List;

public class LinksAdapter extends RecyclerView.Adapter<LinksAdapter.LinkViewHolder> {

    public interface OnLinkActionListener {
        void onEdit(VaultLink link);
        void onDelete(VaultLink link);
    }

    private final List<VaultLink> links;
    private final OnLinkActionListener actionListener;

    public LinksAdapter(List<VaultLink> links, OnLinkActionListener listener) {
        this.links = links;
        this.actionListener = listener;
    }

    public LinksAdapter(List<VaultLink> links) {
        this(links, null);
    }

    @NonNull
    @Override
    public LinkViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_link, parent, false);
        return new LinkViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull LinkViewHolder holder, int position) {
        VaultLink link = links.get(position);
        Context ctx = holder.itemView.getContext();

        holder.tvName.setText(link.getLinkName());
        holder.tvUrl.setText(link.getUrl());

        int lightTint = ContextCompat.getColor(ctx, R.color.brand_primary_light);
        FileTypeStyle.applyTileBg(holder.iconTile, lightTint);

        holder.itemView.setOnClickListener(v -> openLink(v.getContext(), link.getUrl()));

        if (actionListener != null) {
            holder.ivMenu.setVisibility(View.VISIBLE);
            holder.ivMenu.setOnClickListener(v -> showMenu(v, link));
        } else {
            holder.ivMenu.setVisibility(View.GONE);
        }
    }

    private void openLink(Context ctx, String url) {
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            ctx.startActivity(intent);
        } catch (Exception e) {
            Toast.makeText(ctx, "Cannot open link", Toast.LENGTH_SHORT).show();
        }
    }

    private void showMenu(View anchor, VaultLink link) {
        PopupMenu menu = new PopupMenu(anchor.getContext(), anchor);
        menu.inflate(R.menu.menu_item_actions);
        menu.setOnMenuItemClickListener(item -> {
            int id = item.getItemId();
            if (id == R.id.action_edit) { actionListener.onEdit(link); return true; }
            if (id == R.id.action_delete) { actionListener.onDelete(link); return true; }
            return false;
        });
        menu.show();
    }

    @Override
    public int getItemCount() {
        return links.size();
    }

    static class LinkViewHolder extends RecyclerView.ViewHolder {
        FrameLayout iconTile;
        TextView tvName, tvUrl;
        ImageView ivMenu;

        LinkViewHolder(@NonNull View itemView) {
            super(itemView);
            iconTile = itemView.findViewById(R.id.icon_tile);
            tvName = itemView.findViewById(R.id.tv_link_name);
            tvUrl = itemView.findViewById(R.id.tv_link_url);
            ivMenu = itemView.findViewById(R.id.iv_menu);
        }
    }
}
