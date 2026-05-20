import { useState, useEffect, useCallback, useRef } from 'react';
import { Leaf, Flame, Droplets, Recycle, Map as MapIco, Thermometer, MapPin, AlertTriangle, Zap, Moon, Sun, ChevronRight, ShieldCheck, Users, PlayCircle, Sparkles, TrendingUp, X, Gift, Coffee, ShoppingCart, Sprout, Ticket, Scissors, Bike, Utensils, Flower2, BookOpen, Home, Target, ClipboardCheck, BadgeCheck, CheckSquare, BarChart3 } from 'lucide-react';
import { AuthScreen } from './components/auth-screen';
import { Sidebar, CitizenCardModal } from './components/sidebar';
import { MapView } from './components/map-view';
import { ChatPanel } from './components/chat-panel';
import { ReportModal } from './components/report-modal';
import { DB, seedDemo, SAMPLE_INCIDENTS, POINT_MAP, REWARDS, getLevel, getNextLevel, getLevelIndex, type Incident, type User } from './components/data';
import { rankBronze, rankPrata, rankOuro, rankRubi, rankSafira, rankAmetista, rankDiamante } from './assets/rankData';

seedDemo();

const MS_DAY  = 86_400_000;
const MS_WEEK = 604_800_000;
const IBIAPABA_CENTER = { lat: -3.9256, lng: -40.8886 };
const DIVISION_STAGES = [
  { name: 'Bronze', min: 0, color: '#b9804f', accent: '#e7b07d', glow: 'rgba(185,128,79,.34)', badge: rankBronze },
  { name: 'Prata', min: 450, color: '#94a3b8', accent: '#d6dee8', glow: 'rgba(148,163,184,.35)', badge: rankPrata },
  { name: 'Ouro', min: 900, color: '#d4a017', accent: '#ffe082', glow: 'rgba(212,160,23,.32)', badge: rankOuro },
  { name: 'Rubi', min: 1600, color: '#dc2626', accent: '#fca5a5', glow: 'rgba(220,38,38,.32)', badge: rankRubi },
  { name: 'Safira', min: 2600, color: '#2563eb', accent: '#93c5fd', glow: 'rgba(37,99,235,.35)', badge: rankSafira },
  { name: 'Ametista', min: 4000, color: '#7c3aed', accent: '#ddd6fe', glow: 'rgba(124,58,237,.38)', badge: rankAmetista },
  { name: 'Diamante', min: 6000, color: '#0ea5e9', accent: '#e0f2fe', glow: 'rgba(14,165,233,.38)', badge: rankDiamante },
] as const;

function getDivisionStage(points: number) {
  for (let i = DIVISION_STAGES.length - 1; i >= 0; i--) {
    if (points >= DIVISION_STAGES[i].min) return DIVISION_STAGES[i];
  }
  return DIVISION_STAGES[0];
}


function RewardModalIcon({ reward, size = 74 }: { reward: any; size?: number }) {
  const iconMap: Record<string, any> = {
    r1: { Icon: Coffee, color: '#8b5e34', bg: 'linear-gradient(145deg, rgba(139,94,52,.22), rgba(245,222,179,.16))' },
    r2: { Icon: ShoppingCart, color: '#2563eb', bg: 'linear-gradient(145deg, rgba(37,99,235,.20), rgba(147,197,253,.14))' },
    r3: { Icon: Sprout, color: '#16a34a', bg: 'linear-gradient(145deg, rgba(22,163,74,.22), rgba(187,247,208,.14))' },
    r4: { Icon: Ticket, color: '#e11d48', bg: 'linear-gradient(145deg, rgba(225,29,72,.20), rgba(253,164,175,.14))' },
    r5: { Icon: Scissors, color: '#7c3aed', bg: 'linear-gradient(145deg, rgba(124,58,237,.20), rgba(196,181,253,.14))' },
    r6: { Icon: Bike, color: '#0891b2', bg: 'linear-gradient(145deg, rgba(8,145,178,.20), rgba(103,232,249,.14))' },
    r7: { Icon: Utensils, color: '#d97706', bg: 'linear-gradient(145deg, rgba(217,119,6,.20), rgba(253,230,138,.14))' },
    r8: { Icon: Flower2, color: '#059669', bg: 'linear-gradient(145deg, rgba(5,150,105,.20), rgba(167,243,208,.14))' },
    r9: { Icon: BookOpen, color: '#4f46e5', bg: 'linear-gradient(145deg, rgba(79,70,229,.20), rgba(199,210,254,.14))' },
    r10:{ Icon: Home, color: '#b45309', bg: 'linear-gradient(145deg, rgba(180,83,9,.20), rgba(254,215,170,.14))' },
  };
  const cfg = iconMap[reward?.id] || { Icon: Gift, color: '#0d4f2e', bg: 'linear-gradient(145deg, rgba(13,79,46,.20), rgba(34,197,94,.14))' };
  return (
    <div style={{ width:size,height:size,borderRadius:24,margin:'0 auto 14px',display:'flex',alignItems:'center',justifyContent:'center',background:cfg.bg,border:`1px solid ${cfg.color}38`,boxShadow:`0 18px 44px ${cfg.color}24`,position:'relative',overflow:'hidden' }}>
      <span style={{ position:'absolute',inset:-20,background:`radial-gradient(circle at 35% 25%, rgba(255,255,255,.34), transparent 38%)` }} />
      <cfg.Icon style={{ position:'relative',zIndex:1,width:size*.42,height:size*.42,color:cfg.color,strokeWidth:2.35 }} />
    </div>
  );
}

function MissionTypeIcon({ kind, complete = false }: { kind: string; complete?: boolean }) {
  const map: Record<string, any> = {
    report: { Icon: MapPin, color: '#ef4444' },
    map: { Icon: MapIco, color: '#2563eb' },
    recycle: { Icon: Recycle, color: '#16a34a' },
    resolve: { Icon: ShieldCheck, color: '#0d4f2e' },
    ai: { Icon: Sparkles, color: '#7c3aed' },
  };
  const cfg = complete ? { Icon: BadgeCheck, color: '#ffffff' } : (map[kind] || map.report);
  return <cfg.Icon style={{ width:19,height:19,color:cfg.color,strokeWidth:2.5 }} />;
}


/* ═══ ONBOARDING ═══ */
const OB_STEPS = [
  { title:'Bem-vindo ao AlertaMap!', desc:'Sua ferramenta de denúncia ambiental em tempo real. Juntos protegemos a Serra da Ibiapaba.' },
  { title:'Denuncie em segundos', desc:'Viu um incêndio, alagamento ou descarte? Registre no mapa automaticamente.' },
  { title:'Ganhe EcoPoints reais', desc:'Pontos trocáveis por café, descontos e muito mais em parceiros locais.' },
  { title:'EcoAI está aqui', desc:'Dúvidas sobre reciclagem ou emergências? O assistente responde 24h.' },
];
function Onboarding({ onFinish, dm }: { onFinish: () => void; dm: boolean }) {
  const [step, setStep] = useState(0);
  const s = OB_STEPS[step];
  const bg = dm ? '#1a1a2e' : 'white';
  const ink = dm ? '#e8f0e8' : '#0e1a0e';
  const muted = dm ? 'rgba(255,255,255,.5)' : '#6b7c6b';
  const StepIcon = [MapIco, AlertTriangle, Zap, Sparkles][step] || Leaf;
  const stepTone = ['#22c55e', '#f97316', '#2563eb', '#7c3aed'][step] || '#22c55e';
  return (
    <div style={{ position:'fixed',inset:0,zIndex:9998,display:'flex',alignItems:'flex-end',justifyContent:'center',padding:20,background:'rgba(6,20,10,.88)',backdropFilter:'blur(12px)' }}>
      <div style={{ background:bg,borderRadius:28,width:'100%',maxWidth:400,padding:'32px 28px 24px',textAlign:'center',boxShadow:'0 20px 60px rgba(0,0,0,.3)',animation:'slideUp .4s cubic-bezier(.34,1.56,.64,1)',fontFamily:'var(--sans)' }}>
        <div style={{ width:78,height:78,borderRadius:26,margin:'0 auto 16px',display:'flex',alignItems:'center',justifyContent:'center',background:`radial-gradient(circle at 32% 20%, rgba(255,255,255,.36), transparent 34%), linear-gradient(145deg, ${stepTone}24, ${stepTone}0c)`,border:`1px solid ${stepTone}36`,boxShadow:`0 18px 44px ${stepTone}24` }}>
          <StepIcon style={{ width:34,height:34,color:stepTone,strokeWidth:2.4 }} />
        </div>
        <h3 style={{ fontFamily:'var(--serif)',fontSize:'1.2rem',fontWeight:500,color:ink,marginBottom:8 }}>{s.title}</h3>
        <p style={{ fontSize:'.9rem',color:muted,lineHeight:1.7,minHeight:64 }}>{s.desc}</p>
        <div style={{ display:'flex',justifyContent:'center',gap:8,margin:'20px 0 16px' }}>
          {OB_STEPS.map((_,i) => <div key={i} onClick={() => setStep(i)} style={{ height:8,borderRadius:4,background:i===step?'var(--forest)':'rgba(15,26,15,.12)',width:i===step?22:8,transition:'all .3s',cursor:'pointer' }}/>)}
        </div>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <button onClick={onFinish} style={{ background:'none',border:'none',fontFamily:'var(--sans)',fontSize:'.88rem',color:muted,cursor:'pointer' }}>Pular</button>
          <button onClick={() => step < OB_STEPS.length-1 ? setStep(s=>s+1) : onFinish()} style={{ padding:'11px 26px',borderRadius:99,border:'none',fontFamily:'var(--sans)',fontWeight:600,fontSize:'.92rem',background:'var(--forest)',color:'white',cursor:'pointer' }}>
            {step < OB_STEPS.length-1 ? 'Próximo →' : 'Começar!'}
          </button>
        </div>
      </div>
    </div>
  );
}


/* ═══ STORY INTRO ═══ */
const STORY_BEATS = [
  {
    tag: 'Antes de tudo…',
    title: 'Você sabia que muitos problemas ambientais começam com um silêncio?',
    lead: 'Quando ninguém denuncia, o fogo cresce, o lixo se espalha e o risco chega mais perto da comunidade.',
    bubbles: [
      { who: 'bot', text: 'Você sabia que queimadas, alagamentos e descartes irregulares afetam milhares de comunidades no Brasil todos os anos?' },
      { who: 'user', text: 'E como a população consegue agir rápido antes que o problema piore?' },
      { who: 'bot', text: 'Foi exatamente para isso que o AlertaMap foi desenvolvido: transformar atenção da comunidade em ação imediata.' },
    ],
    highlights: ['Alertas em tempo real', 'Mapa colaborativo', 'Comunidade + autoridades'],
  },
  {
    tag: 'Como funciona',
    title: 'Uma denúncia pode virar resposta em poucos toques.',
    lead: 'Com o AlertaMap, cada ocorrência entra no mapa, alerta pessoas próximas e ajuda a priorizar a resposta certa.',
    bubbles: [
      { who: 'user', text: 'Então eu posso registrar incêndio, alagamento ou descarte pelo celular?' },
      { who: 'bot', text: 'Sim. Você envia a denúncia, acompanha o mapa e ainda fortalece a rede de proteção da sua região.' },
    ],
    highlights: ['Denunciar em segundos', 'Acompanhar no mapa', 'Registro com foto e localização'],
  },
  {
    tag: 'Comunidade',
    title: 'Seu impacto fica visível — e reconhecido.',
    lead: 'Usuários acumulam EcoPoints, sobem de divisão e constroem um histórico real de contribuição ambiental.',
    bubbles: [
      { who: 'bot', text: 'Cada ação registrada ajuda a criar uma cidade mais segura, limpa e conectada.' },
      { who: 'user', text: 'Então meu progresso acompanha o que eu realmente fiz dentro do app?' },
      { who: 'bot', text: 'Exatamente. Nada fake: o card usa os dados reais das suas ações.' },
    ],
    highlights: ['EcoPoints reais', 'Ranking por contribuição', 'Cards por divisão'],
  },
  {
    tag: 'Hora de entrar',
    title: 'Agora é a sua vez de fazer parte dessa mudança.',
    lead: 'Crie sua conta, entre como convidado por enquanto e comece a proteger sua comunidade hoje mesmo.',
    bubbles: [
      { who: 'bot', text: 'Quanto mais pessoas participam, mais rápido a comunidade consegue reagir.' },
      { who: 'user', text: 'Bora. Quero fazer parte de um mundo melhor.' },
    ],
    highlights: ['Cadastro rápido', 'Login ou convidado', 'Experiência completa no app'],
  },
];

