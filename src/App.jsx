import { useEffect, useState } from "react";
import "./App.css";

const PRICES = [60, 70, 80];

const getCurrentMonthKey = () => {
  const today = new Date();

  return `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}`;
};

const getMonthLabel = (monthKey) => {
  const [year, month] = monthKey.split("-");

  return new Date(
    Number(year),
    Number(month) - 1,
    1
  ).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric"
  });
};

function App() {
  const currentMonth = getCurrentMonthKey();

  const [customers, setCustomers] = useState(() => {
    try {
      const savedCustomers =
        localStorage.getItem("tiffinCustomers");

      return savedCustomers
        ? JSON.parse(savedCustomers)
        : [];
    } catch {
      return [];
    }
  });

  const [selectedCustomer, setSelectedCustomer] =
    useState(null);

  const [name, setName] = useState("");
  const [tiffinNo, setTiffinNo] = useState("");
  const [selectedPrice, setSelectedPrice] =
    useState(80);

  const [showBill, setShowBill] =
    useState(false);

  useEffect(() => {
    localStorage.setItem(
      "tiffinCustomers",
      JSON.stringify(customers)
    );
  }, [customers]);

  useEffect(() => {
    const savedMonth =
      localStorage.getItem("tiffinActiveMonth");

    if (!savedMonth) {
      localStorage.setItem(
        "tiffinActiveMonth",
        currentMonth
      );

      return;
    }

    if (savedMonth !== currentMonth) {
      localStorage.setItem(
        `tiffinArchive_${savedMonth}`,
        JSON.stringify(customers)
      );

      const resetCustomers = customers.map(
        (customer) => ({
          ...customer,
          entries: []
        })
      );

      setCustomers(resetCustomers);

      setSelectedCustomer(null);

      localStorage.setItem(
        "tiffinActiveMonth",
        currentMonth
      );
    }
  }, [currentMonth]);

  const addCustomer = () => {
    if (!name.trim() || !tiffinNo.trim()) {
      alert(
        "Please enter customer name and tiffin number"
      );

      return;
    }

    const newCustomer = {
      id: Date.now(),
      name: name.trim(),
      tiffinNo: tiffinNo.trim(),
      entries: []
    };

    setCustomers((previousCustomers) => [
      ...previousCustomers,
      newCustomer
    ]);

    setSelectedCustomer(newCustomer);

    setName("");
    setTiffinNo("");
  };

  const addTiffin = () => {
    if (!selectedCustomer) return;

    const today = new Date();

    const newEntry = {
      id: Date.now(),
      date: today.toLocaleDateString("en-IN"),
      day: today.toLocaleDateString(
        "en-US",
        {
          weekday: "long"
        }
      ),
      month: today.toLocaleDateString(
        "en-US",
        {
          month: "long"
        }
      ),
      price: Number(selectedPrice)
    };

    const updatedCustomers =
      customers.map((customer) => {
        if (
          customer.id === selectedCustomer.id
        ) {
          return {
            ...customer,
            entries: [
              ...customer.entries,
              newEntry
            ]
          };
        }

        return customer;
      });

    setCustomers(updatedCustomers);

    const updatedSelectedCustomer =
      updatedCustomers.find(
        (customer) =>
          customer.id === selectedCustomer.id
      );

    setSelectedCustomer(
      updatedSelectedCustomer
    );
  };

  const deleteTiffin = (entryId) => {
    if (!selectedCustomer) return;

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this tiffin entry?"
    );

    if (!confirmDelete) return;

    const updatedCustomers =
      customers.map((customer) => {
        if (
          customer.id === selectedCustomer.id
        ) {
          return {
            ...customer,
            entries: customer.entries.filter(
              (entry) =>
                entry.id !== entryId
            )
          };
        }

        return customer;
      });

    setCustomers(updatedCustomers);

    const updatedSelectedCustomer =
      updatedCustomers.find(
        (customer) =>
          customer.id === selectedCustomer.id
      );

    setSelectedCustomer(
      updatedSelectedCustomer
    );
  };

  const totalBill = selectedCustomer
    ? selectedCustomer.entries.reduce(
        (total, entry) =>
          total + Number(entry.price),
        0
      )
    : 0;

  const getInitials = (customerName) => {
    return customerName
      .split(" ")
      .filter((word) => word.length > 0)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const openBill = () => {
    if (!selectedCustomer) return;

    setShowBill(true);
  };

  const printBill = () => {
    window.print();
  };

  return (
    <div className="app">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="logo">
          <div className="logo-icon">
            T
          </div>

          <div>
            <h2>Tiffin Manager</h2>
            <p>Billing Dashboard</p>
          </div>
        </div>

        <div className="sidebar-title">
          CUSTOMERS
        </div>

        <div className="add-customer">

          <input
            type="text"
            placeholder="Customer name"
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
          />

          <input
            type="text"
            placeholder="Tiffin number"
            value={tiffinNo}
            onChange={(event) =>
              setTiffinNo(event.target.value)
            }
          />

          <button onClick={addCustomer}>
            + Add Customer
          </button>

        </div>

        <div className="customer-list">

          {customers.length === 0 ? (

            <p className="empty-customers">
              No customers yet
            </p>

          ) : (

            customers.map((customer) => (

              <div
                key={customer.id}
                className={`customer-card ${
                  selectedCustomer?.id ===
                  customer.id
                    ? "active"
                    : ""
                }`}
                onClick={() => {
                  setSelectedCustomer(customer);
                  setShowBill(false);
                }}
              >

                <div className="avatar">
                  {getInitials(customer.name)}
                </div>

                <div className="customer-info">

                  <h4>
                    {customer.name}
                  </h4>

                  <p>
                    Tiffin #{customer.tiffinNo}
                  </p>

                </div>

                <div className="customer-count">
                  {customer.entries.length}
                </div>

              </div>

            ))

          )}

        </div>

      </aside>


      {/* MAIN DASHBOARD */}

      <main className="main">

        {!selectedCustomer ? (

          <div className="welcome">

            <h1>
              Welcome to Tiffin Manager
            </h1>

            <p>
              Add a customer from the left sidebar
              or select an existing customer.
            </p>

          </div>

        ) : (

          <>

            {/* HEADER */}

            <header className="header">

              <div>

                <h1>
                  {selectedCustomer.name}
                </h1>

                <p>
                  Tiffin No.{" "}
                  {selectedCustomer.tiffinNo}
                </p>

              </div>

              <div className="month-box">

                <span>
                  Current Month
                </span>

                <strong>
                  {getMonthLabel(currentMonth)}
                </strong>

              </div>

            </header>


            {/* STATS */}

            <div className="stats">

              <div className="stat-card">

                <span>
                  Total Tiffins
                </span>

                <h2>
                  {selectedCustomer.entries.length}
                </h2>

              </div>

              <div className="stat-card">

                <span>
                  Selected Price
                </span>

                <h2>
                  ₹{selectedPrice}
                </h2>

              </div>

              <div className="stat-card bill-card">

                <span>
                  Total Bill
                </span>

                <h2>
                  ₹{totalBill}
                </h2>

              </div>

            </div>


            {/* DAILY TIFFIN ENTRY */}

            <div className="action-section">

              <div>

                <h2>
                  Daily Tiffin Entry
                </h2>

                <p>
                  Select the amount and add
                  today's tiffin.
                </p>

              </div>

              <div className="tiffin-controls">

                <select
                  value={selectedPrice}
                  onChange={(event) =>
                    setSelectedPrice(
                      Number(event.target.value)
                    )
                  }
                >

                  {PRICES.map((price) => (

                    <option
                      key={price}
                      value={price}
                    >
                      ₹{price}
                    </option>

                  ))}

                </select>

                <button
                  className="add-tiffin-btn"
                  onClick={addTiffin}
                >
                  + Add Today's Tiffin
                </button>

              </div>

            </div>


            {/* TIFFIN RECORDS */}

            <div className="records">

              <div className="records-header">

                <div>

                  <h2>
                    Tiffin Records
                  </h2>

                  <p>
                    Monthly delivery history
                  </p>

                </div>

                <div className="record-count">

                  {selectedCustomer.entries.length}
                  {" "}
                  Records

                </div>

              </div>


              {selectedCustomer.entries.length === 0 ? (

                <div className="no-records">

                  <div>📋</div>

                  <h3>
                    No tiffin records yet
                  </h3>

                  <p>
                    Add today's tiffin to create
                    the first record.
                  </p>

                </div>

              ) : (

                <div className="table-wrapper">

                  <table>

                    <thead>

                      <tr>
                        <th>#</th>
                        <th>Date</th>
                        <th>Day</th>
                        <th>Month</th>
                        <th>Amount</th>
                        <th>Action</th>
                      </tr>

                    </thead>

                    <tbody>

                      {selectedCustomer.entries.map(
                        (entry, index) => (

                          <tr key={entry.id}>

                            <td>
                              {index + 1}
                            </td>

                            <td>
                              {entry.date}
                            </td>

                            <td>
                              <span className="day-badge">
                                {entry.day}
                              </span>
                            </td>

                            <td>
                              {entry.month}
                            </td>

                            <td className="amount">
                              ₹{entry.price}
                            </td>

                            <td>

                              <button
                                className="delete-btn"
                                onClick={() =>
                                  deleteTiffin(
                                    entry.id
                                  )
                                }
                              >
                                Delete
                              </button>

                            </td>

                          </tr>

                        )
                      )}

                    </tbody>

                  </table>

                </div>

              )}

            </div>


            {/* BILL SUMMARY */}

            <div className="bill-summary">

              <div>

                <p>
                  MONTHLY BILL
                </p>

                <h2>
                  {selectedCustomer.name}
                </h2>

                <span>
                  {selectedCustomer.entries.length}
                  {" "}
                  Tiffins
                </span>

              </div>

              <div className="final-bill">

                <span>
                  Total Payable
                </span>

                <h1>
                  ₹{totalBill}
                </h1>

              </div>

            </div>


            {/* GENERATE BILL */}

            <div className="generate-bill-section">

              <button
                className="generate-bill-btn"
                onClick={openBill}
              >
                Generate Monthly Bill
              </button>

            </div>


            {/* BILL MODAL */}

            {showBill && (

              <div className="bill-modal">

                <div className="bill-container">

                  <button
                    className="close-bill no-print"
                    onClick={() =>
                      setShowBill(false)
                    }
                  >
                    ×
                  </button>


                  {/* BILL HEADER */}

                  <div className="bill-logo">

                    <div className="bill-cross">
                      ✝
                    </div>

                    <h1>
                      GLORY TIFFIN CENTER
                    </h1>

                    <p>
                      Monthly Tiffin Service
                    </p>

                  </div>

                  <hr />


                  {/* CUSTOMER DETAILS */}

                  <div className="bill-info">

                    <p>
                      <strong>
                        Customer:
                      </strong>
                      {" "}
                      {selectedCustomer.name}
                    </p>

                    <p>
                      <strong>
                        Tiffin No.:
                      </strong>
                      {" "}
                      {selectedCustomer.tiffinNo}
                    </p>

                    <p>
                      <strong>
                        Month:
                      </strong>
                      {" "}
                      {getMonthLabel(
                        currentMonth
                      )}
                    </p>

                  </div>

                  <hr />


                  {/* FULL TIFFIN DATE LIST */}

                  <div className="bill-records">

                    <h3>
                      Tiffin Details
                    </h3>

                    <table className="bill-table">

                      <thead>

                        <tr>
                          <th>#</th>
                          <th>Date</th>
                          <th>Day</th>
                          <th>Amount</th>
                        </tr>

                      </thead>

                      <tbody>

                        {selectedCustomer.entries.length === 0 ? (

                          <tr>

                            <td
                              colSpan="4"
                              className="empty-bill-record"
                            >
                              No tiffin entries
                            </td>

                          </tr>

                        ) : (

                          selectedCustomer.entries.map(
                            (entry, index) => (

                              <tr key={entry.id}>

                                <td>
                                  {index + 1}
                                </td>

                                <td>
                                  {entry.date}
                                </td>

                                <td>
                                  {entry.day}
                                </td>

                                <td>
                                  ₹{entry.price}
                                </td>

                              </tr>

                            )
                          )

                        )}

                      </tbody>

                    </table>

                  </div>


                  <hr />


                  {/* TOTAL */}

                  <div className="bill-details">

                    <p>

                      <span>
                        Total Tiffins
                      </span>

                      <strong>
                        {
                          selectedCustomer.entries
                            .length
                        }
                      </strong>

                    </p>

                    <p>

                      <span>
                        Total Amount
                      </span>

                      <strong>
                        ₹{totalBill}
                      </strong>

                    </p>

                  </div>


                  <div className="bill-total">

                    <span>
                      TOTAL PAYABLE
                    </span>

                    <h1>
                      ₹{totalBill}
                    </h1>

                  </div>


                  {/* BILL BUTTONS */}

                  <div className="bill-actions no-print">

                    <button
                      className="print-btn"
                      onClick={printBill}
                    >
                      Print / Save PDF
                    </button>

                    <button
                      className="close-btn"
                      onClick={() =>
                        setShowBill(false)
                      }
                    >
                      Close
                    </button>

                  </div>

                </div>

              </div>

            )}

          </>

        )}

      </main>

    </div>
  );
}

export default App;