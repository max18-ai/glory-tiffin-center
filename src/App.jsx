import { useEffect, useMemo, useState } from "react";
import "./App.css";

const STORAGE_KEY = "glory_tiffin_center_data";

const ITEMS = {
  "Full Tiffin": [60, 70, 80],
  Roti: [10, 15, 20],
  Rice: [20, 30, 40],
};

function getMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}`;
}

function getMonthName(monthKey) {
  if (!monthKey) return "";

  const [year, month] = monthKey.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);

  return date.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

function getNextMonth(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month, 1);

  return getMonthKey(date);
}

function formatDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
}

function getDay(dateString) {
  return new Date(`${dateString}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "long",
  });
}

function getInitial(name) {
  return name?.trim()?.charAt(0)?.toUpperCase() || "?";
}

export default function App() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  const [customerName, setCustomerName] = useState("");
  const [tiffinNumber, setTiffinNumber] = useState("");

  const [entryDate, setEntryDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [item, setItem] = useState("Full Tiffin");
  const [price, setPrice] = useState(60);

  const [selectedMonth, setSelectedMonth] = useState("");
  const [message, setMessage] = useState("");

  // Load data
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);

    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);

        setCustomers(parsed.customers || []);

        if (parsed.selectedCustomerId) {
          setSelectedCustomerId(parsed.selectedCustomerId);
        }
      } catch (error) {
        console.error("Error loading data", error);
      }
    }
  }, []);

  // Save data
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        customers,
        selectedCustomerId,
      })
    );
  }, [customers, selectedCustomerId]);

  const activeCustomers = customers.filter(
    (customer) => !customer.deleted
  );

  const selectedCustomer = customers.find(
    (customer) => customer.id === selectedCustomerId
  );

  useEffect(() => {
    if (selectedCustomer) {
      setSelectedMonth(selectedCustomer.currentMonth);
    }
  }, [selectedCustomerId]);

  const currentMonthData = selectedCustomer?.months?.[selectedMonth];

  const entries = currentMonthData?.entries || [];

  const totalAmount = useMemo(() => {
    return entries.reduce((total, entry) => total + Number(entry.price), 0);
  }, [entries]);

  const monthOptions = selectedCustomer
    ? Object.keys(selectedCustomer.months || {}).sort().reverse()
    : [];

  function showMessage(text) {
    setMessage(text);

    setTimeout(() => {
      setMessage("");
    }, 2500);
  }

  function addCustomer() {
    const name = customerName.trim();

    if (!name) {
      showMessage("Please enter customer name");
      return;
    }

    const id = Date.now().toString();

    const currentMonth = getMonthKey();

    const newCustomer = {
      id,
      name,
      tiffinNumber: tiffinNumber.trim() || "-",
      deleted: false,
      currentMonth,
      months: {
        [currentMonth]: {
          status: "OPEN",
          entries: [],
          closedAt: null,
        },
      },
    };

    setCustomers((previous) => [...previous, newCustomer]);

    setSelectedCustomerId(id);
    setCustomerName("");
    setTiffinNumber("");

    showMessage(`${name} added successfully`);
  }

  function deleteCustomer(customerId) {
    const customer = customers.find((c) => c.id === customerId);

    if (!customer) return;

    const confirmDelete = window.confirm(
      `Delete ${customer.name} from dashboard?\n\nOld records will NOT be deleted.`
    );

    if (!confirmDelete) return;

    setCustomers((previous) =>
      previous.map((customer) =>
        customer.id === customerId
          ? {
              ...customer,
              deleted: true,
            }
          : customer
      )
    );

    setSelectedCustomerId(null);

    showMessage("Customer removed. Records are still saved.");
  }

  function addEntry() {
    if (!selectedCustomer) {
      showMessage("Please select a customer first");
      return;
    }

    if (!entryDate) {
      showMessage("Please select a date");
      return;
    }

    const monthKey = entryDate.slice(0, 7);

    const monthData = selectedCustomer.months?.[monthKey];

    if (monthData?.status === "CLOSED") {
      showMessage("This month is already closed");
      return;
    }

    const newEntry = {
      id: Date.now().toString(),
      date: entryDate,
      item,
      price: Number(price),
    };

    setCustomers((previous) =>
      previous.map((customer) => {
        if (customer.id !== selectedCustomer.id) return customer;

        const updatedMonths = { ...customer.months };

        if (!updatedMonths[monthKey]) {
          updatedMonths[monthKey] = {
            status: "OPEN",
            entries: [],
            closedAt: null,
          };
        }

        updatedMonths[monthKey] = {
          ...updatedMonths[monthKey],
          entries: [
            ...updatedMonths[monthKey].entries,
            newEntry,
          ],
        };

        return {
          ...customer,
          currentMonth: monthKey,
          months: updatedMonths,
        };
      })
    );

    setSelectedMonth(monthKey);

    showMessage("Tiffin entry added");
  }

  function deleteEntry(entryId) {
    if (!selectedCustomer || !currentMonthData) return;

    const confirmed = window.confirm("Delete this entry?");

    if (!confirmed) return;

    setCustomers((previous) =>
      previous.map((customer) => {
        if (customer.id !== selectedCustomer.id) return customer;

        return {
          ...customer,
          months: {
            ...customer.months,
            [selectedMonth]: {
              ...customer.months[selectedMonth],
              entries: customer.months[
                selectedMonth
              ].entries.filter((entry) => entry.id !== entryId),
            },
          },
        };
      })
    );

    showMessage("Entry deleted");
  }

  function closeMonth() {
    if (!selectedCustomer || !selectedMonth) return;

    if (currentMonthData?.status === "CLOSED") {
      showMessage("This month is already closed");
      return;
    }

    const confirmed = window.confirm(
      `Close ${getMonthName(selectedMonth)}?\n\nAfter closing, the next month will automatically start.`
    );

    if (!confirmed) return;

    const nextMonth = getNextMonth(selectedMonth);

    setCustomers((previous) =>
      previous.map((customer) => {
        if (customer.id !== selectedCustomer.id) return customer;

        const updatedMonths = {
          ...customer.months,
          [selectedMonth]: {
            ...customer.months[selectedMonth],
            status: "CLOSED",
            closedAt: new Date().toISOString(),
          },
        };

        if (!updatedMonths[nextMonth]) {
          updatedMonths[nextMonth] = {
            status: "OPEN",
            entries: [],
            closedAt: null,
          };
        }

        return {
          ...customer,
          currentMonth: nextMonth,
          months: updatedMonths,
        };
      })
    );

    setSelectedMonth(nextMonth);

    showMessage(`${getMonthName(selectedMonth)} closed successfully`);
  }

  function generateWhatsAppBill() {
    if (!selectedCustomer) {
      showMessage("Please select a customer");
      return;
    }

    if (!entries.length) {
      showMessage("No entries for this month");
      return;
    }

    let billText = `*GLORY TIFFIN CENTER*\n\n`;

    billText += `*Customer:* ${selectedCustomer.name}\n`;
    billText += `*Tiffin No.:* ${selectedCustomer.tiffinNumber}\n`;
    billText += `*Month:* ${getMonthName(selectedMonth)}\n\n`;

    billText += `*TIFFIN DETAILS*\n`;
    billText += `--------------------------\n`;

    entries.forEach((entry, index) => {
      billText += `${index + 1}. ${formatDate(entry.date)} - ${
        entry.item
      } - ₹${entry.price}\n`;
    });

    billText += `\n--------------------------\n`;
    billText += `*Total Items:* ${entries.length}\n`;
    billText += `*TOTAL PAYABLE: ₹${totalAmount}*\n\n`;

    billText += `Thank you 🙏\nGlory Tiffin Center`;

    const whatsappURL = `https://wa.me/?text=${encodeURIComponent(
      billText
    )}`;

    window.open(whatsappURL, "_blank");
  }

  function changeItem(newItem) {
    setItem(newItem);
    setPrice(ITEMS[newItem][0]);
  }

  return (
    <div className="app">
      <main className="container">
        {/* HEADER */}

        <section className="header">
          <div className="logo">T</div>

          <div>
            <h1>Tiffin Manager</h1>
            <p>Billing Dashboard</p>
          </div>
        </section>

        <div className="divider" />

        {/* CUSTOMER ADD */}

        <section className="customer-section">
          <h2>CUSTOMERS</h2>

          <div className="customer-inputs">
            <input
              type="text"
              placeholder="Customer name"
              value={customerName}
              onChange={(event) =>
                setCustomerName(event.target.value)
              }
            />

            <input
              type="text"
              placeholder="Tiffin number"
              value={tiffinNumber}
              onChange={(event) =>
                setTiffinNumber(event.target.value)
              }
            />

            <button
              className="primary-btn add-customer-btn"
              onClick={addCustomer}
            >
              + Add Customer
            </button>
          </div>
        </section>

        {message && (
          <div className="message">{message}</div>
        )}

        {/* CUSTOMER LIST */}

        <section className="customer-list">
          {activeCustomers.length === 0 && (
            <div className="empty-customers">
              No customers added yet
            </div>
          )}

          {activeCustomers.map((customer) => {
            const currentEntries =
              customer.months?.[customer.currentMonth]?.entries ||
              [];

            return (
              <div
                key={customer.id}
                className={`customer-card ${
                  selectedCustomerId === customer.id
                    ? "selected"
                    : ""
                }`}
                onClick={() => {
                  setSelectedCustomerId(customer.id);
                  setSelectedMonth(customer.currentMonth);
                }}
              >
                <div className="customer-avatar">
                  {getInitial(customer.name)}
                </div>

                <div className="customer-info">
                  <h3>{customer.name}</h3>
                  <p>Tiffin #{customer.tiffinNumber}</p>
                </div>

                <div className="customer-count">
                  {currentEntries.length}
                </div>

                <button
                  className="delete-customer"
                  onClick={(event) => {
                    event.stopPropagation();
                    deleteCustomer(customer.id);
                  }}
                  title="Remove customer"
                >
                  ×
                </button>
              </div>
            );
          })}
        </section>

        {/* SELECTED CUSTOMER */}

        {selectedCustomer && (
          <section className="dashboard">
            <div className="dashboard-top">
              <div>
                <h2>{selectedCustomer.name}</h2>
                <p>
                  Tiffin No. {selectedCustomer.tiffinNumber}
                </p>
              </div>

              <button
                className="remove-btn"
                onClick={() =>
                  deleteCustomer(selectedCustomer.id)
                }
              >
                Remove Customer
              </button>
            </div>

            {/* MONTH SELECT */}

            <div className="month-selector">
              <label>Select Month</label>

              <select
                value={selectedMonth}
                onChange={(event) =>
                  setSelectedMonth(event.target.value)
                }
              >
                {monthOptions.map((month) => (
                  <option key={month} value={month}>
                    {getMonthName(month)}
                    {month === selectedCustomer.currentMonth
                      ? " (Current)"
                      : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* STATS */}

            <div className="stats">
              <div className="stat-card">
                <span>Total Items</span>
                <strong>{entries.length}</strong>
              </div>

              <div className="stat-card">
                <span>Total Amount</span>
                <strong>₹{totalAmount}</strong>
              </div>

              <div className="stat-card">
                <span>Status</span>

                <strong
                  className={
                    currentMonthData?.status === "CLOSED"
                      ? "closed"
                      : "open"
                  }
                >
                  {currentMonthData?.status || "OPEN"}
                </strong>
              </div>
            </div>

            {/* DAILY ENTRY */}

            {currentMonthData?.status !== "CLOSED" && (
              <section className="daily-entry">
                <h2>Daily Tiffin Entry</h2>

                <div className="entry-grid">
                  <div>
                    <label>Date</label>

                    <input
                      type="date"
                      value={entryDate}
                      onChange={(event) =>
                        setEntryDate(event.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label>Item</label>

                    <select
                      value={item}
                      onChange={(event) =>
                        changeItem(event.target.value)
                      }
                    >
                      <option>Full Tiffin</option>
                      <option>Roti</option>
                      <option>Rice</option>
                    </select>
                  </div>

                  <div>
                    <label>Price</label>

                    <select
                      value={price}
                      onChange={(event) =>
                        setPrice(Number(event.target.value))
                      }
                    >
                      {ITEMS[item].map((itemPrice) => (
                        <option
                          key={itemPrice}
                          value={itemPrice}
                        >
                          ₹{itemPrice}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    className="primary-btn entry-btn"
                    onClick={addEntry}
                  >
                    + Add Entry
                  </button>
                </div>
              </section>
            )}

            {/* RECORDS */}

            <section className="records">
              <div className="records-header">
                <h2>Tiffin Records</h2>

                <span>{getMonthName(selectedMonth)}</span>
              </div>

              {entries.length === 0 ? (
                <div className="no-records">
                  No entries for this month.
                </div>
              ) : (
                <div className="records-table">
                  <div className="record-row table-heading">
                    <span>#</span>
                    <span>Date</span>
                    <span>Day</span>
                    <span>Item</span>
                    <span>Amount</span>
                    <span></span>
                  </div>

                  {entries.map((entry, index) => (
                    <div
                      className="record-row"
                      key={entry.id}
                    >
                      <span>{index + 1}</span>

                      <span>{formatDate(entry.date)}</span>

                      <span>{getDay(entry.date)}</span>

                      <span>{entry.item}</span>

                      <strong>₹{entry.price}</strong>

                      <button
                        className="delete-entry"
                        onClick={() =>
                          deleteEntry(entry.id)
                        }
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* TOTAL */}

            <section className="total-box">
              <span>TOTAL PAYABLE</span>
              <strong>₹{totalAmount}</strong>
            </section>

            {/* ACTIONS */}

            <section className="actions">
              {currentMonthData?.status !== "CLOSED" && (
                <button
                  className="secondary-btn"
                  onClick={closeMonth}
                >
                  Close This Month
                </button>
              )}

              <button
                className="whatsapp-btn"
                onClick={generateWhatsAppBill}
              >
                Send Bill on WhatsApp
              </button>
            </section>
          </section>
        )}
      </main>
    </div>
  );
}