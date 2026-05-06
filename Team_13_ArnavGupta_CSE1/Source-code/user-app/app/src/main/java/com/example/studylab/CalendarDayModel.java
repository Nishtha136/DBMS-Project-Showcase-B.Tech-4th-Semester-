package com.example.studylab;

/**
 * Model for a single calendar day cell.
 */
public class CalendarDayModel {

    public enum CellType {
        OUTSIDE_MONTH,  // padding day from prev/next month
        NORMAL,         // regular day, no events
        ASSESSMENT,     // has an assessment due (orange)
        SESSION,        // study session — kept for heatmap compat
        TASK,           // has a task due (blue)
        BOTH,           // both assessment AND task (diagonal split)
        TODAY           // today — teal border only
    }

    private final int dayNumber;
    private final boolean isCurrentMonth;
    private final CellType cellType;
    private final float studyHours; // for heatmap mode

    public CalendarDayModel(int dayNumber, boolean isCurrentMonth, CellType cellType, float studyHours) {
        this.dayNumber = dayNumber;
        this.isCurrentMonth = isCurrentMonth;
        this.cellType = cellType;
        this.studyHours = studyHours;
    }

    public int getDayNumber() {
        return dayNumber;
    }

    public boolean isCurrentMonth() {
        return isCurrentMonth;
    }

    public CellType getCellType() {
        return cellType;
    }

    public float getStudyHours() {
        return studyHours;
    }
}
