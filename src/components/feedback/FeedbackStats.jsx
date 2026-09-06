function formatRating(value) {
  return Number(value || 0).toFixed(1);
}

function FeedbackStats({
  stats = {},
}) {
  const {
    averageRating = 0,
    totalReviews = 0,
    fiveStarReviews = 0,
    fiveStarPercentage = 0,
    satisfaction = 0,
  } = stats;

  return (
    <div className="row g-3 feedback-stats-grid">

      {/* =====================================================
          AVERAGE RATING
      ===================================================== */}

      <div className="col-6 col-xl-3 feedback-stat-col">

        <div className="feedback-stat-card">

          <div className="feedback-stat-icon feedback-rating-icon">
            <i className="bi bi-star-fill"></i>
          </div>

          <div className="feedback-stat-content">

            <span className="feedback-stat-label">
              Average Rating
            </span>

            <h3>
              {formatRating(
                averageRating
              )}
            </h3>

            <div className="feedback-stat-stars">

              {[1, 2, 3, 4, 5].map(
                (star) => (
                  <i
                    key={star}
                    className={
                      star <=
                      Math.round(
                        averageRating
                      )
                        ? "bi bi-star-fill"
                        : "bi bi-star"
                    }
                  />
                )
              )}

            </div>

          </div>

        </div>

      </div>


      {/* =====================================================
          TOTAL REVIEWS
      ===================================================== */}

      <div className="col-6 col-xl-3 feedback-stat-col">

        <div className="feedback-stat-card">

          <div className="feedback-stat-icon feedback-reviews-icon">
            <i className="bi bi-chat-square-text-fill"></i>
          </div>

          <div className="feedback-stat-content">

            <span className="feedback-stat-label">
              Total Reviews
            </span>

            <h3>
              {totalReviews}
            </h3>

            <small>
              Customer submissions
            </small>

          </div>

        </div>

      </div>


      {/* =====================================================
          5-STAR REVIEWS
      ===================================================== */}

      <div className="col-6 col-xl-3 feedback-stat-col">

        <div className="feedback-stat-card">

          <div className="feedback-stat-icon feedback-five-star-icon">
            <i className="bi bi-stars"></i>
          </div>

          <div className="feedback-stat-content">

            <span className="feedback-stat-label">
              5-Star Reviews
            </span>

            <h3>
              {formatRating(
                fiveStarPercentage
              )}
              %
            </h3>

            <small>
              {fiveStarReviews} excellent{" "}
              {fiveStarReviews === 1
                ? "review"
                : "reviews"}
            </small>

          </div>

        </div>

      </div>


      {/* =====================================================
          SATISFACTION
      ===================================================== */}

      <div className="col-6 col-xl-3 feedback-stat-col">

        <div className="feedback-stat-card">

          <div className="feedback-stat-icon feedback-satisfaction-icon">
            <i className="bi bi-emoji-smile-fill"></i>
          </div>

          <div className="feedback-stat-content">

            <span className="feedback-stat-label">
              Satisfaction
            </span>

            <h3>
              {formatRating(
                satisfaction
              )}
              %
            </h3>

            <small>
              Ratings of 4 or higher
            </small>

          </div>

        </div>

      </div>

    </div>
  );
}

export default FeedbackStats;