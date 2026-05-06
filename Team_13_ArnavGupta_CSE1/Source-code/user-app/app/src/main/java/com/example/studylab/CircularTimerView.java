package com.example.studylab;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.RectF;
import android.graphics.Typeface;
import android.util.AttributeSet;
import android.util.TypedValue;
import android.view.View;

import androidx.annotation.Nullable;
import androidx.core.content.ContextCompat;
import androidx.core.content.res.ResourcesCompat;

/**
 * Custom View that draws a circular countdown timer with:
 * - Outer glow effect
 * - Gray-blue track ring
 * - Blue progress arc with rounded caps
 * - Inner white circle with inset shadow
 * - Centered time text and "REMAINING" label
 */
public class CircularTimerView extends View {

    private float progress = 1.0f; // 1.0 = full, 0.0 = empty
    private String timeText = "00:45:00";

    private Paint glowPaint;
    private Paint trackPaint;
    private Paint progressPaint;
    private Paint innerShadowPaint;
    private Paint innerCirclePaint;
    private Paint timePaint;
    private Paint labelPaint;

    private RectF arcRect;
    private float strokeWidth;

    public CircularTimerView(Context context) {
        super(context);
        init();
    }

    public CircularTimerView(Context context, @Nullable AttributeSet attrs) {
        super(context, attrs);
        init();
    }

    public CircularTimerView(Context context, @Nullable AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        init();
    }

    private void init() {
        // Software layer needed for blur effects
        setLayerType(LAYER_TYPE_SOFTWARE, null);

        strokeWidth = dp(12);

        glowPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        glowPaint.setStyle(Paint.Style.FILL);
        glowPaint.setColor(ContextCompat.getColor(getContext(), R.color.tmr_glow));

        trackPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        trackPaint.setStyle(Paint.Style.STROKE);
        trackPaint.setStrokeWidth(strokeWidth);
        trackPaint.setColor(ContextCompat.getColor(getContext(), R.color.tmr_arc_track));
        trackPaint.setStrokeCap(Paint.Cap.BUTT);

        progressPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        progressPaint.setStyle(Paint.Style.STROKE);
        progressPaint.setStrokeWidth(strokeWidth);
        progressPaint.setColor(ContextCompat.getColor(getContext(), R.color.tmr_primary_blue));
        progressPaint.setStrokeCap(Paint.Cap.ROUND);

        innerShadowPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        innerShadowPaint.setStyle(Paint.Style.FILL);
        innerShadowPaint.setColor(0xFFFFFFFF);
        innerShadowPaint.setShadowLayer(dp(8), 0, dp(2), 0x0D000000);

        innerCirclePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        innerCirclePaint.setStyle(Paint.Style.FILL);
        innerCirclePaint.setColor(0xFFFFFFFF);

        timePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        timePaint.setTextAlign(Paint.Align.CENTER);
        timePaint.setTextSize(sp(36));
        timePaint.setColor(ContextCompat.getColor(getContext(), R.color.tmr_text_primary));
        timePaint.setTypeface(Typeface.create("monospace", Typeface.BOLD));
        timePaint.setLetterSpacing(-0.05f);
        // Try to use Space Mono if available
        try {
            Typeface spaceMono = ResourcesCompat.getFont(getContext(), R.font.space_mono);
            if (spaceMono != null) timePaint.setTypeface(Typeface.create(spaceMono, Typeface.BOLD));
        } catch (Exception ignored) {}

        labelPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        labelPaint.setTextAlign(Paint.Align.CENTER);
        labelPaint.setTextSize(sp(12));
        labelPaint.setColor(ContextCompat.getColor(getContext(), R.color.tmr_primary_blue));
        labelPaint.setTypeface(Typeface.create(Typeface.DEFAULT, Typeface.BOLD));
        labelPaint.setLetterSpacing(0.2f);

        arcRect = new RectF();
    }

    @Override
    protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
        int w = MeasureSpec.getSize(widthMeasureSpec);
        int h = MeasureSpec.getSize(heightMeasureSpec);
        // Use the width but allow extra height for glow/label
        setMeasuredDimension(w, h);
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);

        float viewW = getWidth();
        float viewH = getHeight();
        float ringSize = Math.min(viewW, viewW); // square ring
        float cx = viewW / 2f;
        // Offset to give room for label below
        float cy = viewH / 2f - dp(16);
        float radius = (ringSize / 2f) - strokeWidth - dp(8);

        // 1. Glow
        float glowRadius = radius + strokeWidth + dp(16);
        canvas.drawCircle(cx, cy, glowRadius, glowPaint);

        // 2. Track arc (full 360)
        arcRect.set(cx - radius, cy - radius, cx + radius, cy + radius);
        canvas.drawArc(arcRect, 0, 360, false, trackPaint);

        // 3. Progress arc
        float sweepAngle = progress * 360f;
        canvas.drawArc(arcRect, -90, sweepAngle, false, progressPaint);

        // 4. Inner white circle with shadow
        float innerRadius = radius - strokeWidth / 2f - dp(2);
        canvas.drawCircle(cx, cy, innerRadius, innerShadowPaint);
        canvas.drawCircle(cx, cy, innerRadius - dp(1), innerCirclePaint);

        // 5. Time text
        float textY = cy + timePaint.getTextSize() / 3f;
        canvas.drawText(timeText, cx, textY, timePaint);

        // 6. "REMAINING" label
        float labelY = textY + dp(24);
        canvas.drawText("REMAINING", cx, labelY, labelPaint);
    }

    public void setProgress(float progress) {
        this.progress = Math.max(0, Math.min(1, progress));
        invalidate();
    }

    public void setTimeText(String text) {
        this.timeText = text;
        invalidate();
    }

    public float getProgress() {
        return progress;
    }

    private float dp(int val) {
        return TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, val,
                getResources().getDisplayMetrics());
    }

    private float sp(int val) {
        return TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_SP, val,
                getResources().getDisplayMetrics());
    }
}
