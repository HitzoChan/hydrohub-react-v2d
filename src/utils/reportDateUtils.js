function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function startOfDay(date) {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
}

function endOfDay(date) {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
}

export function getCurrentMonthRange(reference = new Date()) {
    const start = new Date(reference.getFullYear(), reference.getMonth(), 1);
    const end = new Date(reference.getFullYear(), reference.getMonth() + 1, 0);
    return { startDate: formatDate(start), endDate: formatDate(end) };
}

export function getPreviousMonthRange(reference = new Date()) {
    const start = new Date(reference.getFullYear(), reference.getMonth() - 1, 1);
    const end = new Date(reference.getFullYear(), reference.getMonth(), 0);
    return { startDate: formatDate(start), endDate: formatDate(end) };
}

export function getLast7DaysRange(reference = new Date()) {
    const end = endOfDay(reference);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    return { startDate: formatDate(start), endDate: formatDate(end) };
}

export function getLast30DaysRange(reference = new Date()) {
    const end = endOfDay(reference);
    const start = new Date(end);
    start.setDate(start.getDate() - 29);
    return { startDate: formatDate(start), endDate: formatDate(end) };
}

export function getCurrentYearRange(reference = new Date()) {
    return {
        startDate: formatDate(new Date(reference.getFullYear(), 0, 1)),
        endDate: formatDate(new Date(reference.getFullYear(), 11, 31)),
    };
}

export function getPreviousYearRange(reference = new Date()) {
    return {
        startDate: formatDate(new Date(reference.getFullYear() - 1, 0, 1)),
        endDate: formatDate(new Date(reference.getFullYear() - 1, 11, 31)),
    };
}

export function getCustomRange(startDate, endDate) {
    return { startDate, endDate };
}

export function getRangeForPreset(preset, reference = new Date()) {
    switch (preset) {
        case "previous-month":
            return getPreviousMonthRange(reference);
        case "last-7-days":
            return getLast7DaysRange(reference);
        case "last-30-days":
            return getLast30DaysRange(reference);
        case "current-year":
            return getCurrentYearRange(reference);
        case "previous-year":
            return getPreviousYearRange(reference);
        case "current-month":
        default:
            return getCurrentMonthRange(reference);
    }
}

export function getPreviousEquivalentRange(startDate, endDate) {
    const start = startOfDay(new Date(`${startDate}T00:00:00`));
    const end = startOfDay(new Date(`${endDate}T00:00:00`));
    const duration = Math.max(0, end.getTime() - start.getTime());
    const previousEnd = new Date(start.getTime() - 86400000);
    const previousStart = new Date(previousEnd.getTime() - duration);

    return {
        startDate: formatDate(previousStart),
        endDate: formatDate(previousEnd),
    };
}

export function formatPeriodLabel(startDate, endDate) {
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);

    if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
        return start.toLocaleDateString("en-PH", { month: "long", year: "numeric" });
    }

    return `${start.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })} - ${end.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}`;
}
