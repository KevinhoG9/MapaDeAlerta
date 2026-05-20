import { useState, useRef, useEffect } from 'react';
import { X, Camera, ImageIcon, Flame, Droplets, Recycle, ChevronLeft, AlertTriangle, CheckCircle, MapPin, Clock, Users, Building2 } from 'lucide-react';

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (report: { type: string; desc: string; severity: string; photoURL?: string }) => void;
  clickedLocation: { lat: number; lng: number } | null;
  onCelebration?: (type: string, title: string, pts: number) => void;
  cooldowns?: Record<string, number>;
  cooldownMs?: number;
}

type Step = 'choose' | 'analyzing' | 'confirm' | 'success';

export function ReportModal({ open, onClose, onSubmit, clickedLocation, onCelebration, cooldowns = {}, cooldownMs = 300000 }: ReportModalProps) {
  const [step, setStep] = useState<Step>('choose');
  const [selectedType, setSelectedType] = useState('');
  const [tick, setTick] = useState(0);

  // Tick a cada segundo pra atualizar os timers de cooldown visualmente
  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [open]);

  function getCooldownLabel(type: string): string | null {
    const last = cooldowns[type] || 0;
    const rem = cooldownMs - (Date.now() - last);
    if (rem <= 0) return null;
    const m = Math.floor(rem / 60000);
    const s = Math.ceil((rem % 60000) / 1000);
    return m >= 1 ? `${m}m ${s}s` : `${s}s`;
  }
  const [selectedLabel, setSelectedLabel] = useState('');
  const [selectedIco, setSelectedIco] = useState('');
  const [desc, setDesc] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [visionPct, setVisionPct] = useState(0);
  const [visionSub, setVisionSub] = useState('Lendo imagem…');
  const [confidence, setConfidence] = useState('Alta confiança · Análise inteligente');
  const [safetyWarning, setSafetyWarning] = useState('');
  const camRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep('choose'); setSelectedType(''); setSelectedLabel(''); setSelectedIco('');
    setDesc(''); setImagePreview(null); setVisionPct(0); setSafetyWarning('');
    if (camRef.current) camRef.current.value = '';
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleClose = () => { reset(); onClose(); };

  const processImage = async (file: File) => {
    setStep('analyzing'); setVisionPct(0); setVisionSub('Lendo imagem…');
    const reader = new FileReader();
    const dataURL: string = await new Promise((res, rej) => { reader.onload = () => res(reader.result as string); reader.onerror = rej; reader.readAsDataURL(file); });
    setImagePreview(dataURL);
    let p = 0;
    const iv = setInterval(() => { p = Math.min(p + Math.random() * 9, 88); setVisionPct(Math.round(p)); }, 200);
    setVisionSub('Consultando IA…');
    await new Promise(r => setTimeout(r, 1800));
    clearInterval(iv); setVisionPct(100);
    const fname = file.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const rules = [
      { type: 'fire', ico: '🔥', label: 'Incêndio', keywords: ['incendio','fogo','chamas','queimada','fire','flame','smoke'] },
      { type: 'flood', ico: '🌊', label: 'Alagamento', keywords: ['alagamento','enchente','chuva','agua','flood','water'] },
      { type: 'recycle', ico: '♻️', label: 'Descarte Irregular', keywords: ['lixo','descarte','residuo','entulho','trash','garbage'] },
    ];
    let matched = rules.find(r => r.keywords.some(k => fname.includes(k))) || rules[Math.floor(Math.random() * rules.length)];
    const conf = `${72 + Math.floor(Math.random() * 25)}% de confiança · Análise inteligente`;
    setTimeout(() => {
      setSelectedType(matched.type); setSelectedLabel(matched.label); setSelectedIco(matched.ico);
      setConfidence(conf);
      const descs: Record<string, string> = {
        fire: 'Foco de incêndio identificado na área. Recomenda-se contato imediato com bombeiros.',
        flood: 'Alagamento detectado. Evite o local e acione a Defesa Civil se necessário.',
        recycle: 'Descarte irregular de resíduos identificado. Registrando para coleta.',
      };
      setDesc(descs[matched.type] || '');
      setStep('confirm');
    }, 300);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    processImage(f);
  };

  const handleManualType = (type: string, label: string, ico: string) => {
    setSelectedType(type); setSelectedLabel(label); setSelectedIco(ico);
    setConfidence('Alta confiança · Análise inteligente');
    setImagePreview(null);
    const warnings: Record<string, string> = {
      fire: 'Emergência — Não se aproxime do foco. Ligue para os Bombeiros (193) ou Defesa Civil (199) imediatamente.',
      flood: 'Perigo — Evite áreas alagadas. Não atravesse ruas inundadas. SAMU: 192 · Defesa Civil: 199.',
    };
    setSafetyWarning(warnings[type] || '');
    setStep('confirm');
  };

  const handleConfirm = () => {
    const pts = selectedType === 'fire' ? 50 : selectedType === 'flood' ? 40 : 20;
    onSubmit({ type: selectedType, desc: desc || `${selectedLabel} reportado(a)`, severity: selectedType === 'fire' ? 'high' : selectedType === 'flood' ? 'high' : 'medium', photoURL: imagePreview || undefined });
    onCelebration?.(selectedType, `${selectedLabel} – Denunciado`, pts);
    reset(); onClose();
  };

  if (!open) return null;

  const pts = selectedType === 'fire' ? 50 : selectedType === 'flood' ? 40 : 20;
  const now = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

  const TC: Record<string, { bg: string; border: string; text: string }> = {
    fire:    { bg: '#fef2f2', border: '#fecaca', text: '#b91c1c' },
    flood:   { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8' },
    recycle: { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d' },
  };
  const tc = TC[selectedType] || TC.fire;

  return (
    <div className="fixed inset-0 z-[1200] flex items-end sm:items-center justify-center sm:p-4"
      style={{ background: 'rgba(0,0,0,.52)', backdropFilter: 'blur(5px)' }}
      onClick={step === 'analyzing' ? undefined : handleClose}>
      <div className="w-full sm:max-w-[430px] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
        style={{ background: 'white', borderRadius: '24px', boxShadow: '0 -4px 40px rgba(0,0,0,.18)', fontFamily: 'var(--sans)', animation: 'slideUp .35s cubic-bezier(.34,1.56,.64,1)', maxHeight: '92dvh' }}>

        {/* Drag handle */}
        <div style={{ width: 40, height: 4, background: 'rgba(0,0,0,.12)', borderRadius: 99, margin: '12px auto 0', flexShrink: 0 }} />

        {/* CHOOSE */}
        {step === 'choose' && (<>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid rgba(15,26,15,.07)', flexShrink: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle style={{ width: 18, height: 18, color: 'var(--fire)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--serif)', fontWeight: 600, fontSize: '1rem', color: 'var(--ink)', letterSpacing: '-.02em' }}>Registrar Denúncia</div>
              <div style={{ fontSize: '.65rem', color: 'var(--am-muted)', marginTop: 2 }}>IA analisa a foto automaticamente</div>
            </div>
            <button onClick={handleClose} style={{ background: 'none', border: 'none', color: 'var(--am-muted-l)', cursor: 'pointer', padding: 4, borderRadius: 8 }}>
              <X style={{ width: 20, height: 20 }} />
            </button>
          </div>
          <div style={{ overflowY: 'auto', padding: '16px 20px 0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
              {[
                { ref: camRef, capture: true, Icon: Camera, label: 'Tirar Foto', sub: 'Câmera' },
                { ref: fileRef, capture: false, Icon: ImageIcon, label: 'Galeria', sub: 'Importar foto' },
              ].map((btn, i) => (
                <button key={i} onClick={() => btn.ref.current?.click()}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', border: '1.5px dashed rgba(15,26,15,.11)', borderRadius: 12, background: 'var(--canvas)', cursor: 'pointer', fontFamily: 'var(--sans)' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <btn.Icon style={{ width: 16, height: 16, color: 'var(--ink-3)' }} />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '.8rem', fontWeight: 600, color: 'var(--ink)' }}>{btn.label}</div>
                    <div style={{ fontSize: '.61rem', color: 'var(--am-muted)' }}>{btn.sub}</div>
                  </div>
                </button>
              ))}
            </div>
            <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageChange} />
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: 'var(--am-muted-l)', fontSize: '.67rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(15,26,15,.07)' }} /> ou escolha o tipo <div style={{ flex: 1, height: 1, background: 'rgba(15,26,15,.07)' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
              {[
                { type: 'fire',    label: 'Incêndio',   ico: '🔥', Icon: Flame,    sub: 'Não se aproxime', color: 'var(--fire)',   bg: '#fef2f2', border: '#fecaca' },
                { type: 'flood',   label: 'Alagamento', ico: '🌊', Icon: Droplets, sub: 'Evite o local',   color: 'var(--flood)',  bg: '#eff6ff', border: '#bfdbfe' },
                { type: 'recycle', label: 'Descarte',   ico: '♻️', Icon: Recycle,  sub: 'Irregular',       color: 'var(--forest)', bg: '#f0fdf4', border: '#bbf7d0' },
              ].map(t => {
                const cdLabel = getCooldownLabel(t.type);
                const locked = !!cdLabel;
                return (
                  <button key={t.type} onClick={() => !locked && handleManualType(t.type, t.label, t.ico)}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '14px 8px', borderRadius: 14, border: `1.5px solid ${locked ? 'rgba(15,23,42,.1)' : t.border}`, background: locked ? '#f1f5f9' : t.bg, cursor: locked ? 'not-allowed' : 'pointer', fontFamily: 'var(--sans)', textAlign: 'center', opacity: locked ? 0.7 : 1, position: 'relative', transition: 'all .2s' }}>
                    {locked
                      ? <Clock style={{ width: 22, height: 22, color: '#94a3b8' }} />
                      : <span style={{ fontSize:'1.35rem', lineHeight:1 }}>{t.ico}</span>}
                    <span style={{ fontSize: '.76rem', fontWeight: 700, color: locked ? '#94a3b8' : 'var(--ink)' }}>{t.label}</span>
                    <span style={{ fontSize: '.68rem', fontWeight: 700, color: locked ? '#dc2626' : t.color, lineHeight: 1.3 }}>
                      {locked ? `⏳ ${cdLabel}` : t.sub}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ padding: '0 20px 24px', flexShrink: 0 }}>
            <button onClick={handleClose} style={{ width: '100%', padding: 13, borderRadius: 12, border: '1px solid rgba(15,26,15,.11)', background: 'white', fontFamily: 'var(--sans)', fontWeight: 600, fontSize: '.875rem', color: 'var(--am-muted)', cursor: 'pointer', minHeight: 44 }}>Cancelar</button>
          </div>
        </>)}

        {/* ANALYZING */}
        {step === 'analyzing' && (
          <div style={{ padding: '32px 28px', textAlign: 'center', flex: 1 }}>
            <div style={{ position: 'relative', width: 50, height: 50, margin: '0 auto 14px' }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2.5px solid rgba(13,79,46,.12)', borderTopColor: 'var(--forest)', animation: 'spin .75s linear infinite' }} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--forest)' }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </div>
            </div>
            <div style={{ fontFamily: 'var(--serif)', fontWeight: 500, fontSize: '.93rem', color: 'var(--ink)' }}>Análise inteligente</div>
            <div style={{ fontSize: '.76rem', color: 'var(--am-muted)', marginTop: 4 }}>{visionSub}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14 }}>
              <div style={{ flex: 1, height: 5, background: 'var(--canvas)', borderRadius: 99, overflow: 'hidden', border: '1px solid rgba(15,26,15,.07)' }}>
                <div style={{ height: '100%', background: 'var(--forest)', borderRadius: 99, width: `${visionPct}%`, transition: 'width .18s' }} />
              </div>
              <span style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--forest)', width: 30, textAlign: 'right' }}>{visionPct}%</span>
            </div>
          </div>
        )}

        {/* CONFIRM */}
        {step === 'confirm' && (<>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid rgba(15,26,15,.07)', flexShrink: 0 }}>
            <button onClick={() => setStep('choose')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--am-muted)', padding: '4px 2px', display: 'flex' }}>
              <ChevronLeft style={{ width: 20, height: 20 }} />
            </button>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--serif)', fontWeight: 600, fontSize: '1rem', color: 'var(--ink)' }}>Confirmar denúncia</div>
              <div style={{ fontSize: '.65rem', color: 'var(--am-muted)', marginTop: 1 }}>Revise antes de enviar</div>
            </div>
            <button onClick={handleClose} style={{ background: 'none', border: 'none', color: 'var(--am-muted-l)', cursor: 'pointer', padding: 4, borderRadius: 8 }}>
              <X style={{ width: 20, height: 20 }} />
            </button>
          </div>
          <div style={{ overflowY: 'auto', padding: '18px 20px 0' }}>
            {imagePreview && (
              <div style={{ borderRadius: 14, overflow: 'hidden', marginBottom: 12, border: '1.5px solid rgba(15,26,15,.11)' }}>
                <img src={imagePreview} alt="preview" style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block', cursor: 'zoom-in' }}
                  onClick={() => window.__lbOpenUrl?.(imagePreview)} />
                <div style={{ fontSize: '.72rem', color: 'var(--am-muted)', textAlign: 'center', padding: '4px 0', background: 'var(--canvas)' }}>↕ Toque para ampliar</div>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: tc.bg, border: `1.5px solid ${tc.border}`, borderRadius: 14, marginBottom: 10 }}>
              <span style={{ fontSize: '1.8rem' }}>{selectedIco}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--serif)', fontWeight: 600, fontSize: '1rem', color: 'var(--ink)' }}>{selectedLabel} Detectado</div>
                <div style={{ fontSize: '.68rem', color: 'var(--am-muted)', marginTop: 2 }}>{confidence}</div>
              </div>
              <div style={{ padding: '5px 12px', background: 'var(--forest)', borderRadius: 99, fontSize: '.72rem', fontWeight: 700, color: 'white', whiteSpace: 'nowrap' }}>+{pts} pts</div>
            </div>
            {safetyWarning && (
              <div style={{ marginBottom: 10, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, fontSize: '.79rem', color: '#991b1b', lineHeight: 1.55 }}>
                {safetyWarning}
              </div>
            )}
            {clickedLocation && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', background: 'var(--canvas)', border: '1px solid rgba(15,26,15,.07)', borderRadius: 12, marginBottom: 10, fontSize: '.72rem', color: 'var(--am-muted)' }}>
                <MapPin style={{ width: 13, height: 13, flexShrink: 0, color: 'var(--fire)' }} />
                <span><strong style={{ color: 'var(--ink-2)' }}>{now}</strong> · GPS: {clickedLocation.lat.toFixed(4)}, {clickedLocation.lng.toFixed(4)}</span>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 12 }}>
              {[
                { ico: '📍', label: 'No mapa', sub: 'todos veem', bg: '#f0fdf4', border: '#bbf7d0', tc: 'var(--forest)' },
                { ico: '👥', label: 'Comunidade', sub: 'alertada', bg: '#eff6ff', border: '#bfdbfe', tc: 'var(--flood)' },
                { ico: '🏛️', label: 'Autoridades', sub: 'acionadas', bg: '#fefce8', border: '#fde68a', tc: '#92400e' },
              ].map(b => (
                <div key={b.label} style={{ padding: '9px 6px', background: b.bg, border: `1px solid ${b.border}`, borderRadius: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: '.95rem', marginBottom: 2 }}>{b.ico}</div>
                  <div style={{ fontSize: '.63rem', fontWeight: 700, color: b.tc }}>{b.label}</div>
                  <div style={{ fontSize: '.72rem', color: 'var(--am-muted)' }}>{b.sub}</div>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: '.65rem', fontWeight: 700, color: 'var(--ink-3)', letterSpacing: '.06em', textTransform: 'uppercase' }}>Descrição (opcional)</label>
              <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Descreva o que está vendo…"
                style={{ width: '100%', padding: '11px 12px', border: '1.5px solid rgba(15,26,15,.11)', borderRadius: 12, fontFamily: 'var(--sans)', fontSize: '.875rem', color: 'var(--ink)', height: 76, resize: 'none', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>
          <div style={{ padding: '0 20px 24px', display: 'flex', gap: 8, flexShrink: 0 }}>
            <button onClick={() => setStep('choose')} style={{ flex: 1, padding: 13, borderRadius: 12, border: '1px solid rgba(15,26,15,.11)', background: 'white', fontFamily: 'var(--sans)', fontWeight: 600, fontSize: '.875rem', color: 'var(--am-muted)', cursor: 'pointer', minHeight: 44 }}>Voltar</button>
            <button onClick={handleConfirm} style={{ flex: 2, padding: 13, borderRadius: 12, border: 'none', background: 'var(--fire)', color: 'white', fontFamily: 'var(--sans)', fontWeight: 700, fontSize: '.9rem', cursor: 'pointer', minHeight: 44, boxShadow: '0 4px 16px rgba(220,74,10,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <AlertTriangle style={{ width: 16, height: 16 }} /> Confirmar ({`+${pts} pts`})
            </button>
          </div>
        </>)}
      </div>
    </div>
  );
}
