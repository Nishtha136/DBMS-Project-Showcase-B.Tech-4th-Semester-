package com.example.studylab.vault;

public class VaultLink {
    private String id;
    private String subjectId;
    private String linkName;
    private String url;
    private String addedAt;

    public VaultLink() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getSubjectId() { return subjectId; }
    public void setSubjectId(String subjectId) { this.subjectId = subjectId; }

    public String getLinkName() { return linkName; }
    public void setLinkName(String linkName) { this.linkName = linkName; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public String getAddedAt() { return addedAt; }
    public void setAddedAt(String addedAt) { this.addedAt = addedAt; }
}
