import { useState } from "react";

export default function ReportFilters({
    range,
    onRangeChange,
    startDate,
    endDate,
    onCustomRange,
}) {
    const [showCustom, setShowCustom] =
        useState(false);

    const [customStart, setCustomStart] =
        useState(startDate || "");

    const [customEnd, setCustomEnd] =
        useState(endDate || "");

    function handleApply() {
        if (
            !customStart ||
            !customEnd
        ) {
            return;
        }

        if (
            customStart > customEnd
        ) {
            return;
        }

        onCustomRange(
            customStart,
            customEnd
        );

        setShowCustom(false);
    }

    function handleCancel() {
        setCustomStart(
            startDate || ""
        );

        setCustomEnd(
            endDate || ""
        );

        setShowCustom(false);
    }

    return (
        <>
            <div className="report-filters-wrapper d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">

                <div />

                <div className="d-flex align-items-center gap-2 flex-wrap report-filter-controls">

                    <select
                        className="form-select form-select-sm"
                        value={range}
                        onChange={(event) => {
                            setShowCustom(false);

                            onRangeChange(
                                Number(
                                    event.target.value
                                )
                            );
                        }}
                        style={{
                            width: "auto",
                        }}
                    >
                        <option value={7}>
                            Weekly
                        </option>

                        <option value={30}>
                            Monthly
                        </option>

                        <option value={365}>
                            Yearly
                        </option>
                    </select>

                    <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() =>
                            setShowCustom(
                                true
                            )
                        }
                    >
                        Custom Range
                    </button>

                </div>

            </div>

            {showCustom && (
                <div className="card p-3 mb-3 custom-range-panel">

                    <div className="row g-2 align-items-end">

                        <div className="col-sm-4">

                            <label
                                htmlFor="reportStartDate"
                                className="form-label mb-1"
                            >
                                Start Date
                            </label>

                            <input
                                id="reportStartDate"
                                type="date"
                                className="form-control form-control-sm"
                                value={
                                    customStart
                                }
                                onChange={(event) =>
                                    setCustomStart(
                                        event.target
                                            .value
                                    )
                                }
                            />

                        </div>

                        <div className="col-sm-4">

                            <label
                                htmlFor="reportEndDate"
                                className="form-label mb-1"
                            >
                                End Date
                            </label>

                            <input
                                id="reportEndDate"
                                type="date"
                                className="form-control form-control-sm"
                                value={
                                    customEnd
                                }
                                onChange={(event) =>
                                    setCustomEnd(
                                        event.target
                                            .value
                                    )
                                }
                            />

                        </div>

                        <div className="col-sm-4 d-flex gap-2">

                            <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={
                                    handleApply
                                }
                            >
                                Apply
                            </button>

                            <button
                                type="button"
                                className="btn btn-light btn-sm"
                                onClick={
                                    handleCancel
                                }
                            >
                                Cancel
                            </button>

                        </div>

                    </div>

                </div>
            )}
        </>
    );
}