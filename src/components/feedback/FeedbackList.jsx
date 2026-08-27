import FeedbackCard from "./FeedbackCard";

function FeedbackList({
  feedback = [],
  loading = false,
  totalFeedback = 0,
  onReset,
}) {

  /* ========================================================
     LOADING
  ======================================================== */

  if (loading) {
    return (
      <div className="feedback-loading">

        <div className="feedback-spinner"></div>

        <span>
          Loading customer feedback...
        </span>

      </div>
    );
  }


  /* ========================================================
     EMPTY
  ======================================================== */

  if (feedback.length === 0) {
    return (
      <div className="feedback-empty">

        <div className="feedback-empty-icon">

          <i className="bi bi-chat-square-heart"></i>

        </div>


        <h3>
          No feedback found
        </h3>


        <p>
          {totalFeedback === 0
            ? "Customers have not submitted any feedback yet."
            : "No reviews match your current filters."}
        </p>


        {totalFeedback > 0 && (
          <button
            type="button"
            className="feedback-empty-reset"
            onClick={() => {
              onReset?.();
            }}
          >

            <i className="bi bi-arrow-counterclockwise"></i>

            Clear Filters

          </button>
        )}

      </div>
    );
  }


  /* ========================================================
     FEEDBACK LIST
  ======================================================== */

  return (
    <div className="feedback-list">

      {feedback.map((item) => (
        <FeedbackCard
          key={item.id}
          feedback={item}
        />
      ))}

    </div>
  );
}

export default FeedbackList;