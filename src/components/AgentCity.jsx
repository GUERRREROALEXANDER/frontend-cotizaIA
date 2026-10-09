import { motion } from "framer-motion";
import { ArrowUpRight, Bot, FileText, Inbox, Sparkles } from "lucide-react";

const neighborhoods = [
  { id: "inbox", label: "Briefs", icon: Inbox, count: "01", color: "coral" },
  { id: "pipeline", label: "Análisis", icon: Bot, count: "02", color: "lilac" },
  { id: "pricing", label: "Cotización", icon: Sparkles, count: "03", color: "gold" },
  { id: "proposals", label: "Revisión", icon: FileText, count: "04", color: "mint" },
];

function Building({ x, y, width, height, depth = 14, front, side, roof, windows = 3 }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx={width / 2 + depth * 0.75} cy={height + 3} rx={width * 0.68} ry="7" fill="#374151" opacity=".12" />
      <path d={`M0 0H${width}V${height}H0Z`} fill={front} />
      <path d={`M${width} 0L${width + depth} -${depth * 0.58}V${height - depth * 0.58}L${width} ${height}Z`} fill={side} />
      <path d={`M0 0L${depth} -${depth * 0.58}H${width + depth}L${width} 0Z`} fill={roof} />
      <path d={`M6 8H${width - 6}`} stroke="#fff" strokeOpacity=".38" strokeWidth="1" />
      {Array.from({ length: windows }, (_, index) => {
        const windowWidth = Math.min(12, (width - 24) / windows - 4);
        const spacing = (width - 16) / windows;
        const windowX = 8 + spacing * index + (spacing - windowWidth) / 2;
        return (
          <g key={index}>
            <rect x={windowX} y="17" width={windowWidth} height={Math.min(22, Math.max(11, height * 0.34))} rx="2" fill="#f7efe2" opacity=".84" />
            <path d={`M${windowX} 22H${windowX + windowWidth}`} stroke={front} strokeOpacity=".24" />
          </g>
        );
      })}
      {height > 52 && (
        <g fill="#fff" opacity=".58">
          <rect x={width * 0.28} y="51" width="10" height="14" rx="2" />
          <rect x={width * 0.64} y="51" width="10" height="14" rx="2" />
        </g>
      )}
      <path d={`M${width + 4} -${depth * 0.52}V${height - depth * 0.6}`} stroke="#fff" strokeOpacity=".32" />
    </g>
  );
}

function Tree({ x, y, scale = 1, color = "#7eaa78" }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse cx="0" cy="3" rx="13" ry="5" fill="#52635a" opacity=".15" />
      <path d="M0 -5V17" stroke="#896d58" strokeWidth="3" strokeLinecap="round" />
      <circle cx="0" cy="-13" r="11" fill={color} />
      <circle cx="-8" cy="-8" r="7" fill="#92bb87" />
      <circle cx="8" cy="-7" r="7" fill="#6f9c70" />
      <circle cx="2" cy="-20" r="7" fill="#a7c894" />
    </g>
  );
}

