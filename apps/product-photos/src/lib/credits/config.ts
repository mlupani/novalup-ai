// `Number("")` is 0 and `Number(undefined)` is NaN — a blank `FREE_CREDITS=` in a
// hand-edited .env must fall back to the default, not silently grant 0 credits.
const raw = Number(process.env.FREE_CREDITS);
export const FREE_CREDITS = Number.isFinite(raw) && raw > 0 ? raw : 3;
