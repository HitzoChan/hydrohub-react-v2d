import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

function OrderDetailsModal({ order, onClose }) {
  const [receiptUrl, setReceiptUrl] = useState(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [receiptError, setReceiptError] = useState(false);
  const [receiptErrorMessage, setReceiptErrorMessage] = useState("");

  const RECEIPT_BUCKET = "payment-receipts";

  // ============================================================
  // FORMAT AMOUNT
  // ============================================================

  const formatAmount = (amount) => {
    return `₱${Number(amount || 0).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // ============================================================
  // FORMAT TIME
  // ============================================================

  const formatTime = (time) => {
    if (!time) return "-";

    try {
      const [hours, minutes] = String(time).split(":");

      const date = new Date();

      date.setHours(
        Number(hours),
        Number(minutes),
        0,
        0
      );

      return date.toLocaleTimeString("en-PH", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return time;
    }
  };

  // ============================================================
  // PAYMENT STATUS
  // ============================================================

  const formatPaymentStatus = (status) => {
    const normalized = String(status || "")
      .trim()
      .toLowerCase();

    if (
      normalized === "verified" ||
      normalized === "paid"
    ) {
      return (
        <span className="badge bg-success">
          {status}
        </span>
      );
    }

    if (
      normalized === "rejected" ||
      normalized === "failed" ||
      normalized === "cancelled"
    ) {
      return (
        <span className="badge bg-danger">
          {status}
        </span>
      );
    }

    return (
      <span className="badge bg-warning text-dark">
        {status || "Pending"}
      </span>
    );
  };

  // ============================================================
  // ORDER STATUS
  // ============================================================

  const formatOrderStatus = (status) => {
    switch (status) {
      case "pending":
        return (
          <span className="badge bg-warning text-dark">
            Pending
          </span>
        );

      case "assigned":
        return (
          <span className="badge bg-info">
            Assigned
          </span>
        );

      case "on_the_way":
        return (
          <span className="badge bg-primary">
            On the Way
          </span>
        );

      case "delivered":
        return (
          <span className="badge bg-success">
            Delivered
          </span>
        );

      case "cancelled":
        return (
          <span className="badge bg-danger">
            Cancelled
          </span>
        );

      default:
        return (
          <span className="badge bg-secondary">
            {status || "Unknown"}
          </span>
        );
    }
  };

  // ============================================================
  // GET STORAGE PATH
  // ============================================================

  const getReceiptStoragePath = (receipt) => {
    if (!receipt) {
      return null;
    }

    const value = String(receipt).trim();

    if (!value) {
      return null;
    }

    // Already a storage path
    if (
      !value.startsWith("http://") &&
      !value.startsWith("https://")
    ) {
      return value.replace(/^\/+/, "");
    }

    try {
      const parsedUrl = new URL(value);

      const pathname = decodeURIComponent(
        parsedUrl.pathname
      );

      // Public URL
      const publicMarker =
        `/object/public/${RECEIPT_BUCKET}/`;

      if (pathname.includes(publicMarker)) {
        return pathname
          .split(publicMarker)[1]
          ?.replace(/^\/+/, "");
      }

      // Signed URL
      const signedMarker =
        `/object/sign/${RECEIPT_BUCKET}/`;

      if (pathname.includes(signedMarker)) {
        return pathname
          .split(signedMarker)[1]
          ?.replace(/^\/+/, "");
      }

      return null;
    } catch (error) {
      console.error(
        "Unable to parse payment receipt URL:",
        error
      );

      return null;
    }
  };

  // ============================================================
  // LOAD PAYMENT RECEIPT
  // ============================================================

  useEffect(() => {
    let cancelled = false;

    const loadReceipt = async () => {
      setReceiptUrl(null);
      setReceiptError(false);
      setReceiptErrorMessage("");

      const receipt = String(
        order?.receipt_url || ""
      ).trim();

      // No receipt
      if (!receipt) {
        console.log(
          "No payment receipt attached to this order."
        );
        return;
      }

      const storagePath =
        getReceiptStoragePath(receipt);

      if (!storagePath) {
        console.error(
          "Invalid payment receipt path:",
          receipt
        );

        if (!cancelled) {
          setReceiptError(true);
          setReceiptErrorMessage(
            "The payment receipt path is invalid."
          );
        }

        return;
      }

      console.log(
        "========================================"
      );
      console.log(
        "LOADING PAYMENT RECEIPT"
      );
      console.log(
        "Bucket:",
        RECEIPT_BUCKET
      );
      console.log(
        "Original receipt_url:",
        receipt
      );
      console.log(
        "Storage path:",
        storagePath
      );
      console.log(
        "========================================"
      );

      if (!cancelled) {
        setReceiptLoading(true);
      }

      try {
        // ======================================================
        // STEP 1
        // TRY PUBLIC URL FIRST
        // ======================================================

        const {
          data: publicData,
        } = supabase.storage
          .from(RECEIPT_BUCKET)
          .getPublicUrl(storagePath);

        const publicUrl =
          publicData?.publicUrl || null;

        if (publicUrl) {
          console.log(
            "Public receipt URL generated:"
          );

          console.log(publicUrl);

          if (!cancelled) {
            setReceiptUrl(publicUrl);
            setReceiptError(false);
          }

          return;
        }

        // ======================================================
        // STEP 2
        // FALLBACK TO SIGNED URL
        // ======================================================

        console.log(
          "Public URL unavailable. Trying signed URL..."
        );

        const {
          data: signedData,
          error: signedError,
        } = await supabase.storage
          .from(RECEIPT_BUCKET)
          .createSignedUrl(
            storagePath,
            60 * 60
          );

        if (signedError) {
          throw signedError;
        }

        if (!signedData?.signedUrl) {
          throw new Error(
            "Supabase did not return a signed URL."
          );
        }

        console.log(
          "Signed receipt URL created successfully."
        );

        if (!cancelled) {
          setReceiptUrl(
            signedData.signedUrl
          );

          setReceiptError(false);
        }
      } catch (error) {
        console.error(
          "Unable to load payment receipt:",
          error
        );

        if (!cancelled) {
          setReceiptUrl(null);
          setReceiptError(true);

          setReceiptErrorMessage(
            error?.message ||
              "The payment receipt could not be loaded."
          );
        }
      } finally {
        if (!cancelled) {
          setReceiptLoading(false);
        }
      }
    };

    if (order) {
      loadReceipt();
    }

    return () => {
      cancelled = true;
    };
  }, [order?.receipt_url]);

  // ============================================================
  // RECEIPT IMAGE ERROR
  // ============================================================

  const handleReceiptImageError = async () => {
    console.error(
      "The payment receipt image could not be displayed."
    );

    const storagePath =
      getReceiptStoragePath(
        order?.receipt_url
      );

    if (!storagePath) {
      setReceiptUrl(null);
      setReceiptError(true);
      setReceiptErrorMessage(
        "The payment receipt path is invalid."
      );
      return;
    }

    try {
      console.log(
        "Public receipt URL failed."
      );

      console.log(
        "Trying signed URL as fallback..."
      );

      const {
        data,
        error,
      } = await supabase.storage
        .from(RECEIPT_BUCKET)
        .createSignedUrl(
          storagePath,
          60 * 60
        );

      if (error) {
        throw error;
      }

      if (!data?.signedUrl) {
        throw new Error(
          "Unable to create signed receipt URL."
        );
      }

      console.log(
        "Signed URL fallback created."
      );

      setReceiptUrl(data.signedUrl);
      setReceiptError(false);
      setReceiptErrorMessage("");
    } catch (error) {
      console.error(
        "Signed URL fallback failed:",
        error
      );

      setReceiptUrl(null);
      setReceiptError(true);

      setReceiptErrorMessage(
        "The receipt image could not be displayed. Please check the Supabase Storage configuration."
      );
    }
  };

  // ============================================================
  // RECEIPT IMAGE LOADED
  // ============================================================

  const handleReceiptImageLoad = () => {
    console.log(
      "Payment receipt image loaded successfully."
    );

    setReceiptError(false);
    setReceiptErrorMessage("");
  };

  // ============================================================
  // NO ORDER
  // ============================================================

  if (!order) {
    return null;
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div
      className="modal fade show d-block"
      style={{
        background: "rgba(15,23,42,.45)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"
        style={{
          maxWidth: "900px",
        }}
      >
        <div className="modal-content order-modal">

          {/* ====================================================
              HEADER
          ==================================================== */}

          <div className="modal-header order-modal-header">
            <div>
              <h4 className="modal-title order-modal-title">
                Order Details
              </h4>

              <small className="text-muted">
                Review customer, order, pricing, and
                payment information
              </small>
            </div>

            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Close"
            />
          </div>

          {/* ====================================================
              BODY
          ==================================================== */}

          <div className="modal-body order-modal-body">

            {/* ==================================================
                CUSTOMER INFORMATION
            =================================================== */}

            <div className="order-section">

              <h5 className="section-title">
                Customer Information
              </h5>

              <table className="table order-table">
                <tbody>

                  <tr>
                    <th width="220">
                      Customer Name
                    </th>

                    <td>
                      {order.customer_name || "-"}
                    </td>
                  </tr>

                  <tr>
                    <th>
                      Customer ID
                    </th>

                    <td>
                      {order.customer_id || "-"}
                    </td>
                  </tr>

                  <tr>
                    <th>
                      Complete Address
                    </th>

                    <td>
                      {order.address || "-"}
                    </td>
                  </tr>

                </tbody>
              </table>

            </div>

            {/* ==================================================
                ORDER INFORMATION
            =================================================== */}

            <div className="order-section mt-4">

              <h5 className="section-title">
                Order Information
              </h5>

              <table className="table order-table">
                <tbody>

                  <tr>
                    <th width="220">
                      Order ID
                    </th>

                    <td>
                      #{order.id}
                    </td>
                  </tr>

                  <tr>
                    <th>
                      Date Ordered
                    </th>

                    <td>
                      {order.created_at
                        ? new Date(
                            order.created_at
                          ).toLocaleString("en-PH")
                        : "-"}
                    </td>
                  </tr>

                  <tr>
                    <th>
                      Product
                    </th>

                    <td>
                      {order.product_name || "-"}
                    </td>
                  </tr>

                  <tr>
                    <th>
                      Capacity
                    </th>

                    <td>
                      {order.capacity || "-"}
                    </td>
                  </tr>

                  <tr>
                    <th>
                      Gallons Ordered
                    </th>

                    <td>
                      {order.gallons ?? 0}
                    </td>
                  </tr>

                  <tr>
                    <th>
                      Delivery Type
                    </th>

                    <td>
                      {order.delivery_type || "-"}
                    </td>
                  </tr>

                  <tr>
                    <th>
                      Scheduled Date
                    </th>

                    <td>
                      {formatDate(
                        order.scheduled_date
                      )}
                    </td>
                  </tr>

                  <tr>
                    <th>
                      Scheduled Time
                    </th>

                    <td>
                      {formatTime(
                        order.scheduled_time
                      )}
                    </td>
                  </tr>

                  <tr>
                    <th>
                      Exchange Required
                    </th>

                    <td>
                      {order.exchange_required === true
                        ? "Yes"
                        : order.exchange_required === false
                        ? "No"
                        : "-"}
                    </td>
                  </tr>

                </tbody>
              </table>

            </div>

            {/* ==================================================
                PRICING INFORMATION
            =================================================== */}

            <div className="order-section mt-4">

              <h5 className="section-title">
                Pricing Information
              </h5>

              <table className="table order-table">
                <tbody>

                  <tr>
                    <th width="220">
                      Base Price
                    </th>

                    <td>
                      {formatAmount(
                        order.base_price
                      )}
                    </td>
                  </tr>

                  <tr>
                    <th>
                      Exchange Price
                    </th>

                    <td>
                      {formatAmount(
                        order.exchange_price
                      )}
                    </td>
                  </tr>

                  <tr className="total-row">
                    <th>
                      Total Amount
                    </th>

                    <td>
                      <span className="order-total">
                        {formatAmount(
                          order.total_price
                        )}
                      </span>
                    </td>
                  </tr>

                </tbody>
              </table>

            </div>

            {/* ==================================================
                PAYMENT INFORMATION
            =================================================== */}

            <div className="order-section mt-4">

              <h5 className="section-title">
                Payment Information
              </h5>

              <table className="table order-table">

                <tbody>

                  {/* PAYMENT METHOD */}

                  <tr>
                    <th width="220">
                      Payment Method
                    </th>

                    <td>
                      {order.payment_method ||
                        "Cash"}
                    </td>
                  </tr>

                  {/* PAYMENT STATUS */}

                  <tr>
                    <th>
                      Payment Status
                    </th>

                    <td>
                      {formatPaymentStatus(
                        order.payment_status
                      )}
                    </td>
                  </tr>

                  {/* ==================================================
                      PAYMENT RECEIPT
                  =================================================== */}

                  {String(
                    order.payment_method || ""
                  )
                    .toLowerCase()
                    .includes("gcash") && (

                    <tr>

                      <th
                        style={{
                          verticalAlign: "top",
                        }}
                      >
                        Payment Receipt
                      </th>

                      <td>

                        {/* LOADING */}

                        {receiptLoading && (
                          <div
                            className="border rounded p-4 text-center"
                            style={{
                              background:
                                "#f8fafc",
                            }}
                          >

                            <div
                              className="spinner-border text-primary mb-3"
                              role="status"
                            />

                            <div className="text-muted">
                              Loading payment receipt...
                            </div>

                          </div>
                        )}

                        {/* ERROR */}

                        {!receiptLoading &&
                          receiptError && (

                            <div
                              className="alert alert-danger mb-0"
                            >

                              <div className="fw-semibold">
                                <i className="bi bi-exclamation-circle me-2"></i>

                                Unable to display the
                                payment receipt.
                              </div>

                              <div className="small mt-2">
                                {receiptErrorMessage ||
                                  "The receipt image could not be displayed."}
                              </div>

                              <div className="small mt-3">
                                <strong>
                                  Storage bucket:
                                </strong>

                                <br />

                                <code>
                                  {RECEIPT_BUCKET}
                                </code>
                              </div>

                              <div className="small mt-3">
                                <strong>
                                  Storage path:
                                </strong>

                                <br />

                                <code>
                                  {getReceiptStoragePath(
                                    order.receipt_url
                                  ) || "-"}
                                </code>
                              </div>

                            </div>
                          )}

                        {/* RECEIPT IMAGE */}

                        {!receiptLoading &&
                          !receiptError &&
                          receiptUrl && (

                            <div
                              className="receipt-preview-container"
                              style={{
                                border:
                                  "1px solid #dee2e6",
                                borderRadius:
                                  "12px",
                                padding:
                                  "12px",
                                background:
                                  "#f8fafc",
                              }}
                            >

                              {/* RECEIPT HEADER */}

                              <div
                                className="d-flex justify-content-between align-items-center mb-3"
                              >

                                <div>

                                  <div className="fw-semibold">

                                    <i className="bi bi-receipt me-2"></i>

                                    GCash Payment Receipt

                                  </div>

                                  <div className="text-success small">

                                    <i className="bi bi-check-circle me-1"></i>

                                    Receipt uploaded

                                  </div>

                                </div>

                              </div>

                              {/* IMAGE */}

                              <div
                                className="text-center"
                                style={{
                                  background:
                                    "#ffffff",
                                  borderRadius:
                                    "8px",
                                  padding:
                                    "10px",
                                  overflow:
                                    "hidden",
                                }}
                              >

                                <img
                                  src={receiptUrl}
                                  alt="GCash Payment Receipt"
                                  onLoad={
                                    handleReceiptImageLoad
                                  }
                                  onError={
                                    handleReceiptImageError
                                  }
                                  style={{
                                    display:
                                      "block",
                                    width:
                                      "100%",
                                    maxWidth:
                                      "100%",
                                    maxHeight:
                                      "650px",
                                    objectFit:
                                      "contain",
                                    borderRadius:
                                      "6px",
                                    margin:
                                      "0 auto",
                                  }}
                                />

                              </div>

                            </div>
                          )}

                        {/* NO RECEIPT */}

                        {!receiptLoading &&
                          !receiptError &&
                          !receiptUrl &&
                          !order.receipt_url && (

                            <span className="text-danger">

                              <i className="bi bi-exclamation-circle me-1"></i>

                              No receipt uploaded

                            </span>
                          )}

                      </td>

                    </tr>
                  )}

                  {/* PAYMENT VERIFIED AT */}

                  <tr>
                    <th>
                      Payment Verified At
                    </th>

                    <td>
                      {order.payment_verified_at
                        ? new Date(
                            order.payment_verified_at
                          ).toLocaleString(
                            "en-PH"
                          )
                        : "-"}
                    </td>
                  </tr>

                  {/* VERIFIED BY */}

                  <tr>
                    <th>
                      Verified By
                    </th>

                    <td>
                      {order.verified_by || "-"}
                    </td>
                  </tr>

                </tbody>

              </table>

            </div>

            {/* ==================================================
                DELIVERY INFORMATION
            =================================================== */}

            <div className="order-section mt-4">

              <h5 className="section-title">
                Delivery Information
              </h5>

              <table className="table order-table">
                <tbody>

                  <tr>
                    <th width="220">
                      Driver ID
                    </th>

                    <td>
                      {order.driver_id ||
                        "Not Assigned"}
                    </td>
                  </tr>

                  <tr>
                    <th>
                      Order Status
                    </th>

                    <td>
                      {formatOrderStatus(
                        order.status
                      )}
                    </td>
                  </tr>

                  <tr>
                    <th>
                      Delivery Address
                    </th>

                    <td>
                      {order.address || "-"}
                    </td>
                  </tr>

                </tbody>
              </table>

            </div>

          </div>

          {/* ====================================================
              FOOTER
          ==================================================== */}

          <div className="modal-footer order-modal-footer">

            <button
              type="button"
              className="btn btn-secondary px-4"
              onClick={onClose}
            >
              Close
            </button>

          </div>

        </div>
      </div>
    </div>
  );
}

export default OrderDetailsModal;