import { NavLink } from "react-router-dom";
import { useEffect } from "react";

export default function Navbar() {
    useEffect(() => {
        document.documentElement.removeAttribute("data-theme");
        localStorage.removeItem("theme");
    }, []);

    return (
        <header className="nav">
            <div className="container nav-inner">
                <div className="brand">Krishi Kisan </div>
                <nav className="menu">
                    <NavLink to="/" end>Home</NavLink>
                    <NavLink to="/chatbot">Chatbot</NavLink>
                    <NavLink to="/smart-engine">Smart Engine</NavLink>
                    <NavLink to="/project-overview">Project Overview</NavLink>
                    <NavLink to="/market-prices">Market Prices</NavLink>
                    <NavLink to="/profile">Profile</NavLink>
                    <NavLink to="/about">About</NavLink>
                </nav>
            </div>
        </header>
    );
}