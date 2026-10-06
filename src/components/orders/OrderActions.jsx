import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import useAuth from "../../hooks/useAuth";

function OrderActions({ order, onView }) {
  const [loading, setLoading] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const actionsRef = useRef(null);

  const { user } = useAuth();

  // ==========================================
  // PAYMENT INFORMATION
  // ==========================================

  const paymentMethod = String(
    order?.payment_method || ""
  )
    .trim()
    .toLowerCase();

  const paymentStatus = String(
    order?.payment_status || ""
  )
    .trim()
    .toLowerCase();

  const totalAmount = Number(
    order?.total_price || 0
  );

  const isGcash = paymentMethod === "gcash";

  const isPending =
    paymentStatus === "pending";

  // ==========================================
  // CLOSE DROPDOWN WHEN CLICKING OUTSIDE
  // ==========================================

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        actionsRef.current &&
        !actionsRef.current.contains(event.target)
      ) {
        setShowActions(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setShowActions(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );

      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  // ==========================================
  // VERIFY GCASH PAYMENT
  // ==========================================

  const handleVerifyPayment = async () => {
    if (!order?.id || loading) {
      return;
    }

    // Make sure this is a GCash order
    if (!isGcash) {
      alert(
        "This order does not use GCash."
      );

      return;
    }

    // Make sure payment is still pending
    if (!isPending) {
      alert(
        `This payment is already ${
          order?.payment_status || "processed"
        }.`
      );

      return;
    }

    // ==========================================
    // NO GCASH REFERENCE CHECK
    // ==========================================
    // Reference numbers are no longer required.
    // Admin can verify the payment directly.

    const confirmed = window.confirm(
      "Verify this GCash payment?\n\n" +
        `Total Order Amount: ₱${totalAmount.toLocaleString(
          "en-PH",
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }
        )}\n\n` +
        "Please make sure you have checked the actual GCash transaction before confirming."
    );

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);

      // Make sure admin is logged in
      if (!user) {
        throw new Error(
          "You must be logged in as an administrator."
        );
      }

      const verifiedBy =
        user.email ||
        user.id ||
        "Admin";

      // ==========================================
      // VERIFY PAYMENT
      // ==========================================

      const {
        data,
        error,
      } = await supabase
        .from("orders")
        .update({
          payment_status: "Verified",
          payment_verified_at:
            new Date().toISOString(),
          verified_by: verifiedBy,
        })
        .eq("id", order.id)
        .eq(
          "payment_status",
          "Pending"
        )
        .select()
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error(
          "The payment could not be verified. " +
            "The order may have already been processed or no longer exists."
        );
      }

      alert(
        "GCash payment verified successfully."
      );

      // Reload the page to show updated status
      window.location.reload();

    } catch (error) {
      console.error(
        "GCash verification error:",
        error
      );

      alert(
        error?.message ||
          "Unable to verify the GCash payment. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // REJECT GCASH PAYMENT
  // ==========================================

  const handleRejectPayment = async () => {
    if (!order?.id || loading) {
      return;
    }

    // Make sure this is a GCash order
    if (!isGcash) {
      alert(
        "This order does not use GCash."
      );

      return;
    }

    // Make sure payment is still pending
    if (!isPending) {
      alert(
        `This payment is already ${
          order?.payment_status || "processed"
        }.`
      );

      return;
    }

    const confirmed = window.confirm(
      "Reject this GCash payment?\n\n" +
        `Total Order Amount: ₱${totalAmount.toLocaleString(
          "en-PH",
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }
        )}\n\n` +
        "Only reject the payment if you have confirmed that the transaction cannot be verified."
    );

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);

      // Make sure admin is logged in
      if (!user) {
        throw new Error(
          "You must be logged in as an administrator."
        );
      }

      const rejectedBy =
        user.email ||
        user.id ||
        "Admin";

      // ==========================================
      // REJECT PAYMENT
      // ==========================================

      const {
        data,
        error,
      } = await supabase
        .from("orders")
        .update({
          payment_status: "Rejected",
          payment_verified_at: null,
          verified_by: rejectedBy,
        })
        .eq("id", order.id)
        .eq(
          "payment_status",
          "Pending"
        )
        .select()
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error(
          "The payment could not be rejected. " +
            "The order may have already been processed or no longer exists."
        );
      }

      alert(
        "GCash payment has been rejected."
      );

      // Reload the page
      window.location.reload();

    } catch (error) {
      console.error(
        "GCash rejection error:",
        error
      );

      alert(
        error?.message ||
          "Unable to reject the GCash payment. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <div
      className="d-inline-flex position-relative"
      ref={actionsRef}
    >

      {/* ACTION BUTTON */}
      <button
        type="button"
        className="btn btn-sm btn-primary"
        onClick={() =>
          setShowActions(
            (current) => !current
          )
        }
        disabled={loading}
        aria-expanded={showActions}
        aria-haspopup="menu"
        title="Open order actions"
      >
        <i className="bi bi-three-dots-vertical"></i>

        Action
      </button>

      {/* DROPDOWN */}
      {showActions && (
        <div
          className="dropdown-menu dropdown-menu-end show p-2 shadow"
          style={{
            minWidth: "180px",
            right: 0,
            left: "auto",
          }}
        >

          {/* VIEW */}
          <button
            type="button"
            className="dropdown-item d-flex align-items-center gap-2"
            onClick={() => {
              setShowActions(false);

              onView(order);
            }}
            disabled={loading}
          >
            <i className="bi bi-eye"></i>

            View
          </button>

          {/* GCASH ACTIONS */}
          {isGcash && isPending && (
            <>
              <div className="dropdown-divider my-1"></div>

              {/* VERIFY */}
              <button
                type="button"
                className="dropdown-item d-flex align-items-center gap-2 text-success"
                onClick={() => {
                  setShowActions(false);

                  handleVerifyPayment();
                }}
                disabled={loading}
              >
                <i className="bi bi-check-circle"></i>

                Verify
              </button>

              {/* REJECT */}
              <button
                type="button"
                className="dropdown-item d-flex align-items-center gap-2 text-danger"
                onClick={() => {
                  setShowActions(false);

                  handleRejectPayment();
                }}
                disabled={loading}
              >
                <i className="bi bi-x-circle"></i>

                Reject
              </button>
            </>
          )}

        </div>
      )}

    </div>
  );
}

export default OrderActions;