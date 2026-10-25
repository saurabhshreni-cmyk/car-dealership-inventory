const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

/** Format a number as US dollars, e.g. 25000.5 -> "$25,000.50". */
export const formatPrice = (value) => usd.format(Number(value));

/** Zero-padded stock number shown on cards, e.g. 7 -> "No. 007". */
export const stockNumber = (id) => `No. ${String(id).padStart(3, "0")}`;
