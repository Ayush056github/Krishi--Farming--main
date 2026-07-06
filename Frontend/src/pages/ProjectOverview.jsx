import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function ProjectOverview() {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [userName, setUserName] = useState("User");
  const [userLocation, setUserLocation] = useState("Location");

  const navigate = useNavigate();

  const tabs = [
    { name: "Dashboard", icon: "📊" },
    { name: "AI Chat", icon: "💬" },
    { name: "Activities", icon: "📅" },
    { name: "Alerts", icon: "🔔" },
    { name: "Knowledge", icon: "📚" },
    { name: "Schemes", icon: "🎯" },
  ];

  const tasks = [
    { task: "planting - Rice", status: "completed" },
    { task: "watering - Coconut trees", status: "completed" },
    { task: "fertilizing - Rice field", status: "completed" },
  ];

  const farmProgress = [
    { name: "Rice Cultivation", percent: 75 },
    { name: "Coconut Care", percent: 60 },
  ];

  const [weatherData, setWeatherData] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("profile");
    let city = "Jaipur";
    if (saved) {
      try {
        const profile = JSON.parse(saved);
        if (profile.name) setUserName(profile.name);
        if (profile.location) {
          setUserLocation(profile.location);
          const parsed = profile.location.split(/[(),]/)[0].trim();
          if (parsed) city = parsed;
        }
      } catch {}
    }

    setWeatherLoading(true);
    fetch(`/api/weather?city=${encodeURIComponent(city)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Weather service offline");
        return res.json();
      })
      .then((data) => {
        setWeatherData(data);
        setWeatherError(null);
      })
      .catch((err) => {
        console.error("Failed to load weather:", err);
        setWeatherError(err.message || "Failed to load weather data");
      })
      .finally(() => {
        setWeatherLoading(false);
      });
  }, []);

  
  const handleTabClick = (tabName) => {
    setActiveTab(tabName);

    if (tabName === "Alerts") navigate("/alerts");
    else if (tabName === "Schemes") navigate("/schemes");
    else if (tabName === "Knowledge") navigate("/knowledge");
	else if (tabName === "Activities") navigate("/activities");
  else if (tabName === "AI Chat") navigate("/chatbot");
  };

  return (
    <main className="page">
      <div className="container">
        
        <div className="dashboard-header">
          <div className="dh-left">
            <span className="dh-icon">🌿</span>
            <div>
              <h1 className="dh-title">Krishi Kisan</h1>
              <p className="dh-subtitle">Welcome back, {userName}</p>
            </div>
          </div>
          <div className="dh-right">
            <button className="dh-btn">📌 {userLocation}</button>
            <button className="dh-btn" onClick={() => navigate("/profile")}>
              👤 Profile
            </button>
          </div>
        </div>

       
        <nav className="dashboard-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              className={`tab-btn ${activeTab === tab.name ? "active" : ""}`}
              onClick={() => handleTabClick(tab.name)}
            >
              <span className="tab-icon">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>

       
        <div className="dashboard-grid">
          
          <div className="dash-card">
            <div className="dc-header">
              <span className="dc-icon">📋</span>
              <h3 className="dc-title">Today's Tasks</h3>
            </div>
            <div className="task-list">
              {tasks.map((t, i) => (
                <div key={i} className="task-row">
                  <span className="task-name">{t.task}</span>
                  <span className="task-status">{t.status}</span>
                </div>
              ))}
            </div>
          </div>

  
          <div className="dash-card">
            <div className="dc-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="dc-icon">🔔</span>
                <h3 className="dc-title" style={{ margin: 0 }}>Weather & Advisory</h3>
              </div>
              {weatherData && (
                <span style={{ fontSize: "1.5rem" }} title={weatherData.condition}>
                  {weatherData.icon}
                </span>
              )}
            </div>
            <div className="weather-alert" style={{ display: "flex", flexDirection: "column", gap: "10px", minHeight: "120px" }}>
              {weatherLoading ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", margin: "auto" }}>
                  <div className="loading-spinner-small" style={{ width: "24px", height: "24px", border: "3px solid #22c55e", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
                  <span style={{ marginLeft: "8px", fontSize: "0.9rem", color: "var(--muted)" }}>Loading live weather...</span>
                </div>
              ) : weatherError ? (
                <div>
                  <div className="wa-badge" style={{ background: "#fef2f2", color: "#b91c1c" }}>Service Unavailable</div>
                  <p className="wa-text" style={{ fontSize: "0.9rem", color: "var(--muted)", margin: "8px 0 0" }}>
                    Could not load weather for {userLocation.split(/[(),]/)[0].trim() || "your location"}.
                  </p>
                  <p className="wa-meta" style={{ fontSize: "0.85rem", color: "var(--muted)", margin: "4px 0 0" }}>
                    Temp: 28°C | Humidity: 85%
                  </p>
                </div>
              ) : (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span className="wa-badge" style={{ background: "rgba(34, 197, 94, 0.15)", color: "var(--primary)", fontWeight: "700" }}>
                      {weatherData.city} ({weatherData.condition})
                    </span>
                    <strong style={{ fontSize: "1.2rem", color: "var(--text)" }}>{weatherData.temperature}°C</strong>
                  </div>
                  <p className="wa-text" style={{ fontSize: "0.9rem", fontWeight: "500", margin: "4px 0 8px", color: "var(--text)", lineHeight: "1.4" }}>
                    {weatherData.alerts && weatherData.alerts.length > 0 ? weatherData.alerts[0] : "Weather conditions look normal today."}
                  </p>
                  <p className="wa-meta" style={{ fontSize: "0.8rem", color: "var(--muted)", margin: 0 }}>
                    Feels like: {weatherData.apparentTemperature}°C | Humidity: {weatherData.humidity}% | Wind: {weatherData.windSpeed} km/h
                  </p>
                </div>
              )}
            </div>
          </div>

        
          <div className="dash-card">
            <div className="dc-header">
              <span className="dc-icon">📈</span>
              <h3 className="dc-title">Farm Progress</h3>
            </div>
            <div className="progress-list">
              {farmProgress.map((fp, i) => (
                <div key={i} className="progress-item">
                  <div className="pi-header">
                    <span className="pi-name">{fp.name}</span>
                    <span className="pi-percent">{fp.percent}%</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${fp.percent}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
