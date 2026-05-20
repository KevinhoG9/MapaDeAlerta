import { useState, useRef, useEffect } from 'react';
import { Leaf, Trash2, ArrowLeft, Send, Recycle, Droplets, Zap, Flame } from 'lucide-react';

interface Message {
  role: 'user' | 'bot';
  text: string;
  time: string;
}

interface ChatPanelProps {
  open: boolean;
  darkMode: boolean;
  onClose: () => void;
  onOpen?: () => void;
  user?: any;
  onEarnPoints?: (pts: number, text: string, ico: string) => void;
}

const BOT_RESPONSES: Record<string, string> = {
  'default': 'Olá! Sou o EcoAI, assistente do AlertaMap. Posso ajudar com dúvidas sobre reciclagem, emergências ambientais e como ganhar EcoPoints. Como posso ajudar?',
  'ecopoints': 'Você ganha EcoPoints de várias formas: denunciar incêndio (+50pts), alagamento (+40pts), descarte irregular (+20pts), confirmar resolução (+15pts), e login diário (+5pts). Continue denunciando para subir de nível!',
  'alagamento': 'Em caso de alagamento: 1) Evite transitar pela área alagada. 2) Desligue equipamentos elétricos. 3) Procure locais mais elevados. 4) Ligue para a Defesa Civil: 199. O AlertaMap notifica automaticamente a comunidade.',
  'reciclagem': 'Na Serra da Ibiapaba, temos Ecopontos em Frecheirinha, Ibiapina e Parque Ubajara. Caixa de pizza suja NÃO pode ser reciclada no papel — ela pode ir para compostagem se disponível.',
  'risco': 'O risco de queimada depende da umidade relativa do ar. Quando abaixo de 20%, o risco é ALTO. A Serra da Ibiapaba tem clima mais úmido, mas períodos secos podem aumentar o risco significativamente.',
};

function getBotResponse(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes('ecopoint') || lower.includes('pontos') || lower.includes('ponto')) return BOT_RESPONSES['ecopoints'];
  if (lower.includes('alagamento') || lower.includes('enchente') || lower.includes('inunda')) return BOT_RESPONSES['alagamento'];
  if (lower.includes('recicl') || lower.includes('pizza') || lower.includes('lixo')) return BOT_RESPONSES['reciclagem'];
  if (lower.includes('risco') || lower.includes('queimada') || lower.includes('incêndio') || lower.includes('fogo')) return BOT_RESPONSES['risco'];
  return BOT_RESPONSES['default'];
}

