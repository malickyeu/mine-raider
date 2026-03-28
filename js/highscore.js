/* ── highscore.js ── localStorage-based high score tracking ── */

const HS_PREFIX = 'mine_raider_hs';

/**
 * Return the stored high score for the given mode+difficulty.
 * @param {'campaign'|'custom'} mode
 * @param {'easy'|'normal'|'hard'} difficulty
 */
export function getHighScore(mode, difficulty) {
    const key = `${HS_PREFIX}_${mode}_${difficulty}`;
    return parseInt(localStorage.getItem(key) || '0', 10);
}

/**
 * Submit a score; saves if it beats the current record.
 * Returns { isNew: bool, prev: number, score: number }
 */
export function submitScore(mode, difficulty, score) {
    const prev = getHighScore(mode, difficulty);
    const isNew = score > 0 && score > prev;
    if (isNew) {
        const key = `${HS_PREFIX}_${mode}_${difficulty}`;
        localStorage.setItem(key, String(score));
    }
    return { isNew, prev, score };
}

/** Best campaign score across all difficulties. */
export function getBestCampaignScore() {
    return Math.max(
        getHighScore('campaign', 'easy'),
        getHighScore('campaign', 'normal'),
        getHighScore('campaign', 'hard'),
    );
}

