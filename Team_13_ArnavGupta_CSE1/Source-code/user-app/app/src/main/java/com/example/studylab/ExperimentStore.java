package com.example.studylab;

import android.content.Context;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * In-process cache for experiments, backed by SQLite via DatabaseHelper.
 *
 * Usage:
 *   - First call from any Activity:  ExperimentStore.get(this)
 *   - Subsequent calls (no context): ExperimentStore.get()
 *   - After returning to a screen:   ExperimentStore.get(this).reload()
 */
public class ExperimentStore {

    private static ExperimentStore instance;

    private final DatabaseHelper  db;
    private final List<Experiment> experiments = new ArrayList<>();

    private ExperimentStore(Context ctx) {
        db = DatabaseHelper.get(ctx);
        loadFromDb();
    }

    /** Creates (or returns) the singleton; must supply context on first call. */
    public static synchronized ExperimentStore get(Context ctx) {
        if (instance == null) instance = new ExperimentStore(ctx);
        return instance;
    }

    /** Returns the existing singleton (throws if never init'd with context). */
    public static synchronized ExperimentStore get() {
        if (instance == null) throw new IllegalStateException("Call get(Context) first");
        return instance;
    }

    // ── Load / Reload ──────────────────────────────────────────

    /** Re-reads everything from SQLite. Call from onResume(). */
    public void reload() {
        loadFromDb();
    }

    private void loadFromDb() {
        experiments.clear();
        List<Experiment> loaded = db.loadAllExperiments();
        for (Experiment exp : loaded) {
            List<Float> scores = db.loadScoresForExperiment(exp.getDbId());
            for (float s : scores) exp.addCheckInScore(s);
        }
        experiments.addAll(loaded);
    }

    // ── Reads ──────────────────────────────────────────────────

    /** Newest first. */
    public List<Experiment> getAll() {
        return Collections.unmodifiableList(experiments);
    }

    public Experiment getAt(int index) { return experiments.get(index); }
    public int        size()           { return experiments.size(); }

    // ── Writes ─────────────────────────────────────────────────

    /**
     * Persists a new experiment to SQLite and prepends it to the in-memory list.
     */
    public void add(Experiment exp) {
        long id = db.insertExperiment(
            exp.getTitle(),
            exp.getQuestion(0), exp.getQuestion(1), exp.getQuestion(2),
            exp.getGoalDays(), exp.getIcon());
        exp.setDbId(id);
        experiments.add(0, exp); // newest first
    }

    /**
     * Saves a check-in score for the experiment identified by its DB id,
     * and updates the corresponding in-memory object.
     */
    public void addCheckIn(long experimentDbId, float avgScore) {
        db.insertCheckIn(experimentDbId, avgScore);
        for (Experiment e : experiments) {
            if (e.getDbId() == experimentDbId) {
                e.addCheckInScore(avgScore);
                break;
            }
        }
    }

    /**
     * Returns all check-in timestamps (ms since epoch) across every experiment.
     * Used for building the Dashboard calendar grid.
     */
    public List<Long> getAllCheckInDates() {
        return db.loadAllCheckInDates();
    }

    /**
     * Permanently deletes an experiment and all its check-ins from DB + memory.
     */
    public void remove(Experiment exp) {
        db.deleteExperiment(exp.getDbId());
        experiments.remove(exp);
    }
}
