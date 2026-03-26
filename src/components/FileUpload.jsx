import { useState } from "react";

const SBTN = { background: "#0c1526", color: "#fff", border: "none", borderRadius: 10, padding: "12px 0", width: "100%", fontSize: 14, fontWeight: 700, cursor: "pointer" };
const INP = { width: "100%", boxSizing: "border-box", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 10px", fontSize: 13, color: "#0f172a", outline: "none", fontFamily: "'DM Sans',sans-serif", background: "#fff" };
const Lbl = ({ c }) => <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 4 }}>{c}</div>;

export default function FileUpload({ files, onUpload, patientName }) {
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState("other");

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("File too large. Max 5MB.");
      return;
    }
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result.split(",")[1];
        await onUpload({
          file_name: file.name,
          file_data: base64,
          file_type: file.type,
          category,
        });
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setUploading(false);
    }
  };

  return (
    <div style={{ background: "#fff", borderRadius: 11, padding: "11px 13px", marginBottom: 8, border: "1px solid #f1f5f9" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9 }}>
        <span style={{ fontWeight: 700, fontSize: 11, color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.5px" }}>Documents</span>
        <span style={{ fontSize: 11, color: "#94a3b8" }}>{(files || []).length} files</span>
      </div>

      {/* Upload section */}
      <div style={{ background: "#f8fafc", borderRadius: 10, padding: 12, border: "1px dashed #cbd5e1", marginBottom: 10, textAlign: "center" }}>
        <div style={{ marginBottom: 8 }}>
          <Lbl c="File Type" />
          <div style={{ display: "flex", gap: 5, justifyContent: "center" }}>
            {[["ecg", "ECG"], ["xray", "X-Ray"], ["lab_report", "Lab"], ["other", "Other"]].map(([k, l]) => (
              <button
                key={k}
                onClick={() => setCategory(k)}
                style={{
                  fontSize: 11, padding: "4px 10px", borderRadius: 6, cursor: "pointer",
                  background: category === k ? "#0f172a" : "#fff",
                  color: category === k ? "#fff" : "#64748b",
                  border: category === k ? "none" : "1px solid #e2e8f0",
                  fontWeight: 600,
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        <label style={{ ...SBTN, display: "block", opacity: uploading ? 0.5 : 1, cursor: uploading ? "wait" : "pointer", borderRadius: 8, padding: "10px 0" }}>
          {uploading ? "Uploading..." : "Upload File"}
          <input type="file" accept="image/*,.pdf" onChange={handleFile} disabled={uploading} style={{ display: "none" }} />
        </label>
        <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>Max 5MB. Images or PDF.</div>
      </div>

      {/* File gallery */}
      {(files || []).length === 0 ? (
        <div style={{ color: "#cbd5e1", fontSize: 13, textAlign: "center" }}>No documents uploaded.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {(files || []).map(f => (
            <div key={f.id} style={{ borderRadius: 8, border: "1px solid #e2e8f0", overflow: "hidden" }}>
              {f.file_url && (f.file_name?.endsWith(".pdf") ? (
                <div style={{ height: 80, background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>PDF</div>
              ) : (
                <img src={f.file_url} alt={f.file_name} style={{ width: "100%", height: 80, objectFit: "cover" }} />
              ))}
              <div style={{ padding: "5px 7px" }}>
                <div style={{ fontSize: 10, color: "#0f172a", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.file_name}</div>
                <div style={{ fontSize: 9, color: "#94a3b8", textTransform: "uppercase" }}>{f.file_type}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
