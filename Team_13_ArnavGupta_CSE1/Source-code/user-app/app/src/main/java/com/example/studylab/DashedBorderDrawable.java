package com.example.studylab;

import android.graphics.Canvas;
import android.graphics.ColorFilter;
import android.graphics.DashPathEffect;
import android.graphics.Paint;
import android.graphics.PixelFormat;
import android.graphics.RectF;
import android.graphics.drawable.Drawable;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

/**
 * Custom Drawable that draws a dashed rounded-rectangle border.
 * Used for to-do item cards since Android XML shape doesn't support dashed strokes.
 */
public class DashedBorderDrawable extends Drawable {

    private final Paint paint;
    private final float cornerRadius;
    private final float strokeWidth;

    /**
     * @param strokeWidthPx  border width in pixels
     * @param dashWidthPx    length of each dash segment in pixels
     * @param dashGapPx      gap between dashes in pixels
     * @param cornerRadiusPx corner radius in pixels
     * @param color          stroke color
     */
    public DashedBorderDrawable(float strokeWidthPx, float dashWidthPx, float dashGapPx,
                                 float cornerRadiusPx, int color) {
        this.cornerRadius = cornerRadiusPx;
        this.strokeWidth = strokeWidthPx;

        paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeWidth(strokeWidthPx);
        paint.setColor(color);
        paint.setPathEffect(new DashPathEffect(new float[]{dashWidthPx, dashGapPx}, 0));
    }

    @Override
    public void draw(@NonNull Canvas canvas) {
        float half = strokeWidth / 2f;
        RectF rect = new RectF(half, half,
                getBounds().width() - half, getBounds().height() - half);
        canvas.drawRoundRect(rect, cornerRadius, cornerRadius, paint);
    }

    @Override
    public void setAlpha(int alpha) {
        paint.setAlpha(alpha);
    }

    @Override
    public void setColorFilter(@Nullable ColorFilter colorFilter) {
        paint.setColorFilter(colorFilter);
    }

    @Override
    public int getOpacity() {
        return PixelFormat.TRANSLUCENT;
    }
}
