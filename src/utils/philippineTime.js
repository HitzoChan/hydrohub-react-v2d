export function parseDateValue(value) {
  if (!value && value !== 0) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatBrowserTime(value, options = {}) {
  const date = parseDateValue(value);

  if (!date) {
    return "";
  }

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    ...options,
  });
}

export function formatBrowserDate(value, options = {}) {
  const date = parseDateValue(value);

  if (!date) {
    return "";
  }

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    ...options,
  });
}