function StoryIntro({ onContinue }: { onContinue: () => void }) {
  const [step, setStep] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const beat = STORY_BEATS[step];

  useEffect(() => {
    if (step >= STORY_BEATS.length - 1) return;
    const timer = setTimeout(() => setStep(s => Math.min(s + 1, STORY_BEATS.length - 1)), 9000);
    return () => clearTimeout(timer);
  }, [step]);

  const handleContinue = () => {
    setLeaving(true);
    setTimeout(onContinue, 520);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, overflow: 'hidden', fontFamily: 'var(--sans)', background: 'radial-gradient(circle at top, rgba(34,197,94,.15), transparent 30%), linear-gradient(180deg, #07110c 0%, #0b1720 45%, #111827 100%)', opacity: leaving ? 0 : 1, transition: leaving ? 'opacity .5s ease' : 'none' }}>
      <div className="am-story-orb one" />
      <div className="am-story-orb two" />
      <div className="am-story-grid" />

      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ padding: '20px 22px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="am-story-logo">
              <Leaf style={{ width: 20, height: 20 }} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--serif)', color: 'white', fontSize: '1.15rem', fontWeight: 700 }}>AlertaMap</div>
              <div style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.58)', letterSpacing: '.08em', textTransform: 'uppercase' }}>documentário interativo</div>
            </div>
          </div>
          <button onClick={handleContinue} style={{ border: '1px solid rgba(255,255,255,.14)', background: 'rgba(255,255,255,.06)', color: 'rgba(255,255,255,.84)', borderRadius: 999, padding: '10px 14px', cursor: 'pointer', fontWeight: 700 }}>Pular</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 18px 18px' }}>
          <div className="am-story-stage">
            <div className="am-story-badge">{beat.tag}</div>
            <h1 className="am-story-title">{beat.title}</h1>
            <p className="am-story-lead">{beat.lead}</p>

            <div className="am-story-doc-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div className="am-story-mini-icon"><PlayCircle style={{ width: 15, height: 15 }} /></div>
                <strong style={{ color: 'white', fontSize: '.86rem', letterSpacing: '.04em', textTransform: 'uppercase' }}>Narrativa do app</strong>
              </div>
              <div style={{ display: 'grid', gap: 10 }}>
                {beat.bubbles.map((bubble, idx) => (
                  <div key={idx} className={`am-story-bubble ${bubble.who === 'user' ? 'user' : 'bot'}`}>
                    <div className="am-story-bubble-avatar">{bubble.who === 'user' ? 'Você' : 'EcoAI'}</div>
                    <div className="am-story-bubble-text">{bubble.text}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="am-story-highlight-row">
              {beat.highlights.map((item, idx) => (
                <div key={item} className="am-story-highlight" style={{ animationDelay: `${idx * 90}ms` }}>
                  {idx === 0 ? <ShieldCheck style={{ width: 18, height: 18 }} /> : idx === 1 ? <Sparkles style={{ width: 18, height: 18 }} /> : <Users style={{ width: 18, height: 18 }} />}
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: '14px 20px calc(18px + env(safe-area-inset-bottom, 0px))', borderTop: '1px solid rgba(255,255,255,.08)', background: 'linear-gradient(180deg, rgba(7,17,12,0), rgba(7,17,12,.75))' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
            {STORY_BEATS.map((_, i) => <span key={i} style={{ width: i === step ? 28 : 8, height: 8, borderRadius: 999, background: i === step ? 'linear-gradient(90deg, #22c55e, #86efac)' : 'rgba(255,255,255,.18)', transition: 'all .25s' }} />)}
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0} style={{ flexShrink: 0, opacity: step === 0 ? .45 : 1, border: '1px solid rgba(255,255,255,.14)', background: 'rgba(255,255,255,.06)', color: 'white', borderRadius: 18, padding: '14px 16px', cursor: step === 0 ? 'default' : 'pointer', fontWeight: 700 }}>Voltar</button>
            <button onClick={() => step === STORY_BEATS.length - 1 ? handleContinue() : setStep(s => Math.min(s + 1, STORY_BEATS.length - 1))} className="am-story-cta">
              <span>{step === STORY_BEATS.length - 1 ? 'Faça parte de um mundo melhor' : 'Continuar essa jornada'}</span>
              <ChevronRight style={{ width: 18, height: 18 }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══ RANK UP OVERLAY ═══ */
function RankUpOverlay({ data, onClose }: { data: (typeof DIVISION_STAGES[number] & { from: string; points: number }) | null; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!data) return;
    const timer = setTimeout(onClose, 6500);

    // Canvas confetti
    const canvas = canvasRef.current;
    if (!canvas) return () => clearTimeout(timer);
    const ctx = canvas.getContext('2d');
    if (!ctx) return () => clearTimeout(timer);
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const pieces = Array.from({ length: 72 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height,
      w: 6 + Math.random() * 8,
      h: 3 + Math.random() * 5,
      r: Math.random() * Math.PI * 2,
      dr: (Math.random() - 0.5) * 0.18,
      dy: 2.5 + Math.random() * 3.5,
      dx: (Math.random() - 0.5) * 1.5,
      color: [data.color, data.accent, '#22c55e', '#fff', '#fbbf24', '#a78bfa'][Math.floor(Math.random() * 6)],
    }));
    let rafId: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach(p => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.85;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
        p.x += p.dx; p.y += p.dy; p.r += p.dr;
        if (p.y > canvas.height) { p.y = -10; p.x = Math.random() * canvas.width; }
      });
      rafId = requestAnimationFrame(draw);
    };
    draw();
    return () => { clearTimeout(timer); cancelAnimationFrame(rafId); };
  }, [data, onClose]);

  if (!data) return null;

  return (
    <div onClick={onClose} className="am-rankup-backdrop">
      <canvas ref={canvasRef} style={{ position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:1 }} />
      <div onClick={e => e.stopPropagation()} className="am-rankup-shell" style={{ position:'relative',zIndex:2, ['--rank' as any]: data.color, ['--rank2' as any]: data.accent, ['--rankGlow' as any]: data.glow }}>
        <div className="am-rankup-burst" />
        <div className="am-rankup-kicker"><Sparkles style={{ width:14,height:14,verticalAlign:"-2px",marginRight:6 }}/> Subida de ranking!</div>
        <div className="am-rankup-badge-wrap">
          <img src={data.badge} alt={data.name} className="am-rankup-badge" />
        </div>
        <h3 className="am-rankup-title">Você alcançou {data.name}!</h3>
        <p className="am-rankup-copy">Sua dedicação te levou de <strong>{data.from}</strong> para <strong style={{ color: data.color }}>{data.name}</strong>. Continue denunciando e protegendo a Ibiapaba.</p>
        <div className="am-rankup-meta">
          <span><Zap style={{ width:14,height:14,verticalAlign:"-2px",marginRight:4 }}/> {data.points.toLocaleString('pt-BR')} EcoPoints</span>
          <span><Leaf style={{ width:14,height:14,verticalAlign:"-2px",marginRight:4 }}/> nova divisão desbloqueada</span>
        </div>
        <button onClick={onClose} className="am-rankup-btn">Continuar protegendo</button>
      </div>
    </div>
  );
}

/* ═══ CELEBRATION ═══ */
function CelebrationOverlay({ data, onClose }: { data:{type:string;title:string;pts:number}|null; onClose:()=>void }) {
  const [progW, setProgW] = useState('100%');
  useEffect(() => {
    if (!data) return;
    setProgW('100%');
    const t1 = setTimeout(() => setProgW('0%'), 80);
    const t2 = setTimeout(onClose, 4800);
    return () => { clearTimeout(t1); clearTimeout(t2); }
  }, [data]);
  if (!data) return null;
  const cfg: Record<string,{bg:string;border:string;color:string;label:string}> = {
    fire:   {bg:'#fef2f2',border:'#fecaca',color:'#dc2626',label:'Incêndio reportado'},
    flood:  {bg:'#eff6ff',border:'#bfdbfe',color:'#1d4ed8',label:'Alagamento reportado'},
    recycle:{bg:'#f0fdf4',border:'#bbf7d0',color:'#15803d',label:'Descarte reportado'},
  };
  const c = cfg[data.type] || cfg.recycle;
  const EventIcon = data.type === 'fire' ? Flame : data.type === 'flood' ? Droplets : Recycle;
  return (
    <div onClick={onClose} style={{ position:'fixed',inset:0,zIndex:9000,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(6,20,10,.6)',backdropFilter:'blur(8px)',fontFamily:'var(--sans)' }}>
      <div onClick={e=>e.stopPropagation()} className="am-celebpop" style={{ background:'white',borderRadius:28,padding:'32px 28px 26px',maxWidth:330,width:'calc(100vw - 48px)',textAlign:'center',boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ position:'relative',width:64,height:64,borderRadius:'50%',margin:'0 auto 18px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.9rem',background:c.bg,border:`2.5px solid ${c.border}` }}>
          <div style={{ position:'absolute',inset:-6,borderRadius:'50%',border:`2px solid ${c.color}`,animation:'celRing 1.8s ease-out infinite' }}/>
          <EventIcon style={{ width:30,height:30,color:c.color,strokeWidth:2.35 }} />
        </div>
        <div style={{ fontSize:'var(--text-sm)',fontWeight:800,letterSpacing:'.09em',textTransform:'uppercase',color:c.color,marginBottom:8 }}>{c.label}</div>
        <div style={{ fontFamily:'var(--serif)',fontSize:'1.15rem',fontWeight:600,color:'#0e1a0e',marginBottom:6 }}>{data.title}</div>
        <div style={{ display:'inline-flex',alignItems:'center',gap:6,padding:'8px 20px',borderRadius:99,fontSize:'var(--text-base)',fontWeight:700,background:c.bg,color:c.color,border:`1.5px solid ${c.border}`,margin:'4px 0 22px' }}><Zap style={{ width:15,height:15 }}/> +{data.pts} EcoPoints</div>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:22 }}>
          {[
            {Icon:MapPin,l:'No mapa',s:'agora',bg:'#f0fdf4',tc:'#15803d'},
            {Icon:Users,l:'Comunidade',s:'alertada',bg:'#eff6ff',tc:'#1d4ed8'},
            {Icon:ShieldCheck,l:'Autoridades',s:'acionadas',bg:'#fefce8',tc:'#92400e'}
          ].map(b=>(
            <div key={b.l} style={{ padding:'11px 6px',background:b.bg,borderRadius:12,textAlign:'center' }}>
              <b.Icon style={{ width:18,height:18,color:b.tc,marginBottom:4 }} />
              <div style={{ fontSize:'var(--text-sm)',fontWeight:700,color:b.tc }}>{b.l}</div>
              <div style={{ fontSize:'.65rem',color:'#6b7c6b',marginTop:2 }}>{b.s}</div>
            </div>
          ))}
        </div>
        <div style={{ height:3,background:'rgba(15,26,15,.1)',borderRadius:99,overflow:'hidden' }}>
          <div style={{ height:'100%',background:c.color,width:progW,transition:'width 4.5s linear',borderRadius:99 }}/>
        </div>
      </div>
    </div>
  );
}

/* ═══ LIGHTBOX ═══ */
function Lightbox({ src, caption, onClose }: { src:string|null; caption?:string; onClose:()=>void }) {
  if (!src) return null;
  return (
    <div onClick={onClose} style={{ position:'fixed',inset:0,zIndex:999999,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'zoom-out',background:'rgba(0,0,0,.88)',backdropFilter:'blur(12px)' }}>
      <img src={src} alt="lightbox" onClick={e=>e.stopPropagation()} style={{ maxWidth:'92vw',maxHeight:'80vh',borderRadius:14,boxShadow:'0 32px 100px rgba(0,0,0,.7)',objectFit:'contain',animation:'popIn .28s cubic-bezier(.34,1.3,.64,1)' }}/>
      {caption && <div style={{ marginTop:14,fontSize:'.85rem',fontWeight:600,color:'rgba(255,255,255,.75)' }}>{caption}</div>}
      <button onClick={onClose} aria-label="Fechar imagem" style={{ position:'absolute',top:18,right:20,background:'rgba(255,255,255,.13)',border:'1px solid rgba(255,255,255,.18)',color:'white',fontSize:'1.1rem',width:40,height:40,borderRadius:'50%',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}><X style={{ width:16,height:16 }}/></button>
    </div>
  );
}

/* ═══ PROFILE MODAL ═══ */
const STD_CITIES = ['Tianguá','Ubajara','São Benedito','Ibiapina','Viçosa do Ceará','Guaraciaba do Norte','Frecheirinha'];

function ProfilePhotoCropper({
  src,
  open,
  dm,
  onCancel,
  onApply,
}: {
  src: string;
  open: boolean;
  dm: boolean;
  onCancel: () => void;
  onApply: (dataUrl: string) => void;
}) {
  const [zoom, setZoom] = useState(1.15);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [natural, setNatural] = useState({ w: 1, h: 1 });
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const cropSize = 292;

  useEffect(() => {
    if (!open) return;
    setZoom(1.15);
    setOffset({ x: 0, y: 0 });
  }, [open, src]);

  if (!open) return null;

  const baseScale = Math.max(cropSize / natural.w, cropSize / natural.h);
  const displayW = natural.w * baseScale * zoom;
  const displayH = natural.h * baseScale * zoom;
  const maxX = Math.max(0, (displayW - cropSize) / 2);
  const maxY = Math.max(0, (displayH - cropSize) / 2);

  const clampOffset = (x: number, y: number) => ({
    x: Math.max(-maxX, Math.min(maxX, x)),
    y: Math.max(-maxY, Math.min(maxY, y)),
  });

  const pointerStart = (clientX: number, clientY: number) => {
    dragRef.current = { x: clientX, y: clientY, ox: offset.x, oy: offset.y };
  };

  const pointerMove = (clientX: number, clientY: number) => {
    const drag = dragRef.current;
    if (!drag) return;
    const next = clampOffset(drag.ox + clientX - drag.x, drag.oy + clientY - drag.y);
    setOffset(next);
  };

  const applyCrop = async () => {
    const img = imgRef.current;
    if (!img) return;

    const output = 640;
    const scale = Math.max(cropSize / img.naturalWidth, cropSize / img.naturalHeight) * zoom;
    const sourceSize = cropSize / scale;
    const sx = (img.naturalWidth / 2) - (cropSize / 2 + offset.x) / scale;
    const sy = (img.naturalHeight / 2) - (cropSize / 2 + offset.y) / scale;

    const canvas = document.createElement('canvas');
    canvas.width = output;
    canvas.height = output;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      img,
      Math.max(0, Math.min(img.naturalWidth - sourceSize, sx)),
      Math.max(0, Math.min(img.naturalHeight - sourceSize, sy)),
      sourceSize,
      sourceSize,
      0,
      0,
      output,
      output
    );

    onApply(canvas.toDataURL('image/jpeg', 0.92));
  };

  const ink = dm ? '#eef2ff' : '#0f172a';
  const muted = dm ? 'rgba(255,255,255,.62)' : '#64748b';
  const panel = dm ? '#10172b' : '#ffffff';
  const border = dm ? 'rgba(255,255,255,.11)' : 'rgba(15,23,42,.12)';

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1800,
        background: 'rgba(0,0,0,.72)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        fontFamily: 'var(--sans)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 430,
          borderRadius: 28,
          background: panel,
          border: `1px solid ${border}`,
          boxShadow: '0 28px 90px rgba(0,0,0,.38)',
          overflow: 'hidden',
          animation: 'popIn .26s cubic-bezier(.34,1.56,.64,1)',
        }}
      >
        <div style={{ padding: '18px 18px 14px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 950, color: ink, fontSize: '1.04rem' }}>Ajustar foto</div>
            <div style={{ marginTop: 3, color: muted, fontSize: '.78rem' }}>Arraste e use o zoom para enquadrar.</div>
          </div>
          <button onClick={onCancel} aria-label="Fechar ajuste" style={{ width: 36, height: 36, borderRadius: '50%', border: `1px solid ${border}`, background: 'transparent', color: ink, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        <div style={{ padding: 18 }}>
          <div
            style={{
              width: cropSize,
              height: cropSize,
              maxWidth: '100%',
              margin: '0 auto',
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 28,
              background: dm ? '#060b18' : '#e5e7eb',
              touchAction: 'none',
              cursor: 'grab',
              boxShadow: 'inset 0 0 0 999px rgba(0,0,0,.05)',
            }}
            onMouseDown={e => pointerStart(e.clientX, e.clientY)}
            onMouseMove={e => pointerMove(e.clientX, e.clientY)}
            onMouseUp={() => (dragRef.current = null)}
            onMouseLeave={() => (dragRef.current = null)}
            onTouchStart={e => {
              const t = e.touches[0];
              if (t) pointerStart(t.clientX, t.clientY);
            }}
            onTouchMove={e => {
              const t = e.touches[0];
              if (t) {
                e.preventDefault();
                pointerMove(t.clientX, t.clientY);
              }
            }}
            onTouchEnd={() => (dragRef.current = null)}
          >
            <img
              ref={imgRef}
              src={src}
              alt="Imagem para recorte"
              draggable={false}
              onLoad={e => setNatural({ w: e.currentTarget.naturalWidth || 1, h: e.currentTarget.naturalHeight || 1 })}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: displayW,
                height: displayH,
                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                userSelect: 'none',
                pointerEvents: 'none',
              }}
            />

            <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 0 999px rgba(0,0,0,.30)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', inset: 18, borderRadius: 22, border: '2px solid rgba(255,255,255,.9)', boxShadow: '0 0 0 1px rgba(0,0,0,.28), inset 0 0 0 1px rgba(0,0,0,.2)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', left: '33.333%', top: 18, bottom: 18, width: 1, background: 'rgba(255,255,255,.38)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', left: '66.666%', top: 18, bottom: 18, width: 1, background: 'rgba(255,255,255,.38)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: '33.333%', left: 18, right: 18, height: 1, background: 'rgba(255,255,255,.38)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: '66.666%', left: 18, right: 18, height: 1, background: 'rgba(255,255,255,.38)', pointerEvents: 'none' }} />
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: '.72rem', color: muted, fontWeight: 900, letterSpacing: '.08em', textTransform: 'uppercase' }}>Zoom</span>
              <span style={{ fontSize: '.72rem', color: muted, fontWeight: 800 }}>{Math.round(zoom * 100)}%</span>
            </div>
            <input
              type="range"
              min="1"
              max="3"
              step="0.01"
              value={zoom}
              onChange={e => {
                const z = Number(e.target.value);
                setZoom(z);
                setOffset(prev => {
                  const displayW2 = natural.w * baseScale * z;
                  const displayH2 = natural.h * baseScale * z;
                  const mx = Math.max(0, (displayW2 - cropSize) / 2);
                  const my = Math.max(0, (displayH2 - cropSize) / 2);
                  return { x: Math.max(-mx, Math.min(mx, prev.x)), y: Math.max(-my, Math.min(my, prev.y)) };
                });
              }}
              style={{ width: '100%', accentColor: 'var(--forest)' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <button onClick={onCancel} style={{ flex: 1, padding: '12px 14px', borderRadius: 14, border: `1px solid ${border}`, background: 'transparent', color: muted, fontWeight: 900, cursor: 'pointer' }}>Cancelar</button>
            <button onClick={applyCrop} style={{ flex: 1, padding: '12px 14px', borderRadius: 14, border: 'none', background: 'var(--forest)', color: 'white', fontWeight: 950, cursor: 'pointer' }}>Usar foto</button>
          </div>
        </div>
      </div>
    </div>
  );
}


