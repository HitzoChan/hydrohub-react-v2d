import { useEffect, useState } from "react";
import {
    PencilSquare,
    Trash,
    PlusCircleFill
} from "react-bootstrap-icons";

import { getProducts } from "../../services/product.service";

import AddProductModal from "./products/AddProductModal";
import EditProductModal from "./products/EditProductModal";
import DeleteProductModal from "./products/DeleteProductModal";

export default function ProductsSettings() {

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showAddModal, setShowAddModal] = useState(false);

    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [selectedProduct, setSelectedProduct] = useState(null);

    useEffect(() => {
        loadProducts();
    }, []);

    async function loadProducts() {

        try {

            setLoading(true);

            const data = await getProducts();

            setProducts(data);

        } catch (err) {

            console.error(err);

        } finally {

            setLoading(false);

        }

    }

    function handleEdit(product) {

        setSelectedProduct(product);
        setShowEditModal(true);

    }

    function handleDelete(product) {

        setSelectedProduct(product);
        setShowDeleteModal(true);

    }

function closeModals() {

    console.log("Closing all modals...");

    setShowEditModal(false);
    setShowDeleteModal(false);
    setShowAddModal(false);

    setTimeout(() => {
        setSelectedProduct(null);
    }, 50);

}

    return (

        <>

            <div className="card shadow-sm border-0">

                <div className="card-header bg-white d-flex justify-content-between align-items-center">

                    <div>

                        <h5 className="mb-1">

                            Product Management

                        </h5>

                        <small className="text-muted">

                            Manage all products available for ordering.

                        </small>

                    </div>

                    <button
                        className="btn btn-primary"
                        onClick={() => setShowAddModal(true)}
                    >

                        <PlusCircleFill className="me-2" />

                        Add Product

                    </button>

                </div>

                <div className="card-body p-0">

                    {loading ? (

                        <div className="text-center py-5">

                            <div className="spinner-border text-primary" />

                        </div>

                    ) : (

                        <div
                                className="table-responsive"
                                style={{ overflowX: "auto" }}
                            >

                            <table className="table table-hover table-sm align-middle mb-0 products-table">

                                <thead className="table-light small">

                                    <tr>

                                        <th className="ps-4">Product</th>
                                        <th>Capacity</th>
                                        <th>Base Price</th>
                                        <th>Exchange Price</th>
                                        <th>Exchange</th>
                                        <th>Status</th>

                                        <th
                                            className="text-center pe-4"
                                            style={{ minWidth: "150px" }}
                                        >
                                            Actions
                                        </th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {products.length === 0 ? (

                                        <tr>

                                            <td
                                                colSpan={7}
                                                className="text-center text-muted py-5"
                                            >

                                                No products found.

                                            </td>

                                        </tr>

                                    ) : (

                                        products.map(product => (

                                            <tr key={product.id}>

                                                <td className="ps-4">

                                                    <strong>

                                                        {product.product_name}

                                                    </strong>

                                                </td>

                                                <td>

                                                    {product.capacity}

                                                </td>

                                                <td>

                                                    ₱{Number(product.base_price).toFixed(2)}

                                                </td>

                                                <td>

                                                    ₱{Number(product.exchange_price).toFixed(2)}

                                                </td>

                                                <td>

                                                    {product.exchange_required ? (

                                                        <span className="badge bg-info text-dark small">

                                                            Required

                                                        </span>

                                                    ) : (

                                                        <span className="badge bg-secondary small">

                                                            Optional

                                                        </span>

                                                    )}

                                                </td>

                                                <td>

                                                    {product.enabled ? (

                                                        <span className="badge bg-success small">

                                                            Enabled

                                                        </span>

                                                    ) : (

                                                        <span className="badge bg-danger small">

                                                            Disabled

                                                        </span>

                                                    )}

                                                </td>

                                                    <td className="text-center">

                                                        <div className="d-flex justify-content-center align-items-center gap-2">

                                                            <button
                                                                type="button"
                                                                className="btn btn-outline-primary btn-sm action-btn"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleEdit(product);
                                                                }}
                                                            >
                                                                <PencilSquare />
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="btn btn-outline-danger btn-sm action-btn"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDelete(product);
                                                                }}
                                                            >
                                                                <Trash />
                                                            </button>

                                                        </div>

                                                    </td>

                                            </tr>

                                        ))

                                    )}

                                </tbody>

                            </table>

                        </div>

                    )}

                </div>

            </div>

            <AddProductModal
                show={showAddModal}
                onClose={closeModals}
                onSuccess={loadProducts}
            />

            <EditProductModal
                show={showEditModal}
                product={selectedProduct}
                onClose={closeModals}
                onSuccess={loadProducts}
            />

            <DeleteProductModal
                show={showDeleteModal}
                product={selectedProduct}
                onClose={closeModals}
                onSuccess={loadProducts}
            />

        </>

    );

}