function renderStars(rating) {
  const roundedRating = Math.round(
    Number(rating || 0)
  );

  return (
    <div className="feedback-stars">

      {[1, 2, 3, 4, 5].map(
        (star) => (
          <i
            key={star}
            className={
              star <= roundedRating
                ? "bi bi-star-fill filled"
                : "bi bi-star"
            }
          />
        )
      )}

    </div>
  );
}


function RatingDistribution({
  stats = {},
}) {

  const {
    averageRating = 0,
    totalReviews = 0,
    ratingDistribution = {},
  } = stats;


  return (
    <div className="card shadow-sm border-0 feedback-panel">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="card-header bg-white border-0">

        <h5 className="fw-bold mb-1">
          Rating Distribution
        </h5>

        <small className="text-muted">
          Overall customer rating
          breakdown.
        </small>

      </div>


      {/* =====================================================
          BODY
      ===================================================== */}

      <div className="card-body">


        {/* ===================================================
            AVERAGE
        =================================================== */}

        <div className="feedback-average">

          <h2>
            {Number(
              averageRating || 0
            ).toFixed(1)}
          </h2>

          {renderStars(
            averageRating
          )}

          <span>
            Based on{" "}
            {totalReviews}{" "}
            {totalReviews === 1
              ? "review"
              : "reviews"}
          </span>

        </div>


        {/* ===================================================
            DISTRIBUTION
        =================================================== */}

        <div className="rating-bars">

          {[5, 4, 3, 2, 1].map(
            (rating) => {

              const count =
                Number(
                  ratingDistribution[
                    rating
                  ] || 0
                );


              const percentage =
                totalReviews > 0
                  ? (
                      count /
                      totalReviews
                    ) * 100
                  : 0;


              return (
                <div
                  className="rating-bar-row"
                  key={rating}
                >

                  {/* STAR NUMBER */}

                  <div className="rating-label">

                    <span>
                      {rating}
                    </span>

                    <i className="bi bi-star-fill"></i>

                  </div>


                  {/* PROGRESS */}

                  <div className="rating-progress">

                    <div
                      className="rating-progress-fill"
                      style={{
                        width:
                          `${percentage}%`,
                      }}
                    />

                  </div>


                  {/* COUNT */}

                  <span className="rating-count">
                    {count}
                  </span>

                </div>
              );
            }
          )}

        </div>

      </div>

    </div>
  );
}

export default RatingDistribution;