export default function AgentCity({ briefCount, activeAgents, reviewCount, onNavigate }) {
  return (
    <section className="agent-city relative overflow-hidden rounded-[26px] border border-[#e7dfd3] shadow-[0_24px_65px_rgba(42,36,29,.08)]">
      <div className="agent-city-grain pointer-events-none absolute inset-0" />
      <div className="relative z-10 flex flex-wrap items-start justify-between gap-4 px-5 pt-5 sm:px-7 sm:pt-6">
        <div>
          <p className="mb-2 text-[9px] font-semibold uppercase tracking-[.22em] text-[#9a8e80]">CotizaIA · Distrito comercial</p>
          <h3 className="text-lg font-semibold tracking-[-.035em] text-[#292923] sm:text-xl">Tu equipo, en modo simulación.</h3>
          <p className="mt-1.5 text-[11px] text-[#817b70]">Cada brief pone en marcha una nueva operación.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-[#c8ddc7] bg-white/70 px-3 py-2 text-[9px] font-medium text-[#55765a] shadow-sm">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#71a57b] opacity-40" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-[#71a57b]" />
          </span>
          Simulación activa
        </div>
      </div>

      <div className="relative mx-2 mt-1 sm:mx-5">
        <svg
          className="agent-city-map block h-auto w-full"
          viewBox="0 0 1120 380"
          role="img"
          aria-labelledby="agent-city-title agent-city-description"
        >
          <title id="agent-city-title">Mapa de operaciones de CotizaIA</title>
          <desc id="agent-city-description">Una ciudad ilustrada muestra las etapas de una cotización como distritos conectados. Los agentes recorren el mapa mientras llegan briefs y propuestas esperan revisión.</desc>
          <defs>
            <linearGradient id="city-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#f6eee4" />
              <stop offset="1" stopColor="#eee6da" />
            </linearGradient>
            <linearGradient id="city-ground" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#e8e5d7" />
              <stop offset="1" stopColor="#dfe5d7" />
            </linearGradient>
            <pattern id="city-grid" width="28" height="28" patternTransform="skewY(-28) scale(.8)" patternUnits="userSpaceOnUse">
              <path d="M28 0H0V28" fill="none" stroke="#7d9279" strokeOpacity=".08" strokeWidth="1" />
            </pattern>
            <filter id="city-shadow" x="-20%" y="-30%" width="150%" height="170%">
              <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#554638" floodOpacity=".12" />
            </filter>
          </defs>

          <rect width="1120" height="380" fill="url(#city-sky)" />
          <circle cx="925" cy="78" r="57" fill="#f5d89a" opacity=".18" />
          <circle cx="925" cy="78" r="38" fill="#f5d89a" opacity=".14" />
          <path d="M0 270L411 48L1120 248L715 380H0Z" fill="url(#city-ground)" />
          <path d="M0 270L411 48L1120 248L715 380H0Z" fill="url(#city-grid)" />

          <g opacity=".75" fill="#fffaf3" stroke="#ded8cc">
            <path d="M40 252L133 201L241 231L146 284Z" />
            <path d="M267 224L348 180L440 206L359 251Z" />
            <path d="M722 184L809 137L910 165L824 213Z" />
            <path d="M873 226L955 181L1054 210L972 257Z" />
            <path d="M420 323L506 276L598 302L512 350Z" />
            <path d="M676 304L761 258L857 284L772 332Z" />
          </g>

          <g fill="none" stroke="#fdfaf4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M-24 285C157 245 239 151 405 134S741 168 1149 246" strokeWidth="31" />
            <path d="M162 388C300 290 448 215 564 132S801 78 926 39" strokeWidth="25" />
            <path d="M452 402C551 300 702 220 840 198S1025 220 1145 282" strokeWidth="24" />
            <path d="M-24 285C157 245 239 151 405 134S741 168 1149 246" stroke="#d4cbbd" strokeWidth="1.5" />
            <path d="M162 388C300 290 448 215 564 132S801 78 926 39" stroke="#d4cbbd" strokeWidth="1.5" />
            <path d="M452 402C551 300 702 220 840 198S1025 220 1145 282" stroke="#d4cbbd" strokeWidth="1.5" />
          </g>
          <g fill="none" stroke="#cfb98f" strokeDasharray="4 10" strokeLinecap="round" opacity=".66">
            <path d="M-24 285C157 245 239 151 405 134S741 168 1149 246" strokeWidth="2" />
            <path d="M162 388C300 290 448 215 564 132S801 78 926 39" strokeWidth="2" />
            <path d="M452 402C551 300 702 220 840 198S1025 220 1145 282" strokeWidth="2" />
          </g>

          <g filter="url(#city-shadow)">
            <Building x={103} y={228} width={71} height={59} depth={16} front="#dca18b" side="#bc786d" roof="#e9c0a7" />
            <Building x={190} y={203} width={65} height={81} depth={17} front="#8195af" side="#627795" roof="#a5b5c4" />
            <Building x={289} y={189} width={76} height={62} depth={16} front="#d4b46f" side="#b5945a" roof="#ebd39e" />
            <Building x={373} y={153} width={73} height={83} depth={16} front="#ab858f" side="#896778" roof="#c9a4a0" />
            <Building x={481} y={128} width={88} height={126} depth={18} front="#8e9db5" side="#637a99" roof="#b4c4cf" windows={4} />
            <Building x={589} y={113} width={78} height={97} depth={18} front="#d8a373" side="#b78061" roof="#ecc7a0" windows={3} />
            <Building x={711} y={136} width={94} height={95} depth={18} front="#7b99a0" side="#5c7a80" roof="#a9c4b8" windows={4} />
            <Building x={853} y={174} width={73} height={70} depth={16} front="#c39078" side="#9e6d63" roof="#e0b295" />
            <Building x={954} y={207} width={87} height={70} depth={17} front="#899a86" side="#687e70" roof="#b5c2a7" windows={4} />
            <Building x={260} y={274} width={85} height={72} depth={14} front="#d38b73" side="#ad6b61" roof="#e7b19a" />
            <Building x={383} y={255} width={70} height={55} depth={14} front="#889aa4" side="#677d8e" roof="#b3c0bc" />
            <Building x={550} y={260} width={89} height={77} depth={15} front="#c8a16d" side="#9e805e" roof="#e3c38f" windows={4} />
            <Building x={704} y={237} width={70} height={67} depth={15} front="#bc8583" side="#956978" roof="#d9aaa0" />
            <Building x={825} y={253} width={76} height={81} depth={15} front="#8493aa" side="#65768c" roof="#b4b9c0" />
          </g>

          <g>
            <Tree x={70} y={267} scale={.78} />
            <Tree x={273} y={226} scale={.7} color="#76a579" />
            <Tree x={463} y={190} scale={.72} color="#91ae79" />
            <Tree x={685} y={167} scale={.7} />
            <Tree x={806} y={210} scale={.78} color="#8dae79" />
            <Tree x={1038} y={242} scale={.78} />
            <Tree x={365} y={306} scale={.8} color="#9dbb86" />
            <Tree x={667} y={282} scale={.76} />
            <Tree x={925} y={300} scale={.8} color="#98b57f" />
          </g>

          <g fill="#f4efdf" stroke="#c8bda9" strokeWidth="1.2">
            <path d="M450 207L485 188L524 200L489 219Z" />
            <path d="M764 238L794 221L829 232L798 250Z" />
            <path d="M190 297L222 280L254 291L222 310Z" />
          </g>
          <g fill="#c9b58f">
            <path d="M480 205L489 199L499 202L490 208Z" />
            <path d="M794 239L802 234L810 236L802 242Z" />
            <path d="M220 301L228 296L236 299L228 304Z" />
          </g>

          <g fill="none" strokeLinecap="round">
            <path d="M166 254C294 189 389 149 502 164S714 202 832 191S991 215 1050 241" stroke="#ec8e70" strokeOpacity=".6" strokeWidth="2" strokeDasharray="3 8" />
            <path d="M228 323C340 270 428 227 541 207S744 130 858 120" stroke="#8e83c7" strokeOpacity=".55" strokeWidth="2" strokeDasharray="3 8" />
            <path d="M378 201C504 169 592 161 686 187S862 242 948 261" stroke="#d4a84d" strokeOpacity=".54" strokeWidth="2" strokeDasharray="3 8" />
          </g>
          <g>
            <circle r="5" fill="#ec846c">
              <animateMotion dur="12s" repeatCount="indefinite" path="M166 254C294 189 389 149 502 164S714 202 832 191S991 215 1050 241" />
            </circle>
            <circle r="4.5" fill="#8c7ed1">
              <animateMotion dur="15s" begin="-6s" repeatCount="indefinite" path="M228 323C340 270 428 227 541 207S744 130 858 120" />
            </circle>
            <circle r="4" fill="#d3a342">
              <animateMotion dur="14s" begin="-3s" repeatCount="indefinite" path="M378 201C504 169 592 161 686 187S862 242 948 261" />
            </circle>
          </g>

          <motion.g animate={{ y: [0, -3, 0] }} transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}>
            <g transform="translate(177 164)">
              <rect width="127" height="31" rx="15.5" fill="#fffdf8" stroke="#e4ddd1" />
              <circle cx="16" cy="15.5" r="4" fill="#ec896e" />
              <text x="28" y="19.5" fill="#70685e" fontFamily="Inter, sans-serif" fontSize="10" fontWeight="600">Briefs entrantes</text>
            </g>
          </motion.g>
          <motion.g animate={{ y: [0, -3, 0] }} transition={{ duration: 3.6, delay: 0.5, repeat: Infinity, ease: "easeInOut" }}>
            <g transform="translate(696 75)">
              <rect width="137" height="31" rx="15.5" fill="#fffdf8" stroke="#e4ddd1" />
              <circle cx="16" cy="15.5" r="4" fill="#8b80c9" />
              <text x="28" y="19.5" fill="#70685e" fontFamily="Inter, sans-serif" fontSize="10" fontWeight="600">Agente trabajando</text>
            </g>
          </motion.g>

          <motion.g animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }} style={{ transformOrigin: "973px 154px" }}>
            <circle cx="973" cy="154" r="18" fill="#e5a94c" fillOpacity=".12" />
            <circle cx="973" cy="154" r="8" fill="#e5a94c" stroke="#fff8e6" strokeWidth="3" />
          </motion.g>
        </svg>
      </div>

      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 px-5 pb-5 pt-1 sm:px-7 sm:pb-6">
        <div className="flex flex-wrap items-center gap-2">
          {neighborhoods.map(({ id, label, icon: Icon, count, color }) => {
            const accents = {
              coral: "bg-[#f8e6df] text-[#b76c58]",
              lilac: "bg-[#ece9f8] text-[#7770ac]",
              gold: "bg-[#f6efd9] text-[#a98539]",
              mint: "bg-[#e5eee3] text-[#64876b]",
            };
            return (
              <button
                key={id}
                type="button"
                onClick={() => onNavigate(id)}
                className="group inline-flex items-center gap-2 rounded-full border border-[#e8e0d5] bg-white/75 py-1.5 pl-1.5 pr-3 text-[9px] font-medium text-[#756d63] shadow-sm transition hover:-translate-y-0.5 hover:border-[#c8bcae] hover:bg-white"
              >
                <span className={`grid h-6 w-6 place-items-center rounded-full ${accents[color]}`}><Icon size={12} /></span>
                {label}
                <span className="font-mono text-[8px] text-[#aaa092]">{count}</span>
                <ArrowUpRight size={10} className="text-[#b7ad9f] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#776e62]" />
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-4 text-[9px] text-[#948a7e]">
          <span><strong className="font-mono font-medium text-[#625b52]">{briefCount}</strong> briefs</span>
          <span><strong className="font-mono font-medium text-[#625b52]">{activeAgents}</strong> en proceso</span>
          <span><strong className="font-mono font-medium text-[#625b52]">{reviewCount}</strong> por revisar</span>
        </div>
      </div>
    </section>
  );
}
