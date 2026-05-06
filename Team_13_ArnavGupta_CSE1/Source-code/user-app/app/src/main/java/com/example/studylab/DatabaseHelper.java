package com.example.studylab;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;

import java.util.ArrayList;
import java.util.List;

/**
 * SQLite helper.
 *
 * Tables:
 *   experiments  – one row per user-created experiment
 *   checkins     – one row per check-in entry (linked to experiment)
 */
public class DatabaseHelper extends SQLiteOpenHelper {

    private static final String DB_NAME    = "studylab.db";
    private static final int    DB_VERSION = 2;

    // ── experiments ────────────────────────────────────────────
    static final String TABLE_EXP       = "experiments";
    static final String COL_EXP_ID      = "id";
    static final String COL_EXP_TITLE   = "title";
    static final String COL_EXP_Q1      = "question1";
    static final String COL_EXP_Q2      = "question2";
    static final String COL_EXP_Q3      = "question3";
    static final String COL_EXP_GOAL    = "goal_days";
    static final String COL_EXP_CREATED = "created_at";
    static final String COL_EXP_ICON    = "icon";          // emoji string

    // ── checkins ───────────────────────────────────────────────
    static final String TABLE_CI        = "checkins";
    static final String COL_CI_ID       = "id";
    static final String COL_CI_EXP_ID  = "experiment_id";
    static final String COL_CI_SCORE    = "avg_score";
    static final String COL_CI_DATE     = "checked_in_ms"; // epoch ms

    // ── Singleton ──────────────────────────────────────────────
    private static DatabaseHelper instance;

    private DatabaseHelper(Context ctx) {
        super(ctx.getApplicationContext(), DB_NAME, null, DB_VERSION);
    }

    /** Always call with a Context; subsequent calls ignore the context arg. */
    public static synchronized DatabaseHelper get(Context ctx) {
        if (instance == null) instance = new DatabaseHelper(ctx);
        return instance;
    }

    // ── Schema ─────────────────────────────────────────────────

    @Override
    public void onCreate(SQLiteDatabase db) {
        db.execSQL(
            "CREATE TABLE " + TABLE_EXP + " ("
            + COL_EXP_ID      + " INTEGER PRIMARY KEY AUTOINCREMENT, "
            + COL_EXP_TITLE   + " TEXT    NOT NULL, "
            + COL_EXP_Q1      + " TEXT    NOT NULL, "
            + COL_EXP_Q2      + " TEXT    NOT NULL, "
            + COL_EXP_Q3      + " TEXT    NOT NULL, "
            + COL_EXP_GOAL    + " INTEGER NOT NULL, "
            + COL_EXP_ICON    + " TEXT    DEFAULT '\ud83d\udd2c', "
            + COL_EXP_CREATED + " INTEGER NOT NULL"
            + ")"
        );
        db.execSQL(
            "CREATE TABLE " + TABLE_CI + " ("
            + COL_CI_ID     + " INTEGER PRIMARY KEY AUTOINCREMENT, "
            + COL_CI_EXP_ID + " INTEGER NOT NULL REFERENCES " + TABLE_EXP + "(" + COL_EXP_ID + "), "
            + COL_CI_SCORE  + " REAL    NOT NULL, "
            + COL_CI_DATE   + " INTEGER NOT NULL"
            + ")"
        );
    }

    @Override
    public void onUpgrade(SQLiteDatabase db, int o, int n) {
        if (o < 2) {
            // v1 → v2: add icon column (preserves existing data)
            db.execSQL("ALTER TABLE " + TABLE_EXP
                + " ADD COLUMN " + COL_EXP_ICON + " TEXT DEFAULT '\ud83d\udd2c'");
        }
    }

    // ── Experiment CRUD ────────────────────────────────────────

