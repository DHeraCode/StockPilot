import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getProducts } from "../api/products";
import { getMovements } from "../api/stockMovements";

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const isIN = (type) => type === "entrada";

// Get last 7 days labels and dates
function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      label: d.toLocaleDateString("es-ES", { weekday: "short" }).slice(0, 1).toUpperCase(),
      date:  d.toISOString().split("T")[0],
    });
  }
  return days;
}

// ─────────────────────────────────────────────
// ICONS
// ─────────────────────────────────────────────
function Icon({ name, size = 15 }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" };
  const icons = {
    box:      <svg {...p}><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>,
    grid:     <svg {...p}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    move:     <svg {...p}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>,
    users:    <svg {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    logout:   <svg {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    bell:     <svg {...p}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    search:   <svg {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    chevron:  <svg {...p}><polyline points="9 18 15 12 9 6"/></svg>,
    arrowUp:  <svg {...p} strokeWidth="2.5"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>,
    arrowDn:  <svg {...p} strokeWidth="2.5"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>,
    warning:  <svg {...p}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    trendUp:  <svg {...p}><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>,
    trendDn:  <svg {...p}><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>,
    refresh:  <svg {...p}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  };
  return icons[name] || null;
}

// ─────────────────────────────────────────────
// NAV
// ─────────────────────────────────────────────
const NAV_ITEMS = [
  { label: "Dashboard",   icon: "grid",  path: "/"          },
  { label: "Productos",   icon: "box",   path: "/products"  },
  { label: "Movimientos", icon: "move",  path: "/movements" },
  { label: "Usuarios",    icon: "users", path: "/users"     },
];

// ─────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────
function Sidebar({ onNavigate, user, onLogout }) {
  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : "AD";
  return (
    <aside className="w-60 min-h-screen bg-[#111318] border-r border-[#1E2128] flex flex-col fixed top-0 left-0 z-10">
      <div className="px-6 py-7 border-b border-[#1E2128] flex items-center gap-3">
        <div className="w-9 h-9 bg-amber-500 flex items-center justify-center text-[#0A0C0F] flex-shrink-0"
          style={{ clipPath: "polygon(0 0, 85% 0, 100% 15%, 100% 100%, 15% 100%, 0 85%)" }}>
          <Icon name="box" size={16} />
        </div>
        <span className="font-sans font-extrabold text-base tracking-tight text-white">StockPilot</span>
      </div>
      <nav className="flex-1 px-3 py-5 flex flex-col gap-0.5">
        <span className="text-[10px] uppercase tracking-[0.15em] text-[#3A3F4A] px-3 pb-2">Navegación</span>
        {NAV_ITEMS.map(item => (
          <button key={item.label} onClick={() => onNavigate(item.path)}
            className={`flex items-center gap-3 px-3 py-2.5 text-xs tracking-wide transition-all duration-150 relative text-left w-full border
              ${item.label === "Dashboard"
                ? "text-amber-500 bg-amber-500/8 border-amber-500/20"
                : "text-[#5A5F70] hover:text-[#C8CAD0] hover:bg-[#161820] border-transparent"}`}>
            {item.label === "Dashboard" && <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-amber-500" />}
            <Icon name={item.icon} />
            {item.label}
          </button>
        ))}
        <span className="text-[10px] uppercase tracking-[0.15em] text-[#3A3F4A] px-3 pb-2 pt-5">Sistema</span>
        <button onClick={onLogout}
          className="flex items-center gap-3 px-3 py-2.5 text-xs text-[#5A5F70] hover:text-red-400 hover:bg-red-500/5 border border-transparent transition-all duration-150 w-full text-left">
          <Icon name="logout" />
          Cerrar sesión
        </button>
      </nav>
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
  );
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
// KPI SKELETON
// ─────────────────────────────────────────────
function KpiSkeleton() {
  return (
    <div className="bg-[#111318] border border-[#1E2128] p-6 animate-pulse">
      <div className="flex items-center justify-between mb-5">
        <div className="h-2 bg-[#1E2128] rounded w-24" />
        <div className="w-8 h-8 bg-[#1E2128]" />
      </div>
      <div className="h-10 bg-[#1E2128] rounded w-16 mb-2" />
      <div className="h-2 bg-[#1E2128] rounded w-28" />
    </div>
  );
}

// ─────────────────────────────────────────────
// BAR CHART
// ─────────────────────────────────────────────
function BarChart({ data }) {
  const max = Math.max(...data.flatMap(d => [d.in, d.out]), 1);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end gap-2 h-44 relative">
        {[0.25, 0.5, 0.75, 1].map(v => (
          <div key={v} className="absolute left-0 right-0 border-t border-[#1E2128]/60"
            style={{ bottom: `${v * 100}%` }} />
        ))}
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end relative z-10">
            <div className="w-full flex items-end gap-0.5 h-full">
              <div
                className="flex-1 bg-emerald-500 hover:opacity-80 cursor-default transition-opacity duration-150"
                style={{ height: `${(d.in / max) * 100}%`, minHeight: d.in > 0 ? "4px" : "0" }}
                title={`Entradas: ${d.in}`}
              />
              <div
                className="flex-1 bg-amber-500/70 hover:opacity-80 cursor-default transition-opacity duration-150"
                style={{ height: `${(d.out / max) * 100}%`, minHeight: d.out > 0 ? "4px" : "0" }}
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
          <span className="w-3 h-3 bg-emerald-500 inline-block flex-shrink-0" />Entradas (IN)
        </div>
        <div className="flex items-center gap-2 text-xs text-[#5A5F70]">
          <span className="w-3 h-3 bg-amber-500/70 inline-block flex-shrink-0" />Salidas (OUT)
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// STOCK LEVEL BAR
// ─────────────────────────────────────────────
function StockBar({ item, max }) {
  const pct    = max > 0 ? Math.round((item.quantity / max) * 100) : 0;
  const isLow  = item.quantity <= 5;
  const isMid  = item.quantity > 5 && item.quantity <= 15;
  const color  = isLow ? "bg-red-500" : isMid ? "bg-amber-500" : "bg-emerald-500";
  const txtColor = isLow ? "text-red-400" : isMid ? "text-amber-500" : "text-emerald-500";
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#C8CAD0] truncate max-w-[160px]">{item.name}</span>
        <div className="flex items-center gap-2">
          <span className={`font-sans font-bold text-sm ${txtColor}`}>{item.quantity}</span>
          {isLow && (
            <span className="text-[9px] text-red-400 border border-red-500/30 px-1.5 py-0.5 uppercase tracking-wider leading-none">
              bajo
            </span>
          )}
        </div>
      </div>
      <div className="h-1 bg-[#1E2128] overflow-hidden">
        <div className={`h-full ${color} transition-all duration-1000 ease-out`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// KPI CONFIG
// ─────────────────────────────────────────────
const KPI_STYLES = {
  amber: { icon: "bg-amber-500/10 border-amber-500/20 text-amber-500",    value: "text-amber-500",   hover: "hover:border-amber-500/30"   },
  green: { icon: "bg-emerald-500/10 border-emerald-500/20 text-emerald-500", value: "text-emerald-500", hover: "hover:border-emerald-500/30" },
  red:   { icon: "bg-red-500/10 border-red-500/20 text-red-400",          value: "text-red-400",     hover: "hover:border-red-500/30"     },
  blue:  { icon: "bg-blue-500/10 border-blue-500/20 text-blue-400",       value: "text-blue-400",    hover: "hover:border-blue-500/30"    },
};

// ─────────────────────────────────────────────
// DASHBOARD PAGE
// ─────────────────────────────────────────────
export default function DashboardPage() {
  const navigate         = useNavigate();
  const { user, logout } = useAuth();

  const [products,  setProducts]  = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [prods, movs] = await Promise.all([
          getProducts(),
          getMovements(),
        ]);
        setProducts(Array.isArray(prods) ? prods : []);
        setMovements(Array.isArray(movs) ? movs : []);
      } catch (err) {
        setError(err.response?.data?.detail || "Error al cargar el dashboard");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleLogout = () => { logout(); navigate("/login"); };

  // ── KPI calculations ──
  const totalProducts = products.length;
  const lowStock      = products.filter(p => (p.quantity ?? 0) <= 5).length;

  // Movements from last 7 days
  const last7Dates = getLast7Days().map(d => d.date);
  const recentMovs = movements.filter(m => {
    const d = m.created_at?.split("T")[0];
    return last7Dates.includes(d);
  });
  const totalIN  = recentMovs.filter(m => isIN(m.movement_type)).reduce((a, m) => a + m.quantity, 0);
  const totalOUT = recentMovs.filter(m => !isIN(m.movement_type)).reduce((a, m) => a + m.quantity, 0);

  // ── KPI data ──
  const KPIS = [
    { label: "Total Productos", value: totalProducts, delta: `${lowStock} con stock crítico`, dir: "neutral", color: "amber", iconName: "box"     },
    { label: "Entradas (IN)",   value: totalIN,       delta: "Últimos 7 días",               dir: "up",      color: "green", iconName: "trendDn"  },
    { label: "Salidas (OUT)",   value: totalOUT,      delta: "Últimos 7 días",               dir: "down",    color: "red",   iconName: "trendUp"  },
    { label: "Stock crítico",   value: lowStock,      delta: "Requieren atención",           dir: "neutral", color: "blue",  iconName: "warning"  },
  ];

  // ── Chart data — group movements by day ──
  const chartData = getLast7Days().map(({ label, date }) => {
    const dayMovs = movements.filter(m => m.created_at?.startsWith(date));
    return {
      label,
      in:  dayMovs.filter(m => isIN(m.movement_type)).reduce((a, m) => a + m.quantity, 0),
      out: dayMovs.filter(m => !isIN(m.movement_type)).reduce((a, m) => a + m.quantity, 0),
    };
  });

  // ── Stock levels — top 5 by quantity ──
  const topProducts = [...products]
    .sort((a, b) => (b.quantity ?? 0) - (a.quantity ?? 0))
    .slice(0, 5);
  const maxQty = topProducts[0]?.quantity ?? 1;

  return (
    <div className="min-h-screen bg-[#0A0C0F] font-mono flex relative">
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        backgroundImage: "linear-gradient(rgba(245,158,11,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.025) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }} />

      <Sidebar onNavigate={navigate} user={user} onLogout={handleLogout} />

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
            <button
              onClick={() => { setLoading(true); setError(null); }}
              className="w-9 h-9 border border-[#1E2128] bg-[#111318] text-[#5A5F70] hover:text-amber-500 hover:border-amber-500/30 flex items-center justify-center transition-all duration-150"
              title="Actualizar datos">
              <Icon name="refresh" size={14} />
            </button>
            <button className="w-9 h-9 border border-[#1E2128] bg-[#111318] text-[#5A5F70] hover:text-amber-500 hover:border-amber-500/30 flex items-center justify-center transition-all duration-150 relative">
              <Icon name="bell" />
              {lowStock > 0 && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-[#0A0C0F]" />}
            </button>
          </div>
        </header>

        <div className="p-8 flex flex-col gap-7">

          {/* Error banner */}
          {error && (
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/25 px-5 py-4 text-red-300 text-xs">
              <Icon name="warning" size={14} />
              {error}
              <button onClick={() => window.location.reload()}
                className="ml-auto text-red-400 hover:text-red-300 underline underline-offset-2">
                Reintentar
              </button>
            </div>
          )}

          {/* KPI Grid */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)
              : KPIS.map((kpi, i) => {
                  const s = KPI_STYLES[kpi.color];
                  return (
                    <div key={i}
                      className={`bg-[#111318] border border-[#1E2128] ${s.hover} p-6 relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 cursor-default`}>
                      <div className="flex items-center justify-between mb-5">
                        <span className="text-[10px] uppercase tracking-[0.14em] text-[#5A5F70]">{kpi.label}</span>
                        <div className={`w-8 h-8 border flex items-center justify-center flex-shrink-0 ${s.icon}`}>
                          <Icon name={kpi.iconName} size={14} />
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
                })
            }
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
                <button onClick={() => navigate("/movements")}
                  className="text-[10px] text-amber-500 uppercase tracking-wider hover:underline underline-offset-2">
                  Ver todo
                </button>
              </div>
              {loading
                ? <div className="h-44 bg-[#1E2128]/40 animate-pulse" />
                : <BarChart data={chartData} />
              }
            </div>

            {/* Stock levels */}
            <div className="bg-[#111318] border border-[#1E2128] p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-sans font-bold text-sm text-white flex items-center gap-2.5">
                  <span className="w-0.5 h-4 bg-amber-500 inline-block flex-shrink-0" />
                  Nivel de stock
                </h2>
                <button onClick={() => navigate("/products")}
                  className="text-[10px] text-amber-500 uppercase tracking-wider hover:underline underline-offset-2">
                  Gestionar
                </button>
              </div>
              {loading ? (
                <div className="flex flex-col gap-5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex flex-col gap-2 animate-pulse">
                      <div className="flex justify-between">
                        <div className="h-2 bg-[#1E2128] rounded w-28" />
                        <div className="h-2 bg-[#1E2128] rounded w-8" />
                      </div>
                      <div className="h-1 bg-[#1E2128] rounded w-full" />
                    </div>
                  ))}
                </div>
              ) : topProducts.length === 0 ? (
                <p className="text-xs text-[#5A5F70] text-center py-8">Sin productos registrados</p>
              ) : (
                <div className="flex flex-col gap-5">
                  {topProducts.map((p, i) => (
                    <StockBar key={i} item={p} max={maxQty} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => navigate("/products")}
              className="bg-[#111318] border border-[#1E2128] hover:border-amber-500/30 px-6 py-4 flex items-center justify-between transition-all duration-200 group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                  <Icon name="box" size={14} />
                </div>
                <div className="text-left">
                  <p className="font-sans font-bold text-sm text-white">Gestionar productos</p>
                  <p className="text-[10px] text-[#5A5F70]">{loading ? "—" : `${totalProducts} productos registrados`}</p>
                </div>
              </div>
              <span className="text-[#5A5F70] group-hover:text-amber-500 transition-colors duration-150">
                <Icon name="chevron" size={16} />
              </span>
            </button>

            <button onClick={() => navigate("/movements")}
              className="bg-[#111318] border border-[#1E2128] hover:border-amber-500/30 px-6 py-4 flex items-center justify-between transition-all duration-200 group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                  <Icon name="move" size={14} />
                </div>
                <div className="text-left">
                  <p className="font-sans font-bold text-sm text-white">Ver movimientos</p>
                  <p className="text-[10px] text-[#5A5F70]">{loading ? "—" : `${movements.length} movimientos totales`}</p>
                </div>
              </div>
              <span className="text-[#5A5F70] group-hover:text-amber-500 transition-colors duration-150">
                <Icon name="chevron" size={16} />
              </span>
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}