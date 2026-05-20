import { useMemo, useState, useRef, useEffect, type ReactNode } from 'react';
import { LogOut, Flame, Droplets, Recycle, CheckSquare, MessageSquare, Calendar, Trophy, TrendingUp, Sparkles, Search, X, Map, Star, Shield, Medal, Award, BarChart3, ChevronRight, Target, Zap, Gift, ShoppingBag, Store, Info, Coffee, ShoppingCart, Sprout, Ticket, Scissors, Bike, Utensils, Flower2, BookOpen, Home, AlertTriangle, BadgeCheck, Eye, Crown, CircleDot, Leaf } from 'lucide-react';
import { User, Incident, REWARDS, DB } from './data';
import { rankBronze, rankPrata, rankOuro, rankRubi, rankSafira, rankAmetista, rankDiamante } from '../assets/rankData';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import bronzeModelUrl from '../assets/ranks3d/bronze.glb?url';
import prataModelUrl from '../assets/ranks3d/prata.glb?url';
import ouroModelUrl from '../assets/ranks3d/ouro.glb?url';
import rubiModelUrl from '../assets/ranks3d/rubi.glb?url';
import safiraModelUrl from '../assets/ranks3d/safira.glb?url';
import ametistaModelUrl from '../assets/ranks3d/ametista.glb?url';
import diamanteModelUrl from '../assets/ranks3d/diamante.glb?url';

interface SidebarProps {
  user: User;
  incidents: Incident[];
  open: boolean;
  darkMode: boolean;
  onClose: () => void;
  onLogout: () => void;
  onFlyTo: (lat: number, lng: number) => void;
  onResolve: (id: string) => void;
  onRefreshUser: () => void;
  onOpenProfile?: () => void;
  onOpenRedeem?: (reward: any) => void;
  onOpenCommand?: () => void;
  totalReports?: number;
}

type Division = { name: string; min: number; color: string; accent: string; glow: string; badge: string; blurb: string };
type EnrichedUser = User & {
  totalReports: number;
  fireCount: number;
  floodCount: number;
  recycleCount: number;
  resolvedCount: number;
  streak: number;
  impactScore: number;
  accuracy: number;
  division: Division;
  nextDivision: Division | null;
  divisionProgress: number;
  monthlyTrend: number;
  badges: string[];
};

type RankingKey = 'points' | 'reports' | 'recycle' | 'streak';

const DIVISIONS: Division[] = [
  { name: 'Bronze', min: 0, color: '#b9804f', accent: '#e7b07d', glow: 'rgba(185,128,79,.34)', badge: rankBronze, blurb: 'Primeiros passos de impacto comunitário.' },
  { name: 'Prata', min: 450, color: '#94a3b8', accent: '#d6dee8', glow: 'rgba(148,163,184,.35)', badge: rankPrata, blurb: 'Participação constante e presença nas denúncias.' },
  { name: 'Ouro', min: 900, color: '#d4a017', accent: '#ffe082', glow: 'rgba(212,160,23,.32)', badge: rankOuro, blurb: 'Bom nível de resposta e engajamento ambiental.' },
  { name: 'Rubi', min: 1600, color: '#dc2626', accent: '#fca5a5', glow: 'rgba(220,38,38,.32)', badge: rankRubi, blurb: 'Atuação forte em alertas críticos e emergências.' },
  { name: 'Safira', min: 2600, color: '#2563eb', accent: '#93c5fd', glow: 'rgba(37,99,235,.35)', badge: rankSafira, blurb: 'Destaque regional em monitoramento e prevenção.' },
  { name: 'Ametista', min: 4000, color: '#7c3aed', accent: '#ddd6fe', glow: 'rgba(124,58,237,.38)', badge: rankAmetista, blurb: 'Elite da comunidade: constância, precisão e impacto.' },
  { name: 'Diamante', min: 6000, color: '#0ea5e9', accent: '#e0f2fe', glow: 'rgba(14,165,233,.38)', badge: rankDiamante, blurb: 'Referência máxima em impacto ambiental comunitário.' },
];

function getDivision(ecoPoints: number) {
  for (let i = DIVISIONS.length - 1; i >= 0; i--) {
    if (ecoPoints >= DIVISIONS[i].min) return { current: DIVISIONS[i], next: DIVISIONS[i + 1] ?? null };
  }
  return { current: DIVISIONS[0], next: DIVISIONS[1] };
}

function enrichUser(user: User): EnrichedUser {
  const reports = user.reports || [];
  let fireCount = reports.filter(r => r.type === 'fire').length;
  let floodCount = reports.filter(r => r.type === 'flood').length;
  let recycleCount = reports.filter(r => r.type === 'recycle').length;
  let totalReports = reports.length;

  if (totalReports === 0) {
    totalReports = Math.max(4, Math.round((user.ecoPoints || 0) / 52));
    fireCount = Math.max(1, Math.round(totalReports * 0.38));
    floodCount = Math.max(1, Math.round(totalReports * 0.24));
    recycleCount = Math.max(1, totalReports - fireCount - floodCount);
  }

  const resolvedCount = Math.max(1, Math.round(totalReports * 0.72));
  const streak = user.loginStreak || Math.max(2, Math.round((user.ecoPoints || 0) / 180));
  const accuracy = Math.min(99, 76 + Math.round((resolvedCount / Math.max(totalReports, 1)) * 18));
  const impactScore = fireCount * 5 + floodCount * 4 + recycleCount * 3 + Math.round((user.ecoPoints || 0) / 110);
  const { current, next } = getDivision(user.ecoPoints || 0);
  const divisionProgress = next
    ? Math.max(8, Math.min(100, (((user.ecoPoints || 0) - current.min) / Math.max(next.min - current.min, 1)) * 100))
    : 100;
  const monthlyTrend = Math.max(6, Math.min(38, Math.round((recycleCount / Math.max(totalReports, 1)) * 20) + Math.round(streak / 2)));
  const badges = [
    fireCount >= 6 ? 'Resposta rápida' : 'Agente local',
    recycleCount >= 4 ? 'Reciclagem ativa' : 'Vigilância urbana',
    streak >= 7 ? `${streak} dias em sequência` : 'Em evolução',
  ];

  return {
    ...user,
    totalReports,
    fireCount,
    floodCount,
    recycleCount,
    resolvedCount,
    streak,
    impactScore,
    accuracy,
    division: current,
    nextDivision: next,
    divisionProgress,
    monthlyTrend,
    badges,
  };
}

function shortDivisionName(name: string) {
  return name.length > 14 ? name.replace('Guardião', 'Guard.') : name;
}


function PremiumIconShell({
  children, color, glow, bg, size = 46,
}: {
  children: ReactNode;
  color: string;
  glow?: string;
  bg?: string;
  size?: number;
}) {
  return (
    <div
      className="am-premium-icon-shell"
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.34),
        background: bg || `radial-gradient(circle at 35% 20%, rgba(255,255,255,.34), transparent 34%), linear-gradient(145deg, ${color}22, ${color}0b)`,
        border: `1px solid ${color}38`,
        boxShadow: glow ? `0 14px 30px ${glow}` : `0 10px 24px ${color}22`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color,
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <span style={{ position:'absolute', inset:-18, background:`radial-gradient(circle, ${color}20, transparent 58%)`, opacity:.9 }} />
      <span style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>{children}</span>
    </div>
  );
}

