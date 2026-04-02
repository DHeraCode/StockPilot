import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useStockMovements } from "../hooks/useStockMovements";
import { getProducts } from "../api/products";

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const EMPTY_FORM = { product_id: "", movement_type: "entrada", quantity: "", note: "" };

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const isIN  = (type) => type === "entrada";
const typeLabel = (type) => isIN(type) ? "IN" : "OUT";

function formatDate(isoString) {
  if (!isoString) return { date: "—", time: "—" };
  const d = new Date(isoString);
  return {
    date: d.toLocaleDateString("es-ES", { year: "numeric", month: "2-digit", day: "2-digit" }),
    time: d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
  };
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
    plus:     <svg {...p} strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    x:        <svg {...p} strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    search:   <svg {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    chevron:  <svg {...p}><polyline points="9 18 15 12 9 6"/></svg>,
    arrowDn:  <svg {...p} strokeWidth="2.5"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>,
    arrowUp:  <svg {...p} strokeWidth="2.5"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>,
    alert:    <svg {...p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
    filter:   <svg {...p}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
    warning:  <svg {...p}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    refresh:  <svg {...p}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
    move2:    <svg {...p}><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>,
  };
  return icons[name] || null;
}

// ─────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────
const NAV_ITEMS = [
  { label: "Dashboard",   icon: "grid",  path: "/"          },
  { label: "Productos",   icon: "box",   path: "/products"  },
  { label: "Movimientos", icon: "move",  path: "/movements" },
  { label: "Usuarios",    icon: "users", path: "/users"     },
];

function Sidebar({ active, onNavigate, user, onLogout }) {
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
              ${active === item.label
                ? "text-amber-500 bg-amber-500/8 border-amber-500/20"
                : "text-[#5A5F70] hover:text-[#C8CAD0] hover:bg-[#161820] border-transparent"}`}>
            {active === item.label && <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-amber-500" />}
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
// SKELETON ROW
// ─────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="border-b border-[#1E2128] animate-pulse">
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-5 py-4">
          <div className="h-3 bg-[#1E2128] rounded w-full" />
        </td>
      ))}
    </tr>
  );
}

// ─────────────────────────────────────────────
// ERROR STATE
// ─────────────────────────────────────────────
function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
      <div className="w-16 h-16 bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-400">
        <Icon name="warning" size={28} />
      </div>
      <div>
        <p className="font-sans font-bold text-sm text-white mb-1">Error al cargar movimientos</p>
        <p className="text-xs text-[#5A5F70]">{message}</p>
      </div>
      <button onClick={onRetry}
        className="flex items-center gap-2 text-xs text-[#0A0C0F] bg-amber-500 hover:bg-amber-400 font-sans font-bold uppercase tracking-wider px-5 py-2.5 transition-colors duration-150">
        <Icon name="refresh" size={13} />
        Reintentar
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────
function EmptyState({ onClear, onNew, hasFilters }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
      <div className="w-16 h-16 bg-[#111318] border border-[#1E2128] flex items-center justify-center text-[#3A3F4A]">
        <Icon name="move" size={28} />
      </div>
      <div>
        <p className="font-sans font-bold text-sm text-white mb-1">Sin movimientos</p>
        <p className="text-xs text-[#5A5F70]">
          {hasFilters
            ? "No se encontraron movimientos con los filtros aplicados"
            : "Aún no hay movimientos registrados en el sistema"}
        </p>
      </div>
      <div className="flex gap-3">
        {hasFilters && (
          <button onClick={onClear}
            className="text-xs text-[#5A5F70] border border-[#1E2128] px-4 py-2 hover:border-[#3A3F4A] hover:text-[#C8CAD0] transition-colors duration-150">
            Limpiar filtros
          </button>
        )}
        <button onClick={onNew}
          className="text-xs text-[#0A0C0F] bg-amber-500 hover:bg-amber-400 font-sans font-bold uppercase tracking-wider px-5 py-2 transition-colors duration-150 flex items-center gap-2">
          <Icon name="plus" size={13} />
          Registrar movimiento
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MOVEMENT MODAL
// ─────────────────────────────────────────────
function MovementModal({ onClose, onSave }) {
  const [form, setForm]         = useState(EMPTY_FORM);
  const [products, setProducts] = useState([]);
  const [errors, setErrors]     = useState({});
  const [saving, setSaving]     = useState(false);
  const [apiError, setApiError] = useState("");

  // Load products from API
  useEffect(() => {
    getProducts().catch(() => []).then(data => setProducts(Array.isArray(data) ? data : []));
  }, []);

  const set = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.product_id)                                          e.product_id = "Selecciona un producto";
    if (!form.quantity || isNaN(form.quantity) || Number(form.quantity) <= 0)
                                                                   e.quantity   = "Cantidad inválida";
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    setApiError("");
    try {
      await onSave({
        product_id:    parseInt(form.product_id, 10),
        movement_type: form.movement_type,
        quantity:      parseInt(form.quantity, 10),
        note:          form.note || "",
      });
    } catch (err) {
      const detail = err.response?.data?.detail;
      setApiError(
        Array.isArray(detail)
          ? detail.map(e => e.msg).join(", ")
          : detail || "Error al registrar el movimiento"
      );
    } finally {
      setSaving(false);
    }
  };

  const typeIsIN = isIN(form.movement_type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0A0C0F]/85 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#111318] border border-[#1E2128] w-full max-w-md z-10 shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#1E2128]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Icon name="move2" size={14} />
            </div>
            <div>
              <h2 className="font-sans font-bold text-sm text-white">Registrar movimiento</h2>
              <p className="text-[10px] text-[#5A5F70]">Entrada o salida de stock</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 border border-[#1E2128] hover:border-red-500/30 hover:text-red-400 text-[#5A5F70] flex items-center justify-center transition-all duration-150">
            <Icon name="x" size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4">
          {apiError && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/25 px-4 py-3 text-red-300 text-xs">
              <Icon name="alert" size={12} />{apiError}
            </div>
          )}

          {/* Type toggle */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[#5A5F70] mb-2">
              Tipo de movimiento
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "entrada", label: "Entrada", icon: "arrowDn" },
                { value: "salida",  label: "Salida",  icon: "arrowUp" },
              ].map(t => (
                <button key={t.value} onClick={() => set("movement_type", t.value)}
                  className={`py-3 text-xs font-sans font-bold uppercase tracking-wider border flex items-center justify-center gap-2 transition-all duration-150
                    ${form.movement_type === t.value
                      ? t.value === "entrada"
                        ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-500"
                        : "bg-amber-500/15 border-amber-500/40 text-amber-500"
                      : "border-[#1E2128] text-[#5A5F70] hover:border-[#3A3F4A] hover:text-[#C8CAD0]"}`}>
                  <Icon name={t.icon} size={13} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Product select — loaded from API */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[#5A5F70] mb-1.5">
              Producto
            </label>
            <select
              value={form.product_id}
              onChange={e => set("product_id", e.target.value)}
              className={`w-full bg-[#0D0F13] border text-white font-mono text-xs px-3 py-2.5 outline-none transition-all duration-150 rounded-none appearance-none cursor-pointer
                ${errors.product_id
                  ? "border-red-500 focus:ring-1 focus:ring-red-500/20"
                  : "border-[#1E2128] focus:border-amber-500 focus:ring-1 focus:ring-amber-500/10"}`}>
              <option value="" disabled className="bg-[#111318]">
                {products.length === 0 ? "Cargando productos..." : "Seleccionar producto"}
              </option>
              {products.map(p => (
                <option key={p.id} value={p.id} className="bg-[#111318]">
                  {p.name} — stock actual: {p.quantity ?? 0}
                </option>
              ))}
            </select>
            {errors.product_id && (
              <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1">
                <Icon name="alert" size={10} />{errors.product_id}
              </p>
            )}
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[#5A5F70] mb-1.5">
              Cantidad
            </label>
            <input
              type="number"
              min="1"
              placeholder="0"
              value={form.quantity}
              onChange={e => set("quantity", e.target.value)}
              className={`w-full bg-[#0D0F13] border text-white font-mono text-xs px-3 py-2.5 outline-none transition-all duration-150 rounded-none placeholder:text-[#3A3F4A]
                ${errors.quantity
                  ? "border-red-500 focus:ring-1 focus:ring-red-500/20"
                  : "border-[#1E2128] focus:border-amber-500 focus:ring-1 focus:ring-amber-500/10"}`}
            />
            {errors.quantity && (
              <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1">
                <Icon name="alert" size={10} />{errors.quantity}
              </p>
            )}
          </div>

          {/* Note */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[#5A5F70] mb-1.5">
              Nota <span className="normal-case tracking-normal text-[#3A3F4A]">(opcional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Ej: Reposición mensual, venta cliente #123..."
              value={form.note}
              onChange={e => set("note", e.target.value)}
              className="w-full bg-[#0D0F13] border border-[#1E2128] focus:border-amber-500 focus:ring-1 focus:ring-amber-500/10 text-white font-mono text-xs px-3 py-2.5 outline-none transition-all duration-150 rounded-none resize-none placeholder:text-[#3A3F4A]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#1E2128] flex items-center justify-end gap-3">
          <button onClick={onClose}
            className="px-4 py-2 text-xs text-[#5A5F70] border border-[#1E2128] hover:border-[#3A3F4A] hover:text-[#C8CAD0] transition-all duration-150 font-mono">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving}
            className={`px-5 py-2 font-sans font-bold text-xs uppercase tracking-wider transition-colors duration-150 flex items-center gap-2 disabled:opacity-50
              ${typeIsIN
                ? "bg-emerald-500 hover:bg-emerald-400 text-white"
                : "bg-amber-500 hover:bg-amber-400 text-[#0A0C0F]"}`}>
            {saving
              ? <><span className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />Registrando...</>
              : typeIsIN ? "Registrar entrada" : "Registrar salida"
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// STOCK MOVEMENTS PAGE
// ─────────────────────────────────────────────
export default function StockMovementsPage() {
  const navigate         = useNavigate();
  const { user, logout } = useAuth();

  const { movements, loading, error, fetchMovements, addMovement } = useStockMovements();

  const [showModal, setShowModal]   = useState(false);
  const [search, setSearch]         = useState("");
  const [typeFilter, setTypeFilter] = useState("TODOS");
  const [sortDir, setSortDir]       = useState("desc");

  useEffect(() => { fetchMovements(); }, [fetchMovements]);

  const handleLogout = () => { logout(); navigate("/login"); };

  const handleSave = async (data) => {
    await addMovement(data);
    setShowModal(false);
  };

  const clearFilters = () => { setSearch(""); setTypeFilter("TODOS"); };
  const hasFilters   = search || typeFilter !== "TODOS";

  // ── Stats ──
  const totalIN  = movements.filter(m => isIN(m.movement_type)).reduce((a, m) => a + m.quantity, 0);
  const totalOUT = movements.filter(m => !isIN(m.movement_type)).reduce((a, m) => a + m.quantity, 0);

  // ── Filtering + sorting ──
  const filtered = useMemo(() => {
    return movements
      .filter(m => {
        if (typeFilter === "TODOS") return true;
        if (typeFilter === "IN")  return isIN(m.movement_type);
        if (typeFilter === "OUT") return !isIN(m.movement_type);
        return true;
      })
      .filter(m =>
        String(m.product_id).includes(search) ||
        (m.note && m.note.toLowerCase().includes(search.toLowerCase()))
      )
      .sort((a, b) => {
        const da = new Date(a.created_at);
        const db = new Date(b.created_at);
        return sortDir === "desc" ? db - da : da - db;
      });
  }, [movements, typeFilter, search, sortDir]);

  return (
    <div className="min-h-screen bg-[#0A0C0F] font-mono flex relative">
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        backgroundImage: "linear-gradient(rgba(245,158,11,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.025) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }} />

      <Sidebar active="Movimientos" onNavigate={navigate} user={user} onLogout={handleLogout} />

      <main className="ml-60 flex-1 flex flex-col">

        {/* Topbar */}
        <header className="h-16 border-b border-[#1E2128] flex items-center justify-between px-8 bg-[#0A0C0F]/80 backdrop-blur-sm sticky top-0 z-5">
          <div className="flex flex-col gap-0.5">
            <span className="font-sans font-bold text-sm text-white tracking-tight">Movimientos</span>
            <span className="text-[10px] text-[#3A3F4A] uppercase tracking-wider">StockPilot / Historial de stock</span>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-[#0A0C0F] font-sans font-bold text-xs uppercase tracking-wider px-4 py-2.5 transition-colors duration-150">
            <Icon name="plus" size={13} />
            Registrar movimiento
          </button>
        </header>

        <div className="p-8 flex flex-col gap-6">

          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total movimientos", value: loading ? "—" : movements.length, color: "text-amber-500"   },
              { label: "Total entradas",    value: loading ? "—" : `+${totalIN}`,    color: "text-emerald-500" },
              { label: "Total salidas",     value: loading ? "—" : `−${totalOUT}`,   color: "text-red-400"     },
            ].map(s => (
              <div key={s.label} className="bg-[#111318] border border-[#1E2128] px-5 py-4 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.12em] text-[#5A5F70]">{s.label}</span>
                <span className={`font-sans font-extrabold text-2xl tracking-tight tabular-nums ${s.color}`}>{s.value}</span>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A5F70]">
                <Icon name="search" size={14} />
              </span>
              <input
                type="text"
                placeholder="Buscar por nota..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-[#111318] border border-[#1E2128] focus:border-amber-500 text-white font-mono text-xs pl-9 pr-4 py-2.5 outline-none transition-all duration-150 placeholder:text-[#3A3F4A] rounded-none focus:ring-1 focus:ring-amber-500/10"
              />
              {search && (
                <button onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A5F70] hover:text-white">
                  <Icon name="x" size={12} />
                </button>
              )}
            </div>

            {/* Type filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[#5A5F70]"><Icon name="filter" size={12} /></span>
              {[
                { key: "TODOS", label: "Todos"    },
                { key: "IN",    label: "Entradas" },
                { key: "OUT",   label: "Salidas"  },
              ].map(t => (
                <button key={t.key} onClick={() => setTypeFilter(t.key)}
                  className={`px-3 py-1.5 text-[10px] uppercase tracking-wider border transition-all duration-150
                    ${typeFilter === t.key
                      ? t.key === "IN"
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                        : t.key === "OUT"
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-500"
                          : "bg-amber-500/10 border-amber-500/30 text-amber-500"
                      : "border-[#1E2128] text-[#5A5F70] hover:border-[#3A3F4A] hover:text-[#C8CAD0]"}`}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Sort toggle */}
            <button onClick={() => setSortDir(d => d === "desc" ? "asc" : "desc")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] uppercase tracking-wider border border-[#1E2128] text-[#5A5F70] hover:border-[#3A3F4A] hover:text-[#C8CAD0] transition-all duration-150">
              <Icon name={sortDir === "desc" ? "arrowDn" : "arrowUp"} size={11} />
              {sortDir === "desc" ? "Más reciente" : "Más antiguo"}
            </button>

            {hasFilters && (
              <button onClick={clearFilters}
                className="px-3 py-1.5 text-[10px] uppercase tracking-wider border border-red-500/20 text-red-400 hover:bg-red-500/5 transition-all duration-150">
                Limpiar
              </button>
            )}
          </div>

          {/* Results count */}
          {!loading && (
            <p className="text-[11px] text-[#5A5F70] -mt-2">
              {filtered.length} movimiento{filtered.length !== 1 ? "s" : ""}
              {hasFilters && <span className="text-amber-500"> filtrados</span>}
            </p>
          )}

          {/* Content */}
          {error ? (
            <ErrorState message={error} onRetry={fetchMovements} />
          ) : !loading && filtered.length === 0 ? (
            <EmptyState
              hasFilters={hasFilters}
              onClear={clearFilters}
              onNew={() => setShowModal(true)}
            />
          ) : (
            <div className="bg-[#111318] border border-[#1E2128]">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#1E2128]">
                      {["#", "Producto ID", "Tipo", "Cantidad", "Nota", "Fecha", "Hora"].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-[10px] uppercase tracking-[0.12em] text-[#3A3F4A] font-normal whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading
                      ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                      : filtered.map((row, i) => {
                          const { date, time } = formatDate(row.created_at);
                          const typeIN = isIN(row.movement_type);
                          return (
                            <tr key={row.id}
                              className={`border-b border-[#1E2128] last:border-0 hover:bg-[#161820] transition-colors duration-100
                                ${i % 2 !== 0 ? "bg-[#0D0F13]/40" : ""}`}>

                              <td className="px-5 py-4 text-[#3A3F4A] font-mono tabular-nums">
                                {String(row.id).padStart(3, "0")}
                              </td>

                              <td className="px-5 py-4 text-[#C8CAD0] font-medium tabular-nums">
                                #{row.product_id}
                              </td>

                              <td className="px-5 py-4">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold border
                                  ${typeIN
                                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/25"
                                    : "bg-amber-500/10 text-amber-500 border-amber-500/25"}`}>
                                  <Icon name={typeIN ? "arrowDn" : "arrowUp"} size={9} />
                                  {typeLabel(row.movement_type)}
                                </span>
                              </td>

                              <td className={`px-5 py-4 font-sans font-bold text-sm tabular-nums ${typeIN ? "text-emerald-500" : "text-amber-500"}`}>
                                {typeIN ? "+" : "−"}{row.quantity}
                              </td>

                              <td className="px-5 py-4 max-w-[200px]">
                                {row.note
                                  ? <span className="text-[#5A5F70] truncate block" title={row.note}>{row.note}</span>
                                  : <span className="text-[#3A3F4A]">—</span>
                                }
                              </td>

                              <td className="px-5 py-4 text-[#C8CAD0] tabular-nums whitespace-nowrap">{date}</td>
                              <td className="px-5 py-4 text-[#3A3F4A] tabular-nums">{time}</td>
                            </tr>
                          );
                        })
                    }
                  </tbody>
                </table>
              </div>

              {/* Table footer */}
              {!loading && (
                <div className="px-5 py-3 border-t border-[#1E2128] flex items-center justify-between">
                  <span className="text-[10px] text-[#3A3F4A]">
                    Mostrando {filtered.length} de {movements.length} movimientos
                  </span>
                  <div className="flex items-center gap-4 text-[10px] text-[#5A5F70]">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-emerald-500 inline-block" />
                      Entradas: {filtered.filter(m => isIN(m.movement_type)).reduce((a, m) => a + m.quantity, 0)} uds
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-amber-500 inline-block" />
                      Salidas: {filtered.filter(m => !isIN(m.movement_type)).reduce((a, m) => a + m.quantity, 0)} uds
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {showModal && (
        <MovementModal onClose={() => setShowModal(false)} onSave={handleSave} />
      )}
    </div>
  );
}