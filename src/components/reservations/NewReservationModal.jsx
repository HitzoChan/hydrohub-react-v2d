import { useEffect, useMemo, useState } from "react";
import { getEnabledProducts } from "../../services/product.service";
import { supabase } from "../../lib/supabase";
import ReservationLocationPicker from "./ReservationLocationPicker";

const initialForm = {
    customerType: "existing",
    customerId: "",
    customerName: "",
    customerPhone: "",
    paymentMethod: "COD",
    containerOption: "with_exchange",
    containerQuantity: "1",
    locationAddress: "",
    latitude: "",
    longitude: "",
    productId: "",
    productName: "",
    capacity: "",
    basePrice: 0,
    totalPrice: 0,
    scheduledDate: "",
    scheduledTime: "",
};

function parseCapacity(value) {
    const match = String(value || "").match(/(\d+(?:\.\d+)?)/);
    return match ? Number(match[1]) : 0;
}

function formatCapacity(value) {
    const capacityText = String(value || "").trim();
    const capacity = parseCapacity(capacityText);

    if (!capacity) {
        return capacityText || "Custom";
    }

    const normalizedCapacity = capacityText.toLowerCase();
    const unit = normalizedCapacity.includes("liter") || normalizedCapacity.includes("litre")
        ? "Liters"
        : normalizedCapacity.includes("gallon")
            ? "Gallons"
            : "Units";

    return `${capacity} ${unit}`;
}

