# HydroHub System Overview for Reporting

## Purpose

HydroHub is an admin-facing water-station operations system. It brings together order taking, reservations, deliveries, customer records, employees/drivers, inventory and containers, expenses, feedback, messaging, and system settings. Its Reports page is intended to summarize sales and operating activity for a selected period.

This document describes the data and calculations present in the codebase. It does not query the connected Supabase project, so it contains no live totals and cannot confirm that production records are complete.

## System Areas and Reporting Value

| System area | Main data/entities | Reporting value |
| --- | --- | --- |
| Orders and reservations | `orders` | Sales, order volume/status, delivery type, scheduled time, gallons/containers, payment method and status, customer, assigned driver |
| Customers | `customer_profiles`, customer fields on `orders` | Active and returning buyers, purchase frequency, gallons, and customer sales contribution |
| Deliveries and map monitoring | `deliveries`, order assignment, `employees` | Completion and assignment performance, driver workload, route/service timing if timestamps are captured |
| Employees | `employees` | Driver roster and workforce context; payroll or labor cost is not directly included in report calculations |
| Inventory and products | `products`, `inventory`, `inventory_adjustments` | Stock availability, product movement, stock loss, and potentially cost/stock valuation if cost fields are maintained |
| Container tracking | `container_returns`, `container_borrowings` | Returned, damaged, missing, and currently borrowed container quantities |
| Expenses | `expenses` | Recorded operating costs by date, amount, and expense category; optional driver association is present in the report service mapping |
| Feedback | `feedback` | Customer satisfaction, issue themes, and response follow-up |
| Messaging | `conversations`, `messages` | Customer communication volume and service follow-up, subject to consistent categorization |
| Settings | `system_settings` | Operational/payment configuration, not a source of business-performance totals |

The main application areas are available as protected pages. The Reports page reads directly from Supabase through the reports service; its primary source tables are `orders`, `expenses`, `employees`, `container_returns`, and `container_borrowings`.

## What Reports Currently Calculates

The report supports current/previous month, last 7/30 days, current/previous year, and custom date ranges. It also loads the immediately preceding period with the same number of days and calculates percentage changes for revenue, expenses, net profit, total orders, and gallons sold. If the previous value is zero, the trend is shown as having no previous data.

| Current report output | Current definition/source |
| --- | --- |
| Revenue | Sum of `orders.total_price` for `delivered` or `completed` orders, excluding cancelled orders and rejected payments |
| Expenses | Sum of `expenses.amount` in the date range |
| Net profit | Revenue minus recorded expenses; this is not necessarily accounting net income |
| Profit margin | Net profit divided by revenue, expressed as a percentage; zero when revenue is zero |
| ROI | Net profit divided by recorded expenses, expressed as a percentage; zero when expenses are zero |
| Total orders | All orders created in the selected date range, regardless of status |
| Gallons sold | Sum of `orders.gallons` for revenue-eligible orders |
| Active customers | Distinct customer IDs on any orders in the selected range, including orders that are not completed |
| Order status counts | All orders in the selected period grouped by normalized status |
| Average order value | Revenue divided by completed/revenue-eligible order count |
| Average gallons per order | Gallons on completed/revenue-eligible orders divided by their count |
| Expense breakdown and trend | Sum of expense amounts by `expense_type` and by `expense_date` |
| Financial trend | Daily revenue, expenses, and revenue-minus-expenses across the selected range |
| Delivery types | Count of completed/revenue-eligible orders grouped by `delivery_type` |
| Cash/COD collection | Completed/revenue-eligible cash-like order totals, split into verified and unverified by payment status |
| Payment methods | Count of orders by payment method; this is a count, not a value total |
| GCash status | Completed GCash order value and count of GCash orders not rejected or verified |
| Top customers | Up to five customers ranked by completed sales value, with completed order count and gallons |
| Driver performance | Completed orders and gallons grouped by driver; unassigned orders do not belong to a driver group |
| Delivery pipeline | Pending, assigned, in-transit, completed, and unassigned counts derived from order status/driver assignment |
| Container accountability | Returned/damaged/missing quantities from return records and remaining borrowed quantity from borrowing records |
| Scheduled periods | Scheduled orders grouped into morning, afternoon, or evening when a matching period value exists |
| Attention alerts | Unverified GCash payments, pending orders, and scheduled deliveries without a driver |

## Useful Report Data to Prioritize

### Executive summary

- Revenue, expenses, net profit, and profit margin, each with a clearly labeled comparison period.
- Completed orders, completion rate, cancellation rate, and average order value.
- Gallons sold and revenue per gallon, after confirming what the `gallons` field represents operationally.
- Cash/COD and GCash totals split into verified, pending/unverified, and rejected amounts.
- A short list of exceptions: overdue/pending deliveries, unassigned scheduled orders, and payment verification backlog.

### Sales and customer behavior

