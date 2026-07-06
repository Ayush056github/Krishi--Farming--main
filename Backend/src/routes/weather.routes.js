import { Router } from "express";

const router = Router();

// WMO Weather Codes mapping to condition details
function mapWeatherCode(code) {
    const mapping = {
        0: { condition: "Clear Sky", icon: "☀️" },
        1: { condition: "Mainly Clear", icon: "🌤️" },
        2: { condition: "Partly Cloudy", icon: "⛅" },
        3: { condition: "Overcast", icon: "" },
        45: { condition: "Foggy", icon: "🌫️" },
        48: { condition: "Depositing Rime Fog", icon: "🌫️" },
        51: { condition: "Light Drizzle", icon: "🌦️" },
        53: { condition: "Moderate Drizzle", icon: "🌦️" },
        55: { condition: "Dense Drizzle", icon: "🌦️" },
        56: { condition: "Light Freezing Drizzle", icon: "🌦️" },
        57: { condition: "Dense Freezing Drizzle", icon: "🌦️" },
        61: { condition: "Slight Rain", icon: "🌧️" },
        63: { condition: "Moderate Rain", icon: "🌧️" },
        65: { condition: "Heavy Rain", icon: "🌧️" },
        66: { condition: "Light Freezing Rain", icon: "🌧️" },
        67: { condition: "Heavy Freezing Rain", icon: "🌧️" },
        71: { condition: "Slight Snow Fall", icon: "❄️" },
        73: { condition: "Moderate Snow Fall", icon: "❄️" },
        75: { condition: "Heavy Snow Fall", icon: "❄️" },
        77: { condition: "Snow Grains", icon: "❄️" },
        80: { condition: "Slight Rain Showers", icon: "🌧️" },
        81: { condition: "Moderate Rain Showers", icon: "🌧️" },
        82: { condition: "Violent Rain Showers", icon: "⛈️" },
        85: { condition: "Slight Snow Showers", icon: "❄️" },
        86: { condition: "Heavy Snow Showers", icon: "❄️" },
        95: { condition: "Thunderstorm", icon: "⛈️" },
        96: { condition: "Thunderstorm with Slight Hail", icon: "⛈️" },
        99: { condition: "Thunderstorm with Heavy Hail", icon: "⛈️" }
    };
    return mapping[code] || { condition: "Cloudy", icon: "" };
}

async function fetchWithRetry(url, options = {}, retries = 2, delay = 1500) {
    for (let i = 0; i <= retries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.status === 429 && i < retries) {
                console.warn(`Weather API returned 429. Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            return response;
        } catch (error) {
            if (i < retries) {
                console.warn(`Weather API request failed, retrying in ${delay}ms...`, error.message);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            throw error;
        }
    }
}

router.get("/weather", async (req, res) => {
    try {
        const { city } = req.query;
        const searchCity = city ? city.trim() : "Jaipur";

        // Step 1: Geocoding (Resolve City to Lat/Lon)
        const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchCity)}&count=1&language=en&format=json`;
        const geocodeResponse = await fetchWithRetry(geocodeUrl);
        
        if (!geocodeResponse || !geocodeResponse.ok) {
            return res.status(502).json({ error: "Failed to connect to weather geocoding service." });
        }

        const geocodeData = await geocodeResponse.json();
        if (!geocodeData.results || geocodeData.results.length === 0) {
            return res.status(404).json({ error: `City '${searchCity}' not found. Please update your profile location.` });
        }

        const { latitude, longitude, name: resolvedCityName, country, admin1: state } = geocodeData.results[0];

        // Step 2: Fetch Weather Data using coordinates
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&timezone=auto`;
        const weatherResponse = await fetchWithRetry(weatherUrl);

        if (!weatherResponse || !weatherResponse.ok) {
            return res.status(502).json({ error: "Failed to connect to weather forecast service." });
        }

        const weatherData = await weatherResponse.json();
        const current = weatherData.current;

        if (!current) {
            return res.status(502).json({ error: "Invalid response from weather forecast service." });
        }

        const codeMapping = mapWeatherCode(current.weather_code);
        const temperature = Math.round(current.temperature_2m);
        const humidity = Math.round(current.relative_humidity_2m);
        const apparentTemperature = Math.round(current.apparent_temperature);
        const windSpeed = Math.round(current.wind_speed_10m);
        const precipitation = current.precipitation || 0;

        // Generate Agricultural Alerts/Advisory based on weather variables
        const alerts = [];
        if (precipitation > 0 || [61, 63, 65, 80, 81, 82, 95, 96, 99].includes(current.weather_code)) {
            alerts.push("🌧️ Rain / Storm Alert: Clear drainage channels to prevent waterlogging. Avoid applying fertilizers or pesticide sprays until the weather clears.");
        }
        if (temperature > 38) {
            alerts.push("🌡️ High Heat advisory: Ensure adequate irrigation for crops. Implement soil mulching to conserve moisture and protect root zones from heat stress.");
        } else if (temperature < 8) {
            alerts.push("❄️ Frost hazard warning: Protect young seedlings and frost-sensitive crops. Use windbreaks or provide light sprinkler irrigation to mitigate frost injury.");
        }
        if (windSpeed > 20) {
            alerts.push("💨 Strong winds warning: Secure tall crops (like banana or sugarcane). Postpone spraying actions to avoid pesticide drift.");
        }
        if (humidity > 85 && temperature > 22 && temperature < 32) {
            alerts.push("🦠 High Pest & Disease humidity risk: Monitor plants closely for fungal or bacterial infections. Ensure proper spacing for airflow.");
        }

        // Add a default fallback alert if there are no extreme weather alerts
        if (alerts.length === 0) {
            alerts.push("☀️ Favorable weather conditions: Ideal for harvesting, sowing, or general tillage work.");
            alerts.push("💧 Standard advisory: Maintain regular irrigation cycles based on your crop's current growth stage.");
        }

        res.json({
            city: resolvedCityName,
            state: state || "",
            country: country || "",
            latitude,
            longitude,
            temperature,
            apparentTemperature,
            humidity,
            windSpeed,
            precipitation,
            condition: codeMapping.condition,
            icon: codeMapping.icon,
            alerts,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Weather Route Error:", error);
        res.status(500).json({ error: "Failed to fetch weather data." });
    }
});

export default router;
