package com.example.studylab.services;

import android.accessibilityservice.AccessibilityService;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.view.accessibility.AccessibilityEvent;
import android.view.inputmethod.InputMethodManager;
import android.view.inputmethod.InputMethodInfo;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class FocusModeAccessibilityService extends AccessibilityService {
    private static final String PREFS_NAME = "studylab_prefs";
    private static final String KEY_ALLOWED_PACKAGES = "allowed_packages";
    private static final String KEY_FOCUS_MODE_ENABLED = "focus_mode_enabled";
    private static final String KEY_TIMER_RUNNING = "timer_running";

    // System packages always allowed
    private static final String[] SYSTEM_ALLOWLIST = {
            "com.android.systemui",
            "com.android.phone",
            "com.android.dialer",
            "com.android.contacts",
            "com.android.incallui",
            "com.google.android.dialer",
            "com.android.launcher",
            "com.android.launcher3",
            "com.google.android.apps.nexuslauncher",
            "android"
    };

    private final Set<String> imePackages = new HashSet<>();

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event.getEventType() != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return;

        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        boolean focusEnabled = prefs.getBoolean(KEY_FOCUS_MODE_ENABLED, true);
        boolean timerRunning = prefs.getBoolean(KEY_TIMER_RUNNING, false);
        if (!focusEnabled || !timerRunning) return;

        CharSequence pkgSeq = event.getPackageName();
        if (pkgSeq == null) return;
        String packageName = pkgSeq.toString();
        if (packageName.isEmpty()) return;

        if (!isAppAllowed(packageName, prefs)) {
            blockApp();
        }
    }

    @Override
    public void onInterrupt() {}

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        loadImePackages();
    }

    private void loadImePackages() {
        imePackages.clear();
        InputMethodManager imm = (InputMethodManager) getSystemService(Context.INPUT_METHOD_SERVICE);
        if (imm == null) return;
        List<InputMethodInfo> imes = imm.getInputMethodList();
        if (imes == null) return;
        for (InputMethodInfo ime : imes) {
            imePackages.add(ime.getPackageName());
        }
    }

    private boolean isAppAllowed(String packageName, SharedPreferences prefs) {
        if (packageName.equals(getPackageName())) return true;
        for (String sys : SYSTEM_ALLOWLIST) {
            if (sys.equals(packageName)) return true;
        }
        if (imePackages.contains(packageName)) return true;

        String raw = prefs.getString(KEY_ALLOWED_PACKAGES, "");
        if (raw == null || raw.isEmpty()) return false;
        for (String pkg : raw.split(",")) {
            if (pkg.trim().equals(packageName)) return true;
        }
        return false;
    }

    private void blockApp() {
        Intent intent = new Intent(this, com.example.studylab.ui.focus.FocusModeActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
    }
}
