package com.example.studylab;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Path;
import android.util.AttributeSet;
import android.view.View;

/**
 * Reusable line-chart custom view.
 *
 * Call {@link #setData(float[])} with check-in avg scores (1–10 scale)
 * to update the chart. If no data is set the view draws nothing visible.
 *
 * The Y axis spans 0–10 so the dots always sit at the correct relative height.
 */
public class FocusEnergyChartView extends View {

    private float[] data = null;  // avg scores, 1–10 scale

    private Paint linePaint;
    private Paint fillPaint;
    private Paint gridPaint;
    private Paint dotPaint;
    private Paint dotBorderPaint;

    // ── Constructors ──────────────────────────────────────────

    public FocusEnergyChartView(Context context) {
        super(context); init();
    }
    public FocusEnergyChartView(Context context, AttributeSet attrs) {
        super(context, attrs); init();
    }
    public FocusEnergyChartView(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr); init();
    }

    // ── Public API ────────────────────────────────────────────

    /**
     * Feed the chart with avg score data (values in 1–10 range).
     * Each element represents one check-in day.
     * Call invalidate() is handled here automatically.
     */
    public void setData(float[] scores) {
        this.data = (scores != null && scores.length > 0) ? scores : null;
        invalidate();
    }

    // ── Init ──────────────────────────────────────────────────

    private void init() {
        linePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        linePaint.setColor(0xFF288BE4);
        linePaint.setStrokeWidth(6f);
        linePaint.setStyle(Paint.Style.STROKE);
        linePaint.setStrokeJoin(Paint.Join.ROUND);
        linePaint.setStrokeCap(Paint.Cap.ROUND);

        fillPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        fillPaint.setColor(0x1A288BE4);
        fillPaint.setStyle(Paint.Style.FILL);

        gridPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        gridPaint.setColor(0xFFEAEEF4);
        gridPaint.setStrokeWidth(1f);

        dotPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        dotPaint.setColor(0xFF288BE4);
        dotPaint.setStyle(Paint.Style.FILL);

        dotBorderPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        dotBorderPaint.setColor(0xFFFFFFFF);
        dotBorderPaint.setStyle(Paint.Style.FILL);
    }

    // ── Drawing ───────────────────────────────────────────────

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);

        int w = getWidth();
        int h = getHeight();
        if (w == 0 || h == 0) return;

        float pL = 8f, pR = 8f, pT = 16f, pB = 16f;
        float chartW = w - pL - pR;
        float chartH = h - pT - pB;

        // Always draw grid lines (4 horizontal lines)
        for (int i = 0; i <= 4; i++) {
            float y = pT + chartH * i / 4f;
            canvas.drawLine(pL, y, w - pR, y, gridPaint);
        }

        // Nothing to draw yet
        if (data == null || data.length == 0) return;

        int count = data.length;

        // For a single point just draw the dot
        if (count == 1) {
            float x = pL + chartW / 2f;
            float y = pT + chartH - (data[0] / 10f * chartH);
            canvas.drawCircle(x, y, 9f, dotBorderPaint);
            canvas.drawCircle(x, y, 6f, dotPaint);
            return;
        }

        float stepX = chartW / (count - 1f);

        // Build smooth bezier path
        Path path = buildSmoothPath(data, pL, pT, stepX, chartH);

        // Fill under the line
        Path fill = new Path(path);
        float lastX = pL + (count - 1) * stepX;
        fill.lineTo(lastX, pT + chartH);
        fill.lineTo(pL, pT + chartH);
        fill.close();
        canvas.drawPath(fill, fillPaint);

        // Draw line
        canvas.drawPath(path, linePaint);

        // Draw dots
        for (int i = 0; i < count; i++) {
            float x = pL + i * stepX;
            float y = pT + chartH - (data[i] / 10f * chartH);
            canvas.drawCircle(x, y, 9f, dotBorderPaint);
            canvas.drawCircle(x, y, 6f, dotPaint);
        }
    }

    private Path buildSmoothPath(float[] d, float startX, float startY, float stepX, float chartH) {
        Path path = new Path();
        int count = d.length;
        path.moveTo(startX, startY + chartH - (d[0] / 10f * chartH));

        for (int i = 1; i < count; i++) {
            float prevX = startX + (i - 1) * stepX;
            float prevY = startY + chartH - (d[i - 1] / 10f * chartH);
            float currX = startX + i * stepX;
            float currY = startY + chartH - (d[i] / 10f * chartH);
            path.cubicTo(prevX + stepX / 2f, prevY,
                         currX - stepX / 2f, currY,
                         currX, currY);
        }
        return path;
    }
}
