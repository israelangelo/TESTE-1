export const T = {
  // Cores base
  bg:         "#032774",
  card:       "#021d5a",
  border:     "#0a3572",
  orange:     "#E06820",
  text:       "#ffffff",
  muted:      "#aab4cc",
  green:      "#4caf50",
  red:        "#f44336",
  yellow:     "#f9a825",

  // Glassmorphism
  glass:      "rgba(255,255,255,0.07)",
  glassBorder:"rgba(255,255,255,0.12)",
  glassDark:  "rgba(2,29,90,0.85)",

  // Sombras iOS
  shadow:     "0 8px 32px rgba(0,0,0,0.35)",
  shadowSm:   "0 2px 12px rgba(0,0,0,0.25)",
  shadowOrange:"0 4px 20px rgba(224,104,32,0.4)",

  // Border radius
  r8:  "8px",
  r12: "12px",
  r16: "16px",
  r20: "20px",
  r24: "24px",
  pill:"999px",

  // Tipografia
  fontTitle: "'Barlow Condensed', sans-serif",
  fontBody:  "'Barlow', sans-serif",

  // Transições spring
  spring:    "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
  smooth:    "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
  fast:      "all 0.15s ease",
};

// Estilos prontos reutilizáveis
export const S = {
  card: {
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "16px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
  },
  cardDark: {
    background: "rgba(2,29,90,0.85)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: "16px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
  },
  btnOrange: {
    background: "#E06820",
    border: "none",
    borderRadius: "14px",
    color: "#fff",
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: "18px",
    fontWeight: 700,
    letterSpacing: "0.5px",
    cursor: "pointer",
    boxShadow: "0 4px 20px rgba(224,104,32,0.4)",
    transition: "all 0.15s ease",
  },
  btnGhost: {
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "12px",
    color: "#ffffff",
    fontFamily: "'Barlow', sans-serif",
    fontSize: "15px",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  grabber: {
    width: "36px",
    height: "4px",
    background: "rgba(255,255,255,0.25)",
    borderRadius: "999px",
    margin: "0 auto 16px",
  },
  input: {
    width: "100%",
    padding: "16px",
    borderRadius: "14px",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.15)",
    color: "#ffffff",
    fontFamily: "'Barlow', sans-serif",
    fontSize: "16px",
    boxSizing: "border-box",
    outline: "none",
    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
  },
};