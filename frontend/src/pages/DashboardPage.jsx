import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// ─────────────────────────────────────────────
// MOCK DATA — TODO: replace with API calls
// ─────────────────────────────────────────────
const MOCK_KPIS = [
  { label: "Total Productos", value: 148, delta: "+3 esta semana",   dir: "up",      color: "amber" },
  { label: "Entradas (IN)",   value: 85,  delta: "+12% vs anterior", dir: "up",      color: "green" },
  { label: "Salidas (OUT)",   value: 49,  delta: "-5% vs anterior",  dir: "down",    color: "red"   },
  { label: "Stock crítico",   value: 4,   delta: "Requieren atención", dir: "neutral", color: "blue" },
];

const MOCK_CHART = [
  { label: "L", in: 12, out: 5  },
  { label: "M", in: 8,  out: 14 },
  { label: "X", in: 20, out: 7  },
  { label: "J", in: 5,  out: 9  },
  { label: "V", in: 18, out: 11 },
  { label: "S", in: 7,  out: 3  },
  { label: "D", in: 15, out: 6  },
];

const MOCK_STOCK_LEVELS = [
  { name: "Monitor LG 27\"",  stock: 42, max: 60 },
  { name: "Audífonos Sony",   stock: 25, max: 60 },
  { name: "Hub USB-C",        stock: 18, max: 60 },
  { name: "Teclado Mecánico", stock: 8,  max: 60 },
  { name: "Webcam HD",        stock: 1,  max: 60 },
];

const MOCK_ACTIVITY = [
  { id: 1, product: "Monitor LG 27\"",     type: "IN",  qty: 15, stock: 42, user: "admin",     date: "hoy, 09:14"  },
  { id: 2, product: "Teclado Mecánico",    type: "OUT", qty: 3,  stock: 8,  user: "operador1", date: "hoy, 08:50"  },
  { id: 3, product: "Mouse Logitech",      type: "OUT", qty: 7,  stock: 3,  user: "operador2", date: "ayer, 17:22" },
  { id: 4, product: "Audífonos Sony",      type: "IN",  qty: 20, stock: 25, user: "admin",     date: "ayer, 14:05" },
  { id: 5, product: "Webcam HD 1080p",     type: "OUT", qty: 2,  stock: 1,  user: "operador1", date: "ayer, 11:30" },
  { id: 6, product: "Hub USB-C 7 puertos", type: "IN",  qty: 10, stock: 18, user: "admin",     date: "lun, 16:00"  },
];

const NAV_ITEMS = [
  { label: "Dashboard",   icon: "grid",   path: "/"          },
  { label: "Productos",   icon: "box",    path: "/products"  },
  { label: "Movimientos", icon: "move",   path: "/movements", badge: "3" },
  { label: "Usuarios",    icon: "users",  path: "/users"     },
];

// ─────────────────────────────────────────────
// KPI STYLE MAP
// ─────────────────────────────────────────────
const KPI_STYLES = {
  amber: { icon: "bg-amber-500/10 border-amber-500/20 text-amber-500",   value: "text-amber-500",  hover: "hover:border-amber-500/30"  },
  green: { icon: "bg-emerald-500/10 border-emerald-500/20 text-emerald-500", value: "text-emerald-500", hover: "hover:border-emerald-500/30" },
  red:   { icon: "bg-red-500/10 border-red-500/20 text-red-400",         value: "text-red-400",    hover: "hover:border-red-500/30"    },
  blue:  { icon: "bg-blue-500/10 border-blue-500/20 text-blue-400",      value: "text-blue-400",   hover: "hover:border-blue-500/30"   },
};

