import { useEffect, useState } from "react";
import {
    ChevronDown,
    ChevronUp,
    MessageCircle,
    UserRound,
    Droplets,
} from "lucide-react";

import { saveFeedbackReply } from "../../services/feedback.service";

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

    const [
        replyDraft,
        setReplyDraft,
    ] = useState(
        feedback?.admin_reply || ""
    );

    const [
        savingReply,
        setSavingReply,
    ] = useState(false);

    const [
        replyError,
        setReplyError,
    ] = useState("");

    useEffect(() => {
        setReplyDraft(
            feedback?.admin_reply || ""
        );
    }, [feedback?.admin_reply]);


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

    const replyHistory =
        (feedback.admin_reply || "")
            .split(/\n\s*---\s*\n/)
            .map((entry) => entry.trim())
            .filter(Boolean);


    /*
     * Toggle review
     */

    function handleToggle() {
        setIsExpanded(
            (previous) =>
                !previous
        );
    }

    async function handleSaveReply(
        event
    ) {
        event.preventDefault();

        const trimmedReply =
            replyDraft.trim();

        if (!trimmedReply) {
            setReplyError(
                "Please enter a reply before saving."
            );
            return;
        }

        try {
            setSavingReply(true);
            setReplyError("");

            const updatedFeedback =
                await saveFeedbackReply(
                    feedback.id,
                    trimmedReply
                );

            if (updatedFeedback?.admin_reply) {
                feedback.admin_reply =
                    updatedFeedback.admin_reply;
                feedback.admin_replied_at =
                    updatedFeedback.admin_replied_at ||
                    new Date().toISOString();

                setReplyDraft(
                    ""
                );
            }
        } catch (error) {
            console.error(
                "Failed to save admin reply:",
                error
            );

            setReplyError(
                error?.message ||
                    "Unable to save the reply right now."
            );
        } finally {
            setSavingReply(false);
        }
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
                        ADMIN REPLY
                    ================================================== */}

                    <div className="feedback-admin-reply-box">
                        <div className="feedback-admin-reply-header">
                            <MessageCircle
                                size={15}
                            />
                            <span>Admin Response</span>
                        </div>

                        {replyHistory.length > 0 && (
                            <div className="feedback-replies-history">
                                {replyHistory.map((reply, index) => (
                                    <div
                                        key={`${feedback.id}-reply-${index}`}
                                        className="feedback-saved-reply"
                                    >
                                        <strong>
                                            {index === 0 ? "Last reply:" : `Reply ${index + 1}:`}
                                        </strong>
                                        <p>{reply}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        <textarea
                            value={replyDraft}
                            onChange={(event) => {
                                setReplyDraft(
                                    event.target.value
                                );
                                setReplyError("");
                            }}
                            placeholder="Write a reply to this customer..."
                            rows={4}
                        />

                        {replyError && (
                            <small className="feedback-reply-error">
                                {replyError}
                            </small>
                        )}

                        <div className="feedback-reply-actions">
                            <button
                                type="button"
                                className="feedback-reply-button"
                                onClick={handleSaveReply}
                                disabled={
                                    savingReply ||
                                    !replyDraft.trim()
                                }
                            >
                                {savingReply
                                    ? "Saving..."
                                    : "Save Reply"}
                            </button>
                        </div>
                    </div>

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