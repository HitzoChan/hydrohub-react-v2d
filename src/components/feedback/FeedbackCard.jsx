import { useState } from "react";
import {
    ChevronDown,
    ChevronUp,
    MessageCircle,
    UserRound,
    Droplets,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| Star Rating
|--------------------------------------------------------------------------
*/

function StarRating({
    rating = 0,
    showValue = false,
}) {
    const numericRating =
        Number(rating) || 0;

    return (
        <div className="feedback-star-rating">

            <div className="feedback-stars">
                {[1, 2, 3, 4, 5].map(
                    (star) => (
                        <span
                            key={star}
                            className={
                                star <=
                                numericRating
                                    ? "star-filled"
                                    : "star-empty"
                            }
                        >
                            ★
                        </span>
                    )
                )}
            </div>

            {showValue && (
                <span className="feedback-rating-value">
                    {numericRating.toFixed(1)}
                </span>
            )}

        </div>
    );
}


/*
|--------------------------------------------------------------------------
| Feedback Card
|--------------------------------------------------------------------------
*/

function FeedbackCard({
    feedback,
}) {
    const [
        isExpanded,
        setIsExpanded,
    ] = useState(false);


    /*
     * Prevent rendering an invalid review.
     */

    if (!feedback) {
        return null;
    }


    /*
     * Customer
     */

    const customerName =
        feedback.customer_name ||
        "Unknown Customer";


    /*
     * Driver
     */

    const driverName =
        feedback.driver_name ||
        "Unassigned";


    /*
     * Ratings
     */

    const driverRating =
        Number(
            feedback.driver_rating
        ) || 0;

    const stationRating =
        Number(
            feedback.station_rating
        ) || 0;


    /*
     * Overall rating.
     *
     * Driver + Station / 2
     */

    const overallRating =
        (
            driverRating +
            stationRating
        ) / 2;


    /*
     * Order gallons
     */

    const gallons =
        Number(
            feedback.gallons ??
                feedback.order_gallons
        ) || 0;


    /*
     * Customer comment
     */

    const comment =
        feedback.comment?.trim() ||
        "";


    /*
     * Date
     */

    const createdDate =
        feedback.created_at
            ? new Date(
                  feedback.created_at
              ).toLocaleDateString(
                  "en-US",
                  {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                  }
              )
            : "No date";


    /*
     * Toggle review
     */

    function handleToggle() {
        setIsExpanded(
            (previous) =>
                !previous
        );
    }


    return (
        <div
            className={`feedback-review-item ${
                isExpanded
                    ? "expanded"
                    : ""
            }`}
        >

            {/* ==================================================
                COMPACT REVIEW HEADER
            ================================================== */}

            <button
                type="button"
                className="feedback-review-header"
                onClick={
                    handleToggle
                }
                aria-expanded={
                    isExpanded
                }
            >

                {/* CUSTOMER */}

                <div className="feedback-customer-info">

                    <div className="feedback-avatar">
                        {customerName
                            .charAt(0)
                            .toUpperCase()}
                    </div>


                    <div className="feedback-customer-details">

                        <div className="feedback-customer-name">
                            {customerName}
                        </div>

                        <div className="feedback-review-date">
                            {createdDate}
                        </div>

                    </div>

                </div>


                {/* OVERALL RATING */}

                <div className="feedback-header-right">

                    <StarRating
                        rating={
                            overallRating
                        }
                    />


                    <span className="feedback-expand-icon">

                        {isExpanded ? (
                            <ChevronUp
                                size={18}
                            />
                        ) : (
                            <ChevronDown
                                size={18}
                            />
                        )}

                    </span>

                </div>

            </button>


            {/* ==================================================
                EXPANDED CONTENT
            ================================================== */}

            {isExpanded && (
                <div className="feedback-review-details">

                    {/* ==================================================
                        RATINGS
                    ================================================== */}

                    <div className="feedback-rating-summary">

                        {/* DRIVER */}

                        <div className="feedback-rating-box">

                            <span className="feedback-rating-label">
                                Driver Rating
                            </span>

                            <StarRating
                                rating={
                                    driverRating
                                }
                                showValue
                            />

                        </div>


                        {/* STATION */}

                        <div className="feedback-rating-box">

                            <span className="feedback-rating-label">
                                Station Rating
                            </span>

                            <StarRating
                                rating={
                                    stationRating
                                }
                                showValue
                            />

                        </div>

                    </div>


                    {/* ==================================================
                        COMMENT
                    ================================================== */}

                    {comment && (
                        <div className="feedback-comment">

                            <MessageCircle
                                size={16}
                            />

                            <p>
                                {comment}
                            </p>

                        </div>
                    )}


                    {/* ==================================================
                        ORDER INFORMATION
                    ================================================== */}

                    <div className="feedback-meta">

                        {/* DRIVER */}

                        <div className="feedback-meta-item">

                            <UserRound
                                size={15}
                            />

                            <span>
                                Driver:
                            </span>

                            <strong>
                                {driverName}
                            </strong>

                        </div>


                        {/* GALLONS */}

                        <div className="feedback-meta-item">

                            <Droplets
                                size={15}
                            />

                            <span>
                                Order:
                            </span>

                            <strong>
                                {gallons > 0
                                    ? `${gallons} Gallons`
                                    : "No gallon information"}
                            </strong>

                        </div>

                    </div>

                </div>
            )}

        </div>
    );
}

export default FeedbackCard;