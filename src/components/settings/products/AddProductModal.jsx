import { useState } from "react";
import { addProduct } from "../../../services/product.service";

export default function AddProductModal({

    show,
    onClose,
    onSuccess

}) {

    const [form, setForm] = useState({

        product_name: "",
        capacity: "",
        base_price: "",
        exchange_price: "",
        exchange_required: true,
        enabled: true

    });

    const [saving, setSaving] = useState(false);

    async function handleSubmit(e) {

        e.preventDefault();

        try {

            setSaving(true);

            await addProduct({

                ...form,

                base_price: Number(form.base_price),

                exchange_price: Number(form.exchange_price)

            });

            onSuccess();

            onClose();

            setForm({

                product_name: "",
                capacity: "",
                base_price: "",
                exchange_price: "",
                exchange_required: true,
                enabled: true

            });

        } catch (err) {

            console.error(err);

            alert(err.message);

        } finally {

            setSaving(false);

        }

    }

    if (!show) return null;

    return (

        <div
            className="modal fade show d-block"
            style={{ background: "rgba(0,0,0,.5)" }}
        >

            <div className="modal-dialog">

                <div className="modal-content">

                    <form onSubmit={handleSubmit}>

                        <div className="modal-header">

                            <h5 className="modal-title">

                                Add Product

                            </h5>

                            <button
                                type="button"
                                className="btn-close"
                                onClick={onClose}
                            />

                        </div>

                        <div className="modal-body">

                            <div className="mb-3">

                                <label className="form-label">

                                    Product Name

                                </label>

                                <input
                                    className="form-control"
                                    value={form.product_name}
                                    onChange={e =>
                                        setForm({
                                            ...form,
                                            product_name: e.target.value
                                        })
                                    }
                                    required
                                />

                            </div>

                            <div className="mb-3">

                                <label className="form-label">

                                    Capacity

                                </label>

                                <input
                                    className="form-control"
                                    value={form.capacity}
                                    onChange={e =>
                                        setForm({
                                            ...form,
                                            capacity: e.target.value
                                        })
                                    }
                                    required
                                />

                            </div>

                            <div className="row">

                                <div className="col">

                                    <label className="form-label">

                                        Base Price

                                    </label>

                                    <input
                                        type="number"
                                        className="form-control"
                                        value={form.base_price}
                                        onChange={e =>
                                            setForm({
                                                ...form,
                                                base_price: e.target.value
                                            })
                                        }
                                        required
                                    />

                                </div>

                                <div className="col">

                                    <label className="form-label">

                                        Exchange Price

                                    </label>

                                    <input
                                        type="number"
                                        className="form-control"
                                        value={form.exchange_price}
                                        onChange={e =>
                                            setForm({
                                                ...form,
                                                exchange_price: e.target.value
                                            })
                                        }
                                        required
                                    />

                                </div>

                            </div>

                            <div className="form-check mt-3">

                                <input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={form.exchange_required}
                                    onChange={e =>
                                        setForm({
                                            ...form,
                                            exchange_required: e.target.checked
                                        })
                                    }
                                />

                                <label className="form-check-label">

                                    Exchange Required

                                </label>

                            </div>

                        </div>

                        <div className="modal-footer">

                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={onClose}
                            >

                                Cancel

                            </button>

                            <button
                                className="btn btn-primary"
                                disabled={saving}
                            >

                                {saving ? "Saving..." : "Add Product"}

                            </button>

                        </div>

                    </form>

                </div>

            </div>

        </div>

    );

}