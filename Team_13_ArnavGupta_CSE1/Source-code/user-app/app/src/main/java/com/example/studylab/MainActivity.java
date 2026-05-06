package com.example.studylab;

import android.content.Intent;
import android.os.Bundle;
import android.widget.ImageView;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.fragment.app.Fragment;
import com.example.studylab.api.SessionManager;
import com.example.studylab.services.MentorSyncService;
import com.example.studylab.ui.HomeFragment;
import com.example.studylab.ui.timer.StudyTimerFragment;
import com.example.studylab.vault.VaultHomeFragment;
import com.google.android.material.bottomnavigation.BottomNavigationView;

public class MainActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (!new SessionManager(this).isLoggedIn()) {
            startActivity(new Intent(this, login.class));
            finish();
            return;
        }

        setContentView(R.layout.activity_main);

        ImageView btnSettings = findViewById(R.id.btn_settings);
        btnSettings.setOnClickListener(v -> startActivity(new Intent(this, SettingsActivity.class)));

        BottomNavigationView bottomNav = findViewById(R.id.bottom_nav);

        bottomNav.setOnItemSelectedListener(item -> {
            int id = item.getItemId();
            if (id == R.id.nav_labs) {
                startActivity(new Intent(this, LabsActivity.class));
                return true;
            }
            if (id == R.id.nav_calendar) {
                startActivity(new Intent(this, StudyCalendarActivity.class));
                return true;
            }
            if (id == R.id.nav_timer) {
                startActivity(new Intent(this, StudyTimerActivity.class));
                return true;
            }
            Fragment f = fragmentFor(id);
            if (f == null) return false;
            showFragment(f);
            return true;
        });

        if (savedInstanceState == null) {
            String navTab = getIntent().getStringExtra("nav_tab");
            if ("vault".equals(navTab)) {
                bottomNav.setSelectedItemId(R.id.nav_vault);
            } else {
                bottomNav.setSelectedItemId(R.id.nav_home);
            }
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        // Pull mentor-assigned tasks + assessments into local Room every time
        // the user returns to the home screen. Fire-and-forget; failures are
        // logged inside MentorSyncService.
        MentorSyncService.syncNow(this);
    }

    @Override
    protected void onNewIntent(android.content.Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        BottomNavigationView bottomNav = findViewById(R.id.bottom_nav);
        String navTab = intent.getStringExtra("nav_tab");
        if ("vault".equals(navTab)) {
            bottomNav.setSelectedItemId(R.id.nav_vault);
        } else if ("home".equals(navTab)) {
            bottomNav.setSelectedItemId(R.id.nav_home);
        }
    }

    private Fragment fragmentFor(int itemId) {
        if (itemId == R.id.nav_home)  return new HomeFragment();
        if (itemId == R.id.nav_timer) return new StudyTimerFragment();
        if (itemId == R.id.nav_vault) return new VaultHomeFragment();
        return null;
    }

    private void showFragment(@NonNull Fragment fragment) {
        getSupportFragmentManager()
                .beginTransaction()
                .replace(R.id.nav_host, fragment)
                .commit();
    }
}
