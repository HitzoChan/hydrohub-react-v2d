import { supabase } from "./supabase";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

/**
 * Safely convert a value to a number.
 */
function toNumber(value, fallback = 0) {
    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : fallback;
}


/**
 * Safely convert an ID to a string.
 */
function normalizeId(value) {
    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value).trim();
}


/*
|--------------------------------------------------------------------------
| Normalize Feedback
|--------------------------------------------------------------------------
*/

function normalizeFeedback(
    feedback,
    related = {}
) {
    const order =
        related.order || null;

    const employee =
        related.employee || null;

    /*
     * Driver ID can come from:
     *
     * 1. feedback.driver_id
     * 2. orders.driver_id
     *
     * The first one is preferred.
     */

    const driverId =
        normalizeId(
            feedback.driver_id
        ) ||
        normalizeId(
            order?.driver_id
        );


    /*
     * Customer name should primarily come
     * from the order because the orders table
     * already stores customer_name.
     */

    const customerName =
        order?.customer_name ||
        feedback.customer_name ||
        "Unknown Customer";


    /*
     * Driver name comes from employees.name.
     */

    const driverName =
        employee?.name ||
        feedback.driver_name ||
        "Unassigned";


    /*
     * Gallons comes from the actual order.
     */

    const gallons =
        order?.gallons !== null &&
        order?.gallons !== undefined
            ? toNumber(
                  order.gallons
              )
            : 0;


    /*
     * Total payment comes from the actual order.
     */

    const totalPrice =
        order?.total_price !== null &&
        order?.total_price !== undefined
            ? toNumber(
                  order.total_price
              )
            : 0;


    return {
        ...feedback,


        /*
         * Feedback information
         */

        id:
            feedback.id || "",

        order_id:
            normalizeId(
                feedback.order_id
            ),

        customer_id:
            normalizeId(
                feedback.customer_id
            ),

        driver_id:
            driverId,


        driver_rating:
            toNumber(
                feedback.driver_rating
            ),

        station_rating:
            toNumber(
                feedback.station_rating
            ),

        comment:
            feedback.comment || "",

        admin_reply:
            feedback.admin_reply || "",

        admin_replied_at:
            feedback.admin_replied_at ||
            feedback.replied_at ||
            null,

        created_at:
            feedback.created_at ||
            null,

        updated_at:
            feedback.updated_at ||
            null,


        /*
         * Customer information
         */

        customer_name:
            customerName,


        /*
         * Driver information
         */

        driver_name:
            driverName,


        /*
         * Order information
         *
         * These are NEW fields for the
         * Feedback UI.
         */

        gallons,

        order_gallons:
            gallons,

        order_total:
            totalPrice,

        total_price:
            totalPrice,

        order_customer_name:
            customerName,

        order_driver_id:
            normalizeId(
                order?.driver_id
            ),

        order_status:
            order?.status || "",

        order_created_at:
            order?.created_at || null,
    };
}


/*
|--------------------------------------------------------------------------
| Load Related Orders
|--------------------------------------------------------------------------
|
| Feedback does not currently have a foreign-key relationship that we
| can rely on for a Supabase nested select.
|
| Therefore we load the orders separately using feedback.order_id.
|
|--------------------------------------------------------------------------
*/

async function loadRelatedOrders(
    feedbackRecords
) {
    const orderIds = [
        ...new Set(
            feedbackRecords
                .map(
                    (item) =>
                        normalizeId(
                            item.order_id
                        )
                )
                .filter(Boolean)
        ),
    ];


    if (orderIds.length === 0) {
        return new Map();
    }


    const {
        data,
        error,
    } = await supabase
        .from("orders")
        .select(
            `
                id,
                customer_id,
                customer_name,
                gallons,
                total_price,
                driver_id,
                status,
                created_at
            `
        )
        .in(
            "id",
            orderIds
        );


    if (error) {
        console.error(
            "[Feedback] Failed to load related orders:",
            error
        );

        /*
         * Do not completely break the Feedback page
         * if order information cannot be loaded.
         *
         * The feedback itself can still be displayed.
         */

        return new Map();
    }


    const orderMap =
        new Map();


    (data || []).forEach(
        (order) => {
            orderMap.set(
                normalizeId(
                    order.id
                ),
                order
            );
        }
    );


    return orderMap;
}


/*
|--------------------------------------------------------------------------
| Load Related Employees / Drivers
|--------------------------------------------------------------------------
|
| employees.id is UUID and matches feedback.driver_id.
|
|--------------------------------------------------------------------------
*/

