import { useState, useEffect } from 'react';
import { Leaf, Mail, Lock, Eye, EyeOff, Flame, Droplets, Recycle, Play, Shield, Users, Clock, MapPin, User } from 'lucide-react';
import { DB, CITIES } from './data';

interface AuthScreenProps {
  onLogin: (user: any) => void;
}

export function AuthScreen({ onLogin }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  // Register fields
  const [regName, setRegName] = useState('');
  const [regCity, setRegCity] = useState('');
  const [customCity, setCustomCity] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regPass2, setRegPass2] = useState('');
  const [showRegPass, setShowRegPass] = useState(false);
  const [terms, setTerms] = useState(false);

  const passStrength = regPass.length === 0 ? 0 : regPass.length < 4 ? 1 : regPass.length < 6 ? 2 : regPass.length < 10 ? 3 : 4;
  const strengthColors = ['', '#ef4444', '#f59e0b', '#22c55e', '#0d4f2e'];
  const strengthWidths = ['0%', '25%', '55%', '80%', '100%'];

  const handleLogin = () => {
    setError('');
    if (!email || !password) { setError('Preencha e-mail e senha.'); return; }
    setLoading(true);
    setTimeout(() => {
      try {
        const user = DB.findUser(email, password);
        DB.setSession(user);
        onLogin(user);
      } catch (e: any) {
        setError(e.message);
      }
      setLoading(false);
    }, 500);
  };

  const handleRegister = () => {
    setError('');
    if (!regName) { setError('Informe seu nome.'); return; }
    if (!regCity) { setError('Selecione sua cidade.'); return; }
    if (regCity === 'Outra cidade' && !customCity.trim()) { setError('Digite o nome da sua cidade.'); return; }
    const finalCity = regCity === 'Outra cidade' ? customCity.trim() : regCity;
    if (!regEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail)) { setError('E-mail inválido.'); return; }
    if (regPass.length < 6) { setError('Senha precisa ter ao menos 6 caracteres.'); return; }
    if (regPass !== regPass2) { setError('As senhas não coincidem.'); return; }
    if (!terms) { setError('Aceite os termos para continuar.'); return; }
    setLoading(true);
    setTimeout(() => {
      try {
        const user = DB.createUser({ name: regName, city: finalCity, email: regEmail, password: regPass });
        DB.setSession(user);
        onLogin(user);
      } catch (e: any) {
        setError(e.message);
      }
      setLoading(false);
    }, 600);
  };

  const handleDemo = () => {
    try {
      const user = DB.findUser('ana@demo.com', 'demo123');
      DB.setSession(user);
      onLogin(user);
    } catch {
      const user = DB.createUser({ name: 'Convidado', city: 'Tianguá', email: 'ana@demo.com', password: 'demo123' });
      DB.setSession(user);
      onLogin(user);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-stretch" style={{ background: 'var(--canvas)', fontFamily: 'var(--sans)', opacity: visible ? 1 : 0, transition: 'opacity .55s ease' }}>
      {/* Left Panel */}
      <div className="hidden md:flex w-[420px] shrink-0 flex-col justify-between relative overflow-hidden" style={{ background: 'var(--forest)', padding: '56px 48px' }}>
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(ellipse at 15% 85%, rgba(34,197,94,.09) 0%, transparent 55%), radial-gradient(ellipse at 85% 15%, rgba(6,30,16,.5) 0%, transparent 50%)' }} />
        <div className="absolute inset-0 opacity-[.035]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 0)', backgroundSize: '22px 22px' }} />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-14">
            <div className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center" style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.15)' }}>
              <Leaf className="w-[1.1rem] h-[1.1rem] text-green-300" />
            </div>
            <span style={{ fontFamily: 'var(--serif)', fontSize: '1.3rem', fontWeight: 600, color: 'white', letterSpacing: '-.025em' }}>AlertaMap</span>
          </div>

          <h1 style={{ fontFamily: 'var(--serif)', fontSize: '2.15rem', fontWeight: 500, color: 'white', lineHeight: 1.22, marginBottom: '16px', letterSpacing: '-.03em' }}>
            Denuncie queimadas, lixo e alagamentos na sua <span className="text-green-300 italic">região em tempo real</span>
          </h1>
          <p style={{ fontSize: '.875rem', color: 'rgba(255,255,255,.5)', lineHeight: 1.75, marginBottom: '44px' }}>
            Plataforma comunitária de monitoramento ambiental da Serra da Ibiapaba. Suas denúncias chegam a autoridades e vizinhos em segundos.
          </p>

          <div className="flex flex-col gap-[7px]">
            {[
              { Icon: Flame, cls: 'fire', label: 'Incêndios e queimadas', sub: 'Alertas em tempo real para toda a região', iconColor: '#fb923c', bg: 'rgba(220,74,10,.18)' },
              { Icon: Droplets, cls: 'flood', label: 'Alagamentos', sub: 'Mapa interativo com ocorrências ao vivo', iconColor: '#60a5fa', bg: 'rgba(29,78,216,.18)' },
              { Icon: Recycle, cls: 'eco', label: 'Descartes irregulares', sub: 'Ganhe EcoPoints e troque por recompensas', iconColor: '#86efac', bg: 'rgba(34,197,94,.12)' },
            ].map(f => (
              <div key={f.cls} className="flex items-center gap-3 rounded-[12px] transition-colors" style={{ padding: '10px 14px', background: 'rgba(255,255,255,.055)', border: '1px solid rgba(255,255,255,.07)' }}>
                <div className="w-[30px] h-[30px] rounded-lg flex items-center justify-center shrink-0" style={{ background: f.bg }}>
                  <f.Icon className="w-[.95rem] h-[.95rem]" style={{ color: f.iconColor }} />
                </div>
                <div>
                  <b className="block text-white" style={{ fontSize: '.8rem' }}>{f.label}</b>
                  <span style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.42)' }}>{f.sub}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex gap-9 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,.09)' }}>
          {[{ num: '1.2k+', lbl: 'Usuários ativos' }, { num: '8', lbl: 'Cidades' }, { num: '24/7', lbl: 'Monitoramento' }].map(s => (
            <div key={s.lbl}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 500, color: 'white', letterSpacing: '-.025em' }}>{s.num}</div>
              <div style={{ fontSize: '.62rem', color: 'rgba(255,255,255,.38)', textTransform: 'uppercase', letterSpacing: '.09em', marginTop: '3px' }}>{s.lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
        <div className="w-full max-w-[375px]">
          {/* Mobile Logo */}
          <div className="flex items-center gap-[10px] mb-9 md:hidden">
            <div className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center text-white" style={{ background: 'var(--forest)' }}>
              <Leaf className="w-[.95rem] h-[.95rem]" />
            </div>
            <span style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-.02em' }}>AlertaMap</span>
          </div>

          {mode === 'login' ? (
            <div>
              <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.65rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px', letterSpacing: '-.03em' }}>Bem-vindo de volta</h2>
              <p style={{ fontSize: '.875rem', color: 'var(--am-muted)', marginBottom: '28px', lineHeight: 1.65 }}>Entre para continuar protegendo sua comunidade</p>

              {error && <div className="animate-[slideDown_.2s_ease-out]" style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '10px 14px', fontSize: '.82rem', color: '#991b1b', marginBottom: '14px' }}>{error}</div>}

              <div className="mb-[14px]">
                <label className="block mb-[6px]" style={{ fontSize: '.67rem', fontWeight: 700, color: 'var(--ink-3)', letterSpacing: '.06em', textTransform: 'uppercase' }}>E-mail</label>
                <div className="relative flex items-center">
                  <span className="absolute left-[11px] z-10 flex items-center pointer-events-none" style={{ color: 'var(--am-muted-l)' }}>
                    <Mail className="w-[15px] h-[15px]" />
                  </span>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    placeholder="seu@email.com" className="w-full outline-none transition-all"
                    style={{ padding: '11px 12px 11px 37px', border: '1.5px solid var(--am-border-m)', borderRadius: '12px', fontFamily: 'var(--sans)', fontSize: '.875rem', background: 'white', color: 'var(--ink)' }}
                  />
                </div>
              </div>

              <div className="mb-[14px]">
                <label className="block mb-[6px]" style={{ fontSize: '.67rem', fontWeight: 700, color: 'var(--ink-3)', letterSpacing: '.06em', textTransform: 'uppercase' }}>Senha</label>
                <div className="relative flex items-center">
                  <span className="absolute left-[11px] z-10 flex items-center pointer-events-none" style={{ color: 'var(--am-muted-l)' }}>
                    <Lock className="w-[15px] h-[15px]" />
                  </span>
                  <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    placeholder="Sua senha" className="w-full outline-none transition-all"
                    style={{ padding: '11px 40px 11px 37px', border: '1.5px solid var(--am-border-m)', borderRadius: '12px', fontFamily: 'var(--sans)', fontSize: '.875rem', background: 'white', color: 'var(--ink)' }}
                  />
                  <button onClick={() => setShowPass(!showPass)} className="absolute right-[10px] border-none bg-transparent p-1 flex items-center cursor-pointer transition-colors" style={{ color: 'var(--am-muted)' }}>
                    {showPass ? <EyeOff className="w-[15px] h-[15px]" /> : <Eye className="w-[15px] h-[15px]" />}
                  </button>
                </div>
              </div>

              <button onClick={handleLogin} disabled={loading} className="w-full border-none cursor-pointer transition-all hover:-translate-y-px active:scale-[.98]"
                style={{ padding: '13px 16px', borderRadius: '12px', fontFamily: 'var(--sans)', fontWeight: 600, fontSize: '.93rem', background: 'var(--forest)', color: 'white', boxShadow: '0 1px 0 rgba(0,0,0,.15), 0 4px 16px rgba(13,79,46,.28)', minHeight: '46px', opacity: loading ? .48 : 1 }}>
                {loading ? 'Aguardando...' : 'Entrar na plataforma'}
              </button>

              <div className="text-center relative my-[18px]">
                <div className="absolute top-1/2 left-0 right-0 h-px" style={{ background: 'var(--am-border)' }} />
                <span className="relative px-3" style={{ background: 'var(--canvas)', fontSize: '.72rem', color: 'var(--am-muted)' }}>ou</span>
              </div>

              <button onClick={handleDemo} className="w-full flex items-center justify-center gap-2 cursor-pointer transition-all hover:border-[var(--forest)] hover:text-[var(--forest)]"
                style={{ padding: '11px 16px', borderRadius: '12px', border: '1.5px solid var(--am-border-m)', background: 'white', fontFamily: 'var(--sans)', fontWeight: 500, fontSize: '.875rem', color: 'var(--am-muted)' }}>
                <Play className="w-[15px] h-[15px]" /> Entrar como convidado (por enquanto)
              </button>

              <p className="text-center mt-5" style={{ fontSize: '.82rem', color: 'var(--am-muted)' }}>
                Não tem conta? <a href="#" onClick={e => { e.preventDefault(); setError(''); setMode('register'); }} style={{ color: 'var(--forest)', fontWeight: 600 }}>Cadastre-se grátis</a>
              </p>
            </div>
          ) : (
            <div>
              <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.65rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px', letterSpacing: '-.03em' }}>Criar conta</h2>
              <p style={{ fontSize: '.875rem', color: 'var(--am-muted)', marginBottom: '28px', lineHeight: 1.65 }}>Junte-se à comunidade da Serra da Ibiapaba</p>

              {error && <div className="animate-[slideDown_.2s_ease-out]" style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '10px 14px', fontSize: '.82rem', color: '#991b1b', marginBottom: '14px' }}>{error}</div>}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="mb-[14px]">
                  <label className="block mb-[6px]" style={{ fontSize: '.67rem', fontWeight: 700, color: 'var(--ink-3)', letterSpacing: '.06em', textTransform: 'uppercase' }}>Nome</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-[11px] z-10 flex items-center pointer-events-none" style={{ color: 'var(--am-muted-l)' }}><User className="w-[15px] h-[15px]" /></span>
                    <input type="text" value={regName} onChange={e => setRegName(e.target.value)} placeholder="Seu nome" className="w-full outline-none"
                      style={{ padding: '11px 12px 11px 37px', border: '1.5px solid var(--am-border-m)', borderRadius: '12px', fontFamily: 'var(--sans)', fontSize: '.875rem', background: 'white', color: 'var(--ink)' }} />
                  </div>
                </div>
                <div className="mb-[14px]">
                  <label className="block mb-[6px]" style={{ fontSize: '.67rem', fontWeight: 700, color: 'var(--ink-3)', letterSpacing: '.06em', textTransform: 'uppercase' }}>Cidade</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-[11px] z-10 flex items-center pointer-events-none" style={{ color: 'var(--am-muted-l)' }}><MapPin className="w-[15px] h-[15px]" /></span>
                    <select value={regCity} onChange={e => { setRegCity(e.target.value); setCustomCity(''); }} className="w-full outline-none cursor-pointer appearance-none"
                      style={{ padding: '11px 12px 11px 37px', border: '1.5px solid var(--am-border-m)', borderRadius: '12px', fontFamily: 'var(--sans)', fontSize: '.875rem', background: 'white', color: 'var(--ink)' }}>
                      <option value="">Selecione</option>
                      {CITIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  {regCity === 'Outra cidade' && (
                    <input
                      type="text"
                      value={customCity}
                      onChange={e => setCustomCity(e.target.value)}
                      placeholder="Digite o nome da sua cidade"
                      autoFocus
                      style={{ marginTop: 8, width: '100%', padding: '11px 12px', border: '1.5px solid var(--am-border-m)', borderRadius: '12px', fontFamily: 'var(--sans)', fontSize: '.875rem', background: 'white', color: 'var(--ink)', outline: 'none', boxSizing: 'border-box' }}
                    />
                  )}
                </div>
              </div>

              <div className="mb-[14px]">
                <label className="block mb-[6px]" style={{ fontSize: '.67rem', fontWeight: 700, color: 'var(--ink-3)', letterSpacing: '.06em', textTransform: 'uppercase' }}>E-mail</label>
                <div className="relative flex items-center">
                  <span className="absolute left-[11px] z-10 flex items-center pointer-events-none" style={{ color: 'var(--am-muted-l)' }}><Mail className="w-[15px] h-[15px]" /></span>
                  <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="seu@email.com" className="w-full outline-none"
                    style={{ padding: '11px 12px 11px 37px', border: '1.5px solid var(--am-border-m)', borderRadius: '12px', fontFamily: 'var(--sans)', fontSize: '.875rem', background: 'white', color: 'var(--ink)' }} />
                </div>
              </div>

              <div className="mb-[14px]">
                <label className="block mb-[6px]" style={{ fontSize: '.67rem', fontWeight: 700, color: 'var(--ink-3)', letterSpacing: '.06em', textTransform: 'uppercase' }}>Senha</label>
                <div className="relative flex items-center">
                  <span className="absolute left-[11px] z-10 flex items-center pointer-events-none" style={{ color: 'var(--am-muted-l)' }}><Lock className="w-[15px] h-[15px]" /></span>
                  <input type={showRegPass ? 'text' : 'password'} value={regPass} onChange={e => setRegPass(e.target.value)} placeholder="Mín. 6 caracteres" className="w-full outline-none"
                    style={{ padding: '11px 40px 11px 37px', border: '1.5px solid var(--am-border-m)', borderRadius: '12px', fontFamily: 'var(--sans)', fontSize: '.875rem', background: 'white', color: 'var(--ink)' }} />
                  <button onClick={() => setShowRegPass(!showRegPass)} className="absolute right-[10px] border-none bg-transparent p-1 cursor-pointer" style={{ color: 'var(--am-muted)' }}>
                    {showRegPass ? <EyeOff className="w-[15px] h-[15px]" /> : <Eye className="w-[15px] h-[15px]" />}
                  </button>
                </div>
                <div className="h-[3px] rounded-full mt-[6px] overflow-hidden" style={{ background: 'var(--am-border)' }}>
                  <div className="h-full rounded-full transition-all duration-300" style={{ width: strengthWidths[passStrength], background: strengthColors[passStrength] }} />
                </div>
              </div>

              <div className="mb-[14px]">
                <label className="block mb-[6px]" style={{ fontSize: '.67rem', fontWeight: 700, color: 'var(--ink-3)', letterSpacing: '.06em', textTransform: 'uppercase' }}>Confirmar senha</label>
                <div className="relative flex items-center">
                  <span className="absolute left-[11px] z-10 flex items-center pointer-events-none" style={{ color: 'var(--am-muted-l)' }}><Lock className="w-[15px] h-[15px]" /></span>
                  <input type="password" value={regPass2} onChange={e => setRegPass2(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleRegister()} placeholder="Repita a senha" className="w-full outline-none"
                    style={{ padding: '11px 12px 11px 37px', border: '1.5px solid var(--am-border-m)', borderRadius: '12px', fontFamily: 'var(--sans)', fontSize: '.875rem', background: 'white', color: 'var(--ink)' }} />
                </div>
              </div>

              <div className="flex items-start gap-2 mb-[18px]">
                <input type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)} className="w-[15px] h-[15px] mt-[2px] shrink-0" style={{ accentColor: 'var(--forest)' }} />
                <span style={{ fontSize: '.8rem', color: 'var(--am-muted)', lineHeight: 1.55 }}>Concordo com os <a href="#" style={{ color: 'var(--forest)', fontWeight: 600 }}>Termos de Uso</a> e <a href="#" style={{ color: 'var(--forest)', fontWeight: 600 }}>Política de Privacidade</a></span>
              </div>

              <button onClick={handleRegister} disabled={loading} className="w-full border-none cursor-pointer transition-all hover:-translate-y-px active:scale-[.98]"
                style={{ padding: '13px 16px', borderRadius: '12px', fontFamily: 'var(--sans)', fontWeight: 600, fontSize: '.93rem', background: 'var(--forest)', color: 'white', boxShadow: '0 1px 0 rgba(0,0,0,.15), 0 4px 16px rgba(13,79,46,.28)', minHeight: '46px', opacity: loading ? .48 : 1 }}>
                {loading ? 'Aguardando...' : 'Criar conta grátis'}
              </button>

              <p className="text-center mt-5" style={{ fontSize: '.82rem', color: 'var(--am-muted)' }}>
                Já tem conta? <a href="#" onClick={e => { e.preventDefault(); setError(''); setMode('login'); }} style={{ color: 'var(--forest)', fontWeight: 600 }}>Entrar</a>
              </p>
            </div>
          )}

          <div className="flex justify-center gap-4 mt-6 pt-5 flex-wrap" style={{ borderTop: '1px solid var(--am-border)' }}>
            {[
              { Icon: Shield, label: 'Dados seguros' },
              { Icon: Users, label: '+1.200 usuários' },
              { Icon: Clock, label: 'Monitoramento 24/7' },
            ].map(b => (
              <span key={b.label} className="flex items-center gap-[5px]" style={{ fontSize: '.7rem', color: 'var(--am-muted-l)' }}>
                <b.Icon className="w-3 h-3" /> {b.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
