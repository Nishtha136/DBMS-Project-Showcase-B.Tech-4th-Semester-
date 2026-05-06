package com.example.studylab.vault;

public class Subject {
    public static final String[] PALETTE = {
            "#22C1A8", "#1E66F5", "#F59E0B", "#10B981", "#7C3AED",
            "#F43F5E", "#F97316", "#06B6D4", "#0EA5E9", "#4F46E5"
    };

    public static final String[] PALETTE_LIGHT = {
            "#E1F7F2", "#E8F0FF", "#FEF3E0", "#E4F8F0", "#EFE7FD",
            "#FDE7EC", "#FDECDD", "#DEF5F9", "#E0F2FC", "#E7E5FD"
    };

    private String id;
    private String name;
    private String colorHex;
    private String colorLightHex;
    private String createdAt;
    private String userId;

    public Subject() {}

    public Subject(String name, String userId) {
        this.name = name;
        this.userId = userId;
        int index = bucketForName(name);
        this.colorHex = PALETTE[index];
        this.colorLightHex = PALETTE_LIGHT[index];
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getColorHex() { return colorHex; }
    public void setColorHex(String colorHex) { this.colorHex = colorHex; }

    public String getColorLightHex() {
        if (colorLightHex != null && !colorLightHex.isEmpty()) return colorLightHex;
        return PALETTE_LIGHT[bucketForName(name)];
    }
    public void setColorLightHex(String colorLightHex) { this.colorLightHex = colorLightHex; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getInitial() {
        if (name == null || name.isEmpty()) return "?";
        return String.valueOf(Character.toUpperCase(name.charAt(0)));
    }

    public static int bucketForName(String name) {
        if (name == null || name.isEmpty()) return 0;
        char c = Character.toUpperCase(name.charAt(0));
        return Math.max(0, (c - 'A')) % PALETTE.length;
    }

    public static String colorForName(String name) { return PALETTE[bucketForName(name)]; }
    public static String lightColorForName(String name) { return PALETTE_LIGHT[bucketForName(name)]; }
}