async function loadRelatedEmployees(
    feedbackRecords,
    orderMap = new Map()
) {
    const driverIds = [
        ...new Set(
            feedbackRecords
                .map((item) => {

                    const feedbackDriverId =
                        normalizeId(
                            item.driver_id
                        );

                    if (
                        feedbackDriverId
                    ) {
                        return feedbackDriverId;
                    }


                    const order =
                        orderMap.get(
                            normalizeId(
                                item.order_id
                            )
                        );


                    return normalizeId(
                        order?.driver_id
                    );
                })
                .filter(Boolean)
        ),
    ];


    if (driverIds.length === 0) {
        return new Map();
    }


    const {
        data,
        error,
    } = await supabase
        .from("employees")
        .select(
            `
                id,
                name,
                role,
                status,
                phone,
                driver_status
            `
        )
        .in(
            "id",
            driverIds
        );


    if (error) {
        console.error(
            "[Feedback] Failed to load related employees:",
            error
        );

        /*
         * Don't break the Feedback page if
         * employee lookup fails.
         */

        return new Map();
    }


    const employeeMap =
        new Map();


    (data || []).forEach(
        (employee) => {
            employeeMap.set(
                normalizeId(
                    employee.id
                ),
                employee
            );
        }
    );


    return employeeMap;
}


/*
|--------------------------------------------------------------------------
| Enrich Feedback Records
|--------------------------------------------------------------------------
*/

async function enrichFeedbackRecords(
    feedbackRecords = []
) {
    if (
        !feedbackRecords ||
        feedbackRecords.length === 0
    ) {
        return [];
    }


    /*
     * First load orders.
     */

    const orderMap =
        await loadRelatedOrders(
            feedbackRecords
        );


    /*
     * Then load employees/drivers.
     */

    const employeeMap =
        await loadRelatedEmployees(
            feedbackRecords,
            orderMap
        );


    /*
     * Finally combine everything.
     */

    return feedbackRecords.map(
        (feedback) => {

            const order =
                orderMap.get(
                    normalizeId(
                        feedback.order_id
                    )
                ) || null;


            const driverId =
                normalizeId(
                    feedback.driver_id
                ) ||
                normalizeId(
                    order?.driver_id
                );


            const employee =
                employeeMap.get(
                    driverId
                ) || null;


            return normalizeFeedback(
                feedback,
                {
                    order,
                    employee,
                }
            );
        }
    );
}


/*
|--------------------------------------------------------------------------
| Get All Feedback
|--------------------------------------------------------------------------
|
| Loads REAL customer feedback from Supabase.
|
| Also loads:
|
| - Customer name
| - Driver name
| - Gallons
| - Order total
| - Order status
|
|--------------------------------------------------------------------------
*/

export async function getFeedback() {
    console.log(
        "[Feedback] Loading customer feedback..."
    );


    /*
     * Load actual feedback records.
     */

    const {
        data,
        error,
    } = await supabase
        .from("feedback")
        .select("*")
        .order(
            "created_at",
            {
                ascending: false,
            }
        );


    if (error) {
        console.error(
            "[Feedback] Failed to load feedback:",
            error
        );

        throw error;
    }


    console.log(
        `[Feedback] ${
            data?.length || 0
        } feedback records loaded.`
    );


    /*
     * Enrich feedback with actual
     * orders and employees.
     */

    return enrichFeedbackRecords(
        data || []
    );
}


/*
|--------------------------------------------------------------------------
| Get Feedback By Order
|--------------------------------------------------------------------------
|
| Used by the customer application and admin logic
| to determine whether an order has already been reviewed.
|
|--------------------------------------------------------------------------
*/

export async function saveFeedbackReply(
    feedbackId,
    replyText
) {
    const normalizedReply =
        String(replyText || "")
            .trim();

    if (!feedbackId) {
        throw new Error(
            "Feedback ID is required."
        );
    }

    if (!normalizedReply) {
        return null;
    }

    const {
        data: current,
        error: fetchError,
    } = await supabase
        .from("feedback")
        .select("admin_reply")
        .eq("id", feedbackId)
        .maybeSingle();

    if (fetchError) {
        throw fetchError;
    }

    const existingReply =
        typeof current?.admin_reply === "string"
            ? current.admin_reply.trim()
            : "";

    const combinedReply =
        existingReply
            ? `${existingReply}\n\n---\n\n${normalizedReply}`
            : normalizedReply;

    const {
        data,
        error,
    } = await supabase
        .from("feedback")
        .update({
            admin_reply: combinedReply,
            admin_replied_at: new Date().toISOString(),
        })
        .eq("id", feedbackId)
        .select()
        .single();

    if (error) {
        console.error(
            "[Feedback] Failed to save admin reply:",
            error
        );

        throw error;
    }

    return data;
}


export async function getFeedbackByOrder(
    orderId
) {
    if (!orderId) {
        return null;
    }


    const {
        data,
        error,
    } = await supabase
        .from("feedback")
        .select("*")
        .eq(
            "order_id",
            orderId
        )
        .maybeSingle();


    if (error) {
        console.error(
            "[Feedback] Failed to load order feedback:",
            error
        );

        throw error;
    }


    if (!data) {
        return null;
    }


    /*
     * Enrich the single feedback record
     * exactly like getFeedback().
     */

    const enriched =
        await enrichFeedbackRecords(
            [data]
        );


    return (
        enriched[0] ||
        null
    );
}


