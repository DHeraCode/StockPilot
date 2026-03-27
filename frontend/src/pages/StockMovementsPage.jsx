import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// ─────────────────────────────────────────────
// MOCK DATA — TODO: replace with API calls
// ─────────────────────────────────────────────
const MOCK_MOVEMENTS = [
  { id: 1,  product: "Monitor LG 27\"",      type: "IN",  qty: 15, stock_after: 42, user: "admin",     date: "2025-03-25", time: "09:14", notes: "Reposición mensual"           },
  { id: 2,  product: "Teclado Mecánico",     type: "OUT", qty: 3,  stock_after: 8,  user: "operador1", date: "2025-03-25", time: "08:50", notes: "Venta directa"                },
  { id: 3,  product: "Mouse Logitech MX",    type: "OUT", qty: 7,  stock_after: 3,  user: "operador2", date: "2025-03-24", time: "17:22", notes: ""                             },
  { id: 4,  product: "Audífonos Sony WH",    type: "IN",  qty: 20, stock_after: 25, user: "admin",     date: "2025-03-24", time: "14:05", notes: "Pedido proveedor #4421"       },
  { id: 5,  product: "Webcam HD 1080p",      type: "OUT", qty: 2,  stock_after: 1,  user: "operador1", date: "2025-03-24", time: "11:30", notes: "Equipamiento oficina"         },
  { id: 6,  product: "Hub USB-C 7 puertos",  type: "IN",  qty: 10, stock_after: 18, user: "admin",     date: "2025-03-24", time: "16:00", notes: ""                             },
  { id: 7,  product: "SSD Samsung 1TB",      type: "IN",  qty: 5,  stock_after: 14, user: "admin",     date: "2025-03-23", time: "10:00", notes: "Stock de seguridad"           },
  { id: 8,  product: "Teclado Mecánico",     type: "OUT", qty: 1,  stock_after: 11, user: "operador2", date: "2025-03-23", time: "15:45", notes: ""                             },
  { id: 9,  product: "Monitor LG 27\"",      type: "OUT", qty: 3,  stock_after: 27, user: "operador1", date: "2025-03-22", time: "12:10", notes: "Envío cliente corporativo"    },
  { id: 10, product: "Silla Ergonómica",     type: "IN",  qty: 4,  stock_after: 6,  user: "admin",     date: "2025-03-22", time: "09:30", notes: "Pedido proveedor #4398"       },
  { id: 11, product: "Audífonos Sony WH",    type: "OUT", qty: 2,  stock_after: 5,  user: "operador1", date: "2025-03-21", time: "16:55", notes: ""                             },
  { id: 12, product: "Hub USB-C 7 puertos",  type: "OUT", qty: 4,  stock_after: 8,  user: "operador2", date: "2025-03-21", time: "11:20", notes: "Kit trabajo remoto"           },
];

const MOCK_PRODUCTS = [
  "Monitor LG 27\"", "Teclado Mecánico", "Mouse Logitech MX", "Audífonos Sony WH",
  "Webcam HD 1080p", "Hub USB-C 7 puertos", "SSD Samsung 1TB", "Silla Ergonómica",
];

const EMPTY_FORM = { product: "", type: "IN", qty: "", notes: "" };

