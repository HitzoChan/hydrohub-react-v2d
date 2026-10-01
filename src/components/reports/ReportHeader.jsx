export default function ReportHeader() {
    return (
        <div className="report-header mb-4">
            <div className="report-header-copy">
                <h2 className="page-title report-header-title mb-1">
                    <i className="bi bi-graph-up-arrow me-2" aria-hidden="true" />
                    Executive Sales Dashboard
                </h2>

                <p className="text-muted mb-0">
                    Financial and operational insights for your water station.
                </p>
            </div>
        </div>
    );
}