import { useState, useRef } from "react";
import { useImage } from "../contexts/ImageContext.jsx";

export default function SmartEngine() {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const { setImage, clearImage } = useImage();

  const compressImageDataUrl = (dataUrl, maxSize = 1280, quality = 0.8) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        const scale = Math.min(maxSize / width, maxSize / height, 1);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Image processing failed"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => reject(new Error("Could not load image"));
      img.src = dataUrl;
    });

  const analyzeDataUrl = async (dataUrl) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: dataUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      if (data?.analysis) {
        setResult(data.analysis);
      } else {
        throw new Error("Sorry, our AI service is temporarily unavailable. Please try again.");
      }
    } catch (err) {
      setError(err.message || "Sorry, our AI service is temporarily unavailable. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setError(null);
      setResult(null);

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Result = reader.result;
        const optimizedDataUrl = await compressImageDataUrl(base64Result);
        setImagePreview(optimizedDataUrl);
        const base64Data = optimizedDataUrl.split(",")[1];
        const mimeType = optimizedDataUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,/)?.[1] || "image/jpeg";
        setImage(file, base64Data, mimeType);
        analyzeDataUrl(optimizedDataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setResult(null);
    setError(null);
    clearImage();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const getHealthBadgeClass = (health) => {
    if (!health) return "badge-health";
    const h = health.toLowerCase();
    if (h.includes("healthy") && !h.includes("unhealthy")) return "badge-health healthy";
    if (h.includes("slightly")) return "badge-health slightly-unhealthy";
    if (h.includes("diseased")) return "badge-health diseased";
    return "badge-health critical";
  };

  return (
    <main className="page">
      <div className="container" style={{ maxWidth: "1000px" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "2.5rem", fontWeight: "800", color: "#15803d", marginBottom: "0.5rem" }}>
            Smart AI Plant Doctor
          </h1>
          <p style={{ fontSize: "1.1rem", color: "#475569" }}>
            Upload an image of your crop for real-time health analysis, growth diagnosis, and professional advice.
          </p>
        </div>

        <div style={{ background: "white", borderRadius: "16px", padding: "2rem", border: "1px solid var(--border)", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", marginBottom: "2rem" }}>
          {!imagePreview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{ border: "2px dashed #22c55e", borderRadius: "12px", padding: "4rem 2rem", textAlign: "center", cursor: "pointer", background: "#f8fafc", transition: "all 0.3s ease" }}
              className="upload-dropzone"
            >
              <span style={{ fontSize: "3rem", display: "block", marginBottom: "1rem" }}>📸</span>
              <h3 style={{ fontSize: "1.25rem", color: "#1e293b", marginBottom: "0.5rem", fontWeight: "600" }}>
                Click to upload crop or plant image
              </h3>
              <p style={{ fontSize: "0.9rem", color: "#64748b" }}>Supports JPG, JPEG, PNG formats</p>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
            </div>
          ) : (
            <div>
              <div style={{ position: "relative", marginBottom: "1.5rem" }}>
                <img src={imagePreview} alt="Crop Preview" style={{ width: "100%", maxHeight: "400px", objectFit: "contain", borderRadius: "12px", border: "1px solid #e2e8f0" }} />
                <button
                  onClick={handleRemoveImage}
                  style={{ position: "absolute", top: "12px", right: "12px", background: "rgba(15, 23, 42, 0.85)", color: "white", border: "none", borderRadius: "50%", width: "36px", height: "36px", cursor: "pointer", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}
                  title="Remove image"
                >
                  ✕
                </button>
              </div>

              <button
                onClick={() => imagePreview && analyzeDataUrl(imagePreview)}
                disabled={isLoading}
                style={{ width: "100%", padding: "1rem", background: isLoading ? "#86efac" : "#16a34a", color: "white", border: "none", borderRadius: "8px", fontSize: "1.05rem", fontWeight: "700", cursor: isLoading ? "not-allowed" : "pointer", transition: "all 0.2s ease", boxShadow: "0 4px 6px rgba(22, 163, 74, 0.2)" }}
              >
                {isLoading ? "Analyzing Crop..." : "Re-Analyze Image"}
              </button>
            </div>
          )}
        </div>

        {isLoading && (
          <div style={{ background: "white", borderRadius: "16px", padding: "2rem", border: "1px solid var(--border)", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", marginBottom: "2rem" }} className="loading-container">
            <div className="loading-spinner"></div>
            <h3 style={{ margin: "0", color: "#1e293b", fontWeight: "600" }}>Running AI Health Diagnostics...</h3>
            <p style={{ color: "#64748b", margin: "6px 0 0" }}>Identifying crops, growth stages, and checking for disease symptoms.</p>
            <div className="analysis-progress-bar">
              <div className="progress-fill"></div>
            </div>
          </div>
        )}

        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fee2e2", borderRadius: "12px", padding: "1.25rem", marginBottom: "2rem", color: "#b91c1c", display: "flex", gap: "10px", alignItems: "center" }}>
            <span style={{ fontSize: "1.2rem" }}>⚠️</span>
            <div>
              <strong style={{ display: "block" }}>Service Alert</strong>
              <span style={{ fontSize: "0.95rem" }}>{error}</span>
            </div>
          </div>
        )}

        {result && (
          <div className="result-container">
            <div className="result-grid">
              
              <div className="result-card">
                <h3>🩺 Health Overview</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div>
                    <span style={{ color: "#64748b", fontSize: "0.9rem", display: "block" }}>Plant Identified</span>
                    <strong style={{ fontSize: "1.15rem", color: "#0f172a" }}>{result.plantName || "Unknown"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b", fontSize: "0.9rem", display: "block" }}>Crop Type</span>
                    <strong style={{ fontSize: "1.1rem", color: "#0f172a" }}>{result.cropName || "Unknown"}</strong>
                  </div>
                  <div style={{ display: "flex", gap: "24px", marginTop: "4px" }}>
                    <div>
                      <span style={{ color: "#64748b", fontSize: "0.9rem", display: "block", marginBottom: "4px" }}>Health Status</span>
                      <span className={getHealthBadgeClass(result.plantHealth)}>{result.plantHealth || "Unknown"}</span>
                    </div>
                    <div>
                      <span style={{ color: "#64748b", fontSize: "0.9rem", display: "block", marginBottom: "4px" }}>Confidence</span>
                      <strong style={{ fontSize: "1.1rem", color: "#16a34a" }}>{result.confidenceScore || "N/A"}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="result-card">
                <h3>📝 Health Diagnosis</h3>
                {result.diseaseDetected ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div>
                      <strong style={{ color: "#b91c1c" }}>Disease Detected: </strong>
                      <span style={{ fontWeight: "600" }}>{result.diseaseDetails?.diseaseName}</span>
                    </div>
                    <div>
                      <strong>Cause: </strong>
                      <span style={{ fontSize: "0.95rem", color: "#475569" }}>{result.diseaseDetails?.cause}</span>
                    </div>
                    <div>
                      <strong>Symptoms: </strong>
                      <span style={{ fontSize: "0.95rem", color: "#475569" }}>{result.diseaseDetails?.symptoms}</span>
                    </div>
                    <div>
                      <strong>Severity: </strong>
                      <span style={{ fontWeight: "600", color: result.diseaseDetails?.severity === "Severe" ? "#b91c1c" : "#d97706" }}>
                        {result.diseaseDetails?.severity}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ color: "#15803d", fontWeight: "700", fontSize: "1.1rem" }}>
                      {result.healthyDetails?.message || "✅ Plant is Healthy"}
                    </div>
                    <div>
                      <strong>Expected Next Growth Stage: </strong>
                      <span style={{ fontSize: "0.95rem", color: "#475569" }}>{result.healthyDetails?.expectedNextStage}</span>
                    </div>
                    <div>
                      <strong>Recommended General Care: </strong>
                      <span style={{ fontSize: "0.95rem", color: "#475569" }}>{result.healthyDetails?.recommendedCare}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="result-card" style={{ gridColumn: "1 / -1" }}>
                <h3>🌱 Growth Stage Care: {result.growthStage || "General Advice"}</h3>
                
                <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "1fr" }} className="advisory-subgrid">
                  <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
                    
                    <div className="advice-card">
                      <h4>💧 Water Requirement</h4>
                      <p>{result.growthStageAdvice?.waterRequirement || "N/A"}</p>
                    </div>

                    <div className="advice-card">
                      <h4>☀️ Sunlight</h4>
                      <p>{result.growthStageAdvice?.sunlight || "N/A"}</p>
                    </div>

                    <div className="advice-card">
                      <h4>🧪 Nutrient / Fertilizer</h4>
                      <p>{result.growthStageAdvice?.fertilizer || "N/A"}</p>
                    </div>

                    <div className="advice-card">
                      <h4>🛡️ Protection & Safety</h4>
                      <p>{result.growthStageAdvice?.protection || "N/A"}</p>
                    </div>

                  </div>
                  
                  {result.growthStageAdvice?.commonProblems && (
                    <div className="advice-card" style={{ borderLeftColor: "#ea580c", background: "#fff7ed" }}>
                      <h4 style={{ color: "#c2410c" }}>⚠️ Common Problems at this Stage</h4>
                      <p style={{ color: "#7c2d12" }}>{result.growthStageAdvice.commonProblems}</p>
                    </div>
                  )}
                </div>
              </div>

              {result.diseaseDetected && result.diseaseDetails && (
                <div className="result-card" style={{ gridColumn: "1 / -1" }}>
                  <h3>💊 Treatment Plan</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ borderLeft: "4px solid #16a34a", paddingLeft: "12px" }}>
                      <strong style={{ color: "#15803d", display: "block", marginBottom: "4px" }}>🍀 Organic Treatment</strong>
                      <span style={{ fontSize: "0.95rem", color: "#475569" }}>{result.diseaseDetails.organicTreatment}</span>
                    </div>
                    <div style={{ borderLeft: "4px solid #0284c7", paddingLeft: "12px" }}>
                      <strong style={{ color: "#0369a1", display: "block", marginBottom: "4px" }}>🧪 Chemical Treatment</strong>
                      <span style={{ fontSize: "0.95rem", color: "#475569" }}>{result.diseaseDetails.chemicalTreatment}</span>
                    </div>
                    <div style={{ borderLeft: "4px solid #ea580c", paddingLeft: "12px" }}>
                      <strong style={{ color: "#c2410c", display: "block", marginBottom: "4px" }}>🛡️ Prevention Tips</strong>
                      <span style={{ fontSize: "0.95rem", color: "#475569" }}>{result.diseaseDetails.preventionTips}</span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        <section className="faq-section">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-list">
            
            <div className="faq-item">
              <h3 className="faq-question">1. Which plant images give the best results?</h3>
              <p className="faq-answer">Use clear images taken in daylight with visible leaves.</p>
            </div>

            <div className="faq-item">
              <h3 className="faq-question">2. Can this detect diseases?</h3>
              <p className="faq-answer">Yes. It detects common crop diseases and suggests treatments.</p>
            </div>

            <div className="faq-item">
              <h3 className="faq-question">3. Does it identify plant growth stage?</h3>
              <p className="faq-answer">Yes. It detects seedling, vegetative, flowering, fruiting and harvest stages.</p>
            </div>

            <div className="faq-item">
              <h3 className="faq-question">4. Which crops are supported?</h3>
              <p className="faq-answer">
                Rice, Wheat, Tomato, Potato, Cotton, Maize, Sugarcane, Onion, Chili, Brinjal, Banana, Mango, and many more.
              </p>
            </div>

            <div className="faq-item">
              <h3 className="faq-question">5. What should I do if my problem is not solved?</h3>
              <p className="faq-answer">
                Please contact: <a href="mailto:krishikisan@gmail.com" style={{ color: "#16a34a", fontWeight: "600", textDecoration: "none" }}>krishikisan@gmail.com</a> or ask your question using the AI Chatbot.
              </p>
            </div>

          </div>
        </section>
      </div>
    </main>
  );
}
