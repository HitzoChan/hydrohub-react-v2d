import {
    useEffect,
    useState,
} from "react";

import {
    EXPENSE_CATEGORIES,
    getToday,
} from "../../services/expenses.service";
import { getEmployees } from "../../services/employees.service";


function ExpenseModal({
    isOpen,
    onClose,
    onSave,
    expense,
}) {

    const isEditing =
        Boolean(expense?.id);


    /*
    |--------------------------------------------------------------------------
    | FORM STATE
    |--------------------------------------------------------------------------
    */

    const [form, setForm] = useState({
        expense_date: getToday(),
        expense_type: "",
        description: "",
        amount: "",
        driver_id: "",
        driver_name: "",
        notes: "",
    });

    const [employees, setEmployees] = useState([]);


    const [formError, setFormError] =
        useState("");

    useEffect(() => {
        if (!isOpen) return;

        getEmployees()
            .then((data) => setEmployees(data || []))
            .catch((error) => {
                console.error("Failed to load employees for expense:", error);
                setEmployees([]);
            });
    }, [isOpen]);


    /*
    |--------------------------------------------------------------------------
    | LOAD EXPENSE
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        if (expense) {

            setForm({
                expense_date:
                    expense.expense_date ||
                    expense.date ||
                    getToday(),

                expense_type:
                    expense.expense_type ||
                    expense.type ||
                    "",

                description:
                    expense.description ||
                    "",

                amount:
                    expense.amount !== null &&
                    expense.amount !== undefined
                        ? String(
                            expense.amount
                        )
                        : "",

                driver_id:
                    expense.driver_id ||
                    "",

                driver_name:
                    expense.driver_name ||
                    expense.driver ||
                    "",

                driver_enabled:
                    Boolean(expense.driver_id || expense.driver_name || expense.driver),

                notes:
                    expense.notes ||
                    "",
            });

        } else {

            setForm({
                expense_date:
                    getToday(),

                expense_type:
                    "",

                description:
                    "",

                amount:
                    "",

                driver_id:
                    "",

                driver_name:
                    "",

                driver_enabled:
                    false,

                notes:
                    "",
            });

        }

        setFormError("");

    }, [expense, isOpen]);


    /*
    |--------------------------------------------------------------------------
    | DON'T RENDER WHEN CLOSED
    |--------------------------------------------------------------------------
    */

    if (!isOpen) {
        return null;
    }


    /*
    |--------------------------------------------------------------------------
    | INPUT CHANGE
    |--------------------------------------------------------------------------
    */

    function handleChange(event) {

        const {
            name,
            value,
            type,
            checked,
        } = event.target;

        if (name === "driver_enabled") {
            setForm((current) => ({
                ...current,
                driver_enabled: checked,
                driver_id: checked ? current.driver_id : "",
                driver_name: checked ? current.driver_name : "",
            }));

            if (formError) setFormError("");
            return;
        }


        setForm(
            (current) => ({
                ...current,
                [name]: type === "checkbox" ? checked : value,
            })
        );


        if (formError) {
            setFormError("");
        }
    }


    /*
    |--------------------------------------------------------------------------
    | SUBMIT
    |--------------------------------------------------------------------------
    */

    async function handleSubmit(event) {

        event.preventDefault();

        setFormError("");


        /*
        |--------------------------------------------------------------
        | VALIDATE DATE
        |--------------------------------------------------------------
        */

        if (!form.expense_date) {

            setFormError(
                "Expense date is required."
            );

            return;
        }


        /*
        |--------------------------------------------------------------
        | VALIDATE TYPE
        |--------------------------------------------------------------
        */

        if (
            !form.expense_type ||
            !form.expense_type.trim()
        ) {

            setFormError(
                "Expense type is required."
            );

            return;
        }


        /*
        |--------------------------------------------------------------
        | VALIDATE AMOUNT
        |--------------------------------------------------------------
        */

        const amount =
            Number(
                form.amount
            );


        if (
            form.amount === "" ||
            !Number.isFinite(amount) ||
            amount < 0
        ) {

            setFormError(
                "Please enter a valid expense amount."
            );

            return;
        }


        /*
        |--------------------------------------------------------------
        | DATABASE PAYLOAD
        |--------------------------------------------------------------
        */

        const payload = {

            expense_date:
                form.expense_date,

            expense_type:
                form.expense_type.trim(),

            description:
                form.description.trim(),

            amount,

            driver_id:
                form.driver_id.trim() ||
                null,

            driver_name:
                form.driver_name.trim(),

            notes:
                form.notes.trim(),

        };


        try {

            await onSave(
                payload
            );

        } catch (error) {

            console.error(
                "Expense save error:",
                error
            );

            setFormError(
                error?.message ||
                "Unable to save expense."
            );

        }
    }


    /*
    |--------------------------------------------------------------------------
    | CLOSE WHEN CLICKING OUTSIDE
    |--------------------------------------------------------------------------
    */

    function handleOverlayMouseDown(
        event
    ) {

        if (
            event.target ===
            event.currentTarget
        ) {

            onClose?.();

        }
    }


    /*
    |--------------------------------------------------------------------------
    | RENDER
    |--------------------------------------------------------------------------
    */

    return (

        <div
            className="expense-modal-overlay"
            onMouseDown={
                handleOverlayMouseDown
            }
        >

            <div
                className="expense-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="expense-modal-title"
            >

                {/* ==================================================
                    HEADER
                ================================================== */}

                <div className="expense-modal-header">

                    <div>

                        <h2 id="expense-modal-title">

                            {isEditing
                                ? "Edit Expense"
                                : "Add Expense"}

                        </h2>

                        <p>

                            {isEditing
                                ? "Update the details of this expense record."
                                : "Record an operational expense."}

                        </p>

                    </div>


                    <button
                        type="button"
                        className="expense-modal-close"
                        onClick={
                            onClose
                        }
                        aria-label="Close"
                    >
                        ×
                    </button>

                </div>


                {/* ==================================================
                    FORM
                ================================================== */}

                <form
                    onSubmit={
                        handleSubmit
                    }
                >

                    {/* ERROR */}

                    {formError && (

                        <div
                            className=
                                "expense-form-error"
                        >
                            {formError}
                        </div>

                    )}


                    <div
                        className=
                            "expense-form-grid"
                    >

                        {/* ==================================================
                            DATE
                        ================================================== */}

                        <div
                            className=
                                "expense-form-field"
                        >

                            <label
                                htmlFor=
                                    "expense-date"
                            >
                                Date
                            </label>

                            <input
                                id=
                                    "expense-date"
                                type="date"
                                name=
                                    "expense_date"
                                value={
                                    form.expense_date
                                }
                                onChange={
                                    handleChange
                                }
                                required
                            />

                        </div>


                        {/* ==================================================
                            TYPE
                        ================================================== */}

                        <div
                            className=
                                "expense-form-field"
                        >

                            <label
                                htmlFor=
                                    "expense-type"
                            >
                                Expense Type
                            </label>

                            <select
                                id=
                                    "expense-type"
                                name=
                                    "expense_type"
                                value={
                                    form.expense_type
                                }
                                onChange={
                                    handleChange
                                }
                                required
                            >

                                <option value="">
                                    Select expense type
                                </option>


                                {EXPENSE_CATEGORIES.map(
                                    (
                                        category
                                    ) => (

                                        <option
                                            key={
                                                category
                                            }
                                            value={
                                                category
                                            }
                                        >
                                            {
                                                category
                                            }
                                        </option>

                                    )
                                )}

                            </select>

                        </div>


                        {/* ==================================================
                            DESCRIPTION
                        ================================================== */}

                        <div
                            className=
                                "expense-form-field expense-form-full"
                        >

                            <label
                                htmlFor=
                                    "expense-description"
                            >
                                Description
                            </label>

                            <input
                                id=
                                    "expense-description"
                                type="text"
                                name=
                                    "description"
                                placeholder=
                                    "Describe the expense"
                                value={
                                    form.description
                                }
                                onChange={
                                    handleChange
                                }
                            />

                        </div>


                        {/* ==================================================
                            AMOUNT
                        ================================================== */}

                        <div
                            className=
                                "expense-form-field"
                        >

                            <label
                                htmlFor=
                                    "expense-amount"
                            >
                                Amount
                            </label>

                            <input
                                id=
                                    "expense-amount"
                                type="number"
                                name="amount"
                                min="0"
                                step="0.01"
                                placeholder=
                                    "0.00"
                                value={
                                    form.amount
                                }
                                onChange={
                                    handleChange
                                }
                                required
                            />

                        </div>


                        {/* ==================================================
                            DRIVER
                        ================================================== */}

                        <div
                            className="expense-form-field expense-form-full"
                        >

                            <label className="expense-driver-toggle">
                                <input
                                    type="checkbox"
                                    name="driver_enabled"
                                    checked={Boolean(form.driver_enabled)}
                                    onChange={handleChange}
                                />
                                Assign employee to this expense
                            </label>

                            {form.driver_enabled && (
                                <select
                                    id="expense-driver"
                                    name="driver_id"
                                    value={form.driver_id}
                                    onChange={(event) => {
                                        const employee = employees.find(
                                            (item) => String(item.id) === String(event.target.value)
                                        );
                                        setForm((current) => ({
                                            ...current,
                                            driver_id: event.target.value,
                                            driver_name: employee?.name || "",
                                        }));
                                    }}
                                    required
                                >
                                    <option value="">Select employee</option>
                                    {employees.map((employee) => (
                                        <option key={employee.id} value={employee.id}>
                                            {employee.name || "Unnamed employee"} - {employee.role || "Employee"}
                                        </option>
                                    ))}
                                </select>
                            )}

                        </div>


                        {/* ==================================================
                            NOTES
                        ================================================== */}

                        <div
                            className=
                                "expense-form-field expense-form-full"
                        >

                            <label
                                htmlFor=
                                    "expense-notes"
                            >
                                Notes
                            </label>

                            <textarea
                                id=
                                    "expense-notes"
                                name="notes"
                                rows="4"
                                placeholder=
                                    "Additional notes..."
                                value={
                                    form.notes
                                }
                                onChange={
                                    handleChange
                                }
                            />

                        </div>

                    </div>


                    {/* ==================================================
                        FOOTER
                    ================================================== */}

                    <div
                        className=
                            "expense-modal-footer"
                    >

                        <button
                            type="button"
                            className=
                                "expense-modal-cancel"
                            onClick={
                                onClose
                            }
                        >
                            Cancel
                        </button>


                        <button
                            type="submit"
                            className=
                                "expense-modal-save"
                        >

                            {isEditing
                                ? "Update Expense"
                                : "Save Expense"}

                        </button>

                    </div>

                </form>

            </div>

        </div>
    );
}


export default ExpenseModal;