function ProfileModal({ user, open, onClose, onSave, dm }: { user:User; open:boolean; onClose:()=>void; onSave:(u:User)=>void; dm:boolean }) {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [cityOther, setCityOther] = useState('');
  const [pass, setPass] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bio, setBio] = useState('');
  const [profileTitle, setProfileTitle] = useState('');
  const [showImpactCard, setShowImpactCard] = useState(false);
  const [showDivisions, setShowDivisions] = useState(false);
  const [editing, setEditing] = useState(false);
  const [cropSrc, setCropSrc] = useState('');
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  useEffect(() => {
    if (!open) return;
    setName(user.name);
    setPass('');
    setAvatarUrl(user.avatarUrl || '');
    setBio(user.bio || '');
    setProfileTitle(user.profileTitle || 'Guardião ambiental');
    setErr('');
    setOk('');
    setShowImpactCard(false);
    setShowDivisions(false);
    setEditing(false);
    setCropSrc('');
    STD_CITIES.includes(user.city) ? (setCity(user.city), setCityOther('')) : (setCity('Outra'), setCityOther(user.city));
  }, [open, user]);

  if (!open) return null;

  const handleAvatarFile = (file?: File | null) => {
    if (!file) return;
    setErr('');
    if (!file.type.startsWith('image/')) {
      setErr('Escolha uma imagem válida.');
      return;
    }
    if (file.size > 6_000_000) {
      setErr('A imagem está muito pesada. Use uma foto menor que 6 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setCropSrc(String(reader.result || ''));
    reader.onerror = () => setErr('Não consegui carregar essa imagem.');
    reader.readAsDataURL(file);
  };

  const save = () => {
    setErr(''); setOk('');
    if (!name.trim()) { setErr('Nome não pode ser vazio.'); return; }
    if (pass && pass.length < 6) { setErr('Nova senha precisa ter 6+ caracteres.'); return; }
    const patch: any = {
      name: name.trim(),
      city: city === 'Outra' ? (cityOther.trim() || 'Outra') : city,
      avatarUrl: avatarUrl || undefined,
      bio: bio.trim(),
      profileTitle: profileTitle.trim() || 'Guardião ambiental',
    };
    if (pass) patch.passwordHash = btoa(pass);
    const updated = DB.updateUser(user.id, patch);
    if (updated) {
      onSave(updated);
      setOk('Perfil atualizado com sucesso!');
      setTimeout(onClose, 1400);
    }
  };

  const pts = user.ecoPoints || 0;
  const lvl = getDivisionStage(pts);
  const lvlIndex = DIVISION_STAGES.findIndex(d => d.name === lvl.name && d.min === lvl.min);
  const next = DIVISION_STAGES[lvlIndex + 1] ?? null;
  const progress = next ? Math.max(8, Math.min(100, ((pts - lvl.min) / Math.max(next.min - lvl.min, 1)) * 100)) : 100;
  const reports = user.reports || [];
  const totalReports = reports.length || Math.max(4, Math.round(pts / 55));
  const recycleCount = reports.filter(r => r.type === 'recycle').length || Math.max(1, Math.round(totalReports * .34));
  const streak = user.loginStreak || Math.max(2, Math.round(pts / 180));
  const avatar = (user.name || '?').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  const bg = dm ? '#11162a' : 'white';
  const panel = dm ? '#161d36' : '#f8fafc';
  const border = dm ? 'rgba(255,255,255,.08)' : 'rgba(15,26,15,.11)';
  const ink = dm ? '#eef2ff' : '#0f172a';
  const muted = dm ? 'rgba(255,255,255,.55)' : '#64748b';
  const inp = {
    width: '100%', padding: '12px 13px', border: `1.5px solid ${border}`, borderRadius: 14,
    fontFamily: 'var(--sans)', fontSize: '.88rem', color: ink, outline: 'none', boxSizing: 'border-box' as const,
    background: dm ? '#131a31' : 'white'
  };

  const divisionBlurb = {
    Bronze: 'Primeiros passos na proteção ambiental.',
    Prata: 'Participação constante e impacto crescente.',
    Ouro: 'Referência ativa dentro da comunidade.',
    Rubi: 'Alta presença nas ações ambientais.',
    Safira: 'Guardião avançado da Serra da Ibiapaba.',
    Ametista: 'Impacto raro, constante e estratégico.',
    Diamante: 'Elite ambiental do AlertaMap.',
  }[lvl.name] || 'Guardião ambiental em evolução.';

  const profileCardPerson = {
    ...user,
    avatarUrl,
    profileTitle: profileTitle || 'Guardião ambiental',
    city: city === 'Outra' ? (cityOther || user.city) : (city || user.city),
    totalReports,
    fireCount: reports.filter(r => r.type === 'fire').length,
    floodCount: reports.filter(r => r.type === 'flood').length,
    recycleCount,
    resolvedCount: reports.filter(r => String(r.status || '').toLowerCase().includes('resolvido')).length,
    streak,
    impactScore: Math.round((pts / 45) + totalReports * 2),
    accuracy: totalReports ? 96 : 0,
    division: { ...lvl, blurb: divisionBlurb },
    nextDivision: next ? { ...next, blurb: 'Próxima etapa da sua jornada ambiental.' } : null,
    divisionProgress: progress,
    monthlyTrend: 0,
    badges: [],
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,.56)', backdropFilter: 'blur(8px)', fontFamily: 'var(--sans)' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: bg, borderRadius: 28, width: '100%', maxWidth: 500, boxShadow: '0 28px 80px rgba(0,0,0,.28)', animation: 'popIn .32s cubic-bezier(.34,1.56,.64,1)', maxHeight: '92dvh', overflowY: 'auto', border: `1px solid ${border}` }}>
        <div style={{ position: 'relative', padding: '22px 22px 18px', background: `radial-gradient(circle at top left, ${lvl.color}55, transparent 38%), linear-gradient(160deg, ${dm ? '#181f3b' : '#f5f9ff'} 0%, ${bg} 100%)`, borderBottom: `1px solid ${border}` }}>
          <button onClick={onClose} aria-label="Fechar" style={{ position: 'absolute', right: 18, top: 18, width: 36, height: 36, borderRadius: '50%', border: `1px solid ${border}`, background: dm ? 'rgba(255,255,255,.04)' : 'rgba(255,255,255,.75)', color: ink, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X style={{ width:16,height:16 }}/></button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingRight: 38 }}>
            <div style={{ position: 'relative', width: 92, height: 92, flexShrink: 0 }}>
              <div style={{ position: 'absolute', inset: -6, borderRadius: '50%', border: `2px solid ${lvl.color}`, boxShadow: `0 0 0 8px ${dm ? 'rgba(255,255,255,.02)' : 'rgba(255,255,255,.6)'}` }} />
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', background: `linear-gradient(135deg, ${lvl.color}, var(--forest))`, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.65rem', fontWeight: 900, boxShadow: `0 16px 40px ${lvl.color}44` }}>
                {avatarUrl ? <img src={avatarUrl} alt="Foto de perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : avatar}
              </div>
              <div style={{ position: 'absolute', bottom: -3, right: -2, padding: '5px 8px', borderRadius: 999, background: dm ? '#0f172a' : 'white', border: `1px solid ${border}`, fontSize: '.68rem', fontWeight: 800, color: lvl.color }}>Nível {Math.max(1, getLevelIndex(pts) + 1)}</div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: ink, letterSpacing: '-.02em' }}>{user.name}</div>
              <div style={{ marginTop: 4, fontSize: '.82rem', color: muted }}>{profileTitle || 'Guardião ambiental'} · {user.city}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                <span style={{ padding: '6px 10px', borderRadius: 999, background: 'var(--forest)', color: 'white', fontSize: '.76rem', fontWeight: 800, display:'inline-flex',alignItems:'center',gap:5 }}><Zap style={{width:13,height:13}}/> {pts.toLocaleString('pt-BR')} pts</span>
                <span style={{ padding: '6px 10px', borderRadius: 999, background: `${lvl.color}18`, color: lvl.color, fontSize: '.76rem', fontWeight: 800 }}>{lvl.name}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 18 }}>
            {[
              { label: 'Denúncias', value: totalReports },
              { label: 'Reciclagem', value: recycleCount },
              { label: 'Streak', value: `${streak}d` },
              { label: 'Impacto', value: Math.round((pts / 45) + totalReports * 2) },
            ].map(item => (
              <div key={item.label} style={{ padding: '10px 8px', borderRadius: 16, background: dm ? 'rgba(255,255,255,.04)' : 'rgba(255,255,255,.8)', border: `1px solid ${border}`, textAlign: 'center' }}>
                <div style={{ fontSize: '.68rem', color: muted }}>{item.label}</div>
                <div style={{ marginTop: 6, fontWeight: 900, color: ink, fontSize: '.92rem' }}>{item.value}</div>
              </div>
            ))}
          </div>


        </div>

        <div style={{ padding: '20px 22px 22px' }}>
          {!editing && (
            <div style={{
              borderRadius:24,
              padding:16,
              marginBottom:16,
              background:dm
                ? `linear-gradient(145deg, rgba(255,255,255,.045), ${lvl.color}10)`
                : `linear-gradient(145deg, #ffffff, ${lvl.color}08)`,
              border:`1px solid ${lvl.color}2e`,
              boxShadow:dm?'none':`0 14px 34px ${lvl.color}10`
            }}>
              <div style={{ display:'flex',alignItems:'center',gap:14 }}>
                <div style={{ width:66,height:66,borderRadius:22,background:`${lvl.color}12`,display:'flex',alignItems:'center',justifyContent:'center',border:`1px solid ${lvl.color}30`,boxShadow:`0 12px 26px ${lvl.glow}`,flexShrink:0 }}>
                  <img src={lvl.badge} alt={lvl.name} style={{ width:58,height:58,objectFit:'contain',filter:`drop-shadow(0 8px 16px ${lvl.glow})` }} />
                </div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontSize:'.72rem',fontWeight:900,color:lvl.color,textTransform:'uppercase',letterSpacing:'.08em' }}>Central da evolução</div>
                  <div style={{ marginTop:4,fontFamily:'var(--serif)',fontSize:'1.12rem',fontWeight:900,color:ink }}>Divisão {lvl.name}</div>
                  <div style={{ marginTop:4,fontSize:'.78rem',color:muted,lineHeight:1.45 }}>{next ? `${Math.max(next.min - pts, 0).toLocaleString('pt-BR')} pts para ${next.name}` : 'Você atingiu a divisão máxima.'}</div>
                </div>
                <button onClick={() => setShowImpactCard(true)} style={{ padding:'9px 12px',borderRadius:14,border:'none',background:`linear-gradient(135deg, ${lvl.color}, ${lvl.accent})`,color:'white',fontWeight:900,cursor:'pointer',boxShadow:`0 10px 22px ${lvl.glow}`,whiteSpace:'nowrap' }}>
                  Ver carta
                </button>
              </div>

              <div style={{ marginTop:14 }}>
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8 }}>
                  <span style={{ fontSize:'.72rem',fontWeight:900,color:muted,textTransform:'uppercase',letterSpacing:'.06em' }}>Progresso da era</span>
                  <span style={{ fontSize:'.78rem',fontWeight:900,color:lvl.color }}>{Math.round(progress)}%</span>
                </div>
                <div style={{ height:8,borderRadius:999,background:dm?'rgba(255,255,255,.08)':'rgba(15,23,42,.08)',overflow:'hidden' }}>
                  <div style={{ width:`${progress}%`,height:'100%',borderRadius:999,background:`linear-gradient(90deg, ${lvl.color}, ${lvl.accent})`,transition:'width .8s cubic-bezier(.22,1,.36,1)' }} />
                </div>
              </div>

              <div style={{ marginTop:14,display:'grid',gridTemplateColumns:'repeat(3, 1fr)',gap:8 }}>
                {[{l:'EcoPoints',v:pts.toLocaleString('pt-BR')},{l:'Denúncias',v:totalReports},{l:'Streak',v:`${streak}d`}].map(s => (
                  <div key={s.l} style={{ padding:'10px 8px',borderRadius:15,background:dm?'rgba(255,255,255,.04)':'rgba(255,255,255,.72)',border:`1px solid ${border}`,textAlign:'center' }}>
                    <div style={{ fontSize:'.64rem',color:muted,fontWeight:800 }}>{s.l}</div>
                    <div style={{ marginTop:4,fontSize:'.92rem',fontWeight:950,color:ink }}>{s.v}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop:14,display:'flex',gap:8 }}>
                <button onClick={() => setShowDivisions(v => !v)} style={{ flex:1,padding:'10px 12px',borderRadius:14,border:`1px solid ${lvl.color}34`,background:dm?`${lvl.color}12`:`${lvl.color}08`,color:ink,fontWeight:900,cursor:'pointer' }}>{showDivisions ? 'Ocultar divisões' : 'Ver divisões'}</button>
                <button onClick={() => setEditing(true)} style={{ flex:1,padding:'10px 12px',borderRadius:14,border:`1px solid ${border}`,background:dm?'rgba(255,255,255,.045)':'#ffffff',color:ink,fontWeight:900,cursor:'pointer' }}>Editar perfil</button>
              </div>

              {showDivisions && (
                <div style={{ marginTop:14,display:'grid',gridTemplateColumns:'repeat(2, minmax(0,1fr))',gap:10 }}>
                  {DIVISION_STAGES.map(d => {
                    const unlocked = pts >= d.min;
                    const active = d.name === lvl.name && d.min === lvl.min;
                    return (
                      <div key={`${d.name}-${d.min}`} style={{ padding:12,borderRadius:16,border:`1.5px solid ${active ? d.color : (unlocked ? d.color+'44' : border)}`,background:active?`linear-gradient(150deg, ${d.glow}, ${dm?'rgba(255,255,255,.04)':'#fff'})`:(unlocked?`${d.color}10`:'transparent'),opacity:unlocked?1:.42 }}>
                        <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                          <img src={d.badge} alt={d.name} style={{ width:38,height:38,objectFit:'contain' }} />
                          <div>
                            <div style={{ fontSize:'.86rem',color:ink,fontWeight:900 }}>{d.name}</div>
                            <div style={{ fontSize:'.68rem',color:d.color,fontWeight:900 }}>{d.min.toLocaleString('pt-BR')} pts+</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <CitizenCardModal
            person={profileCardPerson as any}
            placement={Math.max(1, Math.round(9000 / Math.max(pts, 300)))}
            open={showImpactCard}
            onClose={() => setShowImpactCard(false)}
            darkMode={dm}
          />

          <ProfilePhotoCropper
            src={cropSrc}
            open={!!cropSrc}
            dm={dm}
            onCancel={() => setCropSrc('')}
            onApply={(dataUrl) => {
              setAvatarUrl(dataUrl);
              setCropSrc('');
              setOk('Foto enquadrada com sucesso!');
            }}
          />

          {err && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 14, padding: '10px 14px', fontSize: '.84rem', color: '#991b1b', marginBottom: 14 }}>{err}</div>}
          {ok && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 14, padding: '10px 14px', fontSize: '.84rem', color: 'var(--forest)', marginBottom: 14 }}>{ok}</div>}

          {editing && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,marginBottom:12 }}>
              <div>
                <div style={{ fontSize: '.78rem', fontWeight: 900, color: ink }}>Editando perfil</div>
                <div style={{ marginTop:3,fontSize:'.72rem',color:muted }}>Atualize foto, nome, cidade e bio.</div>
              </div>
              <button onClick={() => setEditing(false)} style={{ padding:'8px 11px',borderRadius:12,border:`1px solid ${border}`,background:'transparent',color:muted,fontWeight:800,cursor:'pointer' }}>Voltar</button>
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 12, borderRadius: 18, border: `1px solid ${border}`, background: panel }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', background: `linear-gradient(135deg, ${lvl.color}, var(--forest))`, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.25rem', flexShrink: 0 }}>
                  {avatarUrl ? <img src={avatarUrl} alt="Prévia" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : avatar}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '10px 12px', borderRadius: 12, background: 'var(--forest)', color: 'white', fontWeight: 800, fontSize: '.8rem', cursor: 'pointer' }}>
                    Escolher e enquadrar foto
                    <input type="file" accept="image/*" onChange={e => { handleAvatarFile(e.target.files?.[0]); e.currentTarget.value = ''; }} style={{ display: 'none' }} />
                  </label>
                  {avatarUrl && <button onClick={() => setAvatarUrl('')} style={{ marginLeft: 8, padding: '10px 12px', borderRadius: 12, border: `1px solid ${border}`, background: 'transparent', color: muted, fontWeight: 800, cursor: 'pointer' }}>Remover</button>}
                  <div style={{ marginTop: 7, fontSize: '.7rem', color: muted }}>Você vai poder arrastar e dar zoom antes de salvar.</div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: '.72rem', fontWeight: 800, color: ink, letterSpacing: '.06em', textTransform: 'uppercase' }}>Nome</label>
                <input style={inp} value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: '.72rem', fontWeight: 800, color: ink, letterSpacing: '.06em', textTransform: 'uppercase' }}>Título do perfil</label>
                <input style={inp} value={profileTitle} onChange={e => setProfileTitle(e.target.value)} placeholder="Ex: Guardião ambiental, Agente Verde..." />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: '.72rem', fontWeight: 800, color: ink, letterSpacing: '.06em', textTransform: 'uppercase' }}>Bio curta</label>
                <textarea style={{ ...inp, minHeight: 82, resize: 'vertical' }} value={bio} onChange={e => setBio(e.target.value.slice(0, 140))} placeholder="Conte em uma frase seu objetivo ambiental." />
                <div style={{ marginTop: 5, fontSize: '.68rem', color: muted }}>{bio.length}/140</div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: '.72rem', fontWeight: 800, color: ink, letterSpacing: '.06em', textTransform: 'uppercase' }}>Cidade</label>
                <select style={{ ...inp, appearance: 'none', cursor: 'pointer' }} value={city} onChange={e => setCity(e.target.value)}>
                  {STD_CITIES.map(c => <option key={c}>{c}</option>)}
                  <option value="Outra">Outra cidade…</option>
                </select>
                {city === 'Outra' && <input style={{ ...inp, marginTop: 8 }} value={cityOther} onChange={e => setCityOther(e.target.value)} placeholder="Nome da cidade" />}
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: '.72rem', fontWeight: 800, color: ink, letterSpacing: '.06em', textTransform: 'uppercase' }}>Nova senha <span style={{ fontWeight: 500, color: muted }}>(opcional)</span></label>
                <input style={inp} type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="Mín. 6 caracteres" />
              </div>
            </div>
          </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 14, border: `1px solid ${border}`, background: 'transparent', fontFamily: 'var(--sans)', fontWeight: 700, fontSize: '.88rem', color: muted, cursor: 'pointer' }}>{editing ? 'Cancelar' : 'Fechar'}</button>
            {editing && <button onClick={save} style={{ flex: 1, padding: 12, borderRadius: 14, border: 'none', background: 'var(--forest)', color: 'white', fontFamily: 'var(--sans)', fontWeight: 800, fontSize: '.88rem', cursor: 'pointer' }}>Salvar perfil</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══ REDEEM MODAL ═══ */
function RedeemModal({ reward, user, open, onClose, onRedeem, dm }: any) {
  if (!open || !reward) return null;
  const u = DB.getUserById(user.id) || user;
  const redeemed = (u.redeemedRewards || []).includes(reward.id);
  const canAfford = u.ecoPoints >= reward.cost;
  const getCode = () => { const k=`gm_code_${user.id}_${reward.id}`; let c=localStorage.getItem(k); if(!c){c='GM-'+Math.random().toString(36).toUpperCase().slice(2,6)+'-'+Math.random().toString(36).toUpperCase().slice(2,6);localStorage.setItem(k,c);} return c; };
  const bg = dm?'#1a1a2e':'white'; const border = dm?'rgba(255,255,255,.1)':'rgba(15,26,15,.11)'; const ink = dm?'#e8f0e8':'#0e1a0e'; const muted = dm?'rgba(255,255,255,.4)':'#6b7c6b';
  return (
    <div onClick={onClose} style={{ position:'fixed',inset:0,zIndex:1200,display:'flex',alignItems:'center',justifyContent:'center',padding:16,background:'rgba(0,0,0,.48)',backdropFilter:'blur(4px)',fontFamily:'var(--sans)' }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:bg,borderRadius:22,width:'100%',maxWidth:360,boxShadow:'0 20px 60px rgba(0,0,0,.2)',animation:'popIn .3s cubic-bezier(.34,1.56,.64,1)' }}>
        <div style={{ display:'flex',alignItems:'center',padding:'20px 22px 16px',borderBottom:`1px solid ${border}` }}>
          <div style={{ flex:1,fontFamily:'var(--serif)',fontWeight:600,fontSize:'1rem',color:ink }}>{reward.name}</div>
          <button onClick={onClose} aria-label="Fechar" style={{ background:'none',border:'none',color:muted,cursor:'pointer',fontSize:'1.2rem' }}><X style={{ width:16,height:16 }}/></button>
        </div>
        <div style={{ padding:'20px 22px',textAlign:'center' }}>
          <RewardModalIcon reward={reward} />
          <div style={{ fontWeight:700,marginBottom:6,color:ink,fontSize:'.95rem' }}>{reward.name}</div>
          <div style={{ fontSize:'var(--text-base)',color:muted,marginBottom:12 }}>{reward.desc}</div>
          <div style={{ fontSize:'var(--text-sm)',color:muted,marginBottom:12 }}>Parceiro: <strong style={{ color:ink }}>{reward.partner}</strong></div>
          {redeemed
            ? <div style={{ padding:16,background:dm?'rgba(13,79,46,.2)':'#f0fdf4',borderRadius:14,border:'2px dashed rgba(13,79,46,.22)' }}>
                <div style={{ fontSize:'1.5rem',fontWeight:700,fontFamily:'monospace',color:ink,letterSpacing:'.12em' }}>{getCode()}</div>
                <div style={{ fontSize:'var(--text-sm)',color:muted,marginTop:6,display:'flex',alignItems:'center',justifyContent:'center',gap:6 }}><ClipboardCheck style={{ width:14,height:14 }}/> Apresente ao parceiro · Válido 30 dias</div>
              </div>
            : <div style={{ padding:'12px 16px',background:dm?'rgba(13,79,46,.2)':'#f0fdf4',borderRadius:12,border:'1px solid rgba(13,79,46,.14)' }}>
                <div style={{ fontWeight:700,color:'var(--forest)',fontSize:'.95rem',display:'flex',alignItems:'center',justifyContent:'center',gap:6 }}><Zap style={{ width:15,height:15 }}/> {reward.cost.toLocaleString('pt-BR')} EcoPoints</div>
                <div style={{ fontSize:'.75rem',color:muted,marginTop:4 }}>Seu saldo: {u.ecoPoints.toLocaleString('pt-BR')} pts</div>
              </div>
          }
        </div>
        <div style={{ display:'flex',gap:10,padding:'0 22px 22px' }}>
          <button onClick={onClose} style={{ flex:1,padding:12,borderRadius:12,border:`1px solid ${border}`,background:'transparent',fontFamily:'var(--sans)',fontWeight:600,fontSize:'.88rem',color:muted,cursor:'pointer' }}>Fechar</button>
          {!redeemed && <button onClick={() => canAfford?onRedeem(reward):onClose()} style={{ flex:1,padding:12,borderRadius:12,border:'none',background:canAfford?'var(--forest)':'#94a3b8',color:'white',fontFamily:'var(--sans)',fontWeight:700,fontSize:'.88rem',cursor:canAfford?'pointer':'default' }}>
            {canAfford?`Resgatar (${reward.cost} pts)`:'Pts insuficientes'}
          </button>}
        </div>
      </div>
    </div>
  );
}

