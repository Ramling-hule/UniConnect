"use client";
import React, { useState, useRef, useCallback } from "react";
import {
  X, Image as ImageIcon, Video, FileText, File,
  Loader, UploadCloud, AlertCircle
} from "lucide-react";
import { useSelector } from "react-redux";
import { API_BASE_URL } from "@/utils/config";
import { postSchema, getZodError } from "@/utils/schemas";

/* ─── Per-type config ─────────────────────────────────── */
const MEDIA_CONFIG = {
  image: {
    accept:     "image/jpeg,image/jpg,image/png,image/gif,image/webp",
    maxBytes:   10 * 1024 * 1024,
    label:      "Photo",
    icon:       ImageIcon,
    color:      "#4F8EF7",
    bgColor:    "rgba(79,142,247,0.1)",
  },
  video: {
    accept:     "video/mp4,video/webm,video/quicktime",
    maxBytes:   100 * 1024 * 1024,
    label:      "Video",
    icon:       Video,
    color:      "#22C55E",
    bgColor:    "rgba(34,197,94,0.1)",
  },
  pdf: {
    accept:     "application/pdf",
    maxBytes:   25 * 1024 * 1024,
    label:      "PDF",
    icon:       FileText,
    color:      "#F97316",
    bgColor:    "rgba(249,115,22,0.1)",
  },
  text: {
    accept:     "text/plain,text/markdown",
    maxBytes:   1 * 1024 * 1024,
    label:      "Text File",
    icon:       File,
    color:      "#A78BFA",
    bgColor:    "rgba(167,139,250,0.1)",
  },
};

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ─── Preview component ───────────────────────────────── */
function MediaPreview({ file, onRemove, isDark }) {
  const objectUrl = React.useMemo(() => URL.createObjectURL(file), [file]);
  const [textContent, setTextContent] = React.useState(null);

  React.useEffect(() => {
    if (file.type.startsWith("text/")) {
      const reader = new FileReader();
      reader.onload = (e) => setTextContent(e.target.result);
      reader.readAsText(file);
    }
    return () => URL.revokeObjectURL(objectUrl);
  }, [file, objectUrl]);

  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");
  const isPDF   = file.type === "application/pdf";
  const isText  = file.type.startsWith("text/");

  return (
    <div
      className="relative rounded-xl overflow-hidden mb-3"
      style={{
        border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
        background: isDark ? "#0D1526" : "#F8FAFF",
      }}
    >
      {/* Remove button */}
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full flex items-center justify-center text-white transition-all hover:scale-110"
        style={{ background: "rgba(0,0,0,0.6)" }}
      >
        <X size={14} />
      </button>

      {isImage && (
        <img
          src={objectUrl}
          alt="Preview"
          className="w-full max-h-64 object-contain"
        />
      )}

      {isVideo && (
        <video
          src={objectUrl}
          controls
          className="w-full max-h-64"
          preload="metadata"
        />
      )}

      {isPDF && (
        <div className="flex items-center gap-3 p-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(249,115,22,0.15)" }}
          >
            <FileText size={24} style={{ color: "#F97316" }} />
          </div>
          <div className="overflow-hidden">
            <p className="font-semibold text-sm truncate" style={{ color: isDark ? "#E8EFF8" : "#0F172A" }}>
              {file.name}
            </p>
            <p className="text-xs mt-0.5" style={{ color: isDark ? "#6B7FA3" : "#64748B" }}>
              PDF · {formatBytes(file.size)}
            </p>
          </div>
        </div>
      )}

      {isText && (
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <File size={16} style={{ color: "#A78BFA" }} />
            <span className="text-xs font-semibold truncate" style={{ color: isDark ? "#E8EFF8" : "#0F172A" }}>
              {file.name} · {formatBytes(file.size)}
            </span>
          </div>
          <pre
            className="text-xs rounded-lg p-3 overflow-auto max-h-32 font-mono whitespace-pre-wrap"
            style={{
              background: isDark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.04)",
              color: isDark ? "#B0BFDA" : "#334155",
            }}
          >
            {textContent?.slice(0, 500) || "Loading…"}
            {textContent?.length > 500 ? "\n… (truncated)" : ""}
          </pre>
        </div>
      )}
    </div>
  );
}

