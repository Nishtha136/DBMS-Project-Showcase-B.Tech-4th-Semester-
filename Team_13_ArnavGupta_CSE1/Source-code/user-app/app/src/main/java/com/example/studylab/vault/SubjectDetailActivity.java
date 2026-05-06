package com.example.studylab.vault;

import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.view.View;
import android.widget.ImageView;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.fragment.app.Fragment;
import androidx.viewpager2.adapter.FragmentStateAdapter;
import androidx.viewpager2.widget.ViewPager2;
import com.example.studylab.R;
import com.google.android.material.floatingactionbutton.FloatingActionButton;
import com.google.android.material.tabs.TabLayout;
import com.google.android.material.tabs.TabLayoutMediator;

public class SubjectDetailActivity extends AppCompatActivity {

    private String subjectId;
    private ViewPager2 viewPager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_subject_detail);

        subjectId = getIntent().getStringExtra("subjectId");
        String subjectName = getIntent().getStringExtra("subjectName");
        String colorHex = getIntent().getStringExtra("subjectColorHex");

        ((TextView) findViewById(R.id.tv_subject_name)).setText(subjectName);

        String initial = (subjectName != null && !subjectName.isEmpty())
                ? String.valueOf(Character.toUpperCase(subjectName.charAt(0))) : "?";
        ((TextView) findViewById(R.id.tv_initial)).setText(initial);

        int color = parseColor(colorHex);
        GradientDrawable circle = new GradientDrawable();
        circle.setShape(GradientDrawable.OVAL);
        circle.setColor(color);
        findViewById(R.id.badge_bg).setBackground(circle);

        ImageView btnBack = findViewById(R.id.btn_back);
        btnBack.setOnClickListener(v -> finish());

        viewPager = findViewById(R.id.view_pager);
        TabLayout tabLayout = findViewById(R.id.tab_layout);
        viewPager.setAdapter(new SubjectDetailPagerAdapter(this, subjectId));

        new TabLayoutMediator(tabLayout, viewPager, (tab, position) ->
                tab.setText(position == 0 ? R.string.tab_links : R.string.tab_notes)
        ).attach();

        FloatingActionButton fab = findViewById(R.id.fab_add);
        fab.setOnClickListener(v -> dispatchAddToCurrentTab());

        boolean autoOpenAddLink = getIntent().getBooleanExtra("autoOpenAddLink", false);
        boolean autoOpenAddNote = getIntent().getBooleanExtra("autoOpenAddNote", false);
        if (autoOpenAddLink) {
            viewPager.setCurrentItem(0, false);
            viewPager.post(this::dispatchAddToCurrentTab);
        } else if (autoOpenAddNote) {
            viewPager.setCurrentItem(1, false);
            viewPager.post(this::dispatchAddToCurrentTab);
        }
    }

    private void dispatchAddToCurrentTab() {
        int position = viewPager.getCurrentItem();
        Fragment f = getSupportFragmentManager().findFragmentByTag("f" + position);
        if (position == 0 && f instanceof LinksFragment) {
            ((LinksFragment) f).showAddLinkDialog();
        } else if (position == 1 && f instanceof NotesFragment) {
            ((NotesFragment) f).showAddNoteDialog();
        }
    }

    private int parseColor(String hex) {
        try { return Color.parseColor(hex); }
        catch (Exception e) { return Color.parseColor("#1E66F5"); }
    }

    private static class SubjectDetailPagerAdapter extends FragmentStateAdapter {
        private final String subjectId;

        SubjectDetailPagerAdapter(@NonNull AppCompatActivity activity, String subjectId) {
            super(activity);
            this.subjectId = subjectId;
        }

        @NonNull @Override
        public Fragment createFragment(int position) {
            return position == 0
                    ? LinksFragment.newInstance(subjectId)
                    : NotesFragment.newInstance(subjectId);
        }

        @Override public int getItemCount() { return 2; }
    }
}