- Revenue and completed orders by day/week/month, with a consistent calendar grouping.
- Sales by delivery type and payment method, showing both order count and PHP value.
- Returning-customer share and repeat purchase frequency.
- Top customers by revenue and volume, plus a new-versus-returning breakdown if customer creation dates are reliable.
- Average order value and average gallons per completed order.

### Financial control

- Expense category totals and each category's percentage of total recorded expenses.
- Revenue, recorded expense, and net operating result trend.
- Cost per gallon and expense-to-revenue ratio, once expense coverage and volume units are validated.
- Payment reconciliation: completed cash/COD and GCash sales compared with verified amounts, with unresolved value shown separately from unresolved order count.
- If costs can be classified, separate product/water cost, delivery/fuel, labor, utilities, maintenance, and other overhead rather than treating all expenses as interchangeable.

### Operations and inventory

- Delivery completion rate, pending age, on-time rate, and average time from order to delivery, if the relevant timestamps exist.
- Driver deliveries, gallons, revenue, and exception rates, using a consistent definition and excluding/including unassigned work explicitly.
- Borrowed-container balance across all open borrowings, not only borrowings created during the selected period.
- Stock on hand, low-stock items, inventory adjustments, and stockout days from product/inventory records.
- Feedback score/trend and common issue categories to connect operational performance with customer experience.

## Definitions and Data Caveats

1. **Revenue is completion-based but date-filtered by order creation.** The query selects orders using `orders.created_at`; it does not select by a delivery/completion timestamp. A sale completed this month from an older order may therefore appear in the order's creation period unless the data model or business rule intentionally defines sales that way.
2. **“Profit” is a limited operating estimate.** The current formula subtracts recorded expenses from eligible order revenue. It does not establish that every expense is entered, distinguish cash flow from accruals, or account for cost of goods sold unless those costs are entered as expenses.
3. **Payment labels need careful interpretation.** GCash “received” is calculated from eligible completed order value, not strictly verified payment value. The page separately exposes verified/pending information, but the label should not be treated as a bank-reconciled receipt total.
4. **Some figures use different order populations.** Total orders, status counts, payment-method counts, and active customers use all orders in the period, while sales, gallons sold, top customers, and driver completed-delivery figures use completed/revenue-eligible orders. Showing the denominator beside rates will prevent misleading comparisons.
5. **Container values are period activity, not necessarily a full current balance.** Returns and borrowings are selected by record `created_at` in the selected period. Borrowed quantity is calculated from each selected borrowing after subtracting its recorded returns/damage/missing quantity; older still-open borrowings may be absent from a period report.
6. **“Gallons” and container counts should be named precisely.** The report refers to gallons and also describes the measure as 5-gallon containers. Confirm whether `orders.gallons` stores gallons of water, number of containers, or another quantity; use separate labels/units if both are needed.
7. **Driver figures may omit workload context.** Driver summaries are derived from orders that have a `driver_id`; unassigned orders are not attributed to a driver. The registered driver roster is fetched by role but is not the same as active/available drivers.
8. **Expense accuracy depends on the expense date and category.** The range uses `expenses.expense_date`; missing or inconsistent expense categories are grouped as “Other.”
9. **Trend views should disclose their grouping.** Daily data is grouped to monthly by calendar month for the yearly view. The weekly view groups sequential daily rows into blocks of seven, rather than calendar weeks.
10. **Live data and schema need verification.** Source code shows which tables are queried, but not whether deployed data is complete, whether all optional columns are populated, or whether database policies permit every query in production.

## Suggested Report Page Structure

1. **Period and data status:** selected range, comparison range, and last refresh time.
2. **Executive KPIs:** eligible revenue, recorded expenses, net operating result, profit margin, completed orders, gallons, and comparison changes.
3. **Sales and demand:** revenue/volume trend, order status funnel, delivery type, payment method, average order value, and customer repeat activity.
4. **Cash and payment control:** verified/unverified/rejected value and counts by payment method, plus reconciliation exceptions.
5. **Operating performance:** completion/on-time measures, driver workload, unassigned/scheduled work, and delivery time.
6. **Inventory and containers:** stock risk, adjustments, returns, damages, missing containers, and all-period outstanding borrowing.
7. **Costs and customer experience:** expense categories/trend, feedback trend, and high-priority customer issues.

Prioritize trustworthy definitions and visible data freshness before adding more charts. A smaller report with reconciled totals and explicit date/denominator rules is more useful than a larger report with ambiguous numbers.

## Source Files

- [Reports page](src/pages/Reports.jsx)
- [Report calculations and Supabase queries](src/services/reports.service.js)
- [Report date-range utilities](src/utils/reportDateUtils.js)
- [Shared financial calculations](src/utils/reportCalculations.js)
- [Report KPI cards](src/components/reports/ReportKpiCards.jsx)
- [Report analytics charts](src/components/reports/ReportAnalytics.jsx)
- [Report operations charts](src/components/reports/OperationsOverview.jsx)
- [Application routes and modules](src/App.jsx)