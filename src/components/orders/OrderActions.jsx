function OrderActions({ order, onView }) {
  return (
    <button
      className="btn btn-sm btn-primary"
      onClick={() => onView(order)}
    >
      <i className="bi bi-eye me-1"></i>
      View
    </button>
  );
}

export default OrderActions;