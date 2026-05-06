package com.example.studylab;

import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.drawable.Drawable;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.SwitchCompat;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.Executors;

public class AllowedAppsActivity extends AppCompatActivity {

    private static final String PREFS_NAME = "studylab_prefs";
    private static final String KEY_ALLOWED_PACKAGES = "allowed_packages";

    private SharedPreferences prefs;
    private final Set<String> allowedSet = new HashSet<>();
    private final List<AppInfo> apps = new ArrayList<>();
    private AppsAdapter adapter;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_allowed_apps);

        prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        loadAllowedSet();

        findViewById(R.id.btnBack).setOnClickListener(v -> finish());
        findViewById(R.id.btnSave).setOnClickListener(v -> saveAndFinish());

        RecyclerView recycler = findViewById(R.id.recyclerApps);
        recycler.setLayoutManager(new LinearLayoutManager(this));
        adapter = new AppsAdapter();
        recycler.setAdapter(adapter);

        Executors.newSingleThreadExecutor().execute(() -> {
            List<AppInfo> loaded = loadInstalledApps();
            runOnUiThread(() -> {
                apps.clear();
                apps.addAll(loaded);
                adapter.notifyDataSetChanged();
            });
        });
    }

    private void loadAllowedSet() {
        allowedSet.clear();
        String raw = prefs.getString(KEY_ALLOWED_PACKAGES, "");
        if (raw != null && !raw.isEmpty()) {
            for (String p : raw.split(",")) {
                String t = p.trim();
                if (!t.isEmpty()) allowedSet.add(t);
            }
        }
    }

    private List<AppInfo> loadInstalledApps() {
        PackageManager pm = getPackageManager();
        Intent main = new Intent(Intent.ACTION_MAIN, null);
        main.addCategory(Intent.CATEGORY_LAUNCHER);
        List<ResolveInfo> launchables = pm.queryIntentActivities(main, 0);

        List<AppInfo> result = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        String ownPkg = getPackageName();

        for (ResolveInfo r : launchables) {
            ApplicationInfo ai = r.activityInfo.applicationInfo;
            if (ai.packageName.equals(ownPkg)) continue;
            if (!seen.add(ai.packageName)) continue;
            AppInfo info = new AppInfo();
            info.packageName = ai.packageName;
            info.label = String.valueOf(pm.getApplicationLabel(ai));
            try {
                info.icon = pm.getApplicationIcon(ai);
            } catch (Exception ignored) {}
            result.add(info);
        }
        Collections.sort(result, (a, b) -> a.label.compareToIgnoreCase(b.label));
        return result;
    }

    private void saveAndFinish() {
        StringBuilder sb = new StringBuilder();
        sb.append(getPackageName());
        for (String pkg : allowedSet) {
            if (pkg.equals(getPackageName())) continue;
            sb.append(',').append(pkg);
        }
        prefs.edit().putString(KEY_ALLOWED_PACKAGES, sb.toString()).apply();
        Toast.makeText(this, "Allowed apps saved", Toast.LENGTH_SHORT).show();
        finish();
    }

    private static class AppInfo {
        String packageName;
        String label;
        Drawable icon;
    }

    private class AppsAdapter extends RecyclerView.Adapter<AppsAdapter.VH> {

        @Override
        public VH onCreateViewHolder(ViewGroup parent, int viewType) {
            View v = LayoutInflater.from(parent.getContext())
                    .inflate(R.layout.item_allowed_app, parent, false);
            return new VH(v);
        }

        @Override
        public void onBindViewHolder(VH h, int pos) {
            AppInfo info = apps.get(pos);
            h.tvName.setText(info.label);
            if (info.icon != null) h.ivIcon.setImageDrawable(info.icon);
            h.toggle.setOnCheckedChangeListener(null);
            h.toggle.setChecked(allowedSet.contains(info.packageName));
            h.toggle.setOnCheckedChangeListener((b, checked) -> {
                if (checked) allowedSet.add(info.packageName);
                else allowedSet.remove(info.packageName);
            });
            h.itemView.setOnClickListener(v -> h.toggle.setChecked(!h.toggle.isChecked()));
        }

        @Override
        public int getItemCount() {
            return apps.size();
        }

        class VH extends RecyclerView.ViewHolder {
            ImageView ivIcon;
            TextView tvName;
            SwitchCompat toggle;

            VH(View v) {
                super(v);
                ivIcon = v.findViewById(R.id.ivAppIcon);
                tvName = v.findViewById(R.id.tvAppName);
                toggle = v.findViewById(R.id.swAppAllowed);
            }
        }
    }
}