    /** Inserts and returns the new row-id. */
    public long insertExperiment(String title, String q1, String q2, String q3, int goalDays, String icon) {
        ContentValues cv = new ContentValues();
        cv.put(COL_EXP_TITLE,   title);
        cv.put(COL_EXP_Q1,      q1);
        cv.put(COL_EXP_Q2,      q2);
        cv.put(COL_EXP_Q3,      q3);
        cv.put(COL_EXP_GOAL,    goalDays);
        cv.put(COL_EXP_ICON,    icon != null ? icon : "\ud83d\udd2c");
        cv.put(COL_EXP_CREATED, System.currentTimeMillis());
        return getWritableDatabase().insert(TABLE_EXP, null, cv);
    }

    /**
     * Loads all experiments, newest first.
     * Check-in scores are NOT included here — load them separately.
     */
    public List<Experiment> loadAllExperiments() {
        List<Experiment> list = new ArrayList<>();
        Cursor c = getReadableDatabase().query(
            TABLE_EXP, null, null, null, null, null,
            COL_EXP_CREATED + " DESC");
        while (c.moveToNext()) {
            int iconIdx = c.getColumnIndex(COL_EXP_ICON);
            String icon = (iconIdx >= 0 && !c.isNull(iconIdx)) ? c.getString(iconIdx) : "\ud83d\udd2c";
            list.add(new Experiment(
                c.getLong  (c.getColumnIndexOrThrow(COL_EXP_ID)),
                c.getString(c.getColumnIndexOrThrow(COL_EXP_TITLE)),
                c.getString(c.getColumnIndexOrThrow(COL_EXP_Q1)),
                c.getString(c.getColumnIndexOrThrow(COL_EXP_Q2)),
                c.getString(c.getColumnIndexOrThrow(COL_EXP_Q3)),
                c.getInt   (c.getColumnIndexOrThrow(COL_EXP_GOAL)),
                icon
            ));
        }
        c.close();
        return list;
    }

    // ── CheckIn CRUD ───────────────────────────────────────────

    /** Saves a check-in for the given experiment with the current timestamp. */
    public void insertCheckIn(long experimentId, float avgScore) {
        ContentValues cv = new ContentValues();
        cv.put(COL_CI_EXP_ID, experimentId);
        cv.put(COL_CI_SCORE,  avgScore);
        cv.put(COL_CI_DATE,   System.currentTimeMillis());
        getWritableDatabase().insert(TABLE_CI, null, cv);
    }

    /** Deletes an experiment and all its check-ins. */
    public void deleteExperiment(long experimentId) {
        SQLiteDatabase db = getWritableDatabase();
        db.beginTransaction();
        try {
            db.delete(TABLE_CI,  COL_CI_EXP_ID + "=?", new String[]{String.valueOf(experimentId)});
            db.delete(TABLE_EXP, COL_EXP_ID    + "=?", new String[]{String.valueOf(experimentId)});
            db.setTransactionSuccessful();
        } finally {
            db.endTransaction();
        }
    }

    /** Returns avg scores for one experiment, oldest first. */
    public List<Float> loadScoresForExperiment(long experimentId) {
        List<Float> scores = new ArrayList<>();
        Cursor c = getReadableDatabase().query(
            TABLE_CI,
            new String[]{COL_CI_SCORE},
            COL_CI_EXP_ID + "=?",
            new String[]{String.valueOf(experimentId)},
            null, null, COL_CI_DATE + " ASC");
        while (c.moveToNext()) scores.add(c.getFloat(0));
        c.close();
        return scores;
    }

    /**
     * Returns ALL check-in timestamps (ms since epoch), across all experiments.
     * Used by the Dashboard activity grid.
     */
    public List<Long> loadAllCheckInDates() {
        List<Long> dates = new ArrayList<>();
        Cursor c = getReadableDatabase().query(
            TABLE_CI,
            new String[]{COL_CI_DATE},
            null, null, null, null, COL_CI_DATE + " ASC");
        while (c.moveToNext()) dates.add(c.getLong(0));
        c.close();
        return dates;
    }
}