// ─────────────────────────────────────────────
// ICONS
// ─────────────────────────────────────────────
function Icon({ name, size = 15 }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" };
  const icons = {
    box:       <svg {...p}><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>,
    grid:      <svg {...p}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    move:      <svg {...p}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>,
    users:     <svg {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    logout:    <svg {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    plus:      <svg {...p} strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    x:         <svg {...p} strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    search:    <svg {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    chevron:   <svg {...p}><polyline points="9 18 15 12 9 6"/></svg>,
    arrowDn:   <svg {...p} strokeWidth="2.5"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>,
    arrowUp:   <svg {...p} strokeWidth="2.5"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>,
    alert:     <svg {...p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
    filter:    <svg {...p}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
    calendar:  <svg {...p}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    note:      <svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
    move2:     <svg {...p}><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>,
  };
  return icons[name] || null;
}

// ─────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────
const NAV_ITEMS = [
  { label: "Dashboard",   icon: "grid",  path: "/"          },
  { label: "Productos",   icon: "box",   path: "/products"  },
  { label: "Movimientos", icon: "move",  path: "/movements", badge: "3" },
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
            {item.badge && (
              <span className="ml-auto bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                {item.badge}
              </span>
            )}
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
// MOVEMENT MODAL (create)
// ─────────────────────────────────────────────
function MovementModal({ onClose, onSave }) {
  const [form, setForm]     = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.product)                               e.product = "Selecciona un producto";
    if (!form.qty || isNaN(form.qty) || Number(form.qty) <= 0)
                                                     e.qty     = "Cantidad inválida";
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    // TODO: replace with API call
    // await client.post("/stock-movements", {
    //   product_id: form.product,
    //   type: form.type,
    //   quantity: Number(form.qty),
    //   notes: form.notes,
    // });
    await new Promise(r => setTimeout(r, 800));
    onSave({ ...form, qty: Number(form.qty) });
    setSaving(false);
  };

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

          {/* Type toggle */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[#5A5F70] mb-2">
              Tipo de movimiento
            </label>
            <div className="grid grid-cols-2 gap-2">
              {["IN", "OUT"].map(t => (
                <button key={t} onClick={() => set("type", t)}
                  className={`py-3 text-xs font-sans font-bold uppercase tracking-wider border flex items-center justify-center gap-2 transition-all duration-150
                    ${form.type === t
                      ? t === "IN"
                        ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-500"
                        : "bg-amber-500/15 border-amber-500/40 text-amber-500"
                      : "border-[#1E2128] text-[#5A5F70] hover:border-[#3A3F4A] hover:text-[#C8CAD0]"}`}>
                  {t === "IN" ? <Icon name="arrowDn" size={13} /> : <Icon name="arrowUp" size={13} />}
                  {t === "IN" ? "Entrada" : "Salida"}
                </button>
              ))}
            </div>
          </div>

          {/* Product select */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[#5A5F70] mb-1.5">
              Producto
            </label>
            <select
              value={form.product}
              onChange={e => set("product", e.target.value)}
              className={`w-full bg-[#0D0F13] border text-white font-mono text-xs px-3 py-2.5 outline-none transition-all duration-150 rounded-none appearance-none cursor-pointer
                ${errors.product
                  ? "border-red-500 focus:ring-1 focus:ring-red-500/20"
                  : "border-[#1E2128] focus:border-amber-500 focus:ring-1 focus:ring-amber-500/10"}`}>
              <option value="" disabled className="bg-[#111318]">Seleccionar producto</option>
              {MOCK_PRODUCTS.map(p => (
                <option key={p} value={p} className="bg-[#111318]">{p}</option>
              ))}
            </select>
            {errors.product && (
              <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1">
                <Icon name="alert" size={10} />{errors.product}
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
              value={form.qty}
              onChange={e => set("qty", e.target.value)}
              className={`w-full bg-[#0D0F13] border text-white font-mono text-xs px-3 py-2.5 outline-none transition-all duration-150 rounded-none placeholder:text-[#3A3F4A]
                ${errors.qty
                  ? "border-red-500 focus:ring-1 focus:ring-red-500/20"
                  : "border-[#1E2128] focus:border-amber-500 focus:ring-1 focus:ring-amber-500/10"}`}
            />
            {errors.qty && (
              <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1">
                <Icon name="alert" size={10} />{errors.qty}
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[#5A5F70] mb-1.5">
              Notas <span className="normal-case tracking-normal text-[#3A3F4A]">(opcional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Ej: Reposición mensual, venta cliente #123..."
              value={form.notes}
              onChange={e => set("notes", e.target.value)}
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
              ${form.type === "IN"
                ? "bg-emerald-500 hover:bg-emerald-400 text-white"
                : "bg-amber-500 hover:bg-amber-400 text-[#0A0C0F]"}`}>
            {saving ? (
              <><span className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />Registrando...</>
            ) : (
              <>{form.type === "IN" ? "Registrar entrada" : "Registrar salida"}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────
function EmptyState({ onClear, onNew }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
      <div className="w-16 h-16 bg-[#111318] border border-[#1E2128] flex items-center justify-center text-[#3A3F4A]">
        <Icon name="move" size={28} />
      </div>
      <div>
        <p className="font-sans font-bold text-sm text-white mb-1">Sin movimientos</p>
        <p className="text-xs text-[#5A5F70]">No se encontraron movimientos con los filtros aplicados</p>
      </div>
      <div className="flex gap-3">
        <button onClick={onClear}
          className="text-xs text-[#5A5F70] border border-[#1E2128] px-4 py-2 hover:border-[#3A3F4A] hover:text-[#C8CAD0] transition-colors duration-150">
          Limpiar filtros
        </button>
        <button onClick={onNew}
          className="text-xs text-[#0A0C0F] bg-amber-500 hover:bg-amber-400 font-sans font-bold uppercase tracking-wider px-5 py-2 transition-colors duration-150 flex items-center gap-2">
          <Icon name="plus" size={13} />
          Nuevo movimiento
        </button>
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

  const [movements, setMovements] = useState(MOCK_MOVEMENTS);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch]       = useState("");
  const [typeFilter, setTypeFilter] = useState("TODOS");
  const [sortDir, setSortDir]     = useState("desc"); // "asc" | "desc"

  const handleLogout = () => { logout(); navigate("/login"); };

  // ── Stats ──
  const totalIN  = movements.filter(m => m.type === "IN").reduce((a, m) => a + m.qty, 0);
  const totalOUT = movements.filter(m => m.type === "OUT").reduce((a, m) => a + m.qty, 0);

  // ── Filtering + sorting ──
  const filtered = useMemo(() => {
    return movements
      .filter(m => typeFilter === "TODOS" || m.type === typeFilter)
      .filter(m =>
        m.product.toLowerCase().includes(search.toLowerCase()) ||
        m.user.toLowerCase().includes(search.toLowerCase()) ||
        (m.notes && m.notes.toLowerCase().includes(search.toLowerCase()))
      )
      .sort((a, b) => {
        const da = new Date(`${a.date}T${a.time}`);
        const db = new Date(`${b.date}T${b.time}`);
        return sortDir === "desc" ? db - da : da - db;
      });
  }, [movements, typeFilter, search, sortDir]);

  // ── Create handler ──
  const handleSave = (data) => {
    const now = new Date();
    const newMovement = {
      ...data,
      id: Date.now(),
      stock_after: 0, // TODO: will be returned by API
      user: user?.username || "admin",
      date: now.toISOString().split("T")[0],
      time: now.toTimeString().slice(0, 5),
    };
    setMovements(prev => [newMovement, ...prev]);
    setShowModal(false);
  };

  const clearFilters = () => { setSearch(""); setTypeFilter("TODOS"); };
  const hasFilters   = search || typeFilter !== "TODOS";

  return (
    <div className="min-h-screen bg-[#0A0C0F] font-mono flex relative">

      {/* Grid texture */}
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
              { label: "Total movimientos", value: movements.length,     color: "text-amber-500"   },
              { label: "Total entradas",    value: `+${totalIN}`,        color: "text-emerald-500" },
              { label: "Total salidas",     value: `−${totalOUT}`,       color: "text-red-400"     },
            ].map(s => (
              <div key={s.label} className="bg-[#111318] border border-[#1E2128] px-5 py-4 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.12em] text-[#5A5F70]">{s.label}</span>
                <span className={`font-sans font-extrabold text-2xl tracking-tight tabular-nums ${s.color}`}>{s.value}</span>
              </div>
            ))}
          </div>

          {/* Filters row */}
          <div className="flex items-center gap-3 flex-wrap">

            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A5F70]">
                <Icon name="search" size={14} />
              </span>
              <input
                type="text"
                placeholder="Buscar producto, usuario, notas..."
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
              {["TODOS", "IN", "OUT"].map(t => (
                <button key={t} onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1.5 text-[10px] uppercase tracking-wider border transition-all duration-150
                    ${typeFilter === t
                      ? t === "IN"
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                        : t === "OUT"
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-500"
                          : "bg-amber-500/10 border-amber-500/30 text-amber-500"
                      : "border-[#1E2128] text-[#5A5F70] hover:border-[#3A3F4A] hover:text-[#C8CAD0]"}`}>
                  {t === "IN" ? "Entradas" : t === "OUT" ? "Salidas" : "Todos"}
                </button>
              ))}
            </div>

            {/* Sort toggle */}
            <button
              onClick={() => setSortDir(d => d === "desc" ? "asc" : "desc")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] uppercase tracking-wider border border-[#1E2128] text-[#5A5F70] hover:border-[#3A3F4A] hover:text-[#C8CAD0] transition-all duration-150">
              <Icon name={sortDir === "desc" ? "arrowDn" : "arrowUp"} size={11} />
              {sortDir === "desc" ? "Más reciente" : "Más antiguo"}
            </button>

            {/* Clear filters */}
            {hasFilters && (
              <button onClick={clearFilters}
                className="px-3 py-1.5 text-[10px] uppercase tracking-wider border border-red-500/20 text-red-400 hover:bg-red-500/5 transition-all duration-150">
                Limpiar
              </button>
            )}
          </div>

          {/* Results count */}
          <p className="text-[11px] text-[#5A5F70] -mt-2">
            {filtered.length} movimiento{filtered.length !== 1 ? "s" : ""}
            {hasFilters && <span className="text-amber-500"> filtrados</span>}
          </p>

          {/* Table / Empty */}
          {filtered.length === 0 ? (
            <EmptyState onClear={clearFilters} onNew={() => setShowModal(true)} />
          ) : (
            <div className="bg-[#111318] border border-[#1E2128]">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#1E2128]">
                      {["#", "Producto", "Tipo", "Cantidad", "Stock post-mov.", "Usuario", "Fecha / Hora", "Notas"].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-[10px] uppercase tracking-[0.12em] text-[#3A3F4A] font-normal whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((row, i) => (
                      <tr key={row.id}
                        className={`border-b border-[#1E2128] last:border-0 hover:bg-[#161820] transition-colors duration-100
                          ${i % 2 !== 0 ? "bg-[#0D0F13]/40" : ""}`}>

                        {/* ID */}
                        <td className="px-5 py-4 text-[#3A3F4A] font-mono tabular-nums">
                          {String(row.id).padStart(3, "0")}
                        </td>

                        {/* Product */}
                        <td className="px-5 py-4 text-[#C8CAD0] font-medium whitespace-nowrap">
                          {row.product}
                        </td>

                        {/* Type */}
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold border
                            ${row.type === "IN"
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/25"
                              : "bg-amber-500/10 text-amber-500 border-amber-500/25"}`}>
                            {row.type === "IN"
                              ? <Icon name="arrowDn" size={9} />
                              : <Icon name="arrowUp" size={9} />}
                            {row.type}
                          </span>
                        </td>

                        {/* Qty */}
                        <td className={`px-5 py-4 font-sans font-bold text-sm tabular-nums ${row.type === "IN" ? "text-emerald-500" : "text-amber-500"}`}>
                          {row.type === "IN" ? "+" : "−"}{row.qty}
                        </td>

                        {/* Stock after */}
                        <td className="px-5 py-4">
                          {row.stock_after > 0 ? (
                            <span className={`inline-block px-2.5 py-1 text-[10px] border font-mono
                              ${row.stock_after <= 5
                                ? "border-red-500/30 text-red-400 bg-red-500/5"
                                : "border-[#1E2128] text-[#5A5F70]"}`}>
                              {row.stock_after} uds{row.stock_after <= 5 ? " ⚠" : ""}
                            </span>
                          ) : (
                            <span className="text-[#3A3F4A] font-mono">—</span>
                          )}
                        </td>

                        {/* User */}
                        <td className="px-5 py-4 text-[#5A5F70]">@{row.user}</td>

                        {/* Date */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[#C8CAD0] tabular-nums">{row.date}</span>
                            <span className="text-[#3A3F4A] text-[10px] tabular-nums">{row.time}</span>
                          </div>
                        </td>

                        {/* Notes */}
                        <td className="px-5 py-4 max-w-[180px]">
                          {row.notes ? (
                            <span className="text-[#5A5F70] truncate block" title={row.notes}>
                              {row.notes}
                            </span>
                          ) : (
                            <span className="text-[#3A3F4A]">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table footer */}
              <div className="px-5 py-3 border-t border-[#1E2128] flex items-center justify-between">
                <span className="text-[10px] text-[#3A3F4A]">
                  Mostrando {filtered.length} de {movements.length} movimientos
                </span>
                <div className="flex items-center gap-4 text-[10px] text-[#5A5F70]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-emerald-500 inline-block" />
                    IN: {filtered.filter(m => m.type === "IN").reduce((a, m) => a + m.qty, 0)} uds
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-amber-500 inline-block" />
                    OUT: {filtered.filter(m => m.type === "OUT").reduce((a, m) => a + m.qty, 0)} uds
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <MovementModal onClose={() => setShowModal(false)} onSave={handleSave} />
      )}
    </div>
  );
}