import { useState } from "react";
import { deleteProduct } from "../../../services/product.service";

export default function DeleteProductModal({
    show,
    product,
    onClose,
    onSuccess
}) {

    const [loading, setLoading] = useState(false);

    if (!show || !product) {
        return null;
    }

    async function handleDelete() {

        if (!product?.id) {
            return;
        }

        try {

            setLoading(true);

            await deleteProduct(product.id);

            await onSuccess();

            onClose();

        } catch (err) {

            console.error(
                "Failed to delete product:",
                err
            );

            alert(
                err?.message ||
                "Failed to delete product."
            );

        } finally {

            setLoading(false);

        }

    }

    return (

        <div
            className="modal fade show d-block"
            style={{
                background: "rgba(0,0,0,.5)"
            }}
        >

            <div className="modal-dialog modal-dialog-centered">

                <div className="modal-content">

                    {/* =================================================
                        HEADER
                    ================================================== */}

                    <div className="modal-header">

                        <h5 className="modal-title">
                            Delete Product
                        </h5>

                        <button
                            type="button"
                            className="btn-close"
                            onClick={onClose}
                            disabled={loading}
                        />

                    </div>


                    {/* =================================================
                        BODY
                    ================================================== */}

                    <div className="modal-body">

                        <p className="mb-3">
                            Are you sure you want to delete this product?
                        </p>

                        <div className="alert alert-warning">

                            <div className="fw-semibold">
                                {product.product_name}
                            </div>

                            <div className="small mt-1">
                                Capacity: {product.capacity}
                            </div>

                            {product.initial_containers !== undefined && (

                                <div className="small mt-1">
                                    Initial Containers:{" "}
                                    <strong>
                                        {product.initial_containers}
                                    </strong>
                                </div>

                            )}

                        </div>


                        {/* =================================================
                            INVENTORY WARNING
                        ================================================== */}

                        <div className="alert alert-danger mb-0">

                            <div className="d-flex gap-2">

                                <i className="bi bi-exclamation-triangle-fill" />

                                <div>

                                    <strong>
                                        Important
                                    </strong>

                                    <p className="small mb-0 mt-1">
                                        Products that are already being
                                        used by orders or inventory should
                                        normally be disabled instead of
                                        deleted so their transaction history
                                        remains available.
                                    </p>

                                </div>

                            </div>

                        </div>

                    </div>


                    {/* =================================================
                        FOOTER
                    ================================================== */}

                    <div className="modal-footer">

                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            className="btn btn-danger"
                            onClick={handleDelete}
                            disabled={loading}
                        >

                            {loading
                                ? "Deleting..."
                                : "Delete Product"
                            }

                        </button>

                    </div>

                </div>

            </div>

        </div>

    );

}