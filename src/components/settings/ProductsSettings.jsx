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

    const [showAddModal, setShowAddModal] =
        useState(false);

    const [showEditModal, setShowEditModal] =
        useState(false);

    const [showDeleteModal, setShowDeleteModal] =
        useState(false);

    const [selectedProduct, setSelectedProduct] =
        useState(null);


    /*
    |--------------------------------------------------------------------------
    | LOAD PRODUCTS
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        loadProducts();
    }, []);


    async function loadProducts() {

        try {

            setLoading(true);

            const data = await getProducts();

            setProducts(
                Array.isArray(data)
                    ? data
                    : []
            );

        } catch (err) {

            console.error(
                "Failed to load products:",
                err
            );

        } finally {

            setLoading(false);

        }

    }


    /*
    |--------------------------------------------------------------------------
    | EDIT PRODUCT
    |--------------------------------------------------------------------------
    */

    function handleEdit(product) {

        setSelectedProduct(product);

        setShowEditModal(true);

    }


    /*
    |--------------------------------------------------------------------------
    | DELETE PRODUCT
    |--------------------------------------------------------------------------
    */

    function handleDelete(product) {

        setSelectedProduct(product);

        setShowDeleteModal(true);

    }


    /*
    |--------------------------------------------------------------------------
    | CLOSE MODALS
    |--------------------------------------------------------------------------
    */

    function closeModals() {

        setShowEditModal(false);

        setShowDeleteModal(false);

        setShowAddModal(false);

        setTimeout(() => {

            setSelectedProduct(null);

        }, 50);

    }


    /*
    |--------------------------------------------------------------------------
    | RENDER
    |--------------------------------------------------------------------------
    */

    return (

        <>

            <div className="card shadow-sm border-0 products-settings-card">

                {/* =====================================================
                    HEADER
                ===================================================== */}

                <div className="card-header bg-white d-flex justify-content-between align-items-center products-settings-header">

                    <div className="products-settings-heading">

                        <h5 className="mb-1">
                            Product Management
                        </h5>

                        <small className="text-muted">
                            Manage products, gallon sizes,
                            prices, and initial container
                            ownership.
                        </small>

                    </div>


                    <button
                        type="button"
                        className="btn btn-primary products-settings-add-button"
                        onClick={() =>
                            setShowAddModal(true)
                        }
                    >

                        <PlusCircleFill className="me-2" />

                        Add Product

                    </button>

                </div>


                {/* =====================================================
                    BODY
                ===================================================== */}

                <div className="card-body p-0">

                    {loading ? (

                        <div className="text-center py-5">

                            <div
                                className="spinner-border text-primary"
                                role="status"
                            >
                                <span className="visually-hidden">
                                    Loading...
                                </span>
                            </div>

                            <p className="text-muted mt-3 mb-0">
                                Loading products...
                            </p>

                        </div>

                    ) : (

                        <div
                            className="table-responsive"
                            style={{
                                overflowX: "auto"
                            }}
                        >

                            <table className="table table-hover table-sm align-middle mb-0 products-table">

                                <thead className="table-light small">

                                    <tr>

                                        <th className="ps-4">
                                            Product
                                        </th>

                                        <th>
                                            Capacity
                                        </th>

                                        <th>
                                            Initial Containers
                                        </th>

                                        <th>
                                            Base Price
                                        </th>

                                        <th>
                                            Exchange Price
                                        </th>

                                        <th>
                                            Exchange
                                        </th>

                                        <th>
                                            Status
                                        </th>

                                        <th
                                            className="text-center pe-4"
                                            style={{
                                                minWidth: "150px"
                                            }}
                                        >
                                            Actions
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {products.length === 0 ? (

                                        <tr>

                                            <td
                                                colSpan={8}
                                                className="text-center text-muted py-5"
                                            >

                                                <i
                                                    className="bi bi-box-seam fs-3 d-block mb-2"
                                                />

                                                No products found.

                                            </td>

                                        </tr>

                                    ) : (

                                        products.map(
                                            (product) => (

                                                <tr
                                                    key={
                                                        product.id
                                                    }
                                                >

                                                    {/* PRODUCT */}

                                                    <td className="ps-4">

                                                        <strong>
                                                            {
                                                                product.product_name
                                                            }
                                                        </strong>

                                                    </td>


                                                    {/* CAPACITY */}

                                                    <td>

                                                        <span className="badge bg-light text-dark border">

                                                            {
                                                                product.capacity
                                                            }

                                                        </span>

                                                    </td>


                                                    {/* INITIAL CONTAINERS */}

                                                    <td>

                                                        <div className="d-flex align-items-center gap-2">

                                                            <span
                                                                className="fw-bold"
                                                                style={{
                                                                    fontSize:
                                                                        "15px"
                                                                }}
                                                            >
                                                                {
                                                                    Number(
                                                                        product.initial_containers ??
                                                                        0
                                                                    )
                                                                }
                                                            </span>

                                                            <small className="text-muted">
                                                                containers
                                                            </small>

                                                        </div>

                                                    </td>


                                                    {/* BASE PRICE */}

                                                    <td>

                                                        ₱
                                                        {Number(
                                                            product.base_price ??
                                                            0
                                                        ).toFixed(2)}

                                                    </td>


                                                    {/* EXCHANGE PRICE */}

                                                    <td>

                                                        ₱
                                                        {Number(
                                                            product.exchange_price ??
                                                            0
                                                        ).toFixed(2)}

                                                    </td>


                                                    {/* EXCHANGE */}

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


                                                    {/* STATUS */}

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


                                                    {/* ACTIONS */}

                                                    <td className="text-center">

                                                        <div className="d-flex justify-content-center align-items-center gap-2">

                                                            <button
                                                                type="button"
                                                                className="btn btn-outline-primary btn-sm action-btn"
                                                                title="Edit product"
                                                                onClick={(
                                                                    e
                                                                ) => {

                                                                    e.stopPropagation();

                                                                    handleEdit(
                                                                        product
                                                                    );

                                                                }}
                                                            >

                                                                <PencilSquare />

                                                            </button>


                                                            <button
                                                                type="button"
                                                                className="btn btn-outline-danger btn-sm action-btn"
                                                                title="Delete product"
                                                                onClick={(
                                                                    e
                                                                ) => {

                                                                    e.stopPropagation();

                                                                    handleDelete(
                                                                        product
                                                                    );

                                                                }}
                                                            >

                                                                <Trash />

                                                            </button>

                                                        </div>

                                                    </td>

                                                </tr>

                                            )
                                        )

                                    )}

                                </tbody>

                            </table>

                        </div>

                    )}

                </div>

            </div>


            {/* =====================================================
                ADD PRODUCT MODAL
            ===================================================== */}

            <AddProductModal
                show={showAddModal}
                onClose={closeModals}
                onSuccess={loadProducts}
            />


            {/* =====================================================
                EDIT PRODUCT MODAL
            ===================================================== */}

            <EditProductModal
                show={showEditModal}
                product={selectedProduct}
                onClose={closeModals}
                onSuccess={loadProducts}
            />


            {/* =====================================================
                DELETE PRODUCT MODAL
            ===================================================== */}

            <DeleteProductModal
                show={showDeleteModal}
                product={selectedProduct}
                onClose={closeModals}
                onSuccess={loadProducts}
            />

        </>

    );

}