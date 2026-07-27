import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";

function CustomerModal({

  show,

  onHide,

  customer

}) {

  if (!customer) return null;

  return (

    <Modal
      show={show}
      onHide={onHide}
      centered
      size="lg"
    >

      <Modal.Header closeButton>

        <Modal.Title>

          <i className="bi bi-person-circle me-2"></i>

          Customer Details

        </Modal.Title>

      </Modal.Header>

      <Modal.Body>

        <div className="row">

          <div className="col-md-6 mb-3">

            <label className="fw-semibold">

              Full Name

            </label>

            <p className="mb-0">

              {customer.name}

            </p>

          </div>

          <div className="col-md-6 mb-3">

            <label className="fw-semibold">

              Phone Number

            </label>

            <p className="mb-0">

              {customer.phone || "-"}

            </p>

          </div>

          <div className="col-md-6 mb-3">

            <label className="fw-semibold">

              Email Address

            </label>

            <p className="mb-0">

              {customer.email || "-"}

            </p>

          </div>

          <div className="col-md-6 mb-3">

            <label className="fw-semibold">

              Total Orders

            </label>

            <p className="mb-0">

              {customer.orders}

            </p>

          </div>

          <div className="col-12 mb-3">

            <label className="fw-semibold">

              Delivery Address

            </label>

            <p className="mb-0">

              {customer.address || "No Address"}

            </p>

          </div>

          <div className="col-md-6">

            <label className="fw-semibold">

              Status

            </label>

            <p>

              <span
                className={`badge ${
                  customer.status === "Active"
                    ? "bg-success"
                    : "bg-secondary"
                }`}
              >

                {customer.status}

              </span>

            </p>

          </div>

        </div>

      </Modal.Body>

      <Modal.Footer>

        <Button
          variant="secondary"
          onClick={onHide}
        >

          Close

        </Button>

      </Modal.Footer>

    </Modal>

  );

}

export default CustomerModal;