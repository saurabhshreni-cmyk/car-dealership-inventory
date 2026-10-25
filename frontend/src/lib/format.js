const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

/** Format a number as US dollars, e.g. 25000.5 -> "$25,000.50". */
export const formatPrice = (value) => usd.format(Number(value));

const dateFormat = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" });

/** Format an ISO timestamp as e.g. "Mar 2, 2026". */
export const formatDate = (iso) => dateFormat.format(new Date(iso));

/** Zero-padded stock number shown on cards, e.g. 7 -> "No. 007". */
export const stockNumber = (id) => `No. ${String(id).padStart(3, "0")}`;
