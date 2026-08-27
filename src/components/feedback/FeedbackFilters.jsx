function FeedbackFilters({
  search = "",
  rating = "all",
  onSearch,
  onRatingChange,
  onReset,
}) {
  const hasFilters =
    search.trim() !== "" ||
    rating !== "all";

  return (
    <div className="feedback-filters">

      {/* =====================================================
          SEARCH
      ===================================================== */}

      <div className="feedback-search">

        <i className="bi bi-search"></i>

        <input
          type="search"
          value={search}
          placeholder="Search customer, driver, comment, or order..."
          onChange={(event) => {
            onSearch?.(
              event.target.value
            );
          }}
        />

        {search && (
          <button
            type="button"
            className="feedback-search-clear"
            onClick={() => {
              onSearch?.("");
            }}
            aria-label="Clear search"
          >
            <i className="bi bi-x-circle-fill"></i>
          </button>
        )}

      </div>


      {/* =====================================================
          RATING FILTER
      ===================================================== */}

      <select
        className="feedback-rating-filter"
        value={rating}
        onChange={(event) => {
          onRatingChange?.(
            event.target.value
          );
        }}
      >

        <option value="all">
          All Ratings
        </option>

        <option value="5">
          5 Stars
        </option>

        <option value="4">
          4 Stars
        </option>

        <option value="3">
          3 Stars
        </option>

        <option value="2">
          2 Stars
        </option>

        <option value="1">
          1 Star
        </option>

      </select>


      {/* =====================================================
          RESET
      ===================================================== */}

      {hasFilters && (
        <button
          type="button"
          className="feedback-reset-button"
          onClick={() => {
            onReset?.();
          }}
        >

          <i className="bi bi-arrow-counterclockwise"></i>

          Reset

        </button>
      )}

    </div>
  );
}

export default FeedbackFilters;