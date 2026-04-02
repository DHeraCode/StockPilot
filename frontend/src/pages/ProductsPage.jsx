import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useProducts } from "../hooks/useProducts";
import { getCategories } from "../api/categories";

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const EMPTY_FORM = { name: "", description: "", price: "", quantity: "", category_id: "" };

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
    edit:     <svg {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    trash:    <svg {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
    x:        <svg {...p} strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    search:   <svg {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    warning:  <svg {...p}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    chevron:  <svg {...p}><polyline points="9 18 15 12 9 6"/></svg>,
    package:  <svg {...p}><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
    filter:   <svg {...p}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
    alert:    <svg {...p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
    refresh:  <svg {...p}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
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
// SKELETON CARD
// ─────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-[#111318] border border-[#1E2128] flex flex-col animate-pulse">
      <div className="px-5 pt-5 pb-4 border-b border-[#1E2128] flex items-center gap-3">
        <div className="w-9 h-9 bg-[#1E2128] flex-shrink-0" />
        <div className="flex flex-col gap-2 flex-1">
          <div className="h-3 bg-[#1E2128] rounded w-3/4" />
          <div className="h-2 bg-[#1E2128] rounded w-1/2" />
        </div>
      </div>
      <div className="px-5 py-4 flex flex-col gap-3">
        <div className="h-2 bg-[#1E2128] rounded w-full" />
        <div className="h-2 bg-[#1E2128] rounded w-4/5" />
        <div className="flex justify-between mt-2">
          <div className="h-6 bg-[#1E2128] rounded w-16" />
          <div className="h-6 bg-[#1E2128] rounded w-16" />
        </div>
      </div>
    </div>
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
        <p className="font-sans font-bold text-sm text-white mb-1">Error al cargar productos</p>
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
function EmptyState({ query, onClear, onCreate }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
      <div className="w-16 h-16 bg-[#111318] border border-[#1E2128] flex items-center justify-center text-[#3A3F4A]">
        <Icon name="package" size={28} />
      </div>
      <div>
        <p className="font-sans font-bold text-sm text-white mb-1">
          {query ? "Sin resultados" : "Sin productos"}
        </p>
        <p className="text-xs text-[#5A5F70]">
          {query
            ? `No se encontraron productos para "${query}"`
            : "Aún no hay productos registrados en el sistema"}
        </p>
      </div>
      {query ? (
        <button onClick={onClear}
          className="text-xs text-amber-500 border border-amber-500/30 px-4 py-2 hover:bg-amber-500/5 transition-colors duration-150">
          Limpiar búsqueda
        </button>
      ) : (
        <button onClick={onCreate}
          className="text-xs text-[#0A0C0F] bg-amber-500 hover:bg-amber-400 font-sans font-bold uppercase tracking-wider px-5 py-2.5 transition-colors duration-150 flex items-center gap-2">
          <Icon name="plus" size={13} />
          Crear primer producto
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// PRODUCT CARD
// ─────────────────────────────────────────────
function ProductCard({ product, onEdit, onDelete }) {
  const qty    = product.quantity ?? 0;
  const isLow  = qty <= 5;
  const isMid  = qty > 5 && qty <= 15;
  const stockBg = isLow
    ? "bg-red-500/10 border-red-500/25 text-red-400"
    : isMid
      ? "bg-amber-500/10 border-amber-500/25 text-amber-500"
      : "bg-emerald-500/10 border-emerald-500/25 text-emerald-500";

  return (
    <div className="bg-[#111318] border border-[#1E2128] hover:border-amber-500/20 transition-all duration-200 hover:-translate-y-0.5 group flex flex-col relative overflow-hidden">
      <div className="absolute top-0 right-0 w-0 h-0 border-l-[24px] border-l-transparent border-t-[24px] border-t-amber-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

      <div className="px-5 pt-5 pb-4 border-b border-[#1E2128] flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 flex-shrink-0">
            <Icon name="package" size={15} />
          </div>
          <div className="min-w-0">
            <h3 className="font-sans font-bold text-sm text-white truncate leading-tight">{product.name}</h3>
            <span className="text-[10px] text-[#5A5F70] uppercase tracking-wider">
              {product.category?.name ?? "—"}
            </span>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex-shrink-0">
          <button onClick={() => onEdit(product)}
            className="w-7 h-7 border border-[#1E2128] hover:border-amber-500/30 hover:text-amber-500 text-[#5A5F70] flex items-center justify-center transition-all duration-150">
            <Icon name="edit" size={12} />
          </button>
          <button onClick={() => onDelete(product)}
            className="w-7 h-7 border border-[#1E2128] hover:border-red-500/30 hover:text-red-400 text-[#5A5F70] flex items-center justify-center transition-all duration-150">
            <Icon name="trash" size={12} />
          </button>
        </div>
      </div>

      <div className="px-5 py-4 flex-1 flex flex-col gap-4">
        <p className="text-xs text-[#5A5F70] leading-relaxed line-clamp-2">
          {product.description || "Sin descripción"}
        </p>
        <div className="flex items-end justify-between mt-auto">
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] uppercase tracking-widest text-[#3A3F4A]">Precio</span>
            <span className="font-sans font-bold text-lg text-white tracking-tight">
              ${Number(product.price).toFixed(2)}
            </span>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[9px] uppercase tracking-widest text-[#3A3F4A]">Stock</span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold border font-sans ${stockBg}`}>
              {isLow && <Icon name="alert" size={10} />}
              {qty} uds
            </span>
          </div>
        </div>
      </div>

      {isLow && (
        <div className="px-5 py-2 bg-red-500/5 border-t border-red-500/20 flex items-center gap-2">
          <Icon name="warning" size={10} />
          <span className="text-[10px] text-red-400 uppercase tracking-wider">Stock crítico</span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// PRODUCT MODAL (create / edit)
// ─────────────────────────────────────────────
function ProductModal({ mode, product, onClose, onSave }) {
  // Pre-populate form — map API fields to form fields
  const [form, setForm] = useState(() => {
    if (!product) return EMPTY_FORM;
    return {
      name:        product.name        ?? "",
      description: product.description ?? "",
      price:       String(product.price    ?? ""),
      quantity:    String(product.quantity ?? ""),
      category_id: String(product.category_id ?? ""),
    };
  });

  const [categories, setCategories] = useState([]);
  const [errors, setErrors]         = useState({});
  const [saving, setSaving]         = useState(false);
  const [apiError, setApiError]     = useState("");

  // Load categories from API
  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setApiError("No se pudieron cargar las categorías"));
  }, []);

  const set = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())                                              e.name        = "El nombre es requerido";
    if (!form.category_id)                                              e.category_id = "Selecciona una categoría";
    if (!form.price || isNaN(form.price) || Number(form.price) <= 0)   e.price       = "Precio inválido";
    if (form.quantity === "" || isNaN(form.quantity) || Number(form.quantity) < 0)
                                                                        e.quantity    = "Stock inválido";
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    setApiError("");
    try {
      await onSave({
        name:        form.name,
        description: form.description,
        price:       Number(form.price),
        quantity:    Number(form.quantity),
        category_id: Number(form.category_id),
      });
    } catch (err) {
      const detail = err.response?.data?.detail;
      setApiError(
        Array.isArray(detail)
          ? detail.map(e => e.msg).join(", ")
          : detail || "Error al guardar el producto"
      );
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { key: "name",        label: "Nombre",      type: "text",   placeholder: "Ej: Martillo Stanley",     full: true  },
    { key: "description", label: "Descripción", type: "text",   placeholder: "Descripción del producto", full: true  },
    { key: "price",       label: "Precio ($)",  type: "number", placeholder: "0.00",                     full: false },
    { key: "quantity",    label: "Stock",       type: "number", placeholder: "0",                        full: false },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0A0C0F]/85 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#111318] border border-[#1E2128] w-full max-w-lg z-10 shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#1E2128]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Icon name={mode === "create" ? "plus" : "edit"} size={14} />
            </div>
            <div>
              <h2 className="font-sans font-bold text-sm text-white">
                {mode === "create" ? "Nuevo producto" : "Editar producto"}
              </h2>
              <p className="text-[10px] text-[#5A5F70]">
                {mode === "create" ? "Completa los datos del producto" : `Editando: ${product?.name}`}
              </p>
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
          <div className="grid grid-cols-2 gap-4">
            {fields.map(f => (
              <div key={f.key} className={f.full ? "col-span-2" : "col-span-1"}>
                <label className="block text-[10px] uppercase tracking-widest text-[#5A5F70] mb-1.5">{f.label}</label>
                <input
                  type={f.type}
                  placeholder={f.placeholder}
                  value={form[f.key]}
                  onChange={e => set(f.key, e.target.value)}
                  min={f.type === "number" ? "0" : undefined}
                  step={f.key === "price" ? "0.01" : "1"}
                  className={`w-full bg-[#0D0F13] border text-white font-mono text-xs px-3 py-2.5 outline-none transition-all duration-150 placeholder:text-[#3A3F4A] rounded-none
                    ${errors[f.key]
                      ? "border-red-500 focus:ring-1 focus:ring-red-500/20"
                      : "border-[#1E2128] focus:border-amber-500 focus:ring-1 focus:ring-amber-500/10"}`}
                />
                {errors[f.key] && (
                  <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1">
                    <Icon name="alert" size={10} />{errors[f.key]}
                  </p>
                )}
              </div>
            ))}

            {/* Category select — loaded dynamically from API */}
            <div className="col-span-2">
              <label className="block text-[10px] uppercase tracking-widest text-[#5A5F70] mb-1.5">Categoría</label>
              <select
                value={form.category_id}
                onChange={e => set("category_id", e.target.value)}
                className={`w-full bg-[#0D0F13] border text-white font-mono text-xs px-3 py-2.5 outline-none transition-all duration-150 rounded-none appearance-none cursor-pointer
                  ${errors.category_id
                    ? "border-red-500 focus:ring-1 focus:ring-red-500/20"
                    : "border-[#1E2128] focus:border-amber-500 focus:ring-1 focus:ring-amber-500/10"}`}>
                <option value="" disabled className="bg-[#111318]">
                  {categories.length === 0 ? "Cargando categorías..." : "Seleccionar categoría"}
                </option>
                {categories.map(c => (
                  <option key={c.id} value={c.id} className="bg-[#111318]">{c.name}</option>
                ))}
              </select>
              {errors.category_id && (
                <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1">
                  <Icon name="alert" size={10} />{errors.category_id}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#1E2128] flex items-center justify-end gap-3">
          <button onClick={onClose}
            className="px-4 py-2 text-xs text-[#5A5F70] border border-[#1E2128] hover:border-[#3A3F4A] hover:text-[#C8CAD0] transition-all duration-150 font-mono">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-[#0A0C0F] font-sans font-bold text-xs uppercase tracking-wider transition-colors duration-150 flex items-center gap-2">
            {saving
              ? <><span className="w-3 h-3 border-2 border-[#0A0C0F]/30 border-t-[#0A0C0F] rounded-full animate-spin" />Guardando...</>
              : mode === "create" ? "Crear producto" : "Guardar cambios"
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// DELETE MODAL
// ─────────────────────────────────────────────
function DeleteModal({ product, onClose, onConfirm }) {
  const [deleting, setDeleting] = useState(false);
  const [apiError, setApiError] = useState("");

  const handleConfirm = async () => {
    setDeleting(true);
    setApiError("");
    try {
      await onConfirm(product.id);
    } catch (err) {
      setApiError(err.response?.data?.detail || "Error al eliminar el producto");
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0A0C0F]/85 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#111318] border border-red-500/20 w-full max-w-sm z-10 shadow-2xl">
        <div className="px-6 pt-6 pb-5 flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-400">
            <Icon name="trash" size={20} />
          </div>
          <div>
            <h2 className="font-sans font-bold text-base text-white mb-1">Eliminar producto</h2>
            <p className="text-xs text-[#5A5F70] leading-relaxed">
              ¿Estás seguro de que deseas eliminar{" "}
              <span className="text-white font-medium">"{product.name}"</span>?
              Esta acción no se puede deshacer.
            </p>
          </div>
          {apiError && (
            <p className="text-[11px] text-red-400 flex items-center gap-1">
              <Icon name="alert" size={10} />{apiError}
            </p>
          )}
        </div>
        <div className="px-6 py-4 border-t border-[#1E2128] flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 text-xs text-[#5A5F70] border border-[#1E2128] hover:border-[#3A3F4A] hover:text-[#C8CAD0] transition-all duration-150 font-mono">
            Cancelar
          </button>
          <button onClick={handleConfirm} disabled={deleting}
            className="flex-1 py-2.5 bg-red-500 hover:bg-red-400 disabled:opacity-50 text-white font-sans font-bold text-xs uppercase tracking-wider transition-colors duration-150 flex items-center justify-center gap-2">
            {deleting
              ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Eliminando...</>
              : "Eliminar"
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PRODUCTS PAGE
// ─────────────────────────────────────────────
export default function ProductsPage() {
  const navigate         = useNavigate();
  const { user, logout } = useAuth();

  const {
    products,
    loading,
    error,
    fetchProducts,
    addProduct,
    editProduct,
    removeProduct,
  } = useProducts();

  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState("Todos");
  const [modal, setModal]       = useState(null);
  const [editing, setEditing]   = useState(null);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleLogout = () => { logout(); navigate("/login"); };

  // ── Filtering — use category.name from nested object ──
  const allCategories = ["Todos", ...new Set(
    products.map(p => p.category?.name).filter(Boolean)
  )];

  const filtered = products
    .filter(p => filter === "Todos" || p.category?.name === filter)
    .filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase())) ||
      (p.category?.name && p.category.name.toLowerCase().includes(search.toLowerCase()))
    );

  // ── CRUD handlers ──
  const handleCreate = async (data) => {
    await addProduct(data);
    setModal(null);
  };

  const handleEdit = async (data) => {
    await editProduct(editing.id, data);
    setModal(null);
    setEditing(null);
  };

  const handleDelete = async (id) => {
    await removeProduct(id);
    setDeleting(null);
  };

  // ── Stats ──
  const totalStock = products.reduce((acc, p) => acc + (p.quantity ?? 0), 0);
  const lowStock   = products.filter(p => (p.quantity ?? 0) <= 5).length;

  return (
    <div className="min-h-screen bg-[#0A0C0F] font-mono flex relative">
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        backgroundImage: "linear-gradient(rgba(245,158,11,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.025) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }} />

      <Sidebar active="Productos" onNavigate={navigate} user={user} onLogout={handleLogout} />

      <main className="ml-60 flex-1 flex flex-col">

        {/* Topbar */}
        <header className="h-16 border-b border-[#1E2128] flex items-center justify-between px-8 bg-[#0A0C0F]/80 backdrop-blur-sm sticky top-0 z-5">
          <div className="flex flex-col gap-0.5">
            <span className="font-sans font-bold text-sm text-white tracking-tight">Productos</span>
            <span className="text-[10px] text-[#3A3F4A] uppercase tracking-wider">StockPilot / Gestión de productos</span>
          </div>
          <button onClick={() => setModal("create")}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-[#0A0C0F] font-sans font-bold text-xs uppercase tracking-wider px-4 py-2.5 transition-colors duration-150">
            <Icon name="plus" size={13} />
            Nuevo producto
          </button>
        </header>

        <div className="p-8 flex flex-col gap-6">

          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total productos",   value: loading ? "—" : products.length, color: "text-amber-500"   },
              { label: "Unidades en stock", value: loading ? "—" : totalStock,      color: "text-emerald-500" },
              { label: "Stock crítico",     value: loading ? "—" : lowStock,        color: "text-red-400"     },
            ].map(s => (
              <div key={s.label} className="bg-[#111318] border border-[#1E2128] px-5 py-4 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.12em] text-[#5A5F70]">{s.label}</span>
                <span className={`font-sans font-extrabold text-2xl tracking-tight ${s.color}`}>{s.value}</span>
              </div>
            ))}
          </div>

          {/* Search + Filter */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A5F70]">
                <Icon name="search" size={14} />
              </span>
              <input
                type="text"
                placeholder="Buscar productos..."
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
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[#5A5F70]"><Icon name="filter" size={12} /></span>
              {allCategories.map(cat => (
                <button key={cat} onClick={() => setFilter(cat)}
                  className={`px-3 py-1.5 text-[10px] uppercase tracking-wider border transition-all duration-150
                    ${filter === cat
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-500"
                      : "border-[#1E2128] text-[#5A5F70] hover:border-[#3A3F4A] hover:text-[#C8CAD0]"}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Results count */}
          {(search || filter !== "Todos") && !loading && (
            <p className="text-[11px] text-[#5A5F70]">
              {filtered.length} producto{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
              {filter !== "Todos" && <span className="text-amber-500"> en {filter}</span>}
              {search && <span> · búsqueda: "<span className="text-white">{search}</span>"</span>}
            </p>
          )}

          {/* Content */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : error ? (
            <ErrorState message={error} onRetry={fetchProducts} />
          ) : filtered.length === 0 ? (
            <EmptyState
              query={search}
              onClear={() => { setSearch(""); setFilter("Todos"); }}
              onCreate={() => setModal("create")}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onEdit={p => { setEditing(p); setModal("edit"); }}
                  onDelete={p => setDeleting(p)}
                />
              ))}
            </div>
          )}

        </div>
      </main>

      {/* Modals */}
      {modal === "create" && (
        <ProductModal mode="create" onClose={() => setModal(null)} onSave={handleCreate} />
      )}
      {modal === "edit" && editing && (
        <ProductModal
          mode="edit"
          product={editing}
          onClose={() => { setModal(null); setEditing(null); }}
          onSave={handleEdit}
        />
      )}
      {deleting && (
        <DeleteModal
          product={deleting}
          onClose={() => setDeleting(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}