function getTime() {
  return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function ChatPanel({ open, darkMode, onClose, onOpen, user, onEarnPoints }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: 'Olá! Sou o EcoAI. Pergunte sobre emergências, reciclagem ou EcoPoints.', time: getTime() },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const msgsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [messages, typing]);

  useEffect(() => {
    if (open) {
      if (onOpen) onOpen();
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  const send = (text: string) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { role: 'user', text: text.trim(), time: getTime() }]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'bot', text: getBotResponse(text), time: getTime() }]);
      setTyping(false);
    }, 800 + Math.random() * 600);
  };

  const clear = () => setMessages([{ role: 'bot', text: 'Chat limpo! Como posso ajudar?', time: getTime() }]);

  const quickChips = [
    { label: 'Caixa de pizza?', q: 'Posso reciclar caixa de pizza suja?', Icon: Recycle, color: '#16a34a' },
    { label: 'Alagamento', q: 'O que fazer em caso de alagamento?', Icon: Droplets, color: '#2563eb' },
    { label: 'EcoPoints', q: 'Como ganhar mais EcoPoints?', Icon: Zap, color: '#d97706' },
    { label: 'Risco hoje', q: 'Qual o risco de queimada hoje na Ibiapaba?', Icon: Flame, color: '#f97316' },
  ];

  const dm = darkMode;
  const bg     = dm ? '#1a1a2e' : 'white';
  const bgSub  = dm ? '#16213e' : '#f6f7f5';
  const border = dm ? 'rgba(255,255,255,.08)' : 'rgba(15,26,15,.08)';
  const ink    = dm ? '#e8f0e8' : '#0e1a0e';
  const muted  = dm ? 'rgba(255,255,255,.38)' : '#6b7c6b';

  return (
    /* Fullscreen slide-up panel */
    <div style={{
      position:'fixed', inset:0, zIndex:3000,
      display:'flex', flexDirection:'column',
      background: dm ? 'radial-gradient(circle at 20% 0%, rgba(34,197,94,.12), transparent 32%), linear-gradient(180deg, #0f172a, #111827)' : 'linear-gradient(180deg, #f8fbf8, #ffffff)',
      fontFamily:'var(--sans)',
      transform: open ? 'translateY(0)' : 'translateY(100%)',
      transition:'transform .3s cubic-bezier(.22,1,.36,1)',
      pointerEvents: open ? 'auto' : 'none',
    }}>
      {/* Header estilo Google Maps / iMessage */}
      <div style={{
        display:'flex', alignItems:'center', gap:12,
        padding:'env(safe-area-inset-top, 0px) 16px 0',
        paddingTop:`max(env(safe-area-inset-top, 0px), 12px)`,
        paddingBottom:12,
        background: dm ? '#0d4f2e' : 'var(--forest)',
        flexShrink:0,
      }}>
        <button onClick={onClose} aria-label="Voltar" style={{ background:'rgba(255,255,255,.12)',border:'none',borderRadius:'50%',width:36,height:36,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'white',flexShrink:0,transition:'background .18s' }}
          onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,.2)')} onMouseLeave={e=>(e.currentTarget.style.background='rgba(255,255,255,.12)')}>
          <ArrowLeft style={{ width:18,height:18 }}/>
        </button>

        <div style={{ position:'relative', flexShrink:0 }}>
          <div style={{ width:36,height:36,borderRadius:'50%',background:'rgba(255,255,255,.14)',display:'flex',alignItems:'center',justifyContent:'center' }}>
            <Leaf style={{ width:18,height:18,color:'white' }}/>
          </div>
          <span style={{ position:'absolute',bottom:0,right:0,width:10,height:10,borderRadius:'50%',background:'#4ade80',border:'2px solid var(--forest)' }}/>
        </div>

        <div style={{ flex:1 }}>
          <div style={{ fontWeight:700,fontSize:'.95rem',color:'white',letterSpacing:'-.01em' }}>EcoAI</div>
          <div style={{ fontSize:'.7rem',color:'rgba(255,255,255,.6)' }}>● Online · Assistente ambiental</div>
        </div>

        <button onClick={clear} aria-label="Limpar conversa" style={{ background:'rgba(255,255,255,.12)',border:'none',borderRadius:'50%',width:36,height:36,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'rgba(255,255,255,.8)',transition:'background .18s' }}
          onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,.2)')} onMouseLeave={e=>(e.currentTarget.style.background='rgba(255,255,255,.12)')}>
          <Trash2 style={{ width:16,height:16 }}/>
        </button>
      </div>

      {/* Messages area */}
      <div ref={msgsRef} className="ecoai-messages" style={{ flex:1, overflowY:'auto', padding:'22px 16px', display:'flex', flexDirection:'column', gap:12, maxWidth:820, width:'100%', boxSizing:'border-box', margin:'0 auto' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display:'flex', flexDirection:'column', alignItems: m.role==='user'?'flex-end':'flex-start' }}>
            {m.role === 'bot' && (
              <div style={{ display:'flex', alignItems:'flex-end', gap:8, marginBottom:2 }}>
                <div style={{ width:24,height:24,borderRadius:'50%',background:'var(--forest)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                  <Leaf style={{ width:12,height:12,color:'white' }}/>
                </div>
                <div style={{ maxWidth:'82%', padding:'10px 14px', borderRadius:18, borderBottomLeftRadius:4, fontSize:'.84rem', lineHeight:1.55, wordBreak:'break-word', background:bgSub, border:`1px solid ${border}`, color:ink, animation:'msgIn .2s ease-out' }}>
                  {m.text}
                </div>
              </div>
            )}
            {m.role === 'user' && (
              <div style={{ maxWidth:'82%', padding:'10px 14px', borderRadius:18, borderBottomRightRadius:4, fontSize:'.84rem', lineHeight:1.55, wordBreak:'break-word', background:'var(--forest)', color:'white', animation:'msgIn .2s ease-out' }}>
                {m.text}
              </div>
            )}
            <span style={{ fontSize:'.65rem', color:muted, marginTop:3, paddingInline:4 }}>{m.time}</span>
          </div>
        ))}
        {typing && (
          <div style={{ display:'flex', alignItems:'flex-end', gap:8 }}>
            <div style={{ width:24,height:24,borderRadius:'50%',background:'var(--forest)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
              <Leaf style={{ width:12,height:12,color:'white' }}/>
            </div>
            <div style={{ padding:'11px 15px', background:bgSub, border:`1px solid ${border}`, borderRadius:18, borderBottomLeftRadius:4, display:'flex', gap:5, alignItems:'center' }}>
              {[0,1,2].map(j => <span key={j} style={{ width:7,height:7,borderRadius:'50%',background:muted,animation:`typebounce .9s infinite ${j*.15}s`,display:'block' }}/>)}
            </div>
          </div>
        )}
      </div>

      {/* Quick chips */}
      <div className="quick-chips" style={{ display:'flex', gap:8, overflowX:'auto', padding:'10px 16px 6px', scrollbarWidth:'none', maxWidth:820, width:'100%', boxSizing:'border-box', margin:'0 auto' }}>
        {quickChips.map(c => (
          <button key={c.label} onClick={() => send(c.q)} style={{ flexShrink:0, padding:'8px 13px', borderRadius:99, border:`1px solid ${border}`, fontSize:'.75rem', fontWeight:700, color:muted, whiteSpace:'nowrap', background:bgSub, fontFamily:'var(--sans)', cursor:'pointer', transition:'all .18s', display:'flex', alignItems:'center', gap:7 }}
            onMouseEnter={e=>{e.currentTarget.style.background=c.color;e.currentTarget.style.color='white';e.currentTarget.style.borderColor=c.color;}}
            onMouseLeave={e=>{e.currentTarget.style.background=bgSub;e.currentTarget.style.color=muted;e.currentTarget.style.borderColor=border;}}>
            <c.Icon style={{ width:14,height:14,strokeWidth:2.5 }} /> {c.label}
          </button>
        ))}
      </div>

      {/* Input bar */}
      <div style={{ borderTop:`1px solid ${border}`, background:dm?'rgba(15,23,42,.82)':'rgba(255,255,255,.9)', backdropFilter:'blur(16px)', flexShrink:0 }}><div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 16px', paddingBottom:`max(12px, env(safe-area-inset-bottom, 12px))`, maxWidth:820, width:'100%', boxSizing:'border-box', margin:'0 auto' }}>
        <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send(input)}
          placeholder="Pergunte ao EcoAI..."
          style={{ flex:1, border:`1.5px solid ${border}`, borderRadius:99, padding:'10px 16px', background:bgSub, fontFamily:'var(--sans)', fontSize:'.84rem', color:ink, outline:'none', transition:'border-color .18s' }}
          onFocus={e=>(e.target.style.borderColor='var(--forest)')} onBlur={e=>(e.target.style.borderColor=border)}/>
        <button onClick={() => send(input)} aria-label="Enviar" style={{ width:40,height:40,borderRadius:'50%',border:'none',background:input.trim()?'var(--forest)':'rgba(15,26,15,.1)',color:input.trim()?'white':muted,display:'flex',alignItems:'center',justifyContent:'center',cursor:input.trim()?'pointer':'default',transition:'all .18s',flexShrink:0 }}>
          <Send style={{ width:16,height:16 }}/>
        </button>
      </div></div>
    </div>
  );
}
