package com.studytube.modules.user.model;

/**
 * Predefined study domains — used for onboarding and personalized feed.
 * Maps to the CATEGORY_CHIPS on the frontend.
 */
public enum Domain {
    ENGINEERING("Engineering"),
    MEDICAL("Medical"),
    LAW("Law"),
    SCIENCE("Science"),
    MATHEMATICS("Mathematics"),
    COMMERCE("Commerce"),
    UPSC("UPSC"),
    JEE_NEET("JEE/NEET"),
    PROGRAMMING("Programming");

    private final String label;

    Domain(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    /**
     * Lookup by label string (case-insensitive).
     * Returns null if not found — callers should validate.
     */
    public static Domain fromLabel(String label) {
        for (Domain d : values()) {
            if (d.label.equalsIgnoreCase(label)) {
                return d;
            }
        }
        return null;
    }

    /**
     * Check if a label string is a valid domain.
     */
    public static boolean isValid(String label) {
        return fromLabel(label) != null;
    }
}
