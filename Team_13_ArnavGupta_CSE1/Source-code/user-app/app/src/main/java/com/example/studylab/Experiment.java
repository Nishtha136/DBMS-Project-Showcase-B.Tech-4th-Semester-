package com.example.studylab;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

/**
 * Represents a user-created experiment.
 *
 * dbId = 0 means not yet persisted to the DB.
 * checkInScores are loaded from DB on startup and updated in-memory on each check-in.
 */
public class Experiment implements Serializable {

    private long   dbId;
    private final String   title;
    private final String[] questions;
    private final int      goalDays;
    private final String   icon;       // emoji chosen at creation, e.g. "🔬"

    /** Avg scores (1–10) per check-in, chronological order. */
    private final List<Float> checkInScores = new ArrayList<>();

    // ── Constructors ──────────────────────────────────────────

    /** Use when creating a brand-new experiment (not yet in DB). */
    public Experiment(String title, String q1, String q2, String q3, int goalDays, String icon) {
        this(0L, title, q1, q2, q3, goalDays, icon);
    }

    /** Use when loading from DB (dbId already known). */
    public Experiment(long dbId, String title, String q1, String q2, String q3, int goalDays, String icon) {
        this.dbId      = dbId;
        this.title     = title;
        this.questions = new String[]{q1, q2, q3};
        this.goalDays  = goalDays;
        this.icon      = (icon != null && !icon.isEmpty()) ? icon : "🔬";
    }

    // ── Getters / Setters ─────────────────────────────────────

    public long   getDbId()           { return dbId; }
    public void   setDbId(long id)    { this.dbId = id; }
    public String getTitle()          { return title; }
    public String[] getQuestions()    { return questions; }
    public String getQuestion(int i)  { return questions[i]; }
    public int    getGoalDays()       { return goalDays; }
    public String getIcon()           { return icon; }

    // ── Check-in data ─────────────────────────────────────────

    public void addCheckInScore(float score) { checkInScores.add(score); }

    public int getDaysCompleted()    { return checkInScores.size(); }

    public float getOverallAvgScore() {
        if (checkInScores.isEmpty()) return 0f;
        float sum = 0;
        for (float s : checkInScores) sum += s;
        return sum / checkInScores.size();
    }

    /** Returns 1-based day index of the best (highest avg) check-in, or 0 if none. */
    public int getBestDay() {
        if (checkInScores.isEmpty()) return 0;
        int best = 0; float bestScore = -1;
        for (int i = 0; i < checkInScores.size(); i++) {
            if (checkInScores.get(i) > bestScore) {
                bestScore = checkInScores.get(i);
                best = i + 1;
            }
        }
        return best;
    }

    public float[] getScoreArray() {
        float[] arr = new float[checkInScores.size()];
        for (int i = 0; i < arr.length; i++) arr[i] = checkInScores.get(i);
        return arr;
    }
}
