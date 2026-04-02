import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginRequest } from "../api/auth";

// ── Icons ──
function IconBox() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
      <path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>
    </svg>
  );
}

function IconUser() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
  );
}

function IconLock() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

function IconEye({ off }) {
  return off ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
      <line x1="2" y1="2" x2="22" y2="22"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

function IconAlert() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
}

function IconArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  );
}

// ── Main Component ──
export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState({});
  const [globalError, setGlobalError] = useState("");

  const validate = () => {
    const e = {};
    if (!username.trim()) e.username = "El usuario es requerido";
    if (!password)        e.password = "La contraseña es requerida";
    else if (password.length < 4) e.password = "Mínimo 4 caracteres";
    return e;
  };

  const handleSubmit = async () => {
    setGlobalError("");
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setLoading(true);
    try {
      const data = await loginRequest(username, password);
      login(username, data.access_token);
      navigate("/");
    } catch (err) {
      setGlobalError(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === "Enter") handleSubmit(); };

  return (
    <div className="min-h-screen bg-[#0A0C0F] font-mono grid grid-cols-1 lg:grid-cols-2 overflow-hidden relative">

      {/* Grid texture */}
      <div className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: "linear-gradient(rgba(245,158,11,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.03) 1px, transparent 1px)",
          backgroundSize: "48px 48px"
        }}
      />

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex flex-col justify-between p-12 border-r border-[#1E2128] relative z-10">

        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500 flex items-center justify-center text-[#0A0C0F]"
            style={{ clipPath: "polygon(0 0, 85% 0, 100% 15%, 100% 100%, 15% 100%, 0 85%)" }}>
            <IconBox />
          </div>
          <span className="font-sans font-extrabold text-xl tracking-tight text-white">StockPilot</span>
        </div>

        {/* Hero */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2 text-amber-500 text-xs uppercase tracking-widest">
            <span className="w-6 h-px bg-amber-500" />
            Control de inventario
          </div>
          <h1 className="font-sans font-extrabold text-5xl leading-[1.05] tracking-tight text-white">
            Tu stock,<br />
            bajo <span className="text-amber-500">control</span><br />
            total.
          </h1>
          <p className="text-[#5A5F70] text-sm leading-relaxed max-w-sm">
            Gestiona productos, registra movimientos y monitorea tu inventario en tiempo real. Diseñado para PYMEs que exigen precisión.
          </p>
        </div>

        {/* Stats */}
        <div className="flex gap-4 flex-wrap">
          {[
            { value: "∞",      label: "Productos"   },
            { value: "IN/OUT", label: "Movimientos" },
            { value: "JWT",    label: "Seguridad"   },
          ].map(s => (
            <div key={s.label}
              className="border border-[#1E2128] px-5 py-3 flex flex-col gap-1 hover:border-amber-500/40 transition-colors duration-200">
              <span className="font-sans font-bold text-2xl text-amber-500 tracking-tight">{s.value}</span>
              <span className="text-[#5A5F70] text-[10px] uppercase tracking-widest">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex items-center justify-center p-8 lg:p-12 relative z-10">
        <div className="w-full max-w-sm">

          {/* Mobile brand */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-9 h-9 bg-amber-500 flex items-center justify-center text-[#0A0C0F]"
              style={{ clipPath: "polygon(0 0, 85% 0, 100% 15%, 100% 100%, 15% 100%, 0 85%)" }}>
              <IconBox />
            </div>
            <span className="font-sans font-extrabold text-lg tracking-tight text-white">StockPilot</span>
          </div>

          {/* Header */}
          <div className="mb-10">
            <h2 className="font-sans font-bold text-2xl text-white tracking-tight mb-2">Iniciar sesión</h2>
            <p className="text-[#5A5F70] text-xs">Ingresa tus credenciales para continuar</p>
          </div>

          {/* Global error */}
          {globalError && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/25 px-4 py-3 text-red-300 text-xs mb-5">
              <IconAlert />
              {globalError}
            </div>
          )}

          {/* Username */}
          <div className="mb-5">
            <label className="block text-[10px] uppercase tracking-widest text-[#5A5F70] mb-2">
              Usuario
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A5F70]">
                <IconUser />
              </span>
              <input
                type="text"
                placeholder="tu_usuario"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onKeyDown={handleKey}
                autoComplete="username"
                className={`w-full bg-[#111318] border text-white font-mono text-sm pl-10 pr-4 py-3.5 outline-none transition-all duration-200 placeholder:text-[#5A5F70]/60 rounded-none
                  ${errors.username
                    ? "border-red-500 focus:ring-2 focus:ring-red-500/10"
                    : "border-[#1E2128] focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10"
                  }`}
              />
            </div>
            {errors.username && (
              <div className="flex items-center gap-1.5 text-red-400 text-[11px] mt-1.5">
                <IconAlert />{errors.username}
              </div>
            )}
          </div>

          {/* Password */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[10px] uppercase tracking-widest text-[#5A5F70]">
                Contraseña
              </label>
              <span className="text-amber-500 text-[10px] cursor-pointer hover:underline underline-offset-2">
                ¿Olvidaste tu acceso?
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A5F70]">
                <IconLock />
              </span>
              <input
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={handleKey}
                autoComplete="current-password"
                className={`w-full bg-[#111318] border text-white font-mono text-sm pl-10 pr-10 py-3.5 outline-none transition-all duration-200 placeholder:text-[#5A5F70]/60 rounded-none
                  ${errors.password
                    ? "border-red-500 focus:ring-2 focus:ring-red-500/10"
                    : "border-[#1E2128] focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10"
                  }`}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPass(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5A5F70] hover:text-amber-500 transition-colors duration-200"
              >
                <IconEye off={showPass} />
              </button>
            </div>
            {errors.password && (
              <div className="flex items-center gap-1.5 text-red-400 text-[11px] mt-1.5">
                <IconAlert />{errors.password}
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-[#0A0C0F] font-sans font-bold text-sm uppercase tracking-wider py-4 transition-colors duration-200 flex items-center justify-center gap-2.5 active:scale-[0.98]"
            style={{ clipPath: "polygon(0 0, 95% 0, 100% 20%, 100% 100%, 5% 100%, 0 80%)" }}
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-[#0A0C0F]/30 border-t-[#0A0C0F] rounded-full animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                Entrar al sistema
                <IconArrow />
              </>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-7 text-[#5A5F70] text-[10px] uppercase tracking-widest">
            <span className="flex-1 h-px bg-[#1E2128]" />
            acceso seguro
            <span className="flex-1 h-px bg-[#1E2128]" />
          </div>

          {/* Footer */}
          <p className="text-center text-[#5A5F70] text-[11px]">
            ¿No tienes cuenta?{" "}
            <span className="text-amber-500 cursor-pointer underline underline-offset-2">
              Contacta a tu administrador
            </span>
          </p>

        </div>
      </div>

    </div>
  );
}