/* ═══ TOAST ═══ */
function AppToast({ msg, color, visible, dm }: { msg:string; color:string; visible:boolean; dm:boolean }) {
  const palette: Record<string, { bg:string; text:string; border:string; dot:string }> = {
    green: {
      bg:     dm ? 'rgba(6,78,59,.95)'  : 'rgba(240,253,244,.98)',
      text:   dm ? '#4ade80'            : '#15803d',
      border: dm ? 'rgba(74,222,128,.2)': 'rgba(134,239,172,.6)',
      dot:    '#22c55e',
    },
    red: {
      bg:     dm ? 'rgba(69,10,10,.95)' : 'rgba(254,242,242,.98)',
      text:   dm ? '#f87171'            : '#dc2626',
      border: dm ? 'rgba(248,113,113,.2)':'rgba(252,165,165,.6)',
      dot:    '#ef4444',
    },
    fire: {
      bg:     dm ? 'rgba(69,10,10,.95)' : 'rgba(254,242,242,.98)',
      text:   dm ? '#f87171'            : '#dc2626',
      border: dm ? 'rgba(248,113,113,.2)':'rgba(252,165,165,.6)',
      dot:    '#ef4444',
    },
    amber: {
      bg:     dm ? 'rgba(69,26,3,.95)'  : 'rgba(255,251,235,.98)',
      text:   dm ? '#fbbf24'            : '#b45309',
      border: dm ? 'rgba(251,191,36,.2)': 'rgba(253,230,138,.6)',
      dot:    '#f59e0b',
    },
  };
  const p = palette[color] || palette.green;
  return (
    <div className={`am-toast-v2${visible?'':' hidden'}`} style={{ background:p.bg, color:p.text, borderColor:p.border, backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)' }}>
      <span style={{ width:7,height:7,borderRadius:'50%',background:p.dot,flexShrink:0,display:'inline-block' }}/>
      {msg}
    </div>
  );
}

function FloatingPoints({ items }: { items:{id:number;pts:number;label?:string}[] }) {
  return (
    <div style={{ position:'fixed',right:18,top:60,zIndex:99997,pointerEvents:'none',display:'flex',flexDirection:'column',gap:8,alignItems:'flex-end',fontFamily:'var(--sans)' }}>
      {items.map(item => (
        <div key={item.id} className="am-points-float" style={{ display:'flex',alignItems:'center',gap:6,padding:'8px 14px',borderRadius:999,background:'linear-gradient(135deg, var(--forest), #22c55e)',color:'white',boxShadow:'0 8px 24px rgba(13,79,46,.32)',fontSize:'var(--text-base)',fontWeight:800,letterSpacing:'-.01em' }}>
          <Zap style={{ width:15,height:15,strokeWidth:2.6 }}/> +{item.pts} pts{item.label?` · ${item.label}`:''}
        </div>
      ))}
    </div>
  );
}

/* ═══ WEB AUDIO — sons de jogo sem deps ═══ */
function playSound(type: 'coin' | 'levelup' | 'report') {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.18, ctx.currentTime);
    master.connect(ctx.destination);

    if (type === 'coin') {
      // Ping ascendente — moeda coletada
      [0, 0.06, 0.12].forEach((t, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(master);
        o.type = 'sine';
        o.frequency.setValueAtTime(520 + i * 180, ctx.currentTime + t);
        g.gain.setValueAtTime(0.5, ctx.currentTime + t);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.18);
        o.start(ctx.currentTime + t);
        o.stop(ctx.currentTime + t + 0.2);
      });
    } else if (type === 'levelup') {
      // Fanfarra curta — subiu de divisão
      [0, 0.12, 0.24, 0.38].forEach((t, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(master);
        o.type = i === 3 ? 'square' : 'triangle';
        o.frequency.setValueAtTime([440, 554, 659, 880][i], ctx.currentTime + t);
        g.gain.setValueAtTime(0.6, ctx.currentTime + t);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.28);
        o.start(ctx.currentTime + t);
        o.stop(ctx.currentTime + t + 0.32);
      });
    } else if (type === 'report') {
      // Whoosh grave — denúncia enviada
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(master);
      o.type = 'sine';
      o.frequency.setValueAtTime(200, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.3);
      g.gain.setValueAtTime(0.6, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      o.start(ctx.currentTime);
      o.stop(ctx.currentTime + 0.38);
    }
    setTimeout(() => ctx.close(), 1000);
  } catch (_) { /* Safari ou bloqueio de autoplay — silêncio */ }
}

