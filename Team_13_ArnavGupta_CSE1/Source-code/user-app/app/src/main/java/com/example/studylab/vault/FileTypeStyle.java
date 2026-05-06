package com.example.studylab.vault;

import android.content.Context;
import android.graphics.drawable.GradientDrawable;
import android.view.View;
import androidx.core.content.ContextCompat;
import com.example.studylab.R;

final class FileTypeStyle {
    private FileTypeStyle() {}

    static int iconRes(String type) {
        if ("pdf".equals(type)) return R.drawable.ic_file_pdf;
        if ("doc".equals(type) || "docx".equals(type)) return R.drawable.ic_file_word;
        if ("ppt".equals(type) || "pptx".equals(type)) return R.drawable.ic_file_word;
        if ("image".equals(type)) return R.drawable.ic_file_image;
        return R.drawable.ic_file;
    }

    static int tint(Context ctx, String type) {
        if ("pdf".equals(type)) return ContextCompat.getColor(ctx, R.color.file_pdf);
        if ("doc".equals(type) || "docx".equals(type)) return ContextCompat.getColor(ctx, R.color.file_doc);
        if ("ppt".equals(type) || "pptx".equals(type)) return ContextCompat.getColor(ctx, R.color.file_ppt);
        if ("image".equals(type)) return ContextCompat.getColor(ctx, R.color.file_image);
        return ContextCompat.getColor(ctx, R.color.file_other);
    }

    static int tintLight(Context ctx, String type) {
        if ("pdf".equals(type)) return ContextCompat.getColor(ctx, R.color.file_pdf_light);
        if ("doc".equals(type) || "docx".equals(type)) return ContextCompat.getColor(ctx, R.color.file_doc_light);
        if ("ppt".equals(type) || "pptx".equals(type)) return ContextCompat.getColor(ctx, R.color.file_ppt_light);
        if ("image".equals(type)) return ContextCompat.getColor(ctx, R.color.file_image_light);
        return ContextCompat.getColor(ctx, R.color.file_other_light);
    }

    static void applyTileBg(View tile, int lightColor) {
        GradientDrawable bg = new GradientDrawable();
        bg.setShape(GradientDrawable.RECTANGLE);
        bg.setCornerRadius(tile.getResources().getDisplayMetrics().density * 14);
        bg.setColor(lightColor);
        tile.setBackground(bg);
    }
}