// ─────────────────────────────────────────────
// ICONS
// ─────────────────────────────────────────────
function Icon({ name, size = 15 }) {
  const s = { width: size, height: size };
  const props = { ...s, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" };
  const icons = {
    grid:    <svg {...props}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    box:     <svg {...props}><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>,
    move:    <svg {...props}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>,
    users:   <svg {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    bell:    <svg {...props}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    search:  <svg {...props}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    logout:  <svg {...props}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    arrowUp: <svg {...props} strokeWidth="2.5"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>,
    arrowDn: <svg {...props} strokeWidth="2.5"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>,
    warning: <svg {...props}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    trendUp: <svg {...props}><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>,
    trendDn: <svg {...props}><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>,
    chevron: <svg {...props}><polyline points="9 18 15 12 9 6"/></svg>,
  };
  return icons[name] || null;
}

// ─────────────────────────────────────────────
// ANIMATED COUNTER
// ─────────────────────────────────────────────
function Counter({ target, duration = 900 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let current = 0;
    const steps = 40;
    const increment = target / steps;
    const interval = duration / steps;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) { setVal(target); clearInterval(timer); }
      else setVal(Math.floor(current));
    }, interval);
    return () => clearInterval(timer);
  }, [target, duration]);
  return <span>{val}</span>;
}

// ─────────────────────────────────────────────
// LIVE CLOCK
// ─────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="font-mono text-xs text-[#5A5F70] tabular-nums">
      {time.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
    </span>
  );
}

