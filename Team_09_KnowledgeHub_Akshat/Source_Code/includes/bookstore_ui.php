<?php
/**
 * Demo UI helpers: static-ish ratings and star markup (no extra tables required).
 */

/** Deterministic “demo” rating 3.0–4.9 from id (or DB column if set). */
function bookstore_display_rating(int $bookId, ?float $dbRating = null): float
{
    if ($dbRating !== null && $dbRating > 0) {
        return min(5.0, max(0.0, round((float) $dbRating, 1)));
    }
    $base = 3.0 + (($bookId * 17) % 20) / 10;
    return round(min(4.9, $base), 1);
}

/** Simple 5-star row (filled + empty) for CSS. */
function bookstore_stars_html(float $ratingOutOf5): string
{
    $full = (int) floor($ratingOutOf5);
    $half = ($ratingOutOf5 - $full) >= 0.5 ? 1 : 0;
    $empty = 5 - $full - $half;
    $html = '<span class="star-rating" aria-label="Rating ' . htmlspecialchars((string) $ratingOutOf5) . ' out of 5">';
    $html .= str_repeat('<span class="star star-full">★</span>', $full);
    if ($half) {
        $html .= '<span class="star star-half">★</span>';
    }
    $html .= str_repeat('<span class="star star-empty">☆</span>', max(0, $empty));
    $html .= '</span> ';
    $html .= '<span class="star-rating-num">' . htmlspecialchars((string) $ratingOutOf5) . '</span>';
    return $html;
}
