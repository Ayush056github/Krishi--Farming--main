import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import ChatbotWidget from "./components/ChatbotWidget.jsx";
import Home from "./pages/Home.jsx";
import Chatbot from "./pages/Chatbot.jsx";
import SmartEngine from "./pages/SmartEngine.jsx";
import ProjectOverview from "./pages/ProjectOverview.jsx";
import AlertsPage from "./pages/AlertsPage.jsx";
import SchemesPage from "./pages/SchemesPage.jsx";
import KnowledgePage from "./pages/KnowledgePage.jsx";
import ActivitiesPage from "./pages/ActivitiesPage.jsx";
import Profile from "./pages/Profile.jsx";
import About from "./pages/About.jsx";
import MarketPrices from "./pages/MarketPrices.jsx";
import { ImageProvider } from "./contexts/ImageContext.jsx";

export default function App() {
	return (
		<ImageProvider>
			<div>
				<Navbar />
				<Routes>
					<Route path="/" element={<Home />} />
					<Route path="/chatbot" element={<Chatbot />} />
					<Route path="/smart-engine" element={<SmartEngine />} />
					<Route path="/project-overview" element={<ProjectOverview />} />
					<Route path="/alerts" element={<AlertsPage />} />
					<Route path="/schemes" element={<SchemesPage />} />
					<Route path="/knowledge" element={<KnowledgePage />} />
					<Route path="/activities" element={<ActivitiesPage />} />
					<Route path="/profile" element={<Profile />} />
					<Route path="/about" element={<About />} />
					<Route path="/market-prices" element={<MarketPrices />} />
				</Routes>
				<footer style={{ textAlign: "center", padding: "1.5rem 0", borderTop: "1px solid var(--border)", marginTop: "2rem", color: "var(--muted)", fontSize: "0.9rem" }}>
					<p>© {new Date().getFullYear()} Krishi Kisan. All Rights Reserved.</p>
					<p style={{ marginTop: "0.25rem", fontWeight: "600" }}>Designed & Developed by: Ayush Mathur</p>
				</footer>
				<ChatbotWidget />
			</div>
		</ImageProvider>
	);
}