// ─────────────────────────────────────────────
// BAR CHART
// ─────────────────────────────────────────────
function BarChart({ data }) {
  const max = Math.max(...data.flatMap(d => [d.in, d.out]));
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end gap-2 h-44 relative">
        {/* Horizontal grid lines */}
        {[0.25, 0.5, 0.75, 1].map(v => (
          <div key={v} className="absolute left-0 right-0 border-t border-[#1E2128]/60"
            style={{ bottom: `${v * 100}%` }} />
        ))}
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end relative z-10">
            <div className="w-full flex items-end gap-0.5 h-full">
              <div
                className="flex-1 bg-emerald-500 hover:opacity-80 cursor-default transition-opacity duration-150"
                style={{ height: `${(d.in / max) * 100}%` }}
                title={`Entradas: ${d.in}`}
              />
              <div
                className="flex-1 bg-amber-500/70 hover:opacity-80 cursor-default transition-opacity duration-150"
                style={{ height: `${(d.out / max) * 100}%` }}
                title={`Salidas: ${d.out}`}
              />
            </div>
            <span className="text-[10px] text-[#5A5F70] font-mono">{d.label}</span>
          </div>
        ))}
      </div>
      <div className="h-px bg-[#1E2128]" />
      <div className="flex gap-5">
        <div className="flex items-center gap-2 text-xs text-[#5A5F70]">
          <span className="w-3 h-3 bg-emerald-500 inline-block flex-shrink-0" />
          Entradas (IN)
        </div>
        <div className="flex items-center gap-2 text-xs text-[#5A5F70]">
          <span className="w-3 h-3 bg-amber-500/70 inline-block flex-shrink-0" />
          Salidas (OUT)
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// STOCK LEVEL BAR
// ─────────────────────────────────────────────
function StockBar({ item }) {
  const pct   = Math.round((item.stock / item.max) * 100);
  const isLow = pct <= 20;
  const isMid = pct > 20 && pct <= 50;
  const barColor = isLow ? "bg-red-500" : isMid ? "bg-amber-500" : "bg-emerald-500";
  const valColor = isLow ? "text-red-400" : isMid ? "text-amber-500" : "text-emerald-500";
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#C8CAD0] truncate max-w-[160px]">{item.name}</span>
        <div className="flex items-center gap-2">
          <span className={`font-sans font-bold text-sm ${valColor}`}>{item.stock}</span>
          {isLow && (
            <span className="text-[9px] text-red-400 border border-red-500/30 px-1.5 py-0.5 uppercase tracking-wider leading-none">
              bajo
            </span>
          )}
        </div>
      </div>
      <div className="h-1 bg-[#1E2128] overflow-hidden">
        <div className={`h-full ${barColor} transition-all duration-1000 ease-out`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// DASHBOARD PAGE
// ─────────────────────────────────────────────
export default function DashboardPage() {
  const navigate       = useNavigate();
  const { user, logout } = useAuth();
  const [activeNav] = useState("Dashboard");

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : "AD";

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <div className="min-h-screen bg-[#0A0C0F] font-mono flex relative">

      {/* Grid texture */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        backgroundImage: "linear-gradient(rgba(245,158,11,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.025) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }} />

      {/* ─── SIDEBAR ─── */}
      <aside className="w-60 min-h-screen bg-[#111318] border-r border-[#1E2128] flex flex-col fixed top-0 left-0 z-10">

        {/* Brand */}
        <div className="px-6 py-7 border-b border-[#1E2128] flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-500 flex items-center justify-center text-[#0A0C0F] flex-shrink-0"
            style={{ clipPath: "polygon(0 0, 85% 0, 100% 15%, 100% 100%, 15% 100%, 0 85%)" }}>
            <Icon name="box" size={16} />
          </div>
          <span className="font-sans font-extrabold text-base tracking-tight text-white">StockPilot</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 flex flex-col gap-0.5">
          <span className="text-[10px] uppercase tracking-[0.15em] text-[#3A3F4A] px-3 pb-2">Navegación</span>
          {NAV_ITEMS.map(item => (
            <button key={item.label} onClick={() => navigate(item.path)}
              className={`flex items-center gap-3 px-3 py-2.5 text-xs tracking-wide transition-all duration-150 relative text-left w-full border
                ${activeNav === item.label
                  ? "text-amber-500 bg-amber-500/8 border-amber-500/20"
                  : "text-[#5A5F70] hover:text-[#C8CAD0] hover:bg-[#161820] border-transparent"
                }`}
            >
              {activeNav === item.label && (
                <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-amber-500" />
              )}
              <Icon name={item.icon} />
              {item.label}
              {item.badge && (
                <span className="ml-auto bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                  {item.badge}
                </span>
              )}
            </button>
          ))}

          <span className="text-[10px] uppercase tracking-[0.15em] text-[#3A3F4A] px-3 pb-2 pt-5">Sistema</span>
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 text-xs text-[#5A5F70] hover:text-red-400 hover:bg-red-500/5 border border-transparent transition-all duration-150 w-full text-left">
            <Icon name="logout" />
            Cerrar sesión
          </button>
        </nav>

        {/* User pill */}
        <div className="p-3 border-t border-[#1E2128]">
          <div className="flex items-center gap-3 px-3 py-2.5 border border-[#1E2128] hover:border-amber-500/20 transition-colors duration-200 cursor-pointer">
            <div className="w-8 h-8 bg-amber-500 text-[#0A0C0F] font-sans font-extrabold text-xs flex items-center justify-center flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-white font-medium truncate">{user?.username || "Admin"}</div>
              <div className="text-[10px] text-amber-500 uppercase tracking-wider">Administrador</div>
            </div>
            <span className="text-[#5A5F70]"><Icon name="chevron" size={13} /></span>
          </div>
        </div>
      </aside>

      {/* ─── MAIN ─── */}
      <main className="ml-60 flex-1 flex flex-col">

        {/* Topbar */}
        <header className="h-16 border-b border-[#1E2128] flex items-center justify-between px-8 bg-[#0A0C0F]/80 backdrop-blur-sm sticky top-0 z-5">
          <div className="flex flex-col gap-0.5">
            <span className="font-sans font-bold text-sm text-white tracking-tight">Dashboard</span>
            <span className="text-[10px] text-[#3A3F4A] uppercase tracking-wider">StockPilot / Resumen general</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="border border-[#1E2128] px-3 py-1.5">
              <LiveClock />
            </div>
            <button className="w-9 h-9 border border-[#1E2128] bg-[#111318] text-[#5A5F70] hover:text-amber-500 hover:border-amber-500/30 flex items-center justify-center transition-all duration-150">
              <Icon name="search" />
            </button>
            <button className="w-9 h-9 border border-[#1E2128] bg-[#111318] text-[#5A5F70] hover:text-amber-500 hover:border-amber-500/30 flex items-center justify-center transition-all duration-150 relative">
              <Icon name="bell" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-[#0A0C0F]" />
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="p-8 flex flex-col gap-7">

          {/* KPI Grid */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {MOCK_KPIS.map((kpi, i) => {
              const s = KPI_STYLES[kpi.color];
              return (
                <div key={i}
                  className={`bg-[#111318] border border-[#1E2128] ${s.hover} p-6 relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 cursor-default`}>
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-[10px] uppercase tracking-[0.14em] text-[#5A5F70]">{kpi.label}</span>
                    <div className={`w-8 h-8 border flex items-center justify-center flex-shrink-0 ${s.icon}`}>
                      <Icon name={kpi.color === "amber" ? "box" : kpi.color === "green" ? "trendDn" : kpi.color === "red" ? "trendUp" : "warning"} size={14} />
                    </div>
                  </div>
                  <div className={`font-sans font-extrabold text-4xl tracking-tight mb-2 leading-none ${s.value}`}>
                    <Counter target={kpi.value} duration={800 + i * 100} />
                  </div>
                  <div className={`flex items-center gap-1.5 text-[11px]
                    ${kpi.dir === "up" ? "text-emerald-500" : kpi.dir === "down" ? "text-red-400" : "text-[#5A5F70]"}`}>
                    {kpi.dir === "up"   && <Icon name="arrowUp" size={11} />}
                    {kpi.dir === "down" && <Icon name="arrowDn" size={11} />}
                    {kpi.delta}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">

            {/* Bar chart */}
            <div className="bg-[#111318] border border-[#1E2128] p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-sans font-bold text-sm text-white flex items-center gap-2.5">
                  <span className="w-0.5 h-4 bg-amber-500 inline-block flex-shrink-0" />
                  Movimientos — últimos 7 días
                </h2>
                <button className="text-[10px] text-amber-500 uppercase tracking-wider hover:underline underline-offset-2">
                  Ver todo
                </button>
              </div>
              <BarChart data={MOCK_CHART} />
            </div>

            {/* Stock levels */}
            <div className="bg-[#111318] border border-[#1E2128] p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-sans font-bold text-sm text-white flex items-center gap-2.5">
                  <span className="w-0.5 h-4 bg-amber-500 inline-block flex-shrink-0" />
                  Nivel de stock
                </h2>
                <button className="text-[10px] text-amber-500 uppercase tracking-wider hover:underline underline-offset-2">
                  Gestionar
                </button>
              </div>
              <div className="flex flex-col gap-5">
                {MOCK_STOCK_LEVELS.map((item, i) => (
                  <StockBar key={i} item={item} />
                ))}
              </div>
            </div>
          </div>

          {/* Activity Table */}
          <div className="bg-[#111318] border border-[#1E2128]">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#1E2128]">
              <h2 className="font-sans font-bold text-sm text-white flex items-center gap-2.5">
                <span className="w-0.5 h-4 bg-amber-500 inline-block flex-shrink-0" />
                Actividad reciente
              </h2>
              <button className="text-[10px] text-amber-500 uppercase tracking-wider hover:underline underline-offset-2">
                Ver historial
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#1E2128]">
                    {["#", "Producto", "Tipo", "Cantidad", "Stock actual", "Usuario", "Fecha"].map(h => (
                      <th key={h} className="text-left px-6 py-3 text-[10px] uppercase tracking-[0.12em] text-[#3A3F4A] font-normal whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_ACTIVITY.map((row, i) => (
                    <tr key={row.id}
                      className={`border-b border-[#1E2128] last:border-0 hover:bg-[#161820] transition-colors duration-100
                        ${i % 2 !== 0 ? "bg-[#0D0F13]/40" : ""}`}>
                      <td className="px-6 py-4 text-[#3A3F4A] font-mono tabular-nums">{String(row.id).padStart(3, "0")}</td>
                      <td className="px-6 py-4 text-[#C8CAD0] font-medium whitespace-nowrap">{row.product}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold border
                          ${row.type === "IN"
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/25"
                            : "bg-amber-500/10 text-amber-500 border-amber-500/25"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${row.type === "IN" ? "bg-emerald-500" : "bg-amber-500"}`} />
                          {row.type}
                        </span>
                      </td>
                      <td className={`px-6 py-4 font-sans font-bold text-sm tabular-nums ${row.type === "IN" ? "text-emerald-500" : "text-amber-500"}`}>
                        {row.type === "IN" ? "+" : "−"}{row.qty}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2.5 py-1 text-[10px] border font-mono
                          ${row.stock <= 3
                            ? "border-red-500/30 text-red-400 bg-red-500/5"
                            : "border-[#1E2128] text-[#5A5F70]"}`}>
                          {row.stock} uds{row.stock <= 3 ? " ⚠" : ""}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[#5A5F70]">@{row.user}</td>
                      <td className="px-6 py-4 text-[#5A5F70] whitespace-nowrap">{row.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}