package com.example.studylab.vault;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class VaultFile {
    private String id;
    private String subjectId;
    private String noteName;
    private String noteDescription;
    private String fileName;
    private String fileLocalPath;
    private String fileType;
    private long fileSizeKb;
    private String uploadedAt;

    public VaultFile() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getSubjectId() { return subjectId; }
    public void setSubjectId(String subjectId) { this.subjectId = subjectId; }

    public String getNoteName() { return noteName; }
    public void setNoteName(String noteName) { this.noteName = noteName; }

    public String getNoteDescription() { return noteDescription; }
    public void setNoteDescription(String noteDescription) { this.noteDescription = noteDescription; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getFileLocalPath() { return fileLocalPath; }
    public void setFileLocalPath(String fileLocalPath) { this.fileLocalPath = fileLocalPath; }

    public String getFileType() { return fileType; }
    public void setFileType(String fileType) { this.fileType = fileType; }

    public long getFileSizeKb() { return fileSizeKb; }
    public void setFileSizeKb(long fileSizeKb) { this.fileSizeKb = fileSizeKb; }

    public String getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(String uploadedAt) { this.uploadedAt = uploadedAt; }

    public String getDisplayTitle() {
        if (noteName != null && !noteName.isEmpty()) return noteName;
        return fileName != null ? fileName : "Untitled note";
    }

    public String getFormattedSize() {
        if (fileSizeKb >= 1024) return String.format(Locale.getDefault(), "%.1f MB", fileSizeKb / 1024.0);
        return fileSizeKb + " KB";
    }

    public String getFormattedDate() {
        if (uploadedAt == null || uploadedAt.isEmpty()) return "";
        try {
            String normalized = uploadedAt.replace("T", " ").replaceAll("\\..*", "").replace("Z", "");
            Date date = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US).parse(normalized);
            return new SimpleDateFormat("MMM d", Locale.getDefault()).format(date);
        } catch (Exception e) {
            return "";
        }
    }
}