/* ─── Main component ──────────────────────────────────── */
export default function CreatePostModal({ isOpen, onClose, onPostCreated }) {
  const { isDark } = useSelector((state) => state.theme);
  const { user }   = useSelector((state) => state.auth);

  const [text,       setText]       = useState("");
  const [mediaFile,  setMediaFile]  = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [uploadPct,  setUploadPct]  = useState(0);
  const [error,      setError]      = useState("");

  const fileInputRefs = {
    image: useRef(null),
    video: useRef(null),
    pdf:   useRef(null),
    text:  useRef(null),
  };

  if (!isOpen) return null;

  /* ─── Colour tokens ─── */
  const surface     = isDark ? "#0D1526"  : "#FFFFFF";
  const border      = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textPrimary = isDark ? "#E8EFF8"  : "#0F172A";
  const textSecondary = isDark ? "#6B7FA3" : "#64748B";
  const inputBg     = isDark ? "#060B18"  : "#F8FAFF";

  /* ─── File picker ─── */
  const handleFileChange = (type, e) => {
    setError("");
    const file = e.target.files?.[0];
    if (!file) return;

    const config = MEDIA_CONFIG[type];
    if (file.size > config.maxBytes) {
      setError(`File too large. Max size for ${config.label} is ${formatBytes(config.maxBytes)}.`);
      e.target.value = "";
      return;
    }
    setMediaFile(file);
    // Reset the input so the same file can be re-selected after removal
    e.target.value = "";
  };

  /* ─── Submit ─── */
  const handlePostSubmit = async (e) => {
    e?.preventDefault();
    setError("");

    if (!text.trim() && !mediaFile) {
      setError("Add some text or attach a file.");
      return;
    }

    if (text.trim()) {
      try {
        postSchema.parse({ content: text });
      } catch (err) {
        setError(getZodError(err));
        return;
      }
    }

    setLoading(true);
    setUploadPct(0);

    try {
      const currentUserId = user?.id || user?._id;
      const formData = new FormData();
      formData.append("userId", currentUserId);
      formData.append("text", text);
      if (mediaFile) formData.append("file", mediaFile);

      // Use XMLHttpRequest for upload progress tracking
      const newPost = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${API_BASE_URL}/api/dashboard/posts`);

        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            setUploadPct(Math.round((ev.loaded / ev.total) * 100));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            let msg = "Post failed. Please try again.";
            try { msg = JSON.parse(xhr.responseText).message || msg; } catch {}
            reject(new Error(msg));
          }
        };
        xhr.onerror = () => reject(new Error("Network error. Please check your connection."));
        xhr.send(formData);
      });

      onPostCreated(newPost);
      onClose();
      setText("");
      setMediaFile(null);
      setUploadPct(0);

    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: surface, border: `1px solid ${border}` }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: `1px solid ${border}` }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm"
              style={{ background: "linear-gradient(135deg, #4F8EF7, #818CF8)" }}
            >
              {user?.name?.[0] || "U"}
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: textPrimary }}>{user?.name}</p>
              <p className="text-xs" style={{ color: textSecondary }}>Post to everyone</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl transition-all hover:scale-110"
            style={{ color: textSecondary }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          <textarea
            placeholder="What do you want to share?"
            className="w-full h-28 resize-none outline-none text-sm leading-relaxed"
            style={{
              background: "transparent",
              color: textPrimary,
              caretColor: "#4F8EF7",
            }}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          {/* Media preview */}
          {mediaFile && (
            <MediaPreview
              file={mediaFile}
              onRemove={() => setMediaFile(null)}
              isDark={isDark}
            />
          )}

          {/* Error */}
          {error && (
            <div
              className="flex items-start gap-2 p-3 rounded-xl text-sm mb-3"
              style={{ background: "rgba(248,113,113,0.1)", color: "#F87171", border: "1px solid rgba(248,113,113,0.2)" }}
            >
              <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* Upload progress */}
          {loading && uploadPct > 0 && uploadPct < 100 && (
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1" style={{ color: textSecondary }}>
                <span>Uploading…</span>
                <span>{uploadPct}%</span>
              </div>
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-200"
                  style={{
                    width: `${uploadPct}%`,
                    background: "linear-gradient(90deg, #4F8EF7, #818CF8)",
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-5 py-4 flex items-center justify-between"
          style={{ borderTop: `1px solid ${border}` }}
        >
          {/* Attachment buttons */}
          <div className="flex items-center gap-1">
            {Object.entries(MEDIA_CONFIG).map(([type, config]) => {
              const Icon = config.icon;
              return (
                <label
                  key={type}
                  className={`cursor-pointer flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105 ${mediaFile ? "opacity-30 pointer-events-none" : ""}`}
                  style={{
                    color:   config.color,
                    background: config.bgColor,
                  }}
                  title={`Attach ${config.label}`}
                >
                  <Icon size={15} />
                  <span className="hidden sm:inline">{config.label}</span>
                  <input
                    ref={fileInputRefs[type]}
                    type="file"
                    accept={config.accept}
                    hidden
                    onChange={(e) => handleFileChange(type, e)}
                    disabled={loading}
                  />
                </label>
              );
            })}
          </div>

          {/* Post button */}
          <button
            onClick={handlePostSubmit}
            disabled={loading || (!text.trim() && !mediaFile)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{
              background: "linear-gradient(135deg, #4F8EF7, #818CF8)",
              boxShadow: "0 4px 14px rgba(79,142,247,0.3)",
            }}
          >
            {loading ? (
              <>
                <Loader size={15} className="animate-spin" />
                {uploadPct > 0 ? `${uploadPct}%` : "Posting…"}
              </>
            ) : (
              <>
                <UploadCloud size={15} />
                Post
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
