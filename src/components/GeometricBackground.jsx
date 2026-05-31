// Fundo geométrico ESTÁTICO — sem animações, leve, roda bem em celular
export default function GeometricBackground() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
      {/* Gradiente base */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse 120% 80% at 20% -10%, #1A3A8F 0%, #010e2e 60%)",
      }} />

      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        viewBox="0 0 390 844"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="gbg1" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2563EB" stopOpacity="0.30" />
            <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="gbg2" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FF6B00" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#FF6B00" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="gbg3" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Glow spots — estáticos */}
        <ellipse cx="320" cy="120" rx="200" ry="200" fill="url(#gbg1)" />
        <ellipse cx="50" cy="700" rx="180" ry="180" fill="url(#gbg2)" />
        <ellipse cx="195" cy="400" rx="220" ry="220" fill="url(#gbg3)" />

        {/* Hexágono grande — canto superior direito */}
        <polygon points="340,10 390,40 390,100 340,130 290,100 290,40"
          fill="none" stroke="rgba(59,130,246,0.18)" strokeWidth="1.5" />

        {/* Hexágono médio — esquerda meio */}
        <polygon points="30,380 65,360 100,380 100,420 65,440 30,420"
          fill="none" stroke="rgba(255,107,0,0.14)" strokeWidth="1.2" />

        {/* Triângulo — fundo esquerda */}
        <polygon points="0,780 80,650 160,780"
          fill="none" stroke="rgba(59,130,246,0.10)" strokeWidth="1" />

        {/* Losango — direita centro */}
        <polygon points="370,350 395,400 370,450 345,400"
          fill="none" stroke="rgba(255,181,71,0.18)" strokeWidth="1.2" />

        {/* Hexágono pequeno extra — fundo direita */}
        <polygon points="350,700 375,686 400,700 400,728 375,742 350,728"
          fill="none" stroke="rgba(59,130,246,0.12)" strokeWidth="1" />

        {/* Linhas diagonais sutis */}
        <line x1="-20" y1="200" x2="200" y2="-20"
          stroke="rgba(59,130,246,0.07)" strokeWidth="1" />
        <line x1="200" y1="900" x2="420" y2="680"
          stroke="rgba(59,130,246,0.07)" strokeWidth="1" />
        <line x1="300" y1="0" x2="600" y2="300"
          stroke="rgba(255,107,0,0.05)" strokeWidth="1" />

        {/* Círculos concêntricos — canto inferior direito, estáticos */}
        <circle cx="390" cy="800" r="85" fill="none"
          stroke="rgba(59,130,246,0.09)" strokeWidth="1" />
        <circle cx="390" cy="800" r="55" fill="none"
          stroke="rgba(59,130,246,0.13)" strokeWidth="1" />

        {/* Pontinhos estáticos */}
        {[
          [60, 150, 0.15], [130, 90, 0.12], [280, 200, 0.18], [350, 280, 0.10],
          [100, 500, 0.13], [310, 600, 0.15], [40, 700, 0.10], [200, 750, 0.12],
          [170, 300, 0.08], [280, 480, 0.10],
        ].map(([x, y, o], i) => (
          <circle key={i} cx={x} cy={y} r="2" fill={`rgba(255,255,255,${o})`} />
        ))}
      </svg>

      {/* Noise overlay leve */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`,
        opacity: 0.35,
      }} />
    </div>
  );
}