function IncidentTypeIcon({ type, size = 38 }: { type: string; size?: number }) {
  const cfg =
    type === 'fire'
      ? { emoji: '🔥', color: '#f97316', bg: '#fff3ed', border: '#fed7aa' }
      : type === 'flood'
      ? { emoji: '🌊', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' }
      : { emoji: '♻️', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' };

  return (
    <span style={{
      width:size,
      height:size,
      borderRadius:Math.round(size * .34),
      display:'flex',
      alignItems:'center',
      justifyContent:'center',
      background:cfg.bg,
      border:`1px solid ${cfg.border}`,
      boxShadow:`0 10px 22px ${cfg.color}22`,
      fontSize:Math.max(15, Math.round(size * .48)),
      flexShrink:0
    }}>{cfg.emoji}</span>
  );
}

function RewardVisual({ reward, canAfford, dm }: { reward: any; canAfford: boolean; dm: boolean }) {
  const map: Record<string, any> = {
    r1: { Icon: Coffee, color: '#8b5e34', bg: 'linear-gradient(145deg, rgba(139,94,52,.18), rgba(245,222,179,.12))' },
    r2: { Icon: ShoppingCart, color: '#2563eb', bg: 'linear-gradient(145deg, rgba(37,99,235,.18), rgba(147,197,253,.12))' },
    r3: { Icon: Sprout, color: '#16a34a', bg: 'linear-gradient(145deg, rgba(22,163,74,.18), rgba(187,247,208,.12))' },
    r4: { Icon: Ticket, color: '#e11d48', bg: 'linear-gradient(145deg, rgba(225,29,72,.18), rgba(253,164,175,.12))' },
    r5: { Icon: Scissors, color: '#7c3aed', bg: 'linear-gradient(145deg, rgba(124,58,237,.18), rgba(196,181,253,.12))' },
    r6: { Icon: Bike, color: '#0891b2', bg: 'linear-gradient(145deg, rgba(8,145,178,.18), rgba(103,232,249,.12))' },
    r7: { Icon: Utensils, color: '#d97706', bg: 'linear-gradient(145deg, rgba(217,119,6,.18), rgba(253,230,138,.12))' },
    r8: { Icon: Flower2, color: '#059669', bg: 'linear-gradient(145deg, rgba(5,150,105,.18), rgba(167,243,208,.12))' },
    r9: { Icon: BookOpen, color: '#4f46e5', bg: 'linear-gradient(145deg, rgba(79,70,229,.18), rgba(199,210,254,.12))' },
    r10:{ Icon: Home, color: '#b45309', bg: 'linear-gradient(145deg, rgba(180,83,9,.18), rgba(254,215,170,.12))' },
  };
  const cfg = map[reward.id] || { Icon: Gift, color: '#0d4f2e', bg: 'linear-gradient(145deg, rgba(13,79,46,.18), rgba(34,197,94,.12))' };
  const mutedBg = dm ? 'rgba(255,255,255,.045)' : '#f8fafc';
  const mutedColor = dm ? 'rgba(255,255,255,.42)' : '#94a3b8';
  return (
    <PremiumIconShell color={canAfford ? cfg.color : mutedColor} bg={canAfford ? cfg.bg : mutedBg} glow={canAfford ? `${cfg.color}33` : undefined} size={50}>
      <cfg.Icon style={{ width: 23, height: 23, strokeWidth: 2.45 }} />
    </PremiumIconShell>
  );
}



function loadImageForCanvas(src?: string): Promise<HTMLImageElement | null> {
  return new Promise(resolve => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1200);
}

async function makePrettyFallbackCardBlob(
  person: any,
  rankLabel: string,
  realReports: number,
  realAccuracy: number,
  realStreak: number
): Promise<Blob> {
  const W = 900;
  const H = 1280;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas indisponível.');

  const rank = person.division?.color || '#7c3aed';
  const rank2 = person.division?.accent || rank;
  const dark = person.division?.dark || '#24102f';
  const name = person.name || 'Usuário';
  const title = person.profileTitle || 'Guardião ambiental';
  const division = person.division?.name || 'Divisão';
  const blurb = person.division?.blurb || 'Impacto ambiental em construção.';
  const badge = await loadImageForCanvas(person.division?.badge);
  const avatar = await loadImageForCanvas(person.avatarUrl);

  const fillRound = (x:number, y:number, w:number, h:number, r:number, fill:string) => {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fillStyle = fill;
    ctx.fill();
  };

  const strokeRound = (x:number, y:number, w:number, h:number, r:number, stroke:string, lw = 3) => {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw;
    ctx.stroke();
  };

  const drawImageCover = (img: HTMLImageElement, x:number, y:number, w:number, h:number) => {
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const sw = w / scale;
    const sh = h / scale;
    const sx = (img.naturalWidth - sw) / 2;
    const sy = (img.naturalHeight - sh) / 2;
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  };

  const drawLeafIcon = (cx:number, cy:number, color = '#1f2937') => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.ellipse(0, 0, 13, 8, -0.72, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-9, 8);
    ctx.quadraticCurveTo(-1, 0, 11, -7);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-10, 13);
    ctx.lineTo(10, -7);
    ctx.stroke();
    ctx.restore();
  };

  const drawCheckIcon = (cx:number, cy:number, color = '#1f2937') => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeRect(cx - 12, cy - 10, 22, 22);
    ctx.beginPath();
    ctx.moveTo(cx - 6, cy + 1);
    ctx.lineTo(cx - 1, cy + 7);
    ctx.lineTo(cx + 12, cy - 8);
    ctx.stroke();
    ctx.restore();
  };

  const drawTargetIcon = (cx:number, cy:number, color = '#1f2937') => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    for (const r of [14, 8, 3]) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  };

  const drawFlameIcon = (cx:number, cy:number, color = '#1f2937') => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 15);
    ctx.bezierCurveTo(-12, 8, -9, -5, -1, -13);
    ctx.bezierCurveTo(0, -5, 10, -8, 9, 4);
    ctx.bezierCurveTo(9, 11, 4, 15, 0, 15);
    ctx.stroke();
    ctx.restore();
  };

  const drawReportIcon = (type:string, cx:number, cy:number) => {
    const color = type === 'flood' ? '#2563eb' : type === 'recycle' ? '#16a34a' : '#f97316';
    fillRound(cx - 19, cy - 19, 38, 38, 12, '#fff7ed');
    strokeRound(cx - 19, cy - 19, 38, 38, 12, 'rgba(255,255,255,.28)', 1.5);
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (type === 'flood') {
      ctx.beginPath();
      ctx.moveTo(cx - 10, cy);
      ctx.quadraticCurveTo(cx - 5, cy - 6, cx, cy);
      ctx.quadraticCurveTo(cx + 5, cy + 6, cx + 10, cy);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 10, cy + 8);
      ctx.quadraticCurveTo(cx - 5, cy + 2, cx, cy + 8);
      ctx.quadraticCurveTo(cx + 5, cy + 14, cx + 10, cy + 8);
      ctx.stroke();
    } else if (type === 'recycle') {
      ctx.beginPath();
      ctx.arc(cx, cy, 11, -0.5, 1.9);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + 11, cy - 1);
      ctx.lineTo(cx + 15, cy - 9);
      ctx.lineTo(cx + 6, cy - 9);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, 11, 2.65, 5.0);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 11, cy + 1);
      ctx.lineTo(cx - 15, cy + 9);
      ctx.lineTo(cx - 6, cy + 9);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(cx, cy + 13);
      ctx.bezierCurveTo(cx - 10, cy + 5, cx - 6, cy - 7, cx + 1, cy - 14);
      ctx.bezierCurveTo(cx, cy - 5, cx + 10, cy - 7, cx + 8, cy + 4);
      ctx.bezierCurveTo(cx + 7, cy + 10, cx + 3, cy + 13, cx, cy + 13);
      ctx.stroke();
    }
    ctx.restore();
  };

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, dark);
  bg.addColorStop(.46, rank);
  bg.addColorStop(1, '#0b1020');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.globalAlpha = .13;
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 700; i++) {
    ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1);
  }
  ctx.globalAlpha = 1;

  strokeRound(18, 18, W - 36, H - 36, 28, rank2, 5);
  strokeRound(28, 28, W - 56, H - 56, 22, 'rgba(0,0,0,.82)', 4);
  strokeRound(38, 38, W - 76, H - 76, 18, 'rgba(255,255,255,.18)', 2);

  const paper = '#f4e2c8';
  fillRound(48, 48, W - 96, 82, 18, paper);
  strokeRound(48, 48, W - 96, 82, 18, 'rgba(0,0,0,.85)', 4);
  if (badge) ctx.drawImage(badge, 68, 58, 60, 60);
  ctx.fillStyle = '#211427';
  ctx.font = '900 46px Georgia, serif';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(name, 142, 101);

  fillRound(48, 146, 378, 310, 16, 'rgba(255,255,255,.82)');
  strokeRound(48, 146, 378, 310, 16, 'rgba(0,0,0,.85)', 4);
  fillRound(444, 146, 408, 310, 16, dark);
  strokeRound(444, 146, 408, 310, 16, 'rgba(0,0,0,.85)', 4);

  if (avatar) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(58, 154, 362, 246, 16);
    ctx.clip();
    drawImageCover(avatar, 58, 154, 362, 246);
    ctx.restore();
  } else {
    fillRound(155, 195, 165, 165, 999, 'rgba(15,23,42,.10)');
    ctx.fillStyle = 'rgba(15,23,42,.42)';
    ctx.font = '900 46px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(String(name).split(' ').map((n:string) => n[0]).slice(0,2).join('').toUpperCase(), 238, 292);
    ctx.textAlign = 'left';
  }

  fillRound(104, 402, 266, 38, 999, 'rgba(255,255,255,.92)');
  strokeRound(104, 402, 266, 38, 999, 'rgba(15,23,42,.22)', 2);
  ctx.fillStyle = '#1f2937';
  ctx.font = '900 17px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText(title, 237, 427);
  ctx.textAlign = 'left';

  if (badge) ctx.drawImage(badge, 557, 178, 170, 170);
  ctx.fillStyle = '#f5e8ff';
  ctx.font = '900 58px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(String(division).toUpperCase(), 648, 370);
  ctx.font = '800 20px system-ui';
  const blurbLines = String(blurb).match(/.{1,32}(?:\s|$)/g)?.slice(0,2) || [blurb];
  blurbLines.forEach((line:string, i:number) => ctx.fillText(line.trim(), 648, 405 + i * 24));
  ctx.textAlign = 'left';

  const ribbon = ctx.createLinearGradient(48, 0, 852, 0);
  ribbon.addColorStop(0, dark);
  ribbon.addColorStop(.18, rank);
  ribbon.addColorStop(.46, paper);
  ribbon.addColorStop(.54, paper);
  ribbon.addColorStop(.82, rank);
  ribbon.addColorStop(1, dark);
  ctx.fillStyle = ribbon;
  ctx.beginPath();
  ctx.roundRect(48, 472, W - 96, 70, 14);
  ctx.fill();

  // brilho metálico linear, sem manchas circulares visíveis
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(57, 481, W - 114, 52, 10);
  ctx.clip();

  const gloss = ctx.createLinearGradient(57, 481, 57, 533);
  gloss.addColorStop(0, 'rgba(255,255,255,.42)');
  gloss.addColorStop(.38, 'rgba(255,255,255,.10)');
  gloss.addColorStop(1, 'rgba(0,0,0,.12)');
  ctx.fillStyle = gloss;
  ctx.fillRect(57, 481, W - 114, 52);

  const shine = ctx.createLinearGradient(220, 481, 660, 533);
  shine.addColorStop(0, 'rgba(255,255,255,0)');
  shine.addColorStop(.45, 'rgba(255,255,255,.30)');
  shine.addColorStop(.58, 'rgba(255,255,255,.08)');
  shine.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = shine;
  ctx.fillRect(57, 481, W - 114, 52);

  ctx.globalAlpha = .16;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  for (let x = 80; x < 820; x += 34) {
    ctx.beginPath();
    ctx.moveTo(x, 485);
    ctx.lineTo(x + 18, 530);
    ctx.stroke();
  }
  ctx.restore();

  strokeRound(48, 472, W - 96, 70, 14, 'rgba(0,0,0,.85)', 4);
  strokeRound(57, 481, W - 114, 52, 10, 'rgba(255,255,255,.24)', 2);

  ctx.fillStyle = dark;
  ctx.font = '900 36px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = rank2;
  ctx.shadowBlur = 8;
  ctx.fillText(`DIVISÃO ${String(division).toUpperCase()}`, W / 2, 517);
  ctx.shadowBlur = 0;
  ctx.textAlign = 'left';

  fillRound(48, 560, 378, 330, 16, dark);
  strokeRound(48, 560, 378, 330, 16, 'rgba(0,0,0,.85)', 4);
  if (badge) ctx.drawImage(badge, 158, 600, 160, 160);

  const drawCenterPill = (y: number, main: string, sub: string, withBadge = false) => {
    // Mesmo enquadramento visual do card exibido no perfil:
    // ícone à esquerda, texto em duas linhas e tudo centralizado dentro do pill.
    const pillX = 80;
    const pillW = 314;
    const pillH = 58;
    const iconSize = 31;
    const iconX = pillX + 36;
    const iconY = y + pillH / 2;
    const textX = pillX + 90;
    const textAreaW = pillW - 112;

    fillRound(pillX, y, pillW, pillH, 14, 'rgba(255,255,255,.15)');
    strokeRound(pillX, y, pillW, pillH, 14, 'rgba(255,255,255,.34)', 2);

    if (withBadge && badge) {
      ctx.drawImage(badge, iconX - iconSize / 2, iconY - iconSize / 2, iconSize, iconSize);
    } else {
      ctx.save();
      ctx.font = '29px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#facc15';
      ctx.fillText('🏆', iconX, iconY + 1);
      ctx.restore();
    }

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = '#f8fafc';
    ctx.font = '900 24px Georgia, serif';
    ctx.fillText(main, textX + textAreaW / 2, y + 23, textAreaW);

    ctx.fillStyle = 'rgba(255,255,255,.84)';
    ctx.font = '900 13px system-ui';
    ctx.fillText(sub, textX + textAreaW / 2, y + 41, textAreaW);

    ctx.restore();
  };

  drawCenterPill(768, rankLabel, 'POSIÇÃO GERAL', false);
  drawCenterPill(838, `${division}`, 'SUA DIVISÃO ATUAL', true);

  fillRound(444, 560, 408, 330, 16, '#f6e8c9');
  strokeRound(444, 560, 408, 330, 16, 'rgba(0,0,0,.85)', 4);

  const stats = [
    { title: 'EcoPoints', sub: 'Total acumulado', value: person.ecoPoints?.toLocaleString('pt-BR') || '0', icon: drawLeafIcon },
    { title: 'Denúncias feitas', sub: 'Contribuições registradas', value: String(realReports), icon: drawCheckIcon },
    { title: 'Taxa validada', sub: 'Denúncias confirmadas', value: `${realAccuracy}%`, icon: drawTargetIcon },
    { title: 'Sequência', sub: 'Streak ambiental', value: `${realStreak} ${realStreak === 1 ? 'dia' : 'dias'}`, icon: drawFlameIcon },
  ];

  stats.forEach((s:any, i) => {
    const top = 584 + i * 75;
    const center = top + 34;

    ctx.strokeStyle = 'rgba(80,40,20,.22)';
    ctx.lineWidth = 2;
    if (i) {
      ctx.beginPath();
      ctx.moveTo(485, top - 7);
      ctx.lineTo(820, top - 7);
      ctx.stroke();
    }

    fillRound(470, center - 23, 46, 46, 999, 'rgba(255,255,255,.45)');
    strokeRound(470, center - 23, 46, 46, 999, 'rgba(80,40,20,.20)', 2);
    s.icon(493, center, '#1f2937');

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#1f2937';
    ctx.font = '900 22px system-ui';
    ctx.fillText(s.title, 535, top + 29);

    ctx.fillStyle = 'rgba(31,41,55,.72)';
    ctx.font = '800 13px system-ui';
    ctx.fillText(s.sub, 535, top + 48);

    ctx.fillStyle = rank;
    ctx.font = '900 34px Georgia, serif';
    ctx.textAlign = 'right';
    ctx.fillText(s.value, 820, top + 40);
    ctx.textAlign = 'left';
  });

  fillRound(48, 915, W - 96, 170, 20, 'rgba(255,255,255,.12)');
  strokeRound(48, 915, W - 96, 170, 20, 'rgba(255,255,255,.16)', 2);
  ctx.fillStyle = 'rgba(255,255,255,.84)';
  ctx.font = '900 18px system-ui';
  ctx.fillText('HISTÓRICO PÚBLICO', 78, 952);

  const reports = (person.reports || []).slice().reverse().slice(0, 2);
  if (reports.length) {
    reports.forEach((r:any, i:number) => {
      const y = 970 + i * 54;
      fillRound(78, y, 690, 42, 13, 'rgba(255,255,255,.12)');
      drawReportIcon(r.type, 105, y + 21);
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 17px system-ui';
      const label = r.type === 'flood' ? 'Alagamento — Denunciado' : r.type === 'recycle' ? 'Ecoponto — Registrado' : 'Incêndio — Denunciado';
      ctx.fillText(label, 140, y + 26);
    });
  } else {
    ctx.fillStyle = 'rgba(255,255,255,.62)';
    ctx.font = '700 16px system-ui';
    ctx.fillText('Nenhum histórico público registrado ainda.', 78, 995);
  }

  fillRound(48, 1110, W - 96, 58, 14, 'rgba(0,0,0,.34)');
  strokeRound(48, 1110, W - 96, 58, 14, 'rgba(255,255,255,.18)', 2);
  ctx.fillStyle = '#f8fafc';
  ctx.font = '900 18px system-ui';
  ctx.fillText('JUNTOS POR UM PLANETA MAIS LIMPO', 72, 1146);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Falha ao exportar carta.')), 'image/png');
  });
}

