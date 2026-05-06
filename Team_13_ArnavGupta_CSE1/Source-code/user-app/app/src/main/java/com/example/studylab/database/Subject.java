package com.example.studylab.database;

import androidx.room.ColumnInfo;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "subjects")
public class Subject {
    @PrimaryKey(autoGenerate = true)
    public int id;

    @ColumnInfo(name = "name")
    public String name;

    @ColumnInfo(name = "color_hex")
    public String colorHex;

    @ColumnInfo(name = "icon_res_name")
    public String iconResName;

    @ColumnInfo(name = "total_study_seconds")
    public long totalStudySeconds;

    @ColumnInfo(name = "created_at", defaultValue = "0")
    public long createdAt;

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getColorHex() { return colorHex; }
    public void setColorHex(String colorHex) { this.colorHex = colorHex; }
    public String getIconResName() { return iconResName; }
    public void setIconResName(String iconResName) { this.iconResName = iconResName; }
    public long getTotalStudySeconds() { return totalStudySeconds; }
    public void setTotalStudySeconds(long totalStudySeconds) { this.totalStudySeconds = totalStudySeconds; }
}