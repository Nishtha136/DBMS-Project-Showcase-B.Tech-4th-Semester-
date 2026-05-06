package com.example.studylab;

import android.app.Activity;
import android.content.Intent;
import android.view.View;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.core.content.ContextCompat;

public class BottomNavHelper {

    public static void setup(Activity activity, String activeTab) {
        int[] navIds = {
            R.id.navItemHome,
            R.id.navItemCalendar,
            R.id.navItemTimer,
            R.id.navItemVault,
            R.id.navItemLabs
        };
        String[] tabKeys = {"home", "calendar", "timer", "vault", "labs"};

        for (int i = 0; i < navIds.length; i++) {
            View item = activity.findViewById(navIds[i]);
            if (item == null) continue;
            boolean isActive = tabKeys[i].equals(activeTab);
            setNavItemState(activity, item, isActive);
            final String key = tabKeys[i];
            item.setOnClickListener(v -> navigate(activity, key));
        }
    }

    private static void setNavItemState(Activity activity, View item, boolean active) {
        int activeColor  = ContextCompat.getColor(activity, R.color.tmr_primary_blue);
        int inactiveColor = ContextCompat.getColor(activity, R.color.tmr_text_disabled);
        int color = active ? activeColor : inactiveColor;

        if (!(item instanceof LinearLayout)) return;
        LinearLayout ll = (LinearLayout) item;
        for (int i = 0; i < ll.getChildCount(); i++) {
            View child = ll.getChildAt(i);
            if (child instanceof ImageView) {
                ((ImageView) child).setColorFilter(color);
            } else if (child instanceof TextView) {
                ((TextView) child).setTextColor(color);
            }
        }
    }

    private static void navigate(Activity from, String tab) {
        Class<?> dest;
        switch (tab) {
            case "calendar": dest = StudyCalendarActivity.class; break;
            case "timer":    dest = StudyTimerActivity.class;    break;
            case "labs":     dest = LabsActivity.class;          break;
            case "home":
            case "vault":
            default:         dest = MainActivity.class;          break;
        }
        if (from.getClass().equals(dest)) return;
        Intent intent = new Intent(from, dest);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        // Pass the desired tab so MainActivity can load the right fragment
        intent.putExtra("nav_tab", tab);
        from.startActivity(intent);
    }
}
