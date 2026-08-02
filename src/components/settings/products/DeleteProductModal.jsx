import { useState } from "react";
import { deleteProduct } from "../../../services/product.service";

export default function DeleteProductModal({
    show,
    product,
    onClose,
    onSuccess
}) {

    const [loading, setLoading] = useState(false);

    if (!show || !product) return null;

    async function handleDelete() {

        try {

            setLoading(true);

            await deleteProduct(product.id);

            onSuccess();
            onClose();

        } catch (err) {

            console.error(err);
            alert(err.message);

        } finally {

            setLoading(false);

        }

    }

    return (

        <div
            className="modal fade show d-block"
            style={{ background: "rgba(0,0,0,.5)" }}
        >

            <div className="modal-dialog modal-dialog-centered">

                <div className="modal-content">

                    <div className="modal-header">

                        <h5 className="modal-title">

                            Delete Product

                        </h5>

                        <button
                            type="button"
                            className="btn-close"
                            onClick={onClose}
                        />

                    </div>

                    <div className="modal-body">

                        <p className="mb-2">

                            Are you sure you want to delete this product?

                        </p>

                        <div className="alert alert-warning mb-0">

                            <strong>

                                {product.product_name}

                            </strong>

                            <br />

                            Capacity: {product.capacity}

                        </div>

                    </div>

                    <div className="modal-footer">

                        <button
                            className="btn btn-secondary"
                            onClick={onClose}
                            disabled={loading}
                        >

                            Cancel

                        </button>

                        <button
                            className="btn btn-danger"
                            onClick={handleDelete}
                            disabled={loading}
                        >

                            {loading ? "Deleting..." : "Delete"}

                        </button>

                    </div>

                </div>

            </div>

        </div>

    );

}