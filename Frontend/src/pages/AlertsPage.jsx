import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AlertsPage() {
  const navigate = useNavigate();
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locationName, setLocationName] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("profile");
    let city = "Jaipur";
    if (saved) {
      try {
        const profile = JSON.parse(saved);
        if (profile.location) {
          setLocationName(profile.location);
          const parsed = profile.location.split(/[(),]/)[0].trim();
          if (parsed) city = parsed;
        }
      } catch {}
    }

    setLoading(true);
    fetch(`/api/weather?city=${encodeURIComponent(city)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Weather service offline");
        return res.json();
      })
      .then((data) => {
        setWeatherData(data);
        setError(null);
      })
      .catch((err) => {
        console.error("Failed to load weather alerts:", err);
        setError(err.message || "Failed to load weather alerts");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <main className="page">
      <div className="container" style={{ maxWidth: "800px", padding: "2rem 1rem" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ fontSize: "2rem", color: "#16a34a", margin: "0 0 0.5rem" }}>🌾 Weather & Crop Advisory</h1>
            <p style={{ color: "var(--muted)", margin: 0 }}>
              Live localized weather alerts for <strong>{weatherData?.city || locationName.split(/[(),]/)[0].trim() || "your area"}</strong>
            </p>
          </div>
          <button onClick={() => navigate(-1)} className="btn" style={{ padding: "0.5rem 1rem" }}>
            ← Back
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem 0" }}>
            <div className="loading-spinner" style={{ margin: "0 auto 1rem" }}></div>
            <p style={{ color: "var(--muted)" }}>Analyzing meteorological variables & generating advisories...</p>
          </div>
        ) : error ? (
          <div style={{ background: "#fef2f2", border: "1px solid #fee2e2", borderRadius: "12px", padding: "1.5rem", color: "#b91c1c" }}>
            <h3 style={{ margin: "0 0 0.5rem" }}>⚠️ Service Connection Offline</h3>
            <p style={{ margin: "0 0 1rem", fontSize: "0.95rem" }}>
              We could not connect to the real-time weather service. Below are standard guidelines:
            </p>
            <ul style={{ paddingLeft: "1.25rem", margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
              <li>🌧️ Rain Expected: Protect crops from waterlogging and clear drainage paths.</li>
              <li>💧 High Humidity (85%): Check for signs of fungal infection on leaves.</li>
              <li>🌡️ Average Temperature (28°C): Maintain regular irrigation schedules.</li>
            </ul>
          </div>
        ) : (
          <div>
            {/* Live Weather Metrics Card */}
            <div style={{ background: "white", borderRadius: "16px", padding: "1.5rem", border: "1px solid var(--border)", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", marginBottom: "2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "1rem", marginBottom: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "2.5rem" }}>{weatherData.icon}</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.25rem", color: "var(--text)" }}>{weatherData.condition}</h3>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted)" }}>
                      Resolved: {weatherData.city}, {weatherData.state}
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "2rem", fontWeight: "800", color: "var(--text)", lineHeight: 1 }}>
                    {weatherData.temperature}°C
                  </div>
                  <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                    Feels like {weatherData.apparentTemperature}°C
                  </span>
                </div>
              </div>

              {/* Weather Stats Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
                <div style={{ textAlign: "center", padding: "0.75rem", background: "#f8fafc", borderRadius: "8px", border: "1px solid var(--border)" }} className="weather-metric">
                  <span style={{ fontSize: "1.2rem", display: "block", marginBottom: "4px" }}>💧</span>
                  <span style={{ fontSize: "0.8rem", color: "var(--muted)", display: "block" }}>Humidity</span>
                  <strong style={{ color: "var(--text)" }}>{weatherData.humidity}%</strong>
                </div>
                <div style={{ textAlign: "center", padding: "0.75rem", background: "#f8fafc", borderRadius: "8px", border: "1px solid var(--border)" }} className="weather-metric">
                  <span style={{ fontSize: "1.2rem", display: "block", marginBottom: "4px" }}>💨</span>
                  <span style={{ fontSize: "0.8rem", color: "var(--muted)", display: "block" }}>Wind Speed</span>
                  <strong style={{ color: "var(--text)" }}>{weatherData.windSpeed} km/h</strong>
                </div>
                <div style={{ textAlign: "center", padding: "0.75rem", background: "#f8fafc", borderRadius: "8px", border: "1px solid var(--border)" }} className="weather-metric">
                  <span style={{ fontSize: "1.2rem", display: "block", marginBottom: "4px" }}>🌧️</span>
                  <span style={{ fontSize: "0.8rem", color: "var(--muted)", display: "block" }}>Rainfall</span>
                  <strong style={{ color: "var(--text)" }}>{weatherData.precipitation} mm</strong>
                </div>
              </div>
            </div>

            {/* Advisory / Warnings */}
            <h2 style={{ fontSize: "1.25rem", color: "var(--text)", marginBottom: "1rem" }}>Agricultural Advisory</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {weatherData.alerts.map((alert, index) => {
                const isWarning = alert.includes("Rain") || alert.includes("Heat") || alert.includes("Frost") || alert.includes("winds") || alert.includes("humidity");
                return (
                  <div
                    key={index}
                    style={{
                      background: isWarning ? "#fffbeb" : "#f0fdf4",
                      borderLeft: `5px solid ${isWarning ? "#d97706" : "#22c55e"}`,
                      borderRadius: "0 8px 8px 0",
                      padding: "1rem",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
                    }}
                  >
                    <p style={{ margin: 0, fontSize: "0.95rem", color: isWarning ? "#78350f" : "#14532d", fontWeight: "500", lineHeight: "1.5" }}>
                      {alert}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Standard Safety advisory footer */}
            <div style={{ marginTop: "2.5rem", background: "#f8fafc", border: "1px solid var(--border)", borderRadius: "12px", padding: "1rem", display: "flex", gap: "12px", alignItems: "center" }}>
              <span style={{ fontSize: "1.5rem" }}>💡</span>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted)" }}>
                Advisories are generated based on dynamic temperature, humidity, wind, and precipitation parameters. Please cross-reference with local district warning reports before major farm operations.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