/*
|--------------------------------------------------------------------------
| Calculate Feedback Statistics
|--------------------------------------------------------------------------
|
| Statistics are calculated from REAL customer feedback.
|
|--------------------------------------------------------------------------
*/

export function calculateFeedbackStatistics(
    feedback = []
) {
    const totalReviews =
        feedback.length;


    if (totalReviews === 0) {
        return {
            totalReviews: 0,

            averageDriverRating: 0,

            averageStationRating: 0,

            averageRating: 0,

            fiveStarReviews: 0,

            fiveStarPercentage: 0,

            satisfaction: 0,

            ratingDistribution: {
                5: 0,
                4: 0,
                3: 0,
                2: 0,
                1: 0,
            },
        };
    }


    /*
     * Driver Rating
     */

    const totalDriverRating =
        feedback.reduce(
            (
                total,
                item
            ) =>
                total +
                toNumber(
                    item.driver_rating
                ),
            0
        );


    const averageDriverRating =
        totalDriverRating /
        totalReviews;


    /*
     * Station Rating
     */

    const totalStationRating =
        feedback.reduce(
            (
                total,
                item
            ) =>
                total +
                toNumber(
                    item.station_rating
                ),
            0
        );


    const averageStationRating =
        totalStationRating /
        totalReviews;


    /*
     * Overall Rating
     *
     * Average of driver and station ratings.
     */

    const averageRating =
        (
            averageDriverRating +
            averageStationRating
        ) / 2;


    /*
     * 5-Star Feedback
     *
     * Both driver and station must be 5.
     */

    const fiveStarReviews =
        feedback.filter(
            (item) =>
                Number(
                    item.driver_rating
                ) === 5 &&
                Number(
                    item.station_rating
                ) === 5
        ).length;


    const fiveStarPercentage =
        (
            fiveStarReviews /
            totalReviews
        ) * 100;


    /*
     * Satisfaction
     *
     * Both ratings must be at least 4.
     */

    const satisfiedReviews =
        feedback.filter(
            (item) =>
                Number(
                    item.driver_rating
                ) >= 4 &&
                Number(
                    item.station_rating
                ) >= 4
        ).length;


    const satisfaction =
        (
            satisfiedReviews /
            totalReviews
        ) * 100;


    /*
     * Rating Distribution
     *
     * Uses the average of driver and station rating.
     */

    const ratingDistribution = {
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0,
    };


    feedback.forEach(
        (item) => {

            const overallRating =
                Math.round(
                    (
                        Number(
                            item.driver_rating
                        ) +
                        Number(
                            item.station_rating
                        )
                    ) / 2
                );


            if (
                ratingDistribution[
                    overallRating
                ] !== undefined
            ) {
                ratingDistribution[
                    overallRating
                ] += 1;
            }
        }
    );


    return {
        totalReviews,

        averageDriverRating,

        averageStationRating,

        averageRating,

        fiveStarReviews,

        fiveStarPercentage,

        satisfaction,

        ratingDistribution,
    };
}


/*
|--------------------------------------------------------------------------
| Search / Filter Feedback
|--------------------------------------------------------------------------
*/

export function filterFeedback(
    feedback = [],
    search = "",
    rating = "all"
) {
    const searchValue =
        String(
            search || ""
        )
            .toLowerCase()
            .trim();


    return feedback.filter(
        (item) => {

            /*
             * Search
             */

            const matchesSearch =
                searchValue === "" ||

                String(
                    item.customer_name ||
                    ""
                )
                    .toLowerCase()
                    .includes(
                        searchValue
                    ) ||

                String(
                    item.driver_name ||
                    ""
                )
                    .toLowerCase()
                    .includes(
                        searchValue
                    ) ||

                String(
                    item.comment ||
                    ""
                )
                    .toLowerCase()
                    .includes(
                        searchValue
                    ) ||

                String(
                    item.order_id ||
                    ""
                )
                    .toLowerCase()
                    .includes(
                        searchValue
                    ) ||

                String(
                    item.gallons ||
                    ""
                )
                    .toLowerCase()
                    .includes(
                        searchValue
                    );


            /*
             * Rating
             */

            let matchesRating =
                true;


            if (
                rating !== "all"
            ) {
                const selectedRating =
                    Number(
                        rating
                    );


                const overallRating =
                    Math.round(
                        (
                            Number(
                                item.driver_rating
                            ) +
                            Number(
                                item.station_rating
                            )
                        ) / 2
                    );


                matchesRating =
                    overallRating ===
                    selectedRating;
            }


            return (
                matchesSearch &&
                matchesRating
            );
        }
    );
}