export default function NewReservationModal({
    onClose,
    onCreated,
}) {
    const [form, setForm] = useState(initialForm);
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loadingCustomers, setLoadingCustomers] = useState(true);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let ignore = false;

        async function loadProducts() {
            try {
                const data = await getEnabledProducts();

                if (ignore) return;

                setProducts(data || []);

                if (data && data.length > 0) {
                    const firstProduct = data[0];
                    setForm((current) => ({
                        ...current,
                        productId: firstProduct.id,
                        productName: firstProduct.product_name,
                        capacity: firstProduct.capacity,
                        basePrice: Number(firstProduct.base_price || 0),
                    }));
                }
            } catch (loadError) {
                console.error("Failed to load products:", loadError);
            } finally {
                if (!ignore) {
                    setLoadingProducts(false);
                }
            }
        }

        async function loadCustomers() {
            try {
                const { data, error } = await supabase
                    .from("customer_profiles")
                    .select("id, user_id, name")
                    .not("name", "is", null)
                    .order("name", { ascending: true });

                if (error) throw error;
                if (!ignore) setCustomers(data || []);
            } catch (loadError) {
                console.error("Failed to load customers:", loadError);
            } finally {
                if (!ignore) setLoadingCustomers(false);
            }
        }

        loadProducts();
        loadCustomers();

        return () => {
            ignore = true;
        };
    }, []);

    const selectedProduct = useMemo(
        () =>
            products.find((product) =>
                String(product.id) === String(form.productId)
            ) || null,
        [products, form.productId]
    );

    function recalculateTotal(nextForm) {
        const quantity = Number(nextForm.containerQuantity || 0);
        const basePrice = Number(
            nextForm.basePrice ?? selectedProduct?.base_price ?? 0
        );

        if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(basePrice)) {
            return 0;
        }

        return Number((quantity * basePrice).toFixed(2));
    }

    function updateField(event) {
        const { name, value } = event.target;

        setForm((current) => {
            const next = {
                ...current,
                [name]: value,
            };

            if (name === "customerType") {
                next.customerId = "";
                next.customerName = "";
                next.customerPhone = "";
            }

            if (name === "customerId") {
                const customer = customers.find(
                    (item) => String(item.user_id || item.id) === String(value)
                );
                next.customerName = customer?.name || "";
                next.customerPhone = customer?.phone || "";
            }

            if (name === "productId") {
                const chosenProduct = products.find(
                    (product) => String(product.id) === String(value)
                );

                if (chosenProduct) {
                    next.productName = chosenProduct.product_name;
                    next.capacity = chosenProduct.capacity;
                    next.basePrice = Number(chosenProduct.base_price || 0);
                }
            }

            if (name === "containerOption" && value === "with_exchange") {
                next.containerQuantity = "1";
            }

            if (
                name === "productId" ||
                name === "containerQuantity" ||
                name === "containerOption"
            ) {
                next.totalPrice = recalculateTotal(next);
            }

            return next;
        });
    }

    function handleLocationChange(location) {
        setForm((current) => ({
            ...current,
            locationAddress: location.address,
            latitude: location.latitude,
            longitude: location.longitude,
        }));
    }

    function handleProductSelect(product) {
        setForm((current) => {
            const next = {
                ...current,
                productId: product.id,
                productName: product.product_name,
                capacity: product.capacity,
                basePrice: Number(product.base_price || 0),
            };

            next.totalPrice = recalculateTotal(next);

            return next;
        });
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setSaving(true);
        setError("");

        try {
            if (!form.latitude || !form.longitude || !form.locationAddress) {
                throw new Error("Please click the map to select the delivery location.");
            }

            const selected = selectedProduct || {
                id: form.productId,
                product_name: form.productName,
                capacity: form.capacity,
                base_price: form.basePrice,
            };

            const payload = {
                ...form,
                address: form.locationAddress,
                fullAddress: form.locationAddress,
                productId: selected.id || form.productId,
                productName: selected.product_name || form.productName || "",
                capacity: selected.capacity || form.capacity || "",
                basePrice: Number(selected.base_price ?? form.basePrice ?? 0),
                gallons: Number(form.containerQuantity || 0),
                totalPrice: Number(form.totalPrice || recalculateTotal(form) || 0),
                exchange_containers:
                    form.containerOption === "with_exchange"
                        ? Number(form.containerQuantity || 1)
                        : 0,
                new_containers:
                    form.containerOption === "new_containers"
                        ? Number(form.containerQuantity || 1)
                        : 0,
                borrow_containers:
                    form.containerOption === "borrow_containers"
                        ? Number(form.containerQuantity || 1)
                        : 0,
            };

            await onCreated(payload);
        } catch (createError) {
            setError(createError?.message || "Unable to create reservation.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="new-reservation-overlay" role="presentation">
            <div
                className="new-reservation-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="new-reservation-title"
            >
                <div className="new-reservation-modal-header">
                    <div>
                        <h2 id="new-reservation-title">
                            New Reservation
                        </h2>
                        <p>Schedule a customer delivery.</p>
                    </div>

                    <button
                        type="button"
                        className="new-reservation-close"
                        onClick={onClose}
                        aria-label="Close new reservation form"
                    >
                        <i className="bi bi-x-lg" />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="new-reservation-form-grid">
                        <label>
                            Customer type
                            <select
                                name="customerType"
                                value={form.customerType}
                                onChange={updateField}
                            >
                                <option value="existing">Existing customer</option>
                                <option value="walkin">Walk-in customer</option>
                            </select>
                        </label>

                        {form.customerType === "existing" ? (
                            <label>
                                Customer account
                                <select
                                    name="customerId"
                                    value={form.customerId}
                                    onChange={updateField}
                                    required
                                    disabled={loadingCustomers}
                                >
                                    <option value="">
                                        {loadingCustomers ? "Loading customers..." : "Select customer"}
                                    </option>
                                    {customers.map((customer) => (
                                        <option
                                            key={customer.user_id || customer.id}
                                            value={customer.user_id || customer.id}
                                        >
                                            {customer.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        ) : (
                            <label>
                                Walk-in customer name
                                <input
                                    name="customerName"
                                    value={form.customerName}
                                    onChange={updateField}
                                    placeholder="Enter customer name"
                                    required
                                />
                            </label>
                        )}

                        {form.customerType === "walkin" && (
                            <label>
                                Walk-in customer phone
                                <input
                                    name="customerPhone"
                                    type="tel"
                                    value={form.customerPhone}
                                    onChange={updateField}
                                    placeholder="e.g. +63 912 345 6789"
                                    required
                                />
                            </label>
                        )}

                        <label>
                            Payment method
                            <select
                                name="paymentMethod"
                                value={form.paymentMethod}
                                onChange={updateField}
                            >
                                <option value="Cash">Cash (already paid)</option>
                                <option value="COD">COD (pay on delivery)</option>
                                <option value="GCash">GCash (verify payment)</option>
                            </select>
                        </label>

                        {form.customerType === "existing" && form.customerName && (
                            <p className="new-reservation-full-width">
                                Selected account: {form.customerName}
                            </p>
                        )}

                        <div className="new-reservation-full-width">
                            <div className="new-reservation-section-title">
                                Delivery Location
                            </div>

                            <ReservationLocationPicker
                                latitude={form.latitude}
                                longitude={form.longitude}
                                onLocationChange={handleLocationChange}
                            />
                        </div>

                        <div className="new-reservation-full-width">
                            <div className="new-reservation-section-title">
                                Product Size
                            </div>

                            <div className="new-reservation-product-grid">
                                {loadingProducts ? (
                                    <div className="new-reservation-loading">
                                        Loading products...
                                    </div>
                                ) : products.length === 0 ? (
                                    <div className="new-reservation-empty">
                                        No enabled products available.
                                    </div>
                                ) : (
                                    products.map((product) => {
                                        const isSelected = String(product.id) === String(form.productId);

                                        return (
                                            <button
                                                key={product.id}
                                                type="button"
                                                className={`reservation-product-button ${
                                                    isSelected ? "selected" : ""
                                                }`}
                                                onClick={() => handleProductSelect(product)}
                                            >
                                                <span>{product.product_name}</span>
                                                <strong>
                                                    {formatCapacity(product.capacity)}
                                                </strong>
                                                <small>
                                                    ₱{Number(product.base_price || 0).toFixed(2)}
                                                </small>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        <div className="new-reservation-full-width">
                            <div className="new-reservation-section-title">
                                Container Details
                            </div>

                            <div className="new-reservation-container-grid">
                                <label>
                                    Container type
                                    <select
                                        name="containerOption"
                                        value={form.containerOption}
                                        onChange={updateField}
                                    >
                                        <option value="with_exchange">With exchange</option>
                                        <option value="new_containers">New containers</option>
                                        <option value="borrow_containers">Borrow containers</option>
                                    </select>
                                </label>

                                <label>
                                    Container quantity
                                    <input
                                        name="containerQuantity"
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={form.containerQuantity}
                                        onChange={updateField}
                                        required
                                    />
                                </label>
                            </div>
                        </div>

                        <label>
                            Total price
                            <input
                                name="totalPrice"
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.totalPrice || recalculateTotal(form)}
                                readOnly
                            />
                        </label>

                        <label>
                            Date
                            <input
                                name="scheduledDate"
                                type="date"
                                value={form.scheduledDate}
                                onChange={updateField}
                                required
                            />
                        </label>

                        <label>
                            Time
                            <input
                                name="scheduledTime"
                                type="time"
                                value={form.scheduledTime}
                                onChange={updateField}
                                required
                            />
                        </label>
                    </div>

                    {error && (
                        <p className="new-reservation-error">
                            {error}
                        </p>
                    )}

                    <div className="new-reservation-actions">
                        <button
                            type="button"
                            className="reservation-secondary-button"
                            onClick={onClose}
                            disabled={saving}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="reservation-primary-button"
                            disabled={saving || loadingProducts || !form.latitude || !form.longitude}
                        >
                            {saving ? "Saving..." : "Create Reservation"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}