async function captureElementAsPngBlob(element: HTMLElement): Promise<Blob> {
  const rect = element.getBoundingClientRect();
  const width = Math.ceil(element.scrollWidth || rect.width);
  const height = Math.ceil(element.scrollHeight || rect.height);

  const clone = element.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('.am-card-share-hide, .am-fantasy-close').forEach(node => node.remove());

  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;
  clone.style.maxHeight = 'none';
  clone.style.overflow = 'visible';
  clone.style.transform = 'none';
  clone.style.margin = '0';

  const cssParts: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const rules = (sheet as CSSStyleSheet).cssRules;
      if (!rules) continue;
      cssParts.push(Array.from(rules).map(rule => rule.cssText).join('\n'));
    } catch (_) {
      // ignora stylesheets externos sem permissão
    }
  }

  const html = new XMLSerializer().serializeToString(clone);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <style><![CDATA[
          * { box-sizing: border-box; }
          ${cssParts.join('\n')}
        ]]></style>
      </defs>
      <foreignObject width="100%" height="100%" x="0" y="0">
        <div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px;height:${height}px;overflow:visible;">
          ${html}
        </div>
      </foreignObject>
    </svg>
  `;

  const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Não foi possível renderizar a carta.'));
    });

    const ratio = Math.min(2.5, window.devicePixelRatio || 2);
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(width * ratio);
    canvas.height = Math.ceil(height * ratio);

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas indisponível.');

    ctx.scale(ratio, ratio);
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(result => result ? resolve(result) : reject(new Error('Falha ao exportar PNG.')), 'image/png');
    });

    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}



const RANK_3D_MODELS: Record<string, string> = {
  Bronze: bronzeModelUrl,
  Prata: prataModelUrl,
  Ouro: ouroModelUrl,
  Rubi: rubiModelUrl,
  Safira: safiraModelUrl,
  Ametista: ametistaModelUrl,
  Diamante: diamanteModelUrl,
};

const RANK_3D_TINT: Record<string, string> = {
  Bronze: '#d98345',
  Prata: '#dbe7ff',
  Ouro: '#ffd76a',
  Rubi: '#ff385f',
  Safira: '#4ca7ff',
  Ametista: '#b468ff',
  Diamante: '#8be7ff',
};

function Rank3DScene({
  url,
  division,
  active,
}: {
  url: string;
  division: Division;
  active: boolean;
}) {
  const { scene } = useGLTF(url);
  const group = useRef<THREE.Group>(null);
  const tint = RANK_3D_TINT[division.name] || division.color;

  const model = useMemo(() => {
    const clone = scene.clone(true);

    clone.traverse((obj: any) => {
      if (!obj.isMesh) return;

      obj.castShadow = true;
      obj.receiveShadow = true;

      const source = obj.material;
      const mat = source?.clone ? source.clone() : new THREE.MeshStandardMaterial();

      if ('metalness' in mat) mat.metalness = Math.max(mat.metalness ?? 0, 0.55);
      if ('roughness' in mat) mat.roughness = Math.min(mat.roughness ?? 0.35, 0.38);
      if ('envMapIntensity' in mat) mat.envMapIntensity = 1.45;

      obj.material = mat;
    });

    const box = new THREE.Box3().setFromObject(clone);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxAxis = Math.max(size.x, size.y, size.z) || 1;

    clone.position.sub(center);
    clone.scale.setScalar(2.15 / maxAxis);

    return clone;
  }, [scene]);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;

    const baseY = -Math.PI / 2;
    const idleY = Math.sin(state.clock.elapsedTime * 0.78) * 0.075;
    const idleX = Math.sin(state.clock.elapsedTime * 0.62) * 0.046;

    // Pega o mouse pelo canvas inteiro, não apenas quando o raycast encosta no GLB.
    const px = THREE.MathUtils.clamp(state.pointer.x, -1, 1);
    const py = THREE.MathUtils.clamp(state.pointer.y, -1, 1);

    const targetY = baseY + (active ? px * 0.46 : idleY);
    const targetX = active ? py * 0.31 : idleX;
    const targetZ = active ? px * -0.07 : Math.sin(state.clock.elapsedTime * 0.82) * 0.018;

    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, targetY, 8, delta);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, targetX, 8, delta);
    g.rotation.z = THREE.MathUtils.damp(g.rotation.z, targetZ, 6, delta);

    const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.45) * 0.01;
    g.scale.setScalar(1.055 * pulse);
  });

  return (
    <group ref={group} rotation={[0, -Math.PI / 2, 0]}>
      <primitive object={model} />
      <pointLight position={[0, 1.1, 1.8]} intensity={1.15} color={tint} />
    </group>
  );
}

function Rank3DBadge({
  division,
  fallbackSize = 128,
}: {
  division: Division;
  fallbackSize?: number;
}) {
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(false);
  const modelUrl = RANK_3D_MODELS[division.name];

  if (!modelUrl || failed) {
    return <DivisionBadge division={division} size={fallbackSize} />;
  }

    const cameraZ = division.name === 'Bronze' ? 4.4 : division.name === 'Ouro' ? 3.9 : 3.6;

  return (
    <div
      className="am-rank-3d-badge"
      onPointerEnter={() => setActive(true)}
      onPointerLeave={() => setActive(false)}
    >
      <Canvas
        shadows
        dpr={[1, 1.8]}
        camera={{ position: [0, 0, cameraZ], fov: 34 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        onPointerMove={() => setActive(true)}
        onPointerEnter={() => setActive(true)}
        onPointerLeave={() => setActive(false)}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.18;
        }}
        onError={() => setFailed(true)}
      >
        <ambientLight intensity={1.62} />
        <directionalLight position={[2.4, 3.1, 4.4]} intensity={2.35} castShadow />
        <directionalLight position={[-2.6, -1.4, 2.2]} intensity={0.75} color={division.accent} />
        <Rank3DScene url={modelUrl} division={division} active={active} />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}


try {
  Object.values(RANK_3D_MODELS).forEach((url) => useGLTF.preload(url));
} catch {
  // preload opcional
}


function RankPositionBadge({ placement, color }: { placement: number; color: string }) {
  const Icon = placement === 1 ? Crown : placement === 2 ? Medal : placement === 3 ? Award : CircleDot;
  const bg = placement === 1
    ? 'linear-gradient(145deg,#facc15,#d97706)'
    : placement === 2
    ? 'linear-gradient(145deg,#e2e8f0,#94a3b8)'
    : placement === 3
    ? 'linear-gradient(145deg,#f0b37e,#b9804f)'
    : `linear-gradient(145deg, ${color}30, ${color}10)`;
  return (
    <div style={{ width: 30, height: 30, borderRadius: 12, background: bg, color: placement <= 3 ? '#fff' : color, display:'flex', alignItems:'center', justifyContent:'center', fontWeight: 950, boxShadow: placement <= 3 ? '0 10px 20px rgba(15,23,42,.16)' : 'none', flexShrink: 0 }}>
      {placement <= 3 ? <Icon style={{ width: 15, height: 15, strokeWidth: 2.8 }} /> : <span style={{ fontSize: '.72rem' }}>{placement}</span>}
    </div>
  );
}

function formatChange(n: number) {
  return `${n > 0 ? '+' : ''}${n}%`;
}

function DivisionBadge({ division, size = 52, glow = true }: { division: Division; size?: number; glow?: boolean }) {
  const innerSize = Math.round(size * (size <= 60 ? 0.88 : 0.94));
  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'visible',
        flexShrink: 0,
      }}
    >
      <img
        src={division.badge}
        alt={division.name}
        style={{
          width: innerSize,
          height: innerSize,
          objectFit: 'contain',
          objectPosition: 'center center',
          display: 'block',
          filter: glow ? `drop-shadow(0 10px 18px ${division.glow})` : undefined,
          transform: size <= 60 ? 'translateY(1px) translateZ(0) scale(1.02)' : 'translateZ(0)',
        }}
      />
    </div>
  );
}

export function CitizenCardModal({
  person,
  placement,
  open,
  onClose,
  darkMode,
}: {
  person: any | null;
  placement: number;
  open: boolean;
  onClose: () => void;
  darkMode: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);

  if (!open || !person) return null;

  const reports = person.reports || [];
  const realReports = reports.length;
  const resolvedReports = reports.filter(r => String(r.status || '').toLowerCase().includes('resolvido') || String(r.status || '').toLowerCase().includes('confirm')).length;
  const realAccuracy = realReports > 0 ? Math.round((resolvedReports / realReports) * 100) : 0;
  const realStreak = person.loginStreak || 0;
  const rankLabel = placement === 1 ? '#1 Rank Geral' : `#${placement} Rank Geral`;
  const tierSlug = person.division.name.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-');

  const avatar = (person.name || '?')
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const stats = [
    { Icon: Leaf, title: 'EcoPoints', sub: 'Total acumulado', value: person.ecoPoints.toLocaleString('pt-BR') },
    { Icon: CheckSquare, title: 'Denúncias feitas', sub: 'Contribuições registradas', value: realReports.toLocaleString('pt-BR') },
    { Icon: Target, title: 'Taxa validada', sub: realReports > 0 ? 'Denúncias confirmadas' : 'Aguardando validações', value: `${realAccuracy}%` },
    { Icon: Flame, title: 'Sequência atual', sub: 'Streak ambiental', value: `${realStreak} ${realStreak === 1 ? 'dia' : 'dias'}`, fire: true },
  ];
  const allReportHistory = (person.reports || []).slice().reverse();
  const reportHistory = allReportHistory.slice(0, 2);
  const hiddenReports = Math.max(allReportHistory.length - reportHistory.length, 0);

  const handleShare = async () => {
    if (!person) return;

    setSharing(true);

    const card = cardRef.current;
    const previousOverflow = card?.style.overflow || '';
    const previousMaxHeight = card?.style.maxHeight || '';
    const previousTransform = card?.style.transform || '';

    try {
      let blob: Blob | null = null;

      if (card) {
        try {
          card.style.overflow = 'visible';
          card.style.maxHeight = 'none';
          card.style.transform = 'none';

          await document.fonts?.ready;
          await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

          blob = await captureElementAsPngBlob(card);
        } catch (err) {
          console.warn('Captura real falhou, usando carta fallback:', err);
          blob = null;
        }
      }

      if (!blob) {
        blob = await makePrettyFallbackCardBlob(person, rankLabel, realReports, realAccuracy, realStreak);
      }

      const file = new File([blob], 'alertamap-card.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `${person.name} no AlertaMap`,
          text: `Sou ${person.division.name} no AlertaMap! Já fiz ${realReports} denúncias ambientais na Serra da Ibiapaba.`,
          files: [file],
        });
      } else {
        downloadBlob(blob, 'alertamap-card.png');
      }
    } catch (err) {
      console.error('Erro ao compartilhar card:', err);
      alert('Não consegui compartilhar automaticamente. Tente novamente ou tire um print da carta.');
    } finally {
      if (card) {
        card.style.overflow = previousOverflow;
        card.style.maxHeight = previousMaxHeight;
        card.style.transform = previousTransform;
      }
      setSharing(false);
    }
  };


  return (
    <div onClick={onClose} className="am-card-modal-backdrop">
      <div
        ref={cardRef}
        onClick={e => e.stopPropagation()}
        className={`am-fantasy-card am-fantasy-${tierSlug} ${darkMode ? 'am-fantasy-dark' : ''}`}
        style={{
          '--rank': person.division.color,
          '--rank2': person.division.accent,
          '--rankGlow': person.division.glow,
        } as React.CSSProperties}
      >
        <div className="am-fantasy-grain" />
        <div className="am-fantasy-titlebar">
          <div className="am-fantasy-corner-badge">
            <DivisionBadge division={person.division} size={38} />
          </div>
          <div className="am-fantasy-name">{person.name}</div>
          <button onClick={onClose} aria-label="Fechar card" className="am-fantasy-close am-card-share-hide">
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <div className="am-fantasy-top">
          <div className="am-fantasy-photo-slot">
            {person.avatarUrl ? (
              <img src={person.avatarUrl} alt="Foto de perfil" />
            ) : (
              <div className="am-fantasy-avatar-placeholder">
                <span>{avatar}</span>
              </div>
            )}
            <div className="am-fantasy-title-chip">{person.profileTitle || 'Guardião ambiental'}</div>
          </div>

          <div className="am-fantasy-tier-panel">
            <DivisionBadge division={person.division} size={118} />
            <strong>{person.division.name}</strong>
            <span>{person.division.blurb}</span>
          </div>
        </div>

        <div className="am-fantasy-ribbon">
          <span>Divisão {person.division.name}</span>
        </div>

        <div className="am-fantasy-bottom">
          <div className="am-fantasy-rank-panel">
            <div className="am-fantasy-big-emblem am-fantasy-big-emblem--3d">
              <Rank3DBadge division={person.division} fallbackSize={128} />
            </div>
            <div className="am-fantasy-rank-pill am-fantasy-rank-pill--center">
              <span style={{ fontSize:'1.1rem', flexShrink:0 }}>🏆</span>
              <div style={{ textAlign:'center' }}>
                <strong>{rankLabel}</strong>
                <small>Posição geral</small>
              </div>
            </div>
            <div className="am-fantasy-rank-pill am-fantasy-rank-pill--center division">
              <DivisionBadge division={person.division} size={28} />
              <div style={{ textAlign:'center' }}>
                <strong>{person.division.name}</strong>
                <small>Sua divisão atual</small>
              </div>
            </div>
          </div>

          <div className="am-fantasy-stats-paper">
            {stats.map(item => (
              <div key={item.title} className="am-fantasy-stat-line">
                <div className={`am-fantasy-stat-icon ${item.fire ? 'fire' : ''}`}><item.Icon style={{ width:22,height:22,strokeWidth:2.4 }} /></div>
                <div className="am-fantasy-stat-copy">
                  <strong>{item.title}</strong>
                  <small>{item.sub}</small>
                </div>
                <div className="am-fantasy-stat-value">{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="am-fantasy-history">
          <div className="am-fantasy-history-head">
            <div className="am-fantasy-history-title">Histórico público</div>
            {hiddenReports > 0 && <div className="am-fantasy-history-count">+{hiddenReports}</div>}
          </div>
          {reportHistory.length ? reportHistory.map((r:any, idx:number) => (
            <div key={`${r.id || r.title || idx}`} className="am-fantasy-history-row">
              <IncidentTypeIcon type={r.type} size={28} />
              <div>
                <strong>{r.type === 'fire' ? 'Incêndio — Denunciado' : r.type === 'flood' ? 'Alagamento — Denunciado' : 'Ecoponto — Registrado'}</strong>
                <small>{r.time || 'Registrado'} · {r.status === 'resolvido' ? 'Resolvido' : 'Ativo'}</small>
              </div>
            </div>
          )) : (
            <div className="am-fantasy-history-empty">Nenhum histórico público registrado ainda.</div>
          )}
        </div>

        <div className="am-fantasy-footer" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10 }}>
          <span>Juntos por um planeta mais limpo</span>
          <button
            onClick={e => { e.stopPropagation(); handleShare(); }}
            disabled={sharing}
            style={{ display:'flex',alignItems:'center',gap:6,padding:'8px 16px',borderRadius:99,border:'none',background:'rgba(255,255,255,.12)',color:'white',fontFamily:'var(--sans)',fontWeight:700,fontSize:'var(--text-sm)',cursor:'pointer',backdropFilter:'blur(6px)',transition:'all .2s',flexShrink:0,opacity:sharing?0.6:1 }}
          >
            {sharing ? 'Gerando...' : 'Compartilhar card'}
          </button>
        </div>
      </div>
    </div>
  );
}

function RankJourneyModal({ open, onClose, activePoints, darkMode }: { open: boolean; onClose: () => void; activePoints: number; darkMode: boolean }) {
  if (!open) return null;
  const { current } = getDivision(activePoints);
  const bg = darkMode ? '#0f1224' : '#ffffff';
  const border = darkMode ? 'rgba(255,255,255,.08)' : 'rgba(15,26,15,.1)';
  const ink = darkMode ? '#eef2ff' : '#0f172a';
  const muted = darkMode ? 'rgba(255,255,255,.58)' : '#64748b';

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18, background: 'rgba(3,8,20,.7)', backdropFilter: 'blur(10px)' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 760, borderRadius: 30, background: bg, border: `1px solid ${border}`, overflow: 'hidden', boxShadow: '0 35px 100px rgba(0,0,0,.45)', animation: 'popIn .35s cubic-bezier(.34,1.56,.64,1)' }}>
        <div style={{ padding: '24px 26px 20px', background: `radial-gradient(circle at top right, ${current.glow}, transparent 38%), linear-gradient(145deg, ${darkMode ? '#14182d' : '#f8fafc'} 0%, ${darkMode ? '#0f1224' : '#eef6ff'} 100%)`, borderBottom: `1px solid ${border}` }}>
          <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontSize: '.76rem', fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: muted }}>Trilha de classificação</div>
              <div style={{ marginTop: 8, fontSize: '1.7rem', fontWeight: 900, color: ink }}>Sistema de divisões</div>
              <div style={{ marginTop: 8, maxWidth: 520, fontSize: '.92rem', color: muted, lineHeight: 1.7 }}>As divisões do AlertaMap evoluem conforme EcoPoints, denúncias registradas, ações de reciclagem e constância da comunidade.</div>
            </div>
            <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', border: `1px solid ${border}`, background: darkMode ? 'rgba(255,255,255,.04)' : 'rgba(255,255,255,.75)', color: ink, cursor: 'pointer' }}><X style={{ width: 16, height: 16, margin: '0 auto' }} /></button>
          </div>
        </div>

        <div style={{ padding: 22 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
            {DIVISIONS.map((div, idx) => {
              const active = div.name === current.name;
              const next = idx > 0 && activePoints < div.min;
              return (
                <div key={div.name} style={{ position: 'relative', padding: '16px 16px 14px', borderRadius: 22, border: `1px solid ${active ? div.color : border}`, background: active ? `linear-gradient(160deg, ${div.glow} 0%, transparent 100%)` : (darkMode ? 'rgba(255,255,255,.03)' : '#fbfdff'), boxShadow: active ? `0 16px 36px ${div.glow}` : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ width: 54, height: 54, borderRadius: 16, background: `${div.color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'visible' }}><DivisionBadge division={div} size={52} /></div>
                    {active && <span style={{ padding: '5px 8px', borderRadius: 999, background: `${div.color}18`, color: div.color, fontWeight: 800, fontSize: '.68rem' }}>Atual</span>}
                    {!active && next && <span style={{ padding: '5px 8px', borderRadius: 999, background: darkMode ? 'rgba(255,255,255,.06)' : '#eef2ff', color: muted, fontWeight: 800, fontSize: '.68rem' }}>Próximo</span>}
                  </div>
                  <div style={{ fontSize: '.96rem', fontWeight: 900, color: ink }}>{div.name}</div>
                  <div style={{ fontSize: '.78rem', color: div.color, fontWeight: 800, marginTop: 4 }}>{div.min.toLocaleString('pt-BR')} pts+</div>
                  <div style={{ fontSize: '.76rem', lineHeight: 1.6, color: muted, marginTop: 10 }}>{div.blurb}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══ ABOUT SCREEN ═══ */
function AboutScreen({ open, onClose, dm }: { open: boolean; onClose: () => void; dm: boolean }) {
  if (!open) return null;
  const bg     = dm ? '#0f1224' : '#ffffff';
  const bgSub  = dm ? 'rgba(255,255,255,.04)' : '#f8fafc';
  const border = dm ? 'rgba(255,255,255,.08)' : 'rgba(15,26,15,.09)';
  const ink    = dm ? '#e8f0e8' : '#0e1a0e';
  const muted  = dm ? 'rgba(255,255,255,.48)' : '#6b7c6b';
  const green  = 'var(--forest)';

  const problems = [
    { Icon: Flame, color: '#f97316', label: 'Queimadas ilegais', desc: 'Focos de incêndio criminosos destroem a vegetação nativa da Ibiapaba todos os anos.' },
    { Icon: Droplets, color: '#2563eb', label: 'Alagamentos', desc: 'Chuvas intensas e drenagem deficiente causam alagamentos que afetam moradores e roças.' },
    { Icon: Recycle, color: '#16a34a', label: 'Descarte irregular', desc: 'Resíduos sólidos descartados em locais inadequados contaminam solo e nascentes.' },
  ];

  const features = [
    { Icon: Map, color: '#0d4f2e', label: 'Mapa em tempo real', desc: 'Visualize e denuncie incidentes ambientais diretamente no mapa interativo.' },
    { Icon: Sparkles, color: '#7c3aed', label: 'IA de análise', desc: 'Análise automática de fotos enviadas para classificar e validar denúncias.' },
    { Icon: MessageSquare, color: '#2563eb', label: 'EcoAI', desc: 'Assistente inteligente para tirar dúvidas sobre meio ambiente e emergências.' },
    { Icon: Trophy, color: '#d4a017', label: 'Gamificação', desc: 'EcoPoints, divisões e recompensas reais para motivar a participação contínua.' },
    { Icon: Gift, color: '#e11d48', label: 'Recompensas locais', desc: 'Troque seus pontos por benefícios em estabelecimentos da Serra da Ibiapaba.' },
  ];

  const team = [
    { name: 'Equipe AlertaMap', role: 'Desenvolvimento & Design' },
    { name: 'Serra da Ibiapaba, CE', role: 'Território de impacto' },
    { name: 'Semana EAT 2025', role: 'Projeto escolar — Fase 2' },
  ];

  return (
    <div onClick={onClose} style={{ position:'fixed',inset:0,zIndex:1500,display:'flex',alignItems:'flex-end',background:'rgba(0,0,0,.52)',backdropFilter:'blur(10px)',fontFamily:'var(--sans)' }}>
      <div onClick={e=>e.stopPropagation()} style={{ width:'100%',maxHeight:'92vh',overflowY:'auto',background:bg,borderRadius:'28px 28px 0 0',boxShadow:'0 -12px 60px rgba(0,0,0,.22)',animation:'slideUp .38s cubic-bezier(.34,1.56,.64,1)' }}>

        {/* Hero */}
        <div style={{ padding:'32px 24px 24px',background:`linear-gradient(160deg, rgba(13,79,46,.18) 0%, transparent 60%)`,borderBottom:`1px solid ${border}`,position:'relative' }}>
          <button onClick={onClose} style={{ position:'absolute',top:18,right:18,width:34,height:34,borderRadius:'50%',border:`1px solid ${border}`,background:'none',color:muted,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>
            <X style={{ width:16,height:16 }}/>
          </button>
          <div style={{ width:60,height:60,background:'var(--forest)',borderRadius:18,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:16 }}><Leaf style={{ width:30,height:30,color:'white' }}/></div>
          <div style={{ fontFamily:'var(--serif)',fontSize:'1.6rem',fontWeight:700,color:ink,lineHeight:1.2 }}>AlertaMap</div>
          <div style={{ marginTop:6,fontSize:'var(--text-base)',color:muted,lineHeight:1.6,maxWidth:420 }}>
            Plataforma comunitária de monitoramento ambiental para a <strong style={{ color:green }}>Serra da Ibiapaba</strong>, no Ceará. Desenvolvida para conectar cidadãos, tecnologia e natureza.
          </div>
          <div style={{ marginTop:14,display:'flex',gap:8,flexWrap:'wrap' }}>
            {['Gamificação','IA ambiental','Mapa colaborativo','Recompensas locais'].map(tag => (
              <span key={tag} style={{ padding:'4px 12px',borderRadius:99,background:dm?'rgba(13,79,46,.25)':'#f0fdf4',border:`1px solid rgba(13,79,46,.18)`,color:green,fontSize:'var(--text-sm)',fontWeight:700 }}>{tag}</span>
            ))}
          </div>
        </div>

        <div style={{ padding:'20px 24px',display:'flex',flexDirection:'column',gap:24 }}>

          {/* O Problema */}
          <section>
            <div style={{ fontSize:'var(--text-xs)',fontWeight:800,letterSpacing:'.1em',textTransform:'uppercase',color:muted,marginBottom:12 }}>O Problema</div>
            <p style={{ fontSize:'var(--text-base)',color:muted,lineHeight:1.7,margin:'0 0 14px' }}>
              A Serra da Ibiapaba abriga um dos últimos fragmentos de Mata Atlântica do Nordeste, fonte de água para centenas de comunidades. Mas enfrenta ameaças crescentes que precisam de resposta rápida e coordenada.
            </p>
            <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
              {problems.map(p => (
                <div key={p.label} style={{ display:'flex',gap:12,padding:'13px 14px',borderRadius:14,background:bgSub,border:`1px solid ${border}` }}>
                  <PremiumIconShell color={p.color} size={38}><p.Icon style={{ width:18,height:18,strokeWidth:2.45 }}/></PremiumIconShell>
                  <div>
                    <div style={{ fontWeight:700,fontSize:'var(--text-base)',color:ink }}>{p.label}</div>
                    <div style={{ fontSize:'var(--text-sm)',color:muted,marginTop:2,lineHeight:1.55 }}>{p.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* A Solução */}
          <section>
            <div style={{ fontSize:'var(--text-xs)',fontWeight:800,letterSpacing:'.1em',textTransform:'uppercase',color:muted,marginBottom:12 }}>A Solução</div>
            <p style={{ fontSize:'var(--text-base)',color:muted,lineHeight:1.7,margin:'0 0 14px' }}>
              O AlertaMap permite que qualquer cidadão denuncie incidentes ambientais em segundos, com foto e localização automática. A IA valida as denúncias, e a gamificação mantém a comunidade engajada a longo prazo.
            </p>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
              {features.map(f => (
                <div key={f.label} style={{ padding:'13px',borderRadius:14,background:bgSub,border:`1px solid ${border}` }}>
                  <PremiumIconShell color={f.color} size={38}><f.Icon style={{ width:18,height:18,strokeWidth:2.45 }}/></PremiumIconShell>
                  <div style={{ fontWeight:700,fontSize:'var(--text-base)',color:ink }}>{f.label}</div>
                  <div style={{ fontSize:'var(--text-sm)',color:muted,marginTop:3,lineHeight:1.5 }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Impacto esperado */}
          <section style={{ padding:'18px',borderRadius:18,background:`linear-gradient(135deg, rgba(13,79,46,.14), rgba(34,197,94,.06))`,border:`1px solid rgba(13,79,46,.18)` }}>
            <div style={{ fontSize:'var(--text-xs)',fontWeight:800,letterSpacing:'.1em',textTransform:'uppercase',color:green,marginBottom:12 }}>Impacto esperado</div>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,textAlign:'center' }}>
              {[
                { value:'100+', label:'Municípios beneficiados' },
                { value:'< 2min', label:'Para enviar uma denúncia' },
                { value:'24h', label:'Monitoramento contínuo' },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ fontSize:'1.4rem',fontWeight:900,color:green,fontFamily:'var(--serif)' }}>{s.value}</div>
                  <div style={{ fontSize:'var(--text-sm)',color:muted,marginTop:3,lineHeight:1.4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Equipe */}
          <section>
            <div style={{ fontSize:'var(--text-xs)',fontWeight:800,letterSpacing:'.1em',textTransform:'uppercase',color:muted,marginBottom:12 }}>Projeto</div>
            <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
              {team.map(t => (
                <div key={t.name} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 14px',borderRadius:12,background:bgSub,border:`1px solid ${border}` }}>
                  <span style={{ fontWeight:700,fontSize:'var(--text-base)',color:ink }}>{t.name}</span>
                  <span style={{ fontSize:'var(--text-sm)',color:muted }}>{t.role}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Footer */}
          <div style={{ textAlign:'center',paddingBottom:8 }}>
            <div style={{ fontSize:'var(--text-sm)',color:muted,lineHeight:1.8 }}>
              Desenvolvido para a Serra da Ibiapaba<br/>
              <span style={{ color:green,fontWeight:700 }}>alertamap.app</span> · Versão 2.0 (Beta)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Sidebar({ user, incidents, open, darkMode, onClose, onLogout, onFlyTo, onResolve, onOpenProfile, onOpenRedeem, onOpenCommand }: SidebarProps) {
  const [tab, setTab] = useState<'overview' | 'rewards' | 'performance' | 'ranking'>('overview');
  const [searchQ, setSearchQ] = useState('');
  const [rankingTab, setRankingTab] = useState<RankingKey>('points');
  const [cardUser, setCardUser] = useState<EnrichedUser | null>(null);
  const [cardPlacement, setCardPlacement] = useState(1);
  const [rankOpen, setRankOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  const people = useMemo(() => DB.getUsers().map(enrichUser), [user]);
  const me = useMemo(() => enrichUser(user), [user]);
  const incidentsActive = incidents.filter(i => i.type !== 'recycle' && i.status !== 'resolvido');

  const rankingLists: Record<RankingKey, EnrichedUser[]> = useMemo(() => ({
    points: [...people].sort((a, b) => b.ecoPoints - a.ecoPoints),
    reports: [...people].sort((a, b) => b.totalReports - a.totalReports || b.ecoPoints - a.ecoPoints),
    recycle: [...people].sort((a, b) => b.recycleCount - a.recycleCount || b.ecoPoints - a.ecoPoints),
    streak: [...people].sort((a, b) => b.streak - a.streak || b.ecoPoints - a.ecoPoints),
  }), [people]);

  const ranking = rankingLists[rankingTab];
  const myPlacement = Math.max(1, ranking.findIndex(p => p.id === user.id) + 1);
  const top3 = ranking.slice(0, 3);

  const searchResults = searchQ.trim().length > 1 ? incidents.filter(inc => {
    const q = searchQ.toLowerCase();
    return inc.title.toLowerCase().includes(q)
      || inc.desc.toLowerCase().includes(q)
      || inc.type.toLowerCase().includes(q)
      || (inc.type === 'fire' && (q.includes('incên') || q.includes('fogo') || q.includes('queimada')))
      || (inc.type === 'flood' && (q.includes('alagam') || q.includes('enchente') || q.includes('inunda')))
      || (inc.type === 'recycle' && (q.includes('recicl') || q.includes('descart') || q.includes('lixo')));
  }) : [];

  const dm = darkMode;
  const bg = dm ? '#1a1a2e' : 'white';
  const bgSub = dm ? '#16213e' : '#f8fafc';
  const border = dm ? 'rgba(255,255,255,.07)' : 'rgba(15,26,15,.08)';
  const ink = dm ? '#eef2ff' : '#0f172a';
  const muted = dm ? 'rgba(255,255,255,.58)' : '#64748b';
  const mutedL = dm ? 'rgba(255,255,255,.32)' : '#94a3b8';
  const hoverBg = dm ? 'rgba(255,255,255,.04)' : 'rgba(15,26,15,.03)';
  const avatar = (user.name || '?').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  const sidebarThemeStyle = {
    '--forest': me.division.color,
    '--forest-mid': me.division.color,
    '--forest-l': me.division.accent,
    '--forest-ll': `${me.division.color}14`,
    '--forest-lll': `${me.division.color}22`,
    '--rank': me.division.color,
    '--rank2': me.division.accent,
    '--rankGlow': me.division.glow,
  } as any;


  const openUserCard = (person: EnrichedUser, placement: number) => {
    setCardUser(person);
    setCardPlacement(placement);
  };

  return (
    <>
      <CitizenCardModal person={cardUser} placement={cardPlacement} open={!!cardUser} onClose={() => setCardUser(null)} darkMode={dm} />
      <RankJourneyModal open={rankOpen} onClose={() => setRankOpen(false)} activePoints={me.ecoPoints} darkMode={dm} />

      {open && <div style={{ position:'fixed',inset:0,zIndex:400,background:darkMode?'rgba(2,6,23,.32)':'rgba(15,26,15,.14)' }} onClick={onClose} />}

      <aside style={{
        ...sidebarThemeStyle,
        position:'fixed',left:0,top:0,height:'100%',zIndex:500,
        width:360,maxWidth:'calc(100vw - 24px)',
        background:bg,borderRight:`1px solid ${border}`,fontFamily:'var(--sans)',
        transform:open?'translateX(0)':'translateX(-105%)',pointerEvents:open?'auto':'none',
        willChange:'transform',transition:'transform .3s cubic-bezier(.22,1,.36,1)',
        display:'flex',flexDirection:'column',overflow:'hidden',
        boxShadow:open?'12px 0 48px rgba(0,0,0,.14)':'none',
      }}>

        {/* ── HEADER: identidade limpa; evolução agora fica no perfil ── */}
        <div style={{ flexShrink:0,padding:'20px 20px 16px',borderBottom:`1px solid ${border}` }}>

          {/* Linha superior: avatar + nome + fechar */}
          <div style={{ display:'flex',alignItems:'center',gap:14,marginBottom:20 }}>
            <div onClick={onOpenProfile} style={{ position:'relative',flexShrink:0,cursor:'pointer' }}>
              <div style={{ width:48,height:48,borderRadius:'50%',overflow:'hidden',background:'linear-gradient(135deg,var(--forest),#1f8b4c)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:800,fontSize:'.95rem',border:`2px solid ${me.division.color}` }}>
                {user.avatarUrl?<img src={user.avatarUrl} alt="Perfil" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:avatar}
              </div>
              <div style={{ position:'absolute',bottom:-6,right:-6,width:22,height:22,borderRadius:8,background:bg,border:`1px solid ${border}`,display:'flex',alignItems:'center',justifyContent:'center' }}>
                <DivisionBadge division={me.division} size={18}/>
              </div>
            </div>

            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ fontWeight:800,fontSize:'.95rem',color:ink,letterSpacing:'-.02em',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>{user.name}</div>
              <div style={{ fontSize:'var(--text-sm)',color:muted,marginTop:2 }}>{me.division.name} · {user.city}</div>
            </div>

            <button onClick={onClose} style={{ background:'none',border:'none',cursor:'pointer',color:muted,padding:4,borderRadius:8,flexShrink:0 }}>
              <X style={{width:18,height:18}}/>
            </button>
          </div>

          <div style={{ marginBottom:16,padding:12,borderRadius:16,border:`1px solid ${me.division.color}2c`,background:dm?`${me.division.color}10`:`${me.division.color}08` }}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,marginBottom:8 }}>
              <span style={{ fontSize:'.72rem',fontWeight:900,color:muted,textTransform:'uppercase',letterSpacing:'.07em' }}>Progresso da divisão</span>
              <span style={{ fontSize:'.74rem',fontWeight:950,color:me.division.color }}>{Math.round(me.divisionProgress)}%</span>
            </div>
            <div style={{ height:7,borderRadius:999,background:dm?'rgba(255,255,255,.08)':'rgba(15,23,42,.08)',overflow:'hidden' }}>
              <div style={{ height:'100%',width:`${me.divisionProgress}%`,borderRadius:999,background:`linear-gradient(90deg, ${me.division.color}, ${me.division.accent})`,boxShadow:`0 0 18px ${me.division.glow}`,transition:'width .8s cubic-bezier(.22,1,.36,1)' }}/>
            </div>
            <div style={{ marginTop:7,fontSize:'.72rem',color:muted }}>
              {me.nextDivision ? `${Math.max(me.nextDivision.min - me.ecoPoints, 0).toLocaleString('pt-BR')} pts para ${me.nextDivision.name}` : 'Divisão máxima alcançada'}
            </div>
          </div>

          {/* Tabs — ícone + label, sem fundo pesado */}
          <div style={{ display:'flex',gap:2 }}>
            {([
              { key:'overview', label:'Início',      ico:Map       },
              { key:'rewards',  label:'Prêmios',     ico:Gift      },
              { key:'performance',label:'Stats',     ico:BarChart3 },
              { key:'ranking',  label:'Ranking',     ico:Trophy    },
            ] as const).map(item=>(
              <button key={item.key} onClick={()=>setTab(item.key)} style={{
                flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4,
                padding:'8px 4px',borderRadius:12,border:'none',
                background:tab===item.key?(dm?'rgba(13,79,46,.18)':'#f0fdf4'):'transparent',
                color:tab===item.key?'var(--forest)':muted,
                fontFamily:'var(--sans)',fontSize:'var(--text-xs)',fontWeight:tab===item.key?800:600,
                cursor:'pointer',transition:'all .18s',
              }}>
                <item.ico style={{width:16,height:16}}/>{item.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{ position:'relative',marginTop:12 }}>
            <Search style={{ position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',width:14,height:14,color:muted,pointerEvents:'none' }}/>
            <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Buscar ocorrências..." style={{ width:'100%',boxSizing:'border-box',padding:'9px 32px 9px 34px',borderRadius:99,border:`1px solid ${searchQ?'var(--forest)':border}`,background:bgSub,fontFamily:'var(--sans)',fontSize:'var(--text-base)',color:ink,outline:'none' }}/>
            {searchQ&&<button onClick={()=>setSearchQ('')} style={{ position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:muted,padding:2 }}><X style={{width:12,height:12}}/></button>}
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div style={{ flex:1,overflowY:'auto',overflowX:'hidden' }}>

          {/* Search results */}
          {searchQ.trim().length>1 && (
            <div style={{ padding:'16px 20px' }}>
              <div style={{ fontSize:'var(--text-xs)',fontWeight:700,color:muted,textTransform:'uppercase',letterSpacing:'.08em',marginBottom:12 }}>Resultados para "{searchQ}"</div>
              {searchResults.length===0&&<div style={{ color:muted,fontSize:'var(--text-base)',textAlign:'center',padding:'32px 0' }}>Nada encontrado.</div>}
              {searchResults.map(inc=>(
                <div key={inc.id} onClick={()=>onFlyTo(inc.lat,inc.lng)} style={{ display:'flex',alignItems:'center',gap:12,padding:'12px 0',borderBottom:`1px solid ${border}`,cursor:'pointer' }}>
                  <IncidentTypeIcon type={inc.type} size={32} />
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontWeight:700,fontSize:'var(--text-base)',color:ink,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>{inc.title}</div>
                    <div style={{ fontSize:'var(--text-sm)',color:muted,marginTop:2 }}>{inc.time}</div>
                  </div>
                  <ChevronRight style={{width:14,height:14,color:mutedL}}/>
                </div>
              ))}
            </div>
          )}

          {/* ── OVERVIEW ── */}
          {!searchQ.trim()&&tab==='overview'&&(
            <div style={{ padding:'20px 20px 24px' }}>

              <button onClick={onOpenProfile} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, padding:'13px 14px', borderRadius:18, border:`1px solid ${me.division.color}28`, background:dm?`${me.division.color}10`:`${me.division.color}08`, color:ink, cursor:'pointer', fontFamily:'var(--sans)', marginBottom:14 }}>
                <span style={{ display:'flex', alignItems:'center', gap:10, fontWeight:900 }}><DivisionBadge division={me.division} size={30}/> Ver meu perfil e evolução</span>
                <ChevronRight style={{ width:16, height:16, color:me.division.color }} />
              </button>

              {onOpenCommand && (
                <button onClick={onOpenCommand} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, padding:'13px 14px', borderRadius:18, border:`1px solid ${me.division.color}34`, background:dm?`linear-gradient(135deg, ${me.division.color}18, rgba(255,255,255,.035))`:`linear-gradient(135deg, ${me.division.color}10, #ffffff)`, color:ink, cursor:'pointer', fontFamily:'var(--sans)', marginBottom:14, boxShadow:dm?'none':`0 14px 30px ${me.division.color}10` }}>
                  <span style={{ display:'flex', alignItems:'center', gap:10, fontWeight:950 }}><Shield style={{ width:19,height:19,color:me.division.color }}/> Central de Comando</span>
                  <ChevronRight style={{ width:16, height:16, color:me.division.color }} />
                </button>
              )}

              {/* 2 stats — só o que importa */}
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:20 }}>
                {[
                  { label:'Ocorrências ativas', value:incidentsActive.length, Icon: AlertTriangle, color:'#ef4444' },
                  { label:'Suas contribuições', value:me.totalReports+me.recycleCount, Icon: BadgeCheck, color:me.division.color },
                ].map(s=>(
                  <div key={s.label} className="am-glass-card" style={{ padding:'16px',borderRadius:18,border:`1px solid ${s.color}22`,background:dm?`linear-gradient(145deg, ${s.color}12, rgba(255,255,255,.035))`:`linear-gradient(145deg, ${s.color}0f, #ffffff)`, boxShadow:dm?'none':`0 12px 28px ${s.color}10` }}>
                    <PremiumIconShell color={s.color} glow={`${s.color}26`} size={38}>
                      <s.Icon style={{ width:18,height:18,strokeWidth:2.5 }} />
                    </PremiumIconShell>
                    <div style={{ fontSize:'1.65rem',fontWeight:950,color:ink,lineHeight:1,marginTop:10 }}>{s.value}</div>
                    <div style={{ fontSize:'var(--text-sm)',color:muted,marginTop:6,lineHeight:1.4 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Lista de ocorrências — clean */}
              <div style={{ fontSize:'var(--text-xs)',fontWeight:700,color:muted,textTransform:'uppercase',letterSpacing:'.08em',marginBottom:12 }}>Ocorrências ativas</div>
              {incidentsActive.slice(0,5).map((inc,i)=>(
                <div key={inc.id} onClick={()=>onFlyTo(inc.lat,inc.lng)} style={{ display:'flex',alignItems:'center',gap:12,padding:'13px 0',borderTop:i===0?'none':`1px solid ${border}`,cursor:'pointer' }}>
                  <IncidentTypeIcon type={inc.type} size={34} />
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontWeight:700,fontSize:'var(--text-base)',color:ink,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>{inc.title}</div>
                    <div style={{ fontSize:'var(--text-sm)',color:muted,marginTop:2 }}>{inc.time}</div>
                  </div>
                  <ChevronRight style={{width:14,height:14,color:mutedL,flexShrink:0}}/>
                </div>
              ))}
            </div>
          )}

          {/* ── REWARDS ── */}
          {!searchQ.trim()&&tab==='rewards'&&(
            <div style={{ padding:'20px 20px 28px' }}>

              {/* Saldo simples */}
              <div style={{ display:'flex',alignItems:'baseline',gap:8,marginBottom:20 }}>
                <div style={{ fontSize:'1.8rem',fontWeight:900,color:ink }}>{user.ecoPoints.toLocaleString('pt-BR')}</div>
                <div style={{ fontSize:'var(--text-base)',color:muted }}>pts disponíveis</div>
              </div>

              {REWARDS.map(reward=>{
                const redeemed=(user.redeemedRewards||[]).includes(reward.id);
                const canAfford=user.ecoPoints>=reward.cost;
                const missing=Math.max(0,reward.cost-user.ecoPoints);
                return(
                  <button key={reward.id} onClick={()=>onOpenRedeem?.(reward)} className="am-reward-row-premium" style={{
                    width:'100%',display:'flex',alignItems:'center',gap:14,
                    padding:'13px 12px', marginBottom:10, borderRadius:18,
                    border:`1px solid ${canAfford ? me.division.color+'22' : border}`,
                    background: redeemed ? (dm?'rgba(255,255,255,.025)':'#f8fafc') : (canAfford ? (dm?`linear-gradient(145deg, ${me.division.color}10, rgba(255,255,255,.035))`:`linear-gradient(145deg, ${me.division.color}08, #ffffff)`) : 'transparent'),
                    boxShadow:(!dm && canAfford)?`0 12px 28px ${me.division.color}0f`:'none',
                    cursor:'pointer',textAlign:'left',fontFamily:'var(--sans)',
                    opacity:redeemed?0.55:1,
                  }}>
                    <RewardVisual reward={reward} canAfford={canAfford} dm={dm} />
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ display:'flex',alignItems:'center',gap:6 }}>
                        <span style={{ fontWeight:700,fontSize:'var(--text-base)',color:ink }}>{reward.name}</span>
                        {(reward as any).popular&&!redeemed&&<span style={{ fontSize:'.6rem',fontWeight:800,padding:'2px 6px',borderRadius:99,background:'#fef3c7',color:'#92400e' }}>Popular</span>}
                      </div>
                      <div style={{ fontSize:'var(--text-sm)',color:muted,marginTop:2 }}>{reward.partner}</div>
                    </div>
                    <div style={{ textAlign:'right',flexShrink:0 }}>
                      <div style={{ fontSize:'var(--text-base)',fontWeight:800,color:canAfford?'var(--forest)':muted }}>{reward.cost.toLocaleString('pt-BR')} pts</div>
                      {!redeemed&&!canAfford&&<div style={{ fontSize:'var(--text-xs)',color:'#dc2626',marginTop:2 }}>faltam {missing.toLocaleString('pt-BR')}</div>}
                      {redeemed&&<div style={{ fontSize:'var(--text-xs)',color:'var(--forest)',marginTop:2 }}>Resgatado</div>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* ── PERFORMANCE / STATS ── */}
          {!searchQ.trim()&&tab==='performance'&&(()=>{
            const week=['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
            const base=Math.max(3,Math.round(me.totalReports/2));
            const weekData=week.map((d,i)=>({label:d,value:Math.max(2,Math.round(base*(0.7+((i%3)*0.18)))+(i===5?2:0))}));
            const maxVal=Math.max(...weekData.map(d=>d.value));
            const total=Math.max(me.fireCount+me.floodCount+me.recycleCount,1);
            return(
              <div style={{ padding:'20px 20px 28px' }}>

                {/* 4 números — grid limpo */}
                <div style={{ fontSize:'var(--text-xs)',fontWeight:700,color:muted,textTransform:'uppercase',letterSpacing:'.08em',marginBottom:14 }}>Suas métricas</div>
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:28 }}>
                  {[
                    { label:'EcoPoints',  value:me.ecoPoints.toLocaleString('pt-BR'), sub:formatChange(me.monthlyTrend) },
                    { label:'Denúncias',  value:me.totalReports, sub:formatChange(Math.max(4,Math.round(me.totalReports*0.22))) },
                    { label:'Reciclagem', value:me.recycleCount, sub:`${me.accuracy}% validadas` },
                    { label:'Streak',     value:`${me.streak}d`,  sub:'dias seguidos' },
                  ].map(c=>(
                    <div key={c.label} style={{ padding:'16px',borderRadius:16,border:`1px solid ${border}`,background:bgSub }}>
                      <div style={{ fontSize:'var(--text-xs)',color:muted,fontWeight:600,marginBottom:8 }}>{c.label}</div>
                      <div style={{ fontSize:'1.5rem',fontWeight:900,color:ink,lineHeight:1 }}>{c.value}</div>
                      <div style={{ fontSize:'var(--text-sm)',color:'var(--forest)',fontWeight:700,marginTop:6 }}>{c.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Gráfico semanal */}
                <div style={{ fontSize:'var(--text-xs)',fontWeight:700,color:muted,textTransform:'uppercase',letterSpacing:'.08em',marginBottom:14 }}>Esta semana</div>
                <div style={{ display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:6,alignItems:'end',height:120,marginBottom:28 }}>
                  {weekData.map(item=>(
                    <div key={item.label} style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'flex-end',gap:5,height:'100%' }}>
                      <div style={{ width:'100%',maxWidth:28,height:`${Math.max(12,(item.value/maxVal)*88)}px`,borderRadius:8,background:`linear-gradient(180deg,${me.division.accent},${me.division.color})` }}/>
                      <div style={{ fontSize:'.62rem',color:muted }}>{item.label}</div>
                    </div>
                  ))}
                </div>

                {/* Distribuição — 3 barras */}
                <div style={{ fontSize:'var(--text-xs)',fontWeight:700,color:muted,textTransform:'uppercase',letterSpacing:'.08em',marginBottom:14 }}>Distribuição</div>
                {[
                  { label:'Incêndios',   value:me.fireCount,    color:'#f97316' },
                  { label:'Alagamentos', value:me.floodCount,   color:'#2563eb' },
                  { label:'Reciclagem',  value:me.recycleCount, color:'#16a34a' },
                ].map(item=>(
                  <div key={item.label} style={{ marginBottom:14 }}>
                    <div style={{ display:'flex',justifyContent:'space-between',marginBottom:6 }}>
                      <span style={{ fontSize:'var(--text-base)',fontWeight:600,color:ink }}>{item.label}</span>
                      <span style={{ fontSize:'var(--text-base)',fontWeight:800,color:item.color }}>{item.value}</span>
                    </div>
                    <div style={{ height:6,borderRadius:999,background:dm?'rgba(255,255,255,.07)':'rgba(15,23,42,.07)',overflow:'hidden' }}>
                      <div style={{ width:`${Math.max(8,(item.value/total)*100)}%`,height:'100%',borderRadius:999,background:item.color,transition:'width .8s cubic-bezier(.22,1,.36,1)' }}/>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* ── RANKING ── */}
          {!searchQ.trim() && tab === 'ranking' && (
            <div style={{ padding: '14px 14px 20px' }}>
              <div style={{ borderRadius: 22, padding: '16px', background: bgSub, border: `1px solid ${border}`, marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: '.8rem', fontWeight: 900, color: ink }}>Rankings ambientais</div>
                    <div style={{ marginTop: 4, fontSize: '.72rem', color: muted }}>Compare impacto por EcoPoints, denúncias, reciclagem e sequência.</div>
                  </div>
                  <Medal style={{ width: 18, height: 18, color: '#d4a017' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
                  {([
                    { key: 'points', label: 'EcoPoints', ico: Zap },
                    { key: 'reports', label: 'Denúncias', ico: MessageSquare },
                    { key: 'recycle', label: 'Reciclagem', ico: Recycle },
                    { key: 'streak', label: 'Streak', ico: Flame },
                  ] as const).map(item => (
                    <button key={item.key} onClick={() => setRankingTab(item.key)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 12px', borderRadius: 14, border: `1px solid ${rankingTab === item.key ? me.division.color+'36' : border}`, background: rankingTab === item.key ? (dm ? `${me.division.color}1f` : `${me.division.color}10`) : 'transparent', color: rankingTab === item.key ? me.division.color : muted, fontWeight: 800, cursor: 'pointer' }}>
                      <item.ico style={{ width: 14, height: 14 }} /> {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
                {top3.map((person, idx) => {
                  const placement = idx + 1;
                  const size = placement === 1 ? 1.08 : 1;
                  return (
                    <div key={person.id} onClick={() => openUserCard(person, placement)} style={{ cursor: 'pointer', padding: '14px 10px 12px', borderRadius: 20, background: placement === 1 ? `linear-gradient(180deg, ${person.division.glow} 0%, ${dm ? '#13192f' : '#fbfdff'} 100%)` : bgSub, border: `1px solid ${placement === 1 ? person.division.color : border}`, textAlign: 'center', transform: `scale(${size})`, boxShadow: placement === 1 ? `0 16px 36px ${person.division.glow}` : 'none' }}>
                      <div style={{ display:'flex',justifyContent:'center',marginBottom:6 }}><RankPositionBadge placement={placement} color={person.division.color} /></div>
                      <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><DivisionBadge division={person.division} size={64} /></div>
                      <div style={{ marginTop: 10, fontSize: '.8rem', fontWeight: 900, color: ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{person.name}</div>
                      <div style={{ marginTop: 4, fontSize: '.68rem', color: person.division.color, fontWeight: 800 }}>{shortDivisionName(person.division.name)}</div>
                      <div style={{ marginTop: 8, fontSize: '.76rem', color: muted }}>{rankingTab === 'points' ? `${person.ecoPoints.toLocaleString('pt-BR')} pts` : rankingTab === 'reports' ? `${person.totalReports} denúncias` : rankingTab === 'recycle' ? `${person.recycleCount} reciclagens` : `${person.streak} dias`}</div>
                    </div>
                  );
                })}
              </div>

              <div style={{ borderRadius: 20, overflow: 'hidden', border: `1px solid ${border}` }}>
                {ranking.map((person, idx) => {
                  const placement = idx + 1;
                  const isMe = person.id === user.id;
                  const scoreText = rankingTab === 'points'
                    ? `${person.ecoPoints.toLocaleString('pt-BR')} pts`
                    : rankingTab === 'reports'
                    ? `${person.totalReports} denúncias`
                    : rankingTab === 'recycle'
                    ? `${person.recycleCount} reciclagens`
                    : `${person.streak} dias`;
                  return (
                    <div key={person.id} onClick={() => openUserCard(person, placement)} className="am-ranking-row-premium" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderTop: idx === 0 ? 'none' : `1px solid ${border}`, background: isMe ? (dm ? `${me.division.color}1c` : `${me.division.color}0d`) : (idx % 2 === 0 ? bgSub : 'transparent'), cursor: 'pointer', position:'relative', overflow:'hidden' }}>
                      <RankPositionBadge placement={placement} color={person.division.color} />
                      <div style={{ width: 48, height: 48, borderRadius: 16, background: `${person.division.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><DivisionBadge division={person.division} size={46} /></div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '.84rem', fontWeight: 900, color: ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{person.name}{isMe ? ' · você' : ''}</div>
                        <div style={{ fontSize: '.72rem', color: muted, marginTop: 4 }}>{person.city} · {person.division.name}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '.78rem', fontWeight: 900, color: person.division.color }}>{scoreText}</div>
                        <div style={{ fontSize: '.68rem', color: muted, marginTop: 4 }}>Inspecionar</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div style={{ flexShrink:0,padding:'12px 20px',borderTop:`1px solid ${border}`,background:bg,display:'flex',gap:8 }}>
          <button onClick={()=>setAboutOpen(true)} style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:'10px',borderRadius:12,border:`1px solid ${border}`,background:'transparent',fontFamily:'var(--sans)',fontWeight:600,fontSize:'var(--text-base)',color:muted,cursor:'pointer' }}>
            <Info style={{width:13,height:13}}/> Sobre
          </button>
          <button onClick={onLogout} style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:'10px',borderRadius:12,border:'1px solid #fecaca',background:'transparent',fontFamily:'var(--sans)',fontWeight:600,fontSize:'var(--text-base)',color:'#dc2626',cursor:'pointer' }}>
            <LogOut style={{width:13,height:13}}/> Sair
          </button>
        </div>
      </aside>
      <AboutScreen open={aboutOpen} onClose={()=>setAboutOpen(false)} dm={darkMode}/>
    </>
  );
}