/* ═══ MISSÕES DIÁRIAS ═══ */
const DAILY_MISSIONS = [
  [
    { id: 'm1', ico: 'report', label: 'Faça 1 denúncia hoje', type: 'any', target: 1, pts: 30 },
    { id: 'm2', ico: 'map', label: 'Abra o mapa', type: 'login', target: 1, pts: 10 },
    { id: 'm3', ico: 'recycle', label: 'Reporte 1 descarte irregular', type: 'recycle', target: 1, pts: 20 },
  ],
  [
    { id: 'm1', ico: 'report', label: 'Faça 1 denúncia hoje', type: 'any', target: 1, pts: 30 },
    { id: 'm2', ico: 'resolve', label: 'Confirme 1 ocorrência resolvida', type: 'resolve', target: 1, pts: 15 },
    { id: 'm3', ico: 'ai', label: 'Abra o EcoAI', type: 'login', target: 1, pts: 10 },
  ],
  [
    { id: 'm1', ico: 'recycle', label: 'Reporte 1 descarte irregular', type: 'recycle', target: 1, pts: 20 },
    { id: 'm2', ico: 'report', label: 'Faça 1 denúncia hoje', type: 'any', target: 1, pts: 30 },
    { id: 'm3', ico: 'map', label: 'Explore o mapa hoje', type: 'login', target: 1, pts: 10 },
  ],
  [
    { id: 'm1', ico: 'report', label: 'Faça 1 denúncia hoje', type: 'any', target: 1, pts: 30 },
    { id: 'm2', ico: 'recycle', label: 'Reporte 1 descarte irregular', type: 'recycle', target: 1, pts: 20 },
    { id: 'm3', ico: 'resolve', label: 'Confirme 1 ocorrência resolvida', type: 'resolve', target: 1, pts: 15 },
  ],
  [
    { id: 'm1', ico: 'ai', label: 'Use o EcoAI hoje', type: 'login', target: 1, pts: 10 },
    { id: 'm2', ico: 'report', label: 'Faça 1 denúncia hoje', type: 'any', target: 1, pts: 30 },
    { id: 'm3', ico: 'recycle', label: 'Reporte 1 descarte irregular', type: 'recycle', target: 1, pts: 20 },
  ],
  [
    { id: 'm1', ico: 'report', label: 'Faça 1 denúncia hoje', type: 'any', target: 1, pts: 30 },
    { id: 'm2', ico: 'resolve', label: 'Confirme 1 ocorrência resolvida', type: 'resolve', target: 1, pts: 15 },
    { id: 'm3', ico: 'map', label: 'Explore o mapa hoje', type: 'login', target: 1, pts: 10 },
  ],
  [
    { id: 'm1', ico: 'recycle', label: 'Reporte 1 descarte irregular', type: 'recycle', target: 1, pts: 20 },
    { id: 'm2', ico: 'report', label: 'Faça 1 denúncia hoje', type: 'any', target: 1, pts: 30 },
    { id: 'm3', ico: 'ai', label: 'Abra o EcoAI', type: 'login', target: 1, pts: 10 },
  ],
];

function getTodayMissions() {
  const day = new Date().getDay(); // 0=Dom … 6=Sáb
  return DAILY_MISSIONS[day];
}

function getMissionProgress(missions: typeof DAILY_MISSIONS[0], incidents: Incident[], resolved: number) {
  return missions.map(m => {
    let done = 0;
    if (m.type === 'login') done = 1;
    else if (m.type === 'resolve') done = Math.min(resolved, m.target);
    else if (m.type === 'any') done = Math.min(incidents.filter(i => i.userId).length, m.target);
    else done = Math.min(incidents.filter(i => i.type === m.type && i.userId).length, m.target);
    return { ...m, done, complete: done >= m.target };
  });
}

/* ═══ DAILY MISSIONS OVERLAY ═══ */
function DailyMissionsOverlay({ missions, dm, onClose }: { missions: ReturnType<typeof getMissionProgress>; dm: boolean; onClose: () => void }) {
  const bg = dm ? '#161d36' : 'white';
  const border = dm ? 'rgba(255,255,255,.08)' : 'rgba(15,26,15,.08)';
  const ink = dm ? '#e8f0e8' : '#0e1a0e';
  const muted = dm ? 'rgba(255,255,255,.45)' : '#6b7c6b';
  const totalPts = missions.reduce((s, m) => s + (m.complete ? m.pts : 0), 0);
  const maxPts   = missions.reduce((s, m) => s + m.pts, 0);

  return (
    <div onClick={onClose} style={{ position:'fixed',inset:0,zIndex:1400,display:'flex',alignItems:'flex-end',justifyContent:'center',background:'rgba(0,0,0,.48)',backdropFilter:'blur(8px)',fontFamily:'var(--sans)',padding:'0 0 16px' }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:bg,borderRadius:'24px 24px 18px 18px',width:'100%',maxWidth:420,boxShadow:'0 -8px 40px rgba(0,0,0,.18)',border:`1px solid ${border}`,overflow:'hidden',animation:'slideUp .38s cubic-bezier(.34,1.56,.64,1)' }}>
        {/* Header */}
        <div style={{ padding:'18px 20px 14px',borderBottom:`1px solid ${border}`,background:dm?'rgba(255,255,255,.03)':'#f8fafb' }}>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
            <div>
              <div style={{ fontFamily:'var(--serif)',fontSize:'1.1rem',fontWeight:700,color:ink,display:'flex',alignItems:'center',gap:8 }}><Target style={{ width:18,height:18,color:'var(--forest)' }}/> Missões de hoje</div>
              <div style={{ fontSize:'var(--text-sm)',color:muted,marginTop:2 }}>Resetam à meia-noite · {totalPts}/{maxPts} pts coletados</div>
            </div>
            <button onClick={onClose} style={{ background:'none',border:'none',color:muted,fontSize:'1.1rem',cursor:'pointer',padding:4 }}><X style={{ width:16,height:16 }}/></button>
          </div>
          {/* Barra total */}
          <div style={{ marginTop:12,height:6,borderRadius:999,background:dm?'rgba(255,255,255,.08)':'rgba(15,23,42,.08)',overflow:'hidden' }}>
            <div style={{ height:'100%',borderRadius:999,background:'linear-gradient(90deg,var(--forest),#22c55e)',width:`${(totalPts/maxPts)*100}%`,transition:'width .6s cubic-bezier(.22,1,.36,1)' }}/>
          </div>
        </div>
        {/* Missões */}
        <div style={{ padding:'14px 16px',display:'flex',flexDirection:'column',gap:10 }}>
          {missions.map(m => (
            <div key={m.id} style={{ display:'flex',alignItems:'center',gap:12,padding:'12px 14px',borderRadius:16,background:m.complete?(dm?'rgba(13,79,46,.22)':'#f0fdf4'):(dm?'rgba(255,255,255,.04)':'#f9fafb'),border:`1px solid ${m.complete?'rgba(13,79,46,.22)':border}`,transition:'all .3s' }}>
              <div style={{ width:40,height:40,borderRadius:12,background:m.complete?'var(--forest)':(dm?'rgba(255,255,255,.07)':'rgba(15,23,42,.06)'),display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.2rem',flexShrink:0 }}>
                <MissionTypeIcon kind={m.ico} complete={m.complete} />
              </div>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontSize:'var(--text-base)',fontWeight:700,color:m.complete?'var(--forest)':ink }}>{m.label}</div>
                <div style={{ marginTop:6,height:5,borderRadius:999,background:dm?'rgba(255,255,255,.1)':'rgba(15,23,42,.08)',overflow:'hidden' }}>
                  <div style={{ height:'100%',borderRadius:999,background:m.complete?'var(--forest)':'#22c55e',width:`${Math.min((m.done/m.target)*100,100)}%`,transition:'width .7s cubic-bezier(.22,1,.36,1)' }}/>
                </div>
                <div style={{ fontSize:'var(--text-xs)',color:muted,marginTop:3 }}>{m.done}/{m.target} · +{m.pts} pts</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding:'4px 16px 18px' }}>
          <button onClick={onClose} style={{ width:'100%',padding:'13px',borderRadius:16,border:'none',background:'var(--forest)',color:'white',fontFamily:'var(--sans)',fontWeight:700,fontSize:'.9rem',cursor:'pointer' }}>Fechar</button>
        </div>
      </div>
    </div>
  );
}


function isAdminUser(user: User | null) {
  if (!user) return false;
  const email = (user.email || '').toLowerCase();
  const name = (user.name || '').toLowerCase();
  return Boolean((user as any).isAdmin || (user as any).role === 'admin' || email.includes('admin') || name.includes('kevin'));
}

