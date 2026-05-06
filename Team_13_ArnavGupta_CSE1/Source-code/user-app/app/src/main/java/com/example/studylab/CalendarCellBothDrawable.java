package com.example.studylab;

import android.graphics.Canvas;
import android.graphics.ColorFilter;
import android.graphics.CornerPathEffect;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.PixelFormat;
import android.graphics.RectF;
import android.graphics.drawable.Drawable;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

/**
 * Custom Drawable that draws a diagonally split cell:
 * orange top-left triangle + teal bottom-right triangle.
 * Used for days that have both an assessment and a study session.
 */
public class CalendarCellBothDrawable extends Drawable {

    private final Paint orangePaint;
    private final Paint tealPaint;
    private final float cornerRadius;

    public CalendarCellBothDrawable(float cornerRadiusPx) {
        this.cornerRadius = cornerRadiusPx;

        orangePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        orangePaint.setColor(0xFFF59E0B); // assessment orange
        orangePaint.setStyle(Paint.Style.FILL);

        tealPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        tealPaint.setColor(0xFF2A88CB); // task blue
        tealPaint.setStyle(Paint.Style.FILL);
    }

    @Override
    public void draw(@NonNull Canvas canvas) {
        int w = getBounds().width();
        int h = getBounds().height();
        RectF rect = new RectF(0, 0, w, h);

        // Draw full cell in orange with rounded corners
        canvas.drawRoundRect(rect, cornerRadius, cornerRadius, orangePaint);

        // Draw teal triangle covering bottom-right half
        // Clip to rounded rect first to preserve corners
        canvas.save();
        Path clipPath = new Path();
        clipPath.addRoundRect(rect, cornerRadius, cornerRadius, Path.Direction.CW);
        canvas.clipPath(clipPath);

        Path tealPath = new Path();
        tealPath.moveTo(w, 0);
        tealPath.lineTo(w, h);
        tealPath.lineTo(0, h);
        tealPath.close();
        canvas.drawPath(tealPath, tealPaint);

        canvas.restore();
    }

    @Override
    public void setAlpha(int alpha) {
        orangePaint.setAlpha(alpha);
        tealPaint.setAlpha(alpha);
    }

    @Override
    public void setColorFilter(@Nullable ColorFilter colorFilter) {
        orangePaint.setColorFilter(colorFilter);
        tealPaint.setColorFilter(colorFilter);
    }

    @Override
    public int getOpacity() {
        return PixelFormat.TRANSLUCENT;
    }
}
