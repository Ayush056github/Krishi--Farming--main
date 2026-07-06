import { useState, useRef } from "react";
import { useImage } from "../contexts/ImageContext.jsx";
import { jsPDF } from "jspdf";

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

  const downloadPDF = () => {
    if (!result) return;
    
    const doc = new jsPDF();
    
    let farmerName = "Krishi Kisan Farmer";
    let farmerLocation = "Not Specified";
    const savedProfile = localStorage.getItem("profile");
    if (savedProfile) {
      try {
        const profile = JSON.parse(savedProfile);
        if (profile.name) farmerName = profile.name;
        if (profile.location) farmerLocation = profile.location;
      } catch (e) {}
    }
    
    const textDark = "#1e293b";
    const textMuted = "#64748b";
    
    // Outer border
    doc.setDrawColor(34, 197, 94);
    doc.setLineWidth(1);
    doc.rect(5, 5, 200, 287);
    
    // Header Banner
    doc.setFillColor(34, 197, 94);
    doc.rect(5, 5, 200, 25, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("KRISHI KISAN - AI CROP HEALTH REPORT", 12, 21);
    
    // Date & Farmer details
    doc.setTextColor(textDark);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Date Generated: ${new Date().toLocaleDateString()}`, 145, 42);
    
    doc.setFont("helvetica", "bold");
    doc.text("Farmer Profile Details:", 12, 42);
    doc.setFont("helvetica", "normal");
    doc.text(`Name: ${farmerName}`, 12, 48);
    doc.text(`Location: ${farmerLocation}`, 12, 54);
    
    doc.setDrawColor(226, 232, 240);
    doc.line(12, 60, 198, 60);
    
    // 1. Health Overview
    doc.setTextColor(22, 163, 74);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("1. Health Overview", 12, 68);
    
    doc.setTextColor(textDark);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Plant Identified: ${result.plantName || "N/A"}`, 15, 76);
    doc.text(`Crop Name: ${result.cropName || "N/A"}`, 15, 82);
    doc.text(`Growth Stage: ${result.growthStage || "N/A"}`, 15, 88);
    doc.text(`Confidence Score: ${result.confidenceScore || "N/A"}`, 15, 94);
    
    // Health status badge box
    doc.setFillColor(248, 250, 252);
    doc.rect(145, 68, 50, 25, "F");
    doc.setDrawColor(226, 232, 240);
    doc.rect(145, 68, 50, 25, "S");
    doc.setTextColor(textMuted);
    doc.setFontSize(8);
    doc.text("DIAGNOSTIC STATUS", 148, 74);
    
    const health = result.plantHealth || "Healthy";
    if (health.toLowerCase().includes("healthy") && !health.toLowerCase().includes("unhealthy")) {
      doc.setTextColor(22, 163, 74);
    } else {
      doc.setTextColor(185, 28, 28);
    }
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(health.toUpperCase(), 148, 84);
    
    doc.setDrawColor(226, 232, 240);
    doc.line(12, 102, 198, 102);
    
    // 2. Health Diagnosis
    doc.setTextColor(22, 163, 74);
    doc.setFontSize(12);
    doc.text("2. Health Diagnosis & Details", 12, 110);
    
    doc.setTextColor(textDark);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    let currentY = 118;
    if (result.diseaseDetected && result.diseaseDetails) {
      doc.setFont("helvetica", "bold");
      doc.text(`Disease Detected: ${result.diseaseDetails.diseaseName || "Yes"}`, 15, currentY);
      doc.setFont("helvetica", "normal");
      
      currentY += 8;
      doc.setFont("helvetica", "bold");
      doc.text("Severity: ", 15, currentY);
      doc.setFont("helvetica", "normal");
      doc.text(result.diseaseDetails.severity || "Moderate", 32, currentY);
      
      currentY += 8;
      const causeText = doc.splitTextToSize(`Primary Cause: ${result.diseaseDetails.cause || "N/A"}`, 175);
      doc.text(causeText, 15, currentY);
      currentY += causeText.length * 5;
      
      const symptomsText = doc.splitTextToSize(`Symptoms: ${result.diseaseDetails.symptoms || "N/A"}`, 175);
      doc.text(symptomsText, 15, currentY);
      currentY += symptomsText.length * 5;
    } else {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(22, 163, 74);
      doc.text(result.healthyDetails?.message || "Plant is Healthy", 15, currentY);
      doc.setTextColor(textDark);
      doc.setFont("helvetica", "normal");
      
      currentY += 8;
      const nextStageText = doc.splitTextToSize(`Expected Next Growth Stage: ${result.healthyDetails?.expectedNextStage || "N/A"}`, 175);
      doc.text(nextStageText, 15, currentY);
      currentY += nextStageText.length * 5;
      
      const careText = doc.splitTextToSize(`Recommended General Care: ${result.healthyDetails?.recommendedCare || "N/A"}`, 175);
      doc.text(careText, 15, currentY);
      currentY += careText.length * 5;
    }
    
    doc.setDrawColor(226, 232, 240);
    doc.line(12, currentY + 2, 198, currentY + 2);
    currentY += 10;
    
    // 3. Advisories and Treatments
    if (result.diseaseDetected && result.diseaseDetails) {
      doc.setTextColor(22, 163, 74);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("3. Recommended Treatment Plan", 12, currentY);
      currentY += 8;
      
      doc.setTextColor(textDark);
      doc.setFontSize(10);
      
      doc.setFont("helvetica", "bold");
      doc.text("Organic / Cultural Treatment:", 15, currentY);
      doc.setFont("helvetica", "normal");
      currentY += 5;
      const organicText = doc.splitTextToSize(result.diseaseDetails.organicTreatment || "N/A", 175);
      doc.text(organicText, 18, currentY);
      currentY += organicText.length * 5 + 3;
      
      doc.setFont("helvetica", "bold");
      doc.text("Chemical Treatment (if required):", 15, currentY);
      doc.setFont("helvetica", "normal");
      currentY += 5;
      const chemicalText = doc.splitTextToSize(result.diseaseDetails.chemicalTreatment || "N/A", 175);
      doc.text(chemicalText, 18, currentY);
      currentY += chemicalText.length * 5 + 3;
      
      doc.setFont("helvetica", "bold");
      doc.text("Long-term Prevention Advice:", 15, currentY);
      doc.setFont("helvetica", "normal");
      currentY += 5;
      const prevText = doc.splitTextToSize(result.diseaseDetails.preventionTips || "N/A", 175);
      doc.text(prevText, 18, currentY);
    } else {
      doc.setTextColor(22, 163, 74);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("3. Growth Stage Advisory", 12, currentY);
      currentY += 8;
      
      doc.setTextColor(textDark);
      doc.setFontSize(10);
      
      if (result.growthStageAdvice) {
        doc.setFont("helvetica", "bold");
        doc.text("Water Requirement: ", 15, currentY);
        doc.setFont("helvetica", "normal");
        doc.text(result.growthStageAdvice.waterRequirement || "N/A", 52, currentY);
        currentY += 7;
        
        doc.setFont("helvetica", "bold");
        doc.text("Sunlight Requirement: ", 15, currentY);
        doc.setFont("helvetica", "normal");
        doc.text(result.growthStageAdvice.sunlight || "N/A", 54, currentY);
        currentY += 7;
        
        doc.setFont("helvetica", "bold");
        doc.text("Nutrient / Fertilizer: ", 15, currentY);
        doc.setFont("helvetica", "normal");
        doc.text(result.growthStageAdvice.fertilizer || "N/A", 52, currentY);
        currentY += 7;
        
        doc.setFont("helvetica", "bold");
        doc.text("Plant Protection Advisory: ", 15, currentY);
        doc.setFont("helvetica", "normal");
        currentY += 5;
        const protText = doc.splitTextToSize(result.growthStageAdvice.protection || "N/A", 175);
        doc.text(protText, 18, currentY);
      }
    }
    
    // Bottom Disclaimer Footer
    doc.setTextColor(textMuted);
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text("Disclaimer: This report is generated by Krishi Kisan AI based on image parameters. Please cross-reference with local agronomists.", 12, 283);
    
    doc.save(`Krishi_Kisan_${(result.plantName || "Plant").replace(/\s+/g, "_")}_Report.pdf`);
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

        <div style={{ background: "var(--card-bg)", borderRadius: "16px", padding: "2rem", border: "1px solid var(--border)", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", marginBottom: "2rem" }}>
          {!imagePreview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{ border: "2px dashed #22c55e", borderRadius: "12px", padding: "4rem 2rem", textAlign: "center", cursor: "pointer", background: "var(--inner-bg)", transition: "all 0.3s ease" }}
              className="upload-dropzone"
            >

              <h3 style={{ fontSize: "1.25rem", color: "var(--text)", marginBottom: "0.5rem", fontWeight: "600" }}>
                Click to upload crop or plant image
              </h3>
              <p style={{ fontSize: "0.9rem", color: "var(--muted)" }}>Supports JPG, JPEG, PNG formats</p>
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
          <div style={{ background: "var(--card-bg)", borderRadius: "16px", padding: "2rem", border: "1px solid var(--border)", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", marginBottom: "2rem" }} className="loading-container">
            <div className="loading-spinner"></div>
            <h3 style={{ margin: "0", color: "var(--text)", fontWeight: "600" }}>Running AI Health Diagnostics...</h3>
            <p style={{ color: "var(--muted)", margin: "6px 0 0" }}>Identifying crops, growth stages, and checking for disease symptoms.</p>
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
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1.5rem" }}>
              <button
                onClick={downloadPDF}
                className="btn primary"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "0.75rem 1.5rem",
                  fontSize: "1.05rem",
                  fontWeight: "700",
                  borderRadius: "8px",
                  cursor: "pointer",
                  boxShadow: "0 4px 6px rgba(22, 163, 74, 0.15)"
                }}
              >
                📄 Download Report PDF
              </button>
            </div>
            <div className="result-grid">
              
              <div className="result-card">
                <h3>🩺 Health Overview</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div>
                    <span style={{ color: "var(--muted)", fontSize: "0.9rem", display: "block" }}>Plant Identified</span>
                    <strong style={{ fontSize: "1.15rem", color: "var(--text)" }}>{result.plantName || "Unknown"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--muted)", fontSize: "0.9rem", display: "block" }}>Crop Type</span>
                    <strong style={{ fontSize: "1.1rem", color: "var(--text)" }}>{result.cropName || "Unknown"}</strong>
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
                      <span style={{ fontSize: "0.95rem", color: "var(--muted)" }}>{result.diseaseDetails?.cause}</span>
                    </div>
                    <div>
                      <strong>Symptoms: </strong>
                      <span style={{ fontSize: "0.95rem", color: "var(--muted)" }}>{result.diseaseDetails?.symptoms}</span>
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
                      <span style={{ fontSize: "0.95rem", color: "var(--muted)" }}>{result.healthyDetails?.expectedNextStage}</span>
                    </div>
                    <div>
                      <strong>Recommended General Care: </strong>
                      <span style={{ fontSize: "0.95rem", color: "var(--muted)" }}>{result.healthyDetails?.recommendedCare}</span>
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
                    <div className="advice-card" style={{ borderLeftColor: "#ea580c", background: "var(--warning-card-bg)" }}>
                      <h4 style={{ color: "var(--warning-text)" }}>⚠️ Common Problems at this Stage</h4>
                      <p style={{ color: "var(--warning-text-muted)" }}>{result.growthStageAdvice.commonProblems}</p>
                    </div>
                  )}
                </div>
              </div>

              {result.diseaseDetected && result.diseaseDetails && (
                <div className="result-card" style={{ gridColumn: "1 / -1" }}>
                  <h3>💊 Treatment Plan</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ borderLeft: "4px solid #16a34a", paddingLeft: "12px" }}>
                      <strong style={{ color: "var(--primary)", display: "block", marginBottom: "4px" }}>🍀 Organic Treatment</strong>
                      <span style={{ fontSize: "0.95rem", color: "var(--muted)" }}>{result.diseaseDetails.organicTreatment}</span>
                    </div>
                    <div style={{ borderLeft: "4px solid #0284c7", paddingLeft: "12px" }}>
                      <strong style={{ color: "var(--chemical-text)", display: "block", marginBottom: "4px" }}>🧪 Chemical Treatment</strong>
                      <span style={{ fontSize: "0.95rem", color: "var(--muted)" }}>{result.diseaseDetails.chemicalTreatment}</span>
                    </div>
                    <div style={{ borderLeft: "4px solid #ea580c", paddingLeft: "12px" }}>
                      <strong style={{ color: "var(--warning-text)", display: "block", marginBottom: "4px" }}>🛡️ Prevention Tips</strong>
                      <span style={{ fontSize: "0.95rem", color: "var(--muted)" }}>{result.diseaseDetails.preventionTips}</span>
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
