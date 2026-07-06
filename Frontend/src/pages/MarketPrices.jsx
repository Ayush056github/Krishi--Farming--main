import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function MarketPrices() {
  const navigate = useNavigate();
  const [state, setState] = useState("Rajasthan");
  const [crop, setCrop] = useState("Wheat");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  const states = [
    "Andhra Pradesh",
    "Bihar",
    "Gujarat",
    "Haryana",
    "Karnataka",
    "Madhya Pradesh",
    "Maharashtra",
    "Punjab",
    "Rajasthan",
    "Tamil Nadu",
    "Uttar Pradesh",
    "West Bengal"
  ];
  const crops = ["Wheat", "Rice", "Cotton", "Mustard", "Onion", "Potato"];

  const fetchPrices = (selectedState, selectedCrop) => {
    setLoading(true);
    setError(null);
    fetch(`/api/market-prices?state=${encodeURIComponent(selectedState)}&crop=${encodeURIComponent(selectedCrop)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Market data API returned an error");
        return res.json();
      })
      .then((resData) => {
        setData(resData);
      })
      .catch((err) => {
        console.error("Error loading market prices:", err);
        setError("Failed to load wholesale Mandi rates. Please try again.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    const saved = localStorage.getItem("profile");
    let initialState = "Rajasthan";
    if (saved) {
      try {
        const profile = JSON.parse(saved);
        if (profile.location) {
          const matchedState = states.find(s => profile.location.toLowerCase().includes(s.toLowerCase()));
          if (matchedState) {
            initialState = matchedState;
            setState(matchedState);
          }
        }
      } catch {}
    }
    fetchPrices(initialState, crop);
  }, []);

  const handleFilterChange = (newState, newCrop) => {
    setState(newState);
    setCrop(newCrop);
    fetchPrices(newState, newCrop);
  };

  return (
    <main className="page">
      <div className="container" style={{ maxWidth: "1000px", padding: "2rem 1rem" }}>
        
        {/* Header Section */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "2.5rem", fontWeight: "800", color: "#15803d", marginBottom: "0.5rem" }}>
            Wholesale Market Prices
          </h1>
          <p style={{ fontSize: "1.1rem", color: "var(--muted)" }}>
            Real-time wholesale Mandi prices and arrival volumes across agricultural hubs in India.
          </p>
        </div>

        {/* Filters Card */}
        <div style={{ background: "white", borderRadius: "16px", padding: "1.5rem", border: "1px solid var(--border)", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", marginBottom: "2rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", fontSize: "0.9rem", color: "var(--text)" }}>Select State</label>
            <select
              value={state}
              onChange={(e) => handleFilterChange(e.target.value, crop)}
              className="input"
              style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", height: "auto" }}
            >
              {states.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", fontSize: "0.9rem", color: "var(--text)" }}>Select Commodity</label>
            <select
              value={crop}
              onChange={(e) => handleFilterChange(state, e.target.value)}
              className="input"
              style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", height: "auto" }}
            >
              {crops.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div style={{ textAlign: "center", padding: "4rem 0" }}>
            <div className="loading-spinner" style={{ margin: "0 auto 1rem" }}></div>
            <p style={{ color: "var(--muted)" }}>Fetching the latest wholesale auction data...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fee2e2", borderRadius: "12px", padding: "1.25rem", marginBottom: "2rem", color: "#b91c1c" }}>
            ⚠️ {error}
          </div>
        )}

        {/* Data Metrics Dashboard */}
        {!loading && !error && data && (
          <div>
            {/* Overview cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem", marginBottom: "2.5rem" }}>
              
              <div style={{ background: "white", borderRadius: "12px", padding: "1.5rem", border: "1px solid var(--border)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <span style={{ color: "var(--muted)", fontSize: "0.85rem", textTransform: "uppercase", fontWeight: "600" }}>Modal Wholesale Price</span>
                  <h2 style={{ fontSize: "2rem", fontWeight: "800", color: "#16a34a", margin: "0.5rem 0" }}>
                    ₹{data.avgPrice}
                  </h2>
                </div>
                <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Per {data.unit}</span>
              </div>

              <div style={{ background: "white", borderRadius: "12px", padding: "1.5rem", border: "1px solid var(--border)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <span style={{ color: "var(--muted)", fontSize: "0.85rem", textTransform: "uppercase", fontWeight: "600" }}>Mandi Range</span>
                  <div style={{ display: "flex", gap: "12px", alignItems: "baseline", marginTop: "0.5rem" }}>
                    <span style={{ fontSize: "1.2rem", fontWeight: "700", color: "var(--text)" }}>₹{data.minPrice}</span>
                    <span style={{ color: "var(--muted)" }}>to</span>
                    <span style={{ fontSize: "1.2rem", fontWeight: "700", color: "var(--text)" }}>₹{data.maxPrice}</span>
                  </div>
                </div>
                <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Min / Max price variations</span>
              </div>

              <div style={{ background: "white", borderRadius: "12px", padding: "1.5rem", border: "1px solid var(--border)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <span style={{ color: "var(--muted)", fontSize: "0.85rem", textTransform: "uppercase", fontWeight: "600" }}>Weekly Trend</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "0.5rem" }}>
                    <span style={{
                      fontSize: "1.5rem",
                      color: data.trend === "up" ? "#16a34a" : data.trend === "down" ? "#dc2626" : "var(--muted)"
                    }}>
                      {data.trend === "up" ? "📈" : data.trend === "down" ? "📉" : "📊"}
                    </span>
                    <strong style={{
                      fontSize: "1.25rem",
                      color: data.trend === "up" ? "#16a34a" : data.trend === "down" ? "#dc2626" : "var(--text)"
                    }}>
                      {data.trend === "up" ? `+${data.percentageChange}%` : data.trend === "down" ? `${data.percentageChange}%` : "Stable"}
                    </strong>
                  </div>
                </div>
                <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Based on past 7 days average</span>
              </div>

            </div>

            {/* Mandi Comparison Table */}
            <div style={{ background: "white", borderRadius: "16px", border: "1px solid var(--border)", overflow: "hidden", marginBottom: "2rem" }}>
              <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, fontSize: "1.1rem", color: "var(--text)" }}>Local Mandi Breakdown - {state}</h3>
                <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                  Last Updated: {new Date(data.lastUpdated).toLocaleDateString()}
                </span>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid var(--border)" }}>
                      <th style={{ padding: "1rem 1.5rem", fontWeight: "600", fontSize: "0.85rem", color: "var(--muted)" }}>Mandi Name</th>
                      <th style={{ padding: "1rem 1.5rem", fontWeight: "600", fontSize: "0.85rem", color: "var(--muted)" }}>Modal Price (per Quintal)</th>
                      <th style={{ padding: "1rem 1.5rem", fontWeight: "600", fontSize: "0.85rem", color: "var(--muted)" }}>Arrival Volume</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.mandis && data.mandis.map((mandi, idx) => (
                      <tr key={idx} style={{ borderBottom: idx < data.mandis.length - 1 ? "1px solid var(--border)" : "none" }}>
                        <td style={{ padding: "1rem 1.5rem", fontWeight: "600", color: "var(--text)" }}>📍 {mandi.name}</td>
                        <td style={{ padding: "1rem 1.5rem", fontWeight: "700", color: "#16a34a" }}>₹{mandi.price}</td>
                        <td style={{ padding: "1rem 1.5rem", color: "var(--muted)" }}>{mandi.arrival}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>



          </div>
        )}
      </div>
    </main>
  );
}
