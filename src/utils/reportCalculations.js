export function calculatePercentageChange(currentValue, previousValue) {
    const current = Number(currentValue) || 0;
    const previous = Number(previousValue) || 0;

    if (previous === 0) {
        return null;
    }

    return ((current - previous) / Math.abs(previous)) * 100;
}

export function calculateNetProfit(revenue, expenses) {
    return (Number(revenue) || 0) - (Number(expenses) || 0);
}

export function calculateProfitMargin(revenue, profit) {
    const totalRevenue = Number(revenue) || 0;
    return totalRevenue > 0 ? ((Number(profit) || 0) / totalRevenue) * 100 : 0;
}

export function calculateAverageOrderValue(revenue, completedOrders) {
    const orders = Number(completedOrders) || 0;
    return orders > 0 ? (Number(revenue) || 0) / orders : 0;
}
