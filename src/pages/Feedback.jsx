import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

import FeedbackStats from "../components/feedback/FeedbackStats";
import RatingDistribution from "../components/feedback/RatingDistribution";
import FeedbackFilters from "../components/feedback/FeedbackFilters";
import FeedbackList from "../components/feedback/FeedbackList";

import {
  getFeedback,
  calculateFeedbackStatistics,
  filterFeedback,
} from "../services/feedback.service";

import "../styles/pages/feedback.css";


/* =========================================================
   PAGE
========================================================= */

function Feedback() {

  /* =======================================================
     STATE
  ======================================================= */

  const [
    feedback,
    setFeedback,
  ] = useState([]);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    rating,
    setRating,
  ] = useState("all");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    lastUpdated,
    setLastUpdated,
  ] = useState(null);

  const [
    error,
    setError,
  ] = useState("");


  /* =======================================================
     LOAD / REFRESH FEEDBACK
  ======================================================= */

  const refreshFeedback = async (
    silent = false
  ) => {

    try {

      if (!silent) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      /*
       * Load real feedback from Supabase.
       */
      const data =
        await getFeedback();

      /*
       * Make sure React always receives
       * an array.
       */
      const loadedFeedback =
        Array.isArray(data)
          ? data
          : [];

      /*
       * Update state.
       */
      setFeedback(
        loadedFeedback
      );

      /*
       * Record refresh time.
       */
      setLastUpdated(
        new Date()
      );

    } catch (err) {

      console.error(
        "Unable to load feedback:",
        err
      );

      setError(
        err?.message ||
          "Unable to load customer feedback."
      );

    } finally {

      setLoading(false);
      setRefreshing(false);

    }
  };


  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {

    let mounted = true;


    const load = async () => {

      try {

        setLoading(true);

        setError("");

        /*
         * Load feedback.
         */
        const data =
          await getFeedback();

        /*
         * Don't update state if the
         * component has already unmounted.
         */
        if (!mounted) {
          return;
        }

        const loadedFeedback =
          Array.isArray(data)
            ? data
            : [];


        setFeedback(
          loadedFeedback
        );


        setLastUpdated(
          new Date()
        );

      } catch (err) {

        console.error(
          "Unable to load feedback:",
          err
        );

        if (mounted) {

          setError(
            err?.message ||
              "Unable to load customer feedback."
          );

        }

      } finally {

        if (mounted) {
          setLoading(false);
        }

      }

    };


    load();


    /*
     * Automatically refresh every
     * 30 seconds.
     *
     * This follows the same approach
     * used by your Delivery Management.
     */
    const interval =
      setInterval(() => {

        refreshFeedback(true);

      }, 30000);


    return () => {

      mounted = false;

      clearInterval(
        interval
      );

    };

  }, []);


  /* =======================================================
     STATISTICS
  ======================================================= */

  const stats =
    useMemo(() => {

      return (
        calculateFeedbackStatistics(
          feedback
        ) || {}
      );

    }, [
      feedback,
    ]);


  /* =======================================================
     FILTERED FEEDBACK
  ======================================================= */

  const filteredFeedback =
    useMemo(() => {

      return filterFeedback(
        feedback,
        search,
        rating
      );

    }, [
      feedback,
      search,
      rating,
    ]);


  /* =======================================================
     RESET FILTERS
  ======================================================= */

  const resetFilters = () => {

    setSearch("");

    setRating("all");

  };


  /* =======================================================
     RENDER
  ======================================================= */

  return (

    <div className="dashboard-page">

      <div className="d-flex">

        {/* =================================================
            SIDEBAR
        ================================================= */}

        <Sidebar />


        {/* =================================================
            MAIN CONTENT
        ================================================= */}

        <div className="main-content feedback-main-content">

          <Header />


          {/* =================================================
              PAGE HEADER
          ================================================= */}

          <div className="page-header feedback-page-header mb-3">

            <div className="d-flex align-items-center justify-content-between">

              {/* LEFT */}

              <div className="grow">

                <h2 className="fw-bold mb-1">

                  <i className="bi bi-star-fill me-2 text-warning"></i>

                  Feedback & Reviews

                </h2>


                <p className="text-muted mb-0">

                  View customer ratings,
                  comments, and service
                  satisfaction.

                </p>

              </div>


              {/* RIGHT */}

              <div className="d-flex align-items-center gap-3 ms-auto">

                <button
                  className="btn btn-primary px-4"
                  onClick={() =>
                    refreshFeedback(true)
                  }
                  disabled={
                    refreshing
                  }
                >

                  <i className="bi bi-arrow-clockwise me-2"></i>

                  {refreshing
                    ? "Refreshing..."
                    : "Refresh"}

                </button>

              </div>

            </div>

          </div>


          {/* =================================================
              ERROR
          ================================================= */}

          {error && (

            <div
              className="alert alert-danger d-flex align-items-center justify-content-between"
              role="alert"
            >

              <div>

                <i className="bi bi-exclamation-circle me-2"></i>

                {error}

              </div>


              <button
                className="btn btn-outline-danger btn-sm"
                onClick={() =>
                  refreshFeedback()
                }
              >
                Try Again
              </button>

            </div>

          )}


          {/* =================================================
              FEEDBACK STATISTICS
          ================================================= */}

          <div className="mt-3">

            <FeedbackStats
              stats={stats}
            />

          </div>


          {/* =================================================
              FEEDBACK CONTENT
          ================================================= */}

          <div className="row g-3 mt-1">

            {/* =================================================
                LEFT - RATING DISTRIBUTION
            ================================================= */}

            <div className="col-lg-4">

              <RatingDistribution
                stats={stats}
              />

            </div>


            {/* =================================================
                RIGHT - REVIEWS
            ================================================= */}

            <div className="col-lg-8">

              <div className="card shadow-sm border-0">

                {/* HEADER */}

                <div className="card-header bg-white">

                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">

                    <div>

                      <h5 className="mb-1 fw-bold">

                        Recent Reviews

                      </h5>

                      <small className="text-muted">

                        Customer feedback from
                        completed orders.

                      </small>

                    </div>


                    <span className="badge bg-primary fs-6 px-3 py-2">

                      {
                        filteredFeedback.length
                      }{" "}

                      Review
                      {
                        filteredFeedback.length !== 1
                          ? "s"
                          : ""
                      }

                    </span>

                  </div>

                </div>


                {/* BODY */}

                <div className="card-body">

                  {/* FILTERS */}

                  <FeedbackFilters
                    search={search}
                    rating={rating}
                    onSearch={setSearch}
                    onRatingChange={
                      setRating
                    }
                    onReset={
                      resetFilters
                    }
                  />


                  {/* LIST */}

                  <FeedbackList
                    feedback={
                      filteredFeedback
                    }
                    loading={
                      loading
                    }
                    totalFeedback={
                      feedback.length
                    }
                    onReset={
                      resetFilters
                    }
                  />

                </div>

              </div>

            </div>

          </div>


          <div className="feedback-footer">
            <Footer />
          </div>

        </div>

      </div>

    </div>

  );
}


export default Feedback;