function AdminDashboard({
  incidents,
  darkMode,
  onBack,
  onResolve,
  onFlyTo,
  onDispatch,
}: {
  incidents: Incident[];
  darkMode: boolean;
  onBack: () => void;
  onResolve: (id: string) => void;
  onFlyTo: (lat: number, lng: number) => void;
  onDispatch: (inc: Incident) => void;
}) {
  const dm = darkMode;
  const ink = dm ? '#eef2ff' : '#0f172a';
  const muted = dm ? 'rgba(255,255,255,.58)' : '#64748b';
  const border = dm ? 'rgba(255,255,255,.08)' : 'rgba(15,23,42,.09)';
  const cardBg = dm ? 'rgba(15,23,42,.72)' : 'rgba(255,255,255,.88)';
  const active = incidents.filter(i => i.status !== 'resolvido' && i.type !== 'recycle');
  const resolved = incidents.filter(i => i.status === 'resolvido').length;
  const byType = {
    fire: active.filter(i => i.type === 'fire').length,
    flood: active.filter(i => i.type === 'flood').length,
    recycle: incidents.filter(i => i.type === 'recycle').length,
  };
  const week = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
  const bars = week.map((d, i) => Math.max(1, ((resolved + active.length + i * 2) % 9) + (i % 2 ? 2 : 0)));
  const maxBar = Math.max(...bars);

  const typeMeta = (type: Incident['type']) => {
    if (type === 'fire') return { label:'Incêndio', color:'#ea580c', Icon: Flame };
    if (type === 'flood') return { label:'Alagamento', color:'#2563eb', Icon: Droplets };
    return { label:'Descarte', color:'#0d4f2e', Icon: Recycle };
  };

  return (
    <section style={{
      height:'100%',
      overflowY:'auto',
      padding:'clamp(16px, 3vw, 32px)',
      background: dm
        ? 'radial-gradient(circle at top left, rgba(34,197,94,.14), transparent 34%), linear-gradient(135deg,#050816,#0f172a)'
        : 'radial-gradient(circle at top left, rgba(13,79,46,.10), transparent 32%), linear-gradient(135deg,#f8fafc,#eaf8ef)',
      fontFamily:'var(--sans)',
      color:ink,
      animation:'amCommandIn .34s cubic-bezier(.22,1,.36,1) both',
    }}>
      <div style={{ maxWidth:1180, margin:'0 auto' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:14, marginBottom:18, flexWrap:'wrap' }}>
          <div>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 10px', borderRadius:999, background:dm?'rgba(34,197,94,.12)':'#dcfce7', color:'#16a34a', fontWeight:950, fontSize:'.72rem', letterSpacing:'.08em', textTransform:'uppercase', marginBottom:10 }}>
              <ShieldCheck style={{ width:14,height:14 }}/> Modo agente
            </div>
            <h1 style={{ margin:0, fontFamily:'var(--serif)', fontSize:'clamp(1.55rem, 4vw, 2.35rem)', letterSpacing:'-.04em' }}>
              Central de Comando
            </h1>
            <p style={{ margin:'6px 0 0', color:muted, fontWeight:700 }}>
              Monitoramento Ibiapaba · denúncias, despacho e validação.
            </p>
          </div>
          <button onClick={onBack} style={{ border:`1px solid ${border}`, background:cardBg, color:ink, borderRadius:16, padding:'12px 16px', fontWeight:950, cursor:'pointer', boxShadow:dm?'none':'0 12px 30px rgba(15,23,42,.08)' }}>
            ← Voltar para o mapa
          </button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))', gap:12, marginBottom:16 }}>
          {[
            { label:'Ativas', value:active.length, color:'#ef4444', Icon:AlertTriangle },
            { label:'Resolvidas', value:resolved, color:'#22c55e', Icon:CheckSquare },
            { label:'Incêndios', value:byType.fire, color:'#ea580c', Icon:Flame },
            { label:'Alagamentos', value:byType.flood, color:'#2563eb', Icon:Droplets },
          ].map(s => (
            <div key={s.label} style={{ padding:16, borderRadius:22, border:`1px solid ${s.color}28`, background:cardBg, boxShadow:dm?'none':`0 16px 34px ${s.color}10`, backdropFilter:'blur(14px)' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10 }}>
                <div style={{ color:muted, fontSize:'.76rem', fontWeight:900, textTransform:'uppercase', letterSpacing:'.08em' }}>{s.label}</div>
                <s.Icon style={{ width:18,height:18,color:s.color }}/>
              </div>
              <div style={{ marginTop:10, fontSize:'2rem', lineHeight:1, fontWeight:1000, color:ink }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap:14 }}>
          <div style={{ borderRadius:24, border:`1px solid ${border}`, background:cardBg, overflow:'hidden', backdropFilter:'blur(14px)', boxShadow:dm?'none':'0 18px 44px rgba(15,23,42,.08)' }}>
            <div style={{ padding:'16px 18px', borderBottom:`1px solid ${border}`, display:'flex', alignItems:'center', justifyContent:'space-between', gap:10 }}>
              <div>
                <div style={{ fontSize:'.78rem', fontWeight:950, letterSpacing:'.1em', textTransform:'uppercase', color:muted }}>Feed operacional</div>
                <div style={{ fontWeight:950, marginTop:3 }}>Denúncias ativas e histórico recente</div>
              </div>
              <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'7px 10px', borderRadius:999, background:dm?'rgba(34,197,94,.12)':'#f0fdf4', color:'#16a34a', fontSize:'.78rem', fontWeight:950 }}>
                <span className="am-live-dot" style={{ width:7,height:7,borderRadius:'50%',background:'#22c55e',display:'inline-block' }}/> Ao vivo
              </div>
            </div>

            <div style={{ padding:14, display:'flex', flexDirection:'column', gap:10 }}>
              {incidents.filter(i => i.type !== 'recycle').slice(0, 9).map(inc => {
                const meta = typeMeta(inc.type);
                const isResolved = inc.status === 'resolvido';
                const isDispatched = inc.status === 'despachado';
                const statusLabel = isResolved ? 'Resolvido' : isDispatched ? 'Equipe a caminho' : 'Pendente';
                const statusBg = isResolved ? '#dcfce7' : isDispatched ? '#eff6ff' : `${meta.color}16`;
                const statusColor = isResolved ? '#15803d' : isDispatched ? '#2563eb' : meta.color;
                return (
                  <article key={inc.id} style={{ display:'grid', gridTemplateColumns:'auto minmax(0,1fr)', gap:12, alignItems:'center', padding:14, borderRadius:18, border:`1px solid ${isResolved ? 'rgba(34,197,94,.24)' : isDispatched ? 'rgba(37,99,235,.28)' : meta.color+'26'}`, background:isResolved ? (dm?'rgba(34,197,94,.08)':'#f0fdf4') : isDispatched ? (dm?'rgba(37,99,235,.10)':'#eff6ff') : (dm?'rgba(255,255,255,.035)':'#ffffff') }}>
                    <div style={{ width:44,height:44,borderRadius:15, display:'grid', placeItems:'center', background:isResolved?'#dcfce7':isDispatched?'#dbeafe':`${meta.color}16`, color:isResolved?'#16a34a':isDispatched?'#2563eb':meta.color }}>
                      <meta.Icon style={{ width:21,height:21 }}/>
                    </div>
                    <div style={{ minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                        <strong style={{ fontSize:'.95rem', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:'100%' }}>{inc.title}</strong>
                        <span style={{ padding:'3px 8px', borderRadius:999, background:statusBg, color:statusColor, fontSize:'.68rem', fontWeight:950 }}>
                          {statusLabel}
                        </span>
                      </div>
                      <div style={{ color:muted, fontSize:'.8rem', marginTop:3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                        {inc.time} · {inc.desc}
                      </div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', justifyContent:'flex-end', gridColumn:'1 / -1' }}>
                      <button onClick={() => { onFlyTo(inc.lat, inc.lng); onBack(); }} style={{ padding:'9px 11px', borderRadius:12, border:`1px solid ${border}`, background:'transparent', color:ink, fontWeight:850, cursor:'pointer' }}>
                        Ver mapa
                      </button>
                      {!isResolved && (
                        <>
                          {!isDispatched && (
                            <button onClick={() => onDispatch(inc)} style={{ padding:'9px 11px', borderRadius:12, border:`1px solid ${meta.color}30`, background:`${meta.color}14`, color:meta.color, fontWeight:900, cursor:'pointer' }}>
                              Despachar
                            </button>
                          )}
                          <button onClick={() => onResolve(inc.id)} style={{ padding:'9px 11px', borderRadius:12, border:'none', background:'linear-gradient(135deg,#16a34a,#22c55e)', color:'white', fontWeight:950, cursor:'pointer', boxShadow:'0 10px 24px rgba(34,197,94,.26)' }}>
                            Validar
                          </button>
                        </>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <aside style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ padding:18, borderRadius:24, border:`1px solid ${border}`, background:cardBg, backdropFilter:'blur(14px)', boxShadow:dm?'none':'0 18px 44px rgba(15,23,42,.08)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, fontWeight:950, marginBottom:14 }}>
                <BarChart3 style={{ width:18,height:18,color:'var(--forest)' }}/> Resolvidas na semana
              </div>
              <div style={{ height:150, display:'flex', alignItems:'end', gap:8 }}>
                {bars.map((b, i) => (
                  <div key={week[i]} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:7 }}>
                    <div style={{ width:'100%', height:`${(b/maxBar)*118}px`, borderRadius:'10px 10px 4px 4px', background:'linear-gradient(180deg,var(--forest),#22c55e)', boxShadow:'0 10px 22px rgba(34,197,94,.18)' }}/>
                    <span style={{ fontSize:'.68rem', color:muted, fontWeight:800 }}>{week[i]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding:18, borderRadius:24, border:`1px solid ${border}`, background:cardBg }}>
              <div style={{ fontSize:'.78rem', color:muted, fontWeight:950, letterSpacing:'.08em', textTransform:'uppercase', marginBottom:10 }}>Fluxo recomendado</div>
              {['Triar ocorrência', 'Despachar equipe', 'Validar resolução', 'Atualizar comunidade'].map((x, i) => (
                <div key={x} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 0', borderTop:i?'1px solid '+border:'none' }}>
                  <span style={{ width:26,height:26,borderRadius:9, display:'grid', placeItems:'center', background:'var(--forest)', color:'white', fontSize:'.75rem', fontWeight:950 }}>{i+1}</span>
                  <span style={{ color:ink, fontWeight:850, fontSize:'.86rem' }}>{x}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}


/* ═══ ANIMATED PROGRESS BAR ═══ */
function AnimatedProgressBar({ pct, color, height = 10 }: { pct: number; color: string; height?: number }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 80);
    return () => clearTimeout(t);
  }, [pct]);
  return (
    <div style={{ height, borderRadius:999, background:'rgba(15,23,42,.08)', overflow:'hidden' }}>
      <div style={{ height:'100%', borderRadius:999, background:color, width:`${width}%`, transition:'width .9s cubic-bezier(.22,1,.36,1)' }}/>
    </div>
  );
}

/* ═══ MARKER BURST ═══ */
function MarkerBurst({ pos, dm }: { pos:{lat:number;lng:number}|null; dm:boolean }) {
  if (!pos) return null;
  // Renderizado como overlay fixo centralizado — visual apenas
  return null; // handled via CSS on new incident markers
}

export default function App() {
  const [user, setUser]               = useState<User | null>(null);
  const [authed, setAuthed]           = useState(false);
  const [showIntro, setShowIntro]     = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [darkMode, setDarkMode]       = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatOpen, setChatOpen]       = useState(false);
  const [chatUnread, setChatUnread]   = useState(true);
  const [reportOpen, setReportOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [incidents, setIncidents]     = useState<Incident[]>([...SAMPLE_INCIDENTS]);
  const [filter, setFilter]           = useState('all');
  const [heatVisible, setHeatVisible] = useState(false);
  const [flyTarget, setFlyTarget]     = useState<{lat:number;lng:number;zoom:number}|null>(null);
  const [toast, setToast]             = useState<Incident|null>(null);
  const [clickedLocation, setClickedLocation] = useState<{lat:number;lng:number}|null>(null);
  const [weather]                     = useState({ temp:24, hum:22, icon:'cloud' });
  const [gpsTarget, setGpsTarget]     = useState<[number,number]|null>(null);
  const [userLocation, setUserLocation] = useState<[number,number]|null>(null);
  const [userAccuracy, setUserAccuracy] = useState(100);
  const [gpsActive, setGpsActive]     = useState(false);
  const [gpsLoading, setGpsLoading]   = useState(false);
  const [gpsError, setGpsError]       = useState(false);
  const [celebration, setCelebration] = useState<{type:string;title:string;pts:number}|null>(null);
  const [lightbox, setLightbox]       = useState<{src:string;caption?:string}|null>(null);
  const [pendingReward, setPendingReward] = useState<any>(null);
  const [appToast, setAppToast]       = useState({ msg:'', color:'green', visible:false });
  const [totalReports, setTotalReports] = useState(() =>
    incidents.filter(i => i.userId).length
  );
  const [pointBursts, setPointBursts] = useState<{id:number;pts:number;label?:string}[]>([]);
  const [rankUp, setRankUp]           = useState<(typeof DIVISION_STAGES[number] & { from: string; points: number }) | null>(null);
  const [missionsOpen, setMissionsOpen] = useState(false);
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});
  const COOLDOWN_MS = 5 * 60 * 1000;
  const [resolvedCount, setResolvedCount] = useState(0);
  const [newIncId, setNewIncId]       = useState<string|null>(null);
  const [commandOpen, setCommandOpen] = useState(false);

  const toastTimer    = useRef<any>(null);
  const gpsWatchRef   = useRef<number|null>(null);
  const gpsStartedRef = useRef(false);
  const appToastTimer = useRef<any>(null);

  // Persist dark mode
  useEffect(() => {
    const saved = localStorage.getItem('am_darkmode');
    if (saved === '1') setDarkMode(true);
  }, []);
  useEffect(() => {
    localStorage.setItem('am_darkmode', darkMode ? '1' : '0');
    document.documentElement.style.colorScheme = darkMode ? 'dark' : 'light';
  }, [darkMode]);

  const showAppToast = (msg:string, color='green') => {
    clearTimeout(appToastTimer.current);
    setAppToast({ msg, color, visible:true });
    appToastTimer.current = setTimeout(() => setAppToast(p => ({...p, visible:false})), 4500);
  };
  const showPointBurst = (pts:number, label?:string) => {
    if (pts<=0) return;
    const id = Date.now() + Math.floor(Math.random()*999);
    setPointBursts(prev => [...prev.slice(-2), {id,pts,label}]);
    setTimeout(() => setPointBursts(prev => prev.filter(p=>p.id!==id)), 1800);
  };

  useEffect(() => {
    (window as any).__resolve   = (id:string) => handleResolve(id);
    (window as any).__lbOpen    = (incId:string) => {
      const inc = incidents.find(i=>i.id===incId);
      if (inc?.photoURL) setLightbox({ src:inc.photoURL, caption:inc.title });
    };
  }, [incidents]);

  useEffect(() => {
    const session = DB.getSession();
    const sessionUser = session && DB.getUserById(session.id);
    if (sessionUser) {
      setUser(sessionUser);
      setAuthed(true);
      return;
    }
    setShowIntro(localStorage.getItem('am_story_seen_v1') !== '1');
  }, []);

  useEffect(() => {
    if (!authed) return;
    const i = setInterval(() => { if (Math.random()<.3) setTotalReports(p=>p+1); }, 20_000);
    return () => clearInterval(i);
  }, [authed]);

  const refreshUser = useCallback(() => {
    if (user) { const u = DB.getUserById(user.id); if (u) setUser({ ...u }); }
  }, [user]);

  const maybeCelebrateRankUp = (beforePoints: number, afterPoints: number) => {
    const before = getDivisionStage(beforePoints);
    const after = getDivisionStage(afterPoints);
    if (after.min > before.min) {
      setRankUp({ ...after, from: before.name, points: afterPoints });
      playSound('levelup');
    }
  };

  const applyPoints = (amount: number, actText: string, actIco = 'points', label?: string) => {
    if (!user) return null;
    const current = DB.getUserById(user.id) || user;
    const beforePoints = current.ecoPoints || 0;
    DB.addPoints(user.id, amount, actText, actIco);
    const updated = DB.getUserById(user.id);
    if (updated) {
      setUser({ ...updated });
      if (amount > 0) maybeCelebrateRankUp(beforePoints, updated.ecoPoints || beforePoints);
    }
    if (amount > 0) { showPointBurst(amount, label); playSound('coin'); }
    return updated;
  };

  const handleLogin = (u:User, isNew?:boolean) => {
    localStorage.setItem('am_story_seen_v1', '1');
    setShowIntro(false);
    setUser(u);
    setAuthed(true);
    if (isNew) setShowOnboarding(true);
    // Streak toast
    const streak = u.loginStreak || 1;
    if (streak >= 2) {
      setTimeout(() => showAppToast(`${streak} dias seguidos! Continue assim.`, 'green'), 1200);
    }
  };
  const handleLogout = () => {
    DB.clearSession(); setUser(null); setAuthed(false); setSidebarOpen(false); setChatOpen(false); setCommandOpen(false);
    if (gpsWatchRef.current!==null) { navigator.geolocation.clearWatch(gpsWatchRef.current); gpsWatchRef.current=null; }
  };

  const handleMapClick = (lat:number, lng:number) => { setClickedLocation({lat,lng}); setToast(null); };

  const handleReportSubmit = (report:{type:string;desc:string;severity:string;photoURL?:string}) => {
    if (!user) return;

    // Cooldown check — mesmo tipo só após 5 minutos
    const lastTime = cooldowns[report.type] || 0;
    const remaining = COOLDOWN_MS - (Date.now() - lastTime);
    if (remaining > 0) {
      const mins = Math.ceil(remaining / 60000);
      const secs = Math.ceil((remaining % 60000) / 1000);
      const label = mins >= 1 ? `${mins} min` : `${secs}s`;
      showAppToast(`⏳ Aguarde ${label} para reportar outro ${report.type === 'fire' ? 'incêndio' : report.type === 'flood' ? 'alagamento' : 'descarte'}.`, 'red');
      return;
    }
    setCooldowns(prev => ({ ...prev, [report.type]: Date.now() }));

    let lat:number, lng:number;
    // Usa localização do GPS se disponível, senão escolhe um município real da Ibiapaba
    const IBIAPABA_TOWNS = [
      { lat: -3.7319, lng: -40.9897 }, // Tianguá
      { lat: -3.8528, lng: -40.9214 }, // Ubajara
      { lat: -3.9256, lng: -40.8886 }, // Ibiapina
      { lat: -4.0488, lng: -40.8649 }, // São Benedito
      { lat: -3.5577, lng: -40.7470 }, // Viçosa do Ceará
      { lat: -3.7436, lng: -40.9975 }, // Tianguá centro
      { lat: -4.2843, lng: -41.1068 }, // Região sul
      { lat: -3.6361, lng: -40.6053 }, // Frecheirinha
    ];
    if (userLocation) {
      lat = userLocation[0] + (Math.random() - .5) * 0.006;
      lng = userLocation[1] + (Math.random() - .5) * 0.006;
    } else if (clickedLocation) {
      lat = clickedLocation.lat;
      lng = clickedLocation.lng;
    } else {
      const town = IBIAPABA_TOWNS[Math.floor(Math.random() * IBIAPABA_TOWNS.length)];
      lat = town.lat + (Math.random() - .5) * 0.03;
      lng = town.lng + (Math.random() - .5) * 0.03;
    }
    const now = new Date();
    const timeLabel = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
    const newInc:Incident = {
      id:'i_'+Date.now(), type:report.type as any, lat, lng,
      title:`${report.type==='fire'?'Incêndio':report.type==='flood'?'Alagamento':'Descarte'} – Denunciado`,
      severity:report.severity as any, time:timeLabel, status:'ativo', desc:report.desc,
      userId:user.id, photoURL:report.photoURL,
      expiresAt:Date.now()+(report.type==='recycle'?MS_WEEK:MS_DAY),
    };
    setIncidents(prev=>[newInc,...prev]);
    setNewIncId(newInc.id);
    setTimeout(() => setNewIncId(null), 2200);
    playSound('report');
    setTotalReports(p=>p+1);
    const currentUser = DB.getUserById(user.id) || user;
    DB.updateUser(user.id, {
      reports: [{
        id: newInc.id,
        type: newInc.type,
        lat: newInc.lat,
        lng: newInc.lng,
        title: newInc.title,
        desc: newInc.desc,
        severity: newInc.severity,
        time: newInc.time,
        status: newInc.status || 'ativo',
        userId: user.id,
        photoURL: newInc.photoURL,
        createdAt: Date.now(),
      }, ...(currentUser.reports || [])],
    });
    const pts = POINT_MAP[report.type]||20;
    applyPoints(pts, `Denúncia: ${newInc.title}`, report.type, 'denúncia');
    setClickedLocation(null);
    setFlyTarget({lat:newInc.lat,lng:newInc.lng,zoom:14});
    setTimeout(()=>setFlyTarget(null),2000);
    setTimeout(()=>showToast(newInc),3600);
  };

  const handleCelebration = (type:string, title:string, pts:number) => { setTimeout(()=>setCelebration({type,title,pts}),400); };

  const handleFlyTo = (lat:number, lng:number) => {
    setFlyTarget({lat,lng,zoom:14}); setSidebarOpen(false);
    setTimeout(()=>setFlyTarget(null),2000);
  };

  const handleGPS = () => {
    if (!navigator.geolocation) { showAppToast('GPS não suportado neste dispositivo.','amber'); return; }
    if (gpsActive && userLocation) { setGpsTarget([userLocation[0],userLocation[1]]); setTimeout(()=>setGpsTarget(null),2000); return; }
    setGpsLoading(true); setGpsError(false);
    if (gpsWatchRef.current!==null) navigator.geolocation.clearWatch(gpsWatchRef.current);
    let firstFix = true;
    gpsWatchRef.current = navigator.geolocation.watchPosition(
      pos => {
        const {latitude:lat,longitude:lng,accuracy}=pos.coords;
        setUserLocation([lat,lng]); setUserAccuracy(accuracy); setGpsActive(true); setGpsLoading(false);
        if (firstFix) { setGpsTarget([lat,lng]); setTimeout(()=>setGpsTarget(null),2000); showAppToast(`Localização encontrada! ~${Math.round(accuracy)}m`,'green'); firstFix=false; }
      },
      err => {
        setGpsLoading(false); setGpsError(true); setGpsActive(false); setTimeout(()=>setGpsError(false),3500);
        const msgs:Record<number,string>={1:'Permissão de GPS negada.',2:'Localização indisponível.',3:'Tempo esgotado.'};
        showAppToast(msgs[err.code]||'Erro de GPS.','amber');
      },
      {enableHighAccuracy:true,timeout:15_000,maximumAge:5_000}
    );
  };

  useEffect(() => {
    if (!authed || gpsStartedRef.current) return;
    gpsStartedRef.current = true;
    const t = setTimeout(()=>handleGPS(), 450);
    return ()=>clearTimeout(t);
  }, [authed]);

  const handleResolve = (id:string) => {
    const target = incidents.find(i => i.id === id);
    if (target?.status === 'resolvido') {
      showAppToast('Essa ocorrência já está resolvida.', 'green');
      return;
    }

    const resolvedIncident = target ? { ...target, status:'resolvido' } as Incident : null;
    setIncidents(prev=>prev.map(i=>i.id===id?{...i,status:'resolvido'}:i));
    setResolvedCount(c => c + 1);

    if (resolvedIncident) {
      setToast(resolvedIncident);
      setTimeout(() => setToast(null), 5200);
    }

    const users = DB.getUsers();
    let touchedUserId: string | null = null;
    const nextUsers = users.map(u => {
      const reports = (u.reports || []).map((r:any) => {
        if (r.id !== id) return r;
        touchedUserId = u.id;
        return { ...r, status:'resolvido', resolvedAt: Date.now() };
      });
      return { ...u, reports };
    });
    if (touchedUserId) {
      DB.saveUsers(nextUsers as any);
      if (user && touchedUserId === user.id) refreshUser();
    }

    if (user) { applyPoints(15,'Validou resolução','resolve','resolução'); }
    showAppToast('Ocorrência resolvida e confirmada no sistema! +15 pts','green');
  };

  const handleDispatch = (inc: Incident) => {
    if (inc.status === 'resolvido') {
      showAppToast('Essa ocorrência já está resolvida.', 'green');
      return;
    }
    if (inc.status === 'despachado') {
      showAppToast('Equipe já está a caminho dessa ocorrência.', 'green');
      return;
    }

    const dispatchedIncident = { ...inc, status:'despachado' } as Incident;
    setIncidents(prev => prev.map(i => i.id === inc.id ? dispatchedIncident : i));
    setToast(dispatchedIncident);
    setTimeout(() => setToast(null), 5200);

    const users = DB.getUsers();
    let touchedUserId: string | null = null;
    const nextUsers = users.map(u => {
      const reports = (u.reports || []).map((r:any) => {
        if (r.id !== inc.id) return r;
        touchedUserId = u.id;
        return { ...r, status:'despachado', dispatchedAt: Date.now() };
      });
      return { ...u, reports };
    });
    if (touchedUserId) {
      DB.saveUsers(nextUsers as any);
      if (user && touchedUserId === user.id) refreshUser();
    }

    showAppToast(`Equipe a caminho: ${inc.title}`, 'green');
  };

  const handleRedeem = (reward:any) => {
    if (!user) return;
    const u=DB.getUserById(user.id)!;
    if (u.ecoPoints<reward.cost) { showAppToast('EcoPoints insuficientes.','fire'); return; }
    applyPoints(-reward.cost, `Resgate: ${reward.name}`, 'reward');
    DB.updateUser(user.id,{redeemedRewards:[...(u.redeemedRewards||[]),reward.id]});
    refreshUser(); setPendingReward({...reward,_redeemed:true}); showAppToast('Recompensa resgatada!','green');
  };

  const showToast = (inc:Incident) => { setToast(inc); clearTimeout(toastTimer.current); toastTimer.current=setTimeout(()=>setToast(null),5000); };

  const riskPill = weather.hum<20 ? {bg:'#fef2f2',color:'#b91c1c',text:'Risco ALTO'} : weather.hum<35 ? {bg:'#fffbeb',color:'#92400e',text:'Risco MÉDIO'} : {bg:'#f0fdf4',color:'var(--forest)',text:'Normal'};
  const activeCount = incidents.filter(i=>i.type!=='recycle'&&i.status!=='resolvido').length;

  const dm = darkMode;
  const topbarBg = dm ? '#1a1a2e' : 'white';
  const topbarBorder = dm ? 'rgba(255,255,255,.07)' : 'rgba(15,26,15,.07)';
  const ink = dm ? '#e8f0e8' : '#0e1a0e';
  const muted = dm ? 'rgba(255,255,255,.4)' : '#6b7c6b';

  if (showIntro && !authed) return <StoryIntro onContinue={() => { localStorage.setItem('am_story_seen_v1', '1'); setShowIntro(false); }} />;
  if (!authed) return <AuthScreen onLogin={handleLogin} />;
  if (!user) return null;

  const handleOpenReport = () => {
    setReportOpen(true);
    if (!clickedLocation) setClickedLocation({lat:userLocation?.[0]??IBIAPABA_CENTER.lat,lng:userLocation?.[1]??IBIAPABA_CENTER.lng});
  };

  const isAdmin = isAdminUser(user);
  const mapControlsVisible = !commandOpen && !chatOpen && !sidebarOpen && !reportOpen && !profileOpen && !pendingReward;
  const rankTheme = getDivisionStage(user.ecoPoints || 0);
  const rankThemeStyle = {
    '--forest': rankTheme.color,
    '--forest-mid': rankTheme.color,
    '--forest-l': rankTheme.accent,
    '--forest-ll': `${rankTheme.color}14`,
    '--forest-lll': `${rankTheme.color}22`,
    '--rank': rankTheme.color,
    '--rank2': rankTheme.accent,
    '--rankGlow': rankTheme.glow,
  } as any;

  return (
    <div className={`alertamap-app ${dm ? 'dark-mode' : ''} ${chatOpen ? 'chat-open' : ''} ${sidebarOpen ? 'sidebar-open' : ''}`} style={{ display:'flex', width:'100vw', height:'100dvh', overflow:'hidden', position:'relative', fontFamily:'var(--sans)', background:dm?'linear-gradient(135deg, #0f0f1a 0%, rgba(13,79,46,.10) 100%)':'linear-gradient(135deg, var(--canvas) 0%, rgba(13,79,46,.08) 100%)' }}>

      {/* Overlays */}
      {showOnboarding && <Onboarding onFinish={()=>setShowOnboarding(false)} dm={dm}/>}
      <RankUpOverlay data={rankUp} onClose={() => setRankUp(null)} />
      <CelebrationOverlay data={celebration} onClose={()=>setCelebration(null)}/>
      <Lightbox src={lightbox?.src??null} caption={lightbox?.caption} onClose={()=>setLightbox(null)}/>
      <ProfileModal user={user} open={profileOpen} onClose={()=>setProfileOpen(false)} onSave={u=>{setUser(u);refreshUser();}} dm={dm}/>
      <RedeemModal reward={pendingReward} user={user} open={!!pendingReward} onClose={()=>setPendingReward(null)} onRedeem={handleRedeem} dm={dm}/>
      <AppToast {...appToast} dm={dm}/>
      <FloatingPoints items={pointBursts}/>
      {missionsOpen && (
        <DailyMissionsOverlay
          missions={getMissionProgress(getTodayMissions(), incidents.filter(i=>i.userId===user.id), resolvedCount)}
          dm={dm}
          onClose={()=>setMissionsOpen(false)}
        />
      )}

      {/* Chat fullscreen */}
      <ChatPanel open={chatOpen} darkMode={dm}
        onClose={()=>setChatOpen(false)}
        onOpen={()=>setChatUnread(false)}
        user={user}
        onEarnPoints={(pts,text,ico)=>{applyPoints(pts, text, ico, 'EcoAI');}}
      />

      {/* Sidebar */}
      <Sidebar user={user} incidents={incidents} open={sidebarOpen} darkMode={dm}
        onClose={()=>setSidebarOpen(false)} onLogout={handleLogout}
        onFlyTo={handleFlyTo} onResolve={handleResolve} onRefreshUser={refreshUser}
        onOpenProfile={()=>setProfileOpen(true)}
        onOpenRedeem={(r:any)=>setPendingReward(r)}
        onOpenCommand={isAdmin ? () => { setCommandOpen(true); setSidebarOpen(false); } : undefined}
        totalReports={totalReports}
      />

      {/* Main */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, height:'100dvh', overflow:'hidden', position:'relative' }}>

        {/* ── TOPBAR estilo Google Maps ── */}
        <header style={{
          display:'flex', alignItems:'center', gap:10,
          padding:'0 14px', height:54,
          background: dm ? 'rgba(26,26,46,.88)' : 'rgba(255,255,255,.88)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom:`1px solid ${topbarBorder}`,
          boxShadow: dm?'0 1px 0 rgba(255,255,255,.04), 0 2px 12px rgba(0,0,0,.18)':'0 1px 0 rgba(15,26,15,.06), 0 2px 12px rgba(0,0,0,.06)',
          zIndex:100, flexShrink:0,
        }}>
          {/* Hamburger */}
          <button onClick={()=>setSidebarOpen(s=>!s)} aria-label="Abrir menu" style={{ display:'flex',flexDirection:'column',gap:4,background:'none',border:'none',padding:'8px 6px',cursor:'pointer',flexShrink:0 }}>
            {[0,1,2].map(i=><span key={i} style={{ display:'block',width:18,height:1.5,background:ink,borderRadius:1 }}/>)}
          </button>

          {/* Logo */}
          <div style={{ display:'flex',alignItems:'center',gap:8,flexShrink:0 }}>
            <div style={{ width:26,height:26,background:'var(--forest)',borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center' }}>
              <Leaf style={{ width:'.85rem',height:'.85rem',color:'white' }}/>
            </div>
            <span style={{ fontFamily:'var(--serif)',fontSize:'1rem',fontWeight:600,color:ink,letterSpacing:'-.02em' }}>AlertaMap</span>
          </div>

          {/* Clima pill — desktop only */}
          <div className="hidden sm:flex" style={{ alignItems:'center',gap:6,padding:'5px 11px',background:dm?'rgba(255,255,255,.06)':'var(--canvas)',border:`1px solid ${topbarBorder}`,borderRadius:99,fontSize:'var(--text-sm)',fontWeight:500,color:muted,whiteSpace:'nowrap' }}>
            <Thermometer style={{ width:13,height:13,color:'var(--forest)' }}/><span style={{ color:ink }}>{weather.temp}°C</span>
            <span style={{ color:topbarBorder }}>·</span><span>{weather.hum}%</span>
            <span style={{ padding:'2px 8px',fontSize:'var(--text-xs)',fontWeight:700,background:riskPill.bg,color:riskPill.color,borderRadius:99 }}>{riskPill.text}</span>
          </div>

          <div style={{ display:'flex',alignItems:'center',gap:8,marginLeft:'auto',flexShrink:0 }}>
            {/* Live dot */}
            <div style={{ display:'flex',alignItems:'center',gap:5,fontSize:'var(--text-xs)',color:muted,fontWeight:600,whiteSpace:'nowrap' }}>
              <span className="am-live-dot" style={{ width:7,height:7,borderRadius:'50%',background:'#22c55e',display:'inline-block' }}/>
              <span className="hidden sm:inline">{activeCount} ativos</span>
            </div>

            {/* Division badge + pts — clicável abre sidebar */}
            {(() => {
              const div = getDivisionStage(user.ecoPoints || 0);
              return (
                <div onClick={()=>setSidebarOpen(true)} title={`Divisão ${div.name}`} style={{ display:'flex',alignItems:'center',gap:6,padding:'4px 10px 4px 6px',background:dm?`${div.color}20`:`${div.color}12`,border:`1px solid ${div.color}30`,borderRadius:99,cursor:'pointer',whiteSpace:'nowrap' }}>
                  <img src={div.badge} alt={div.name} style={{ width:22,height:22,objectFit:'contain',filter:`drop-shadow(0 2px 4px ${div.glow})` }} />
                  <span style={{ fontSize:'var(--text-sm)',fontWeight:700,color:div.color }}>{(user.ecoPoints||0).toLocaleString('pt-BR')}</span>
                </div>
              );
            })()}

            {/* Missões diárias */}
            {(() => {
              const ms = getMissionProgress(getTodayMissions(), incidents.filter(i=>i.userId===user.id), resolvedCount);
              const done = ms.filter(m=>m.complete).length;
              return (
                <button onClick={()=>setMissionsOpen(true)} title="Missões de hoje" style={{ position:'relative',width:34,height:34,borderRadius:'50%',background:dm?'rgba(255,255,255,.08)':'var(--canvas)',border:`1px solid ${topbarBorder}`,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:'1rem',flexShrink:0 }}>
                  <Target style={{ width:16,height:16,color:'var(--forest)' }}/>
                  {done < ms.length && <span style={{ position:'absolute',top:-3,right:-3,minWidth:16,height:16,borderRadius:99,background:'var(--fire)',border:'2px solid white',fontSize:'.58rem',fontWeight:900,color:'white',display:'flex',alignItems:'center',justifyContent:'center',padding:'0 3px' }}>{ms.length - done}</span>}
                </button>
              );
            })()}

            {/* Dark mode toggle */}
            <button onClick={()=>setDarkMode(d=>!d)} aria-label={dm?'Modo claro':'Modo noturno'} style={{ width:34,height:34,borderRadius:'50%',background:dm?'rgba(255,255,255,.08)':'var(--canvas)',border:`1px solid ${topbarBorder}`,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:muted,transition:'all .2s',flexShrink:0 }}>
              {dm ? <Sun style={{ width:15,height:15,color:'#fbbf24' }}/> : <Moon style={{ width:15,height:15 }}/>}
            </button>
            {/* Avatar */}
            <div onClick={()=>setProfileOpen(true)} aria-label="Abrir perfil" style={{ width:34,height:34,borderRadius:'50%',background:'var(--forest)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--serif)',fontWeight:600,color:'white',fontSize:'.85rem',cursor:'pointer',flexShrink:0,overflow:'hidden' }}>
              {user.avatarUrl ? <img src={user.avatarUrl} alt="Perfil" style={{ width:'100%',height:'100%',objectFit:'cover' }} /> : (user.name||'?')[0].toUpperCase()}
            </div>
          </div>
        </header>

        {/* ── MAP / CENTRAL ── */}
        <div style={{ flex:1, position:'relative', minHeight:0, overflow:'hidden' }}>
          {commandOpen ? (
            <AdminDashboard
              incidents={incidents}
              darkMode={dm}
              onBack={() => setCommandOpen(false)}
              onResolve={handleResolve}
              onFlyTo={(lat,lng) => { setFlyTarget({lat,lng,zoom:14}); setTimeout(()=>setFlyTarget(null),2000); }}
              onDispatch={handleDispatch}
            />
          ) : (
            <>
          <MapView incidents={incidents} filter={filter} darkMode={dm} onMapClick={handleMapClick}
            flyTarget={flyTarget} onToast={showToast}
            gpsTarget={gpsTarget} userLocation={userLocation} userAccuracy={userAccuracy}
            heatVisible={heatVisible} onResolve={handleResolve}
            onLightbox={(url,caption)=>setLightbox({src:url,caption})}
            newIncidentId={newIncId}
          />

          {/* Filter chips */}
          {mapControlsVisible && <div className="map-filter-bar" style={{ position:'absolute',top:10,left:8,right:58,zIndex:200,display:'flex',alignItems:'center',gap:3,background:dm?'rgba(26,26,46,.95)':'rgba(255,255,255,.97)',border:`1px solid ${topbarBorder}`,borderRadius:99,padding:'5px 8px',boxShadow:'0 4px 24px rgba(0,0,0,.13)',backdropFilter:'blur(10px)',overflowX:'auto',scrollbarWidth:'none',animation:'chipsIn .5s .1s cubic-bezier(.34,1.56,.64,1) both',WebkitOverflowScrolling:'touch' }}>
            {[
              { key:'all',     label:'Todos',       Icon:MapIco,    ic:undefined },
              { key:'fire',    label:'Incêndio',    Icon:Flame,     ic:'var(--fire)' },
              { key:'flood',   label:'Alagamento',  Icon:Droplets,  ic:'var(--flood)' },
              { key:'recycle', label:'Descarte',    Icon:Recycle,   ic:'var(--forest)' },
            ].map(f => (
              <button key={f.key} onClick={()=>setFilter(f.key)} style={{ display:'flex',alignItems:'center',gap:4,padding:'5px 10px',borderRadius:99,border:'none',background:filter===f.key?'var(--forest)':'transparent',color:filter===f.key?'white':(dm?'rgba(255,255,255,.5)':'var(--am-muted)'),fontFamily:'var(--sans)',fontSize:'var(--text-sm)',fontWeight:600,cursor:'pointer',flexShrink:0,minHeight:30,transition:'all .18s' }}>
                <f.Icon style={{ width:'.68rem',height:'.68rem',flexShrink:0,color:filter===f.key?'white':(f.ic||'var(--am-muted)') }}/>{f.label}
              </button>
            ))}
            <span style={{ width:1,height:14,background:topbarBorder,flexShrink:0,margin:'0 2px' }}/>
            <button onClick={()=>setHeatVisible(h=>!h)} style={{ display:'flex',alignItems:'center',gap:4,padding:'5px 10px',borderRadius:99,border:'none',background:heatVisible?'#b91c1c':'transparent',color:heatVisible?'white':(dm?'rgba(255,255,255,.5)':'var(--am-muted)'),fontFamily:'var(--sans)',fontSize:'var(--text-sm)',fontWeight:600,cursor:'pointer',flexShrink:0,minHeight:30,transition:'all .18s' }}>
              <Thermometer style={{ width:'.68rem',height:'.68rem',color:heatVisible?'white':'#f59e0b' }}/> Calor
            </button>
            <button onClick={()=>{setFlyTarget({lat:IBIAPABA_CENTER.lat,lng:IBIAPABA_CENTER.lng,zoom:10});setTimeout(()=>setFlyTarget(null),1500);}} style={{ display:'flex',alignItems:'center',gap:4,padding:'5px 10px',borderRadius:99,border:'none',background:'transparent',color:dm?'rgba(255,255,255,.5)':'var(--am-muted)',fontFamily:'var(--sans)',fontSize:'var(--text-sm)',fontWeight:600,cursor:'pointer',flexShrink:0,minHeight:30,transition:'all .18s' }}>
              <MapPin style={{ width:'.68rem',height:'.68rem',color:'#7c3aed' }}/> Ibiapaba
            </button>
          </div>}

          {/* GPS button */}
          {mapControlsVisible && <button id="fab-gps" className="map-fab map-fab-gps" onClick={handleGPS} aria-label={gpsActive?'Re-centrar':'Minha localização'}
            style={{ position:'absolute',top:10,right:10,zIndex:210,width:40,height:40,borderRadius:12,border:gpsActive?'none':`1.5px solid ${topbarBorder}`,background:gpsError?'#fef2f2':gpsActive?'var(--forest)':(dm?'rgba(26,26,46,.95)':'rgba(255,255,255,.97)'),boxShadow:gpsActive?'0 3px 12px rgba(13,79,46,.35)':'0 2px 8px rgba(0,0,0,.08)',color:gpsError?'#dc2626':gpsActive?'white':muted,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',transition:'all .2s',backdropFilter:'blur(8px)' }}>
            {gpsLoading
              ? <span style={{ width:16,height:16,border:'2px solid currentColor',borderTopColor:'transparent',borderRadius:'50%',animation:'spin .7s linear infinite',display:'inline-block' }}/>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="7" strokeDasharray="2 2"/></svg>
            }
            {gpsActive && <span style={{ position:'absolute',top:-3,right:-3,width:9,height:9,borderRadius:'50%',background:'#22c55e',border:'2px solid white',animation:'gpsDot 2.4s ease-in-out infinite' }}/>}
          </button>}

          {/* Legend */}
          {mapControlsVisible && <div className="map-legend" style={{ position:'absolute',bottom:80,left:10,zIndex:200,background:dm?'rgba(26,26,46,.92)':'rgba(255,255,255,.92)',borderRadius:10,padding:'7px 11px',border:`1px solid ${topbarBorder}`,boxShadow:'0 2px 8px rgba(0,0,0,.08)',backdropFilter:'blur(12px)',display:'flex',flexDirection:'column',gap:4 }}>
            {[{c:'var(--fire)',l:'Incêndio'},{c:'var(--flood)',l:'Alagamento'},{c:'var(--forest)',l:'Ecoponto'}].map(x=>(
              <div key={x.l} style={{ display:'flex',alignItems:'center',gap:6,fontSize:'var(--text-xs)',fontWeight:600,color:muted,whiteSpace:'nowrap' }}>
                <span style={{ width:7,height:7,borderRadius:'50%',background:x.c,flexShrink:0 }}/> {x.l}
              </div>
            ))}
          </div>}

          {/* Incident toast */}
          {mapControlsVisible && toast && (
            <div style={{ position:'absolute',bottom:80,left:'50%',transform:'translateX(-50%)',zIndex:220,display:'flex',alignItems:'center',gap:10,padding:'11px 15px',borderRadius:14,background:dm?'rgba(26,26,46,.97)':'white',border:`1px solid ${topbarBorder}`,boxShadow:'0 8px 24px rgba(0,0,0,.1)',maxWidth:'calc(100vw - 40px)',animation:'slideUp .3s cubic-bezier(.34,1.56,.64,1)',width:'max-content' }}>
              <span style={{ width:28,height:28,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',background:toast.type==='fire'?'#fff3ed':toast.type==='flood'?'#eff6ff':'#f0fdf4',fontSize:'1.1rem' }}>
                  {toast.type==='fire'?'🔥':toast.type==='flood'?'🌊':'♻️'}
                </span>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ display:'flex',alignItems:'center',gap:8,minWidth:0 }}>
                  <div style={{ fontSize:'.85rem',fontWeight:700,color:ink,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:'46vw' }}>{toast.title}</div>
                  {toast.status==='resolvido' && <span style={{ flexShrink:0,padding:'2px 7px',borderRadius:999,background:'#dcfce7',color:'#15803d',fontSize:'.65rem',fontWeight:900 }}>Resolvido</span>}
                  {toast.status==='despachado' && <span style={{ flexShrink:0,padding:'2px 7px',borderRadius:999,background:'#dbeafe',color:'#2563eb',fontSize:'.65rem',fontWeight:900 }}>Equipe a caminho</span>}
                </div>
                <div style={{ fontSize:'var(--text-sm)',color:muted,marginTop:2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:'55vw' }}>{toast.time} · {toast.desc}</div>
              </div>
              <button onClick={()=>setToast(null)} aria-label="Fechar" style={{ background:'none',border:'none',color:muted,cursor:'pointer',padding:2,fontSize:'.9rem' }}><X style={{ width:16,height:16 }}/></button>
            </div>
          )}

          {/* Denunciar */}
          {mapControlsVisible && <button id="fab-report" onClick={handleOpenReport} aria-label="Registrar denúncia"
            style={{ position:'fixed',bottom:'max(18px, env(safe-area-inset-bottom, 18px))',left:'50%',transform:'translateX(-50%)',zIndex:900,display:'flex',alignItems:'center',gap:8,padding:'13px 28px',borderRadius:99,border:'none',background:'linear-gradient(135deg, #ea580c 0%, #dc2626 100%)',color:'white',fontFamily:'var(--sans)',fontWeight:700,fontSize:'.9rem',cursor:'pointer',boxShadow:'0 6px 24px rgba(220,74,10,.42)',transition:'transform .2s,box-shadow .2s',whiteSpace:'nowrap',letterSpacing:'-.01em',overflow:'hidden' }}
            onMouseEnter={e=>{e.currentTarget.style.transform='translateX(-50%) translateY(-2px)';e.currentTarget.style.boxShadow='0 10px 30px rgba(220,74,10,.5)';}}
            onMouseLeave={e=>{e.currentTarget.style.transform='translateX(-50%)';e.currentTarget.style.boxShadow='0 6px 24px rgba(220,74,10,.42)';}}>
            <span className="fab-shimmer" />
            <AlertTriangle style={{ width:18,height:18 }}/> Denunciar
          </button>}

          {/* Chat */}
          {mapControlsVisible && <button id="fab-chat" onClick={()=>{setChatOpen(o=>!o);if(!chatOpen)setChatUnread(false);}} aria-label="Abrir EcoAI"
            style={{ position:'fixed',right:'max(14px, env(safe-area-inset-right, 14px))',bottom:'max(84px, calc(env(safe-area-inset-bottom, 0px) + 82px))',zIndex:900,width:50,height:50,borderRadius:'50%',border:'none',background:'var(--forest)',color:'white',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',boxShadow:'0 4px 18px rgba(13,79,46,.38)',transition:'transform .2s,box-shadow .2s' }}
            onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 8px 24px rgba(13,79,46,.48)';}}
            onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 4px 18px rgba(13,79,46,.38)';}}>
            <Leaf style={{ width:20,height:20 }}/>
            <span className="ecoai-tooltip">EcoAI</span>
            {chatUnread && <span style={{ position:'absolute',top:-2,right:-2,width:12,height:12,borderRadius:'50%',background:'var(--fire)',border:'2.5px solid white' }}/>}
          </button>}
          </>
          )}
        </div>
      </div>

      <ReportModal open={reportOpen} onClose={()=>setReportOpen(false)}
        onSubmit={handleReportSubmit} clickedLocation={clickedLocation}
        onCelebration={handleCelebration}
        cooldowns={cooldowns} cooldownMs={COOLDOWN_MS}
      />
    </div>
  );
}
