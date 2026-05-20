export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  city: string;
  ecoPoints: number;
  level: number;
  reports: Report[];
  activity: Activity[];
  redeemedRewards: string[];
  joinedAt: number;
  lastLogin: number;
  loginStreak: number;
  avatarUrl?: string;
  bio?: string;
  profileTitle?: string;
}

export interface Activity {
  ico: string;
  text: string;
  pts: number;
  ts: number;
}

export interface Report {
  id: string;
  type: string;
  lat: number;
  lng: number;
  title: string;
  desc: string;
  severity: string;
  time: string;
  status: string;
  userId?: string;
  photoURL?: string;
  createdAt: number;
}

export interface Incident {
  id: string;
  type: 'fire' | 'flood' | 'recycle';
  lat: number;
  lng: number;
  title: string;
  severity: 'high' | 'medium' | 'low';
  time: string;
  status?: string;
  desc: string;
  userId?: string;
  photoURL?: string;
  expiresAt?: number;
}

export const LEVELS = [
  { name: 'Cidadão Consciente', min: 0, max: 500, ico: 'seed', color: '#64748b' },
  { name: 'Guardião do Bairro', min: 500, max: 1500, ico: 'plant', color: '#16a34a' },
  { name: 'Guardião da Cidade', min: 1500, max: 3000, ico: 'tree', color: '#15803d' },
  { name: 'Herói Urbano', min: 3000, max: 6000, ico: 'eagle', color: '#b45309' },
  { name: 'Lenda Verde', min: 6000, max: 99999, ico: 'mountain', color: '#7c3aed' },
];

export const REWARDS = [
  { id: 'r1', ico: 'coffee', name: 'Café Grátis', partner: 'Cafeteria Verde', cost: 200, desc: 'Um café artesanal da Cafeteria Verde em Tianguá.', popular: true },
  { id: 'r2', ico: 'shopping', name: '10% em Compras', partner: 'Mercadão Ibiapaba', cost: 300, desc: '10% de desconto em qualquer compra no Mercadão.' },
  { id: 'r3', ico: 'seed', name: 'Kit de Mudas', partner: 'Viveiro Serra Verde', cost: 400, desc: 'Kit com 3 mudas nativas da Caatinga.', popular: true },
  { id: 'r4', ico: 'ticket', name: 'Ingresso Parque', partner: 'Parque Ubajara', cost: 500, desc: 'Ingresso gratuito para o Parque Nacional de Ubajara.' },
  { id: 'r5', ico: 'barber', name: 'Corte de Cabelo', partner: 'Barbearia EcoStyle', cost: 350, desc: 'Corte na Barbearia EcoStyle, Ibiapina.' },
  { id: 'r6', ico: 'bike', name: 'Aluguel de Bike', partner: 'Bike Serra Ride', cost: 250, desc: '2h de bicicleta pela Serra da Ibiapaba.', popular: true },
  { id: 'r7', ico: 'meal', name: 'Almoço p/ 2', partner: 'Restaurante Chapada', cost: 800, desc: 'Almoço completo para 2 no Restaurante Chapada.' },
  { id: 'r8', ico: 'leaf', name: 'Spa Natural', partner: 'Trilha & Bem-Estar', cost: 1200, desc: '1h de massagem com óleos essenciais da serra.' },
  { id: 'r9', ico: 'course', name: 'Curso Online', partner: 'EcoEducação CE', cost: 600, desc: 'Acesso a curso de educação ambiental certificado.' },
  { id: 'r10', ico: 'lodging', name: 'Pousada (1 noite)', partner: 'Pousada da Serra', cost: 2000, desc: '1 diária para 2 pessoas em Ubajara.' },
];

export const SAMPLE_INCIDENTS: Incident[] = [
  { id: 'i1', type: 'fire', lat: -3.7319, lng: -40.9897, title: 'Incêndio – Tianguá', severity: 'high', time: '14min', status: 'ativo', desc: 'Foco próximo à margem da CE-187.' },
  { id: 'i2', type: 'flood', lat: -3.8528, lng: -40.9214, title: 'Alagamento – Ubajara', severity: 'medium', time: '32min', status: 'ativo', desc: 'Estrada estadual parcialmente bloqueada.' },
  { id: 'i3', type: 'recycle', lat: -3.6361, lng: -40.6053, title: 'Ecoponto – Frecheirinha', severity: 'low', time: 'Fixo', desc: 'Coleta de vidro, metal e papel. Seg–Sáb 8–17h.' },
  { id: 'i4', type: 'fire', lat: -4.0488, lng: -40.8649, title: 'Incêndio – São Benedito', severity: 'medium', time: '1h', status: 'ativo', desc: 'Área de vegetação nativa. Bombeiros acionados.' },
  { id: 'i5', type: 'recycle', lat: -3.9256, lng: -40.8886, title: 'Ecoponto – Ibiapina', severity: 'low', time: 'Fixo', desc: 'PEV completo. Eletrônicos aceitos.' },
  { id: 'i6', type: 'flood', lat: -3.7436, lng: -40.9975, title: 'Alagamento – Tianguá Centro', severity: 'high', time: '8min', status: 'ativo', desc: 'Rua Principal inundada. Evite a área.' },
  { id: 'i7', type: 'fire', lat: -4.2843, lng: -41.1068, title: 'Incêndio – Região Sul', severity: 'high', time: '22min', status: 'ativo', desc: 'Vegetação de caatinga em chamas. Vento forte.' },
  { id: 'i8', type: 'recycle', lat: -3.8400, lng: -40.9500, title: 'Ecoponto – Parque Ubajara', severity: 'low', time: 'Fixo', desc: 'Dentro do Parque. Orgânicos e papel.' },
];

export const POINT_MAP: Record<string, number> = { fire: 50, flood: 40, recycle: 20 };

export const CITIES = ['Tianguá', 'Ubajara', 'São Benedito', 'Ibiapina', 'Viçosa do Ceará', 'Guaraciaba do Norte', 'Frecheirinha', 'Outra cidade'];

export function getLevel(pts: number) {
  return LEVELS.find(l => pts >= l.min && pts < l.max) || LEVELS[0];
}

export function getNextLevel(pts: number) {
  const idx = LEVELS.findIndex(l => pts >= l.min && pts < l.max);
  return idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
}

export function getLevelIndex(pts: number) {
  return LEVELS.findIndex(l => pts >= l.min && pts < l.max);
}

// DB helpers using localStorage
export const DB = {
  getUsers: (): User[] => JSON.parse(localStorage.getItem('gm_users') || '[]'),
  saveUsers: (u: User[]) => localStorage.setItem('gm_users', JSON.stringify(u)),
  getSession: (): User | null => JSON.parse(localStorage.getItem('gm_session') || 'null'),
  setSession: (u: User) => localStorage.setItem('gm_session', JSON.stringify(u)),
  clearSession: () => localStorage.removeItem('gm_session'),

  createUser(data: { name: string; email: string; password: string; city: string }): User {
    const users = this.getUsers();
    if (users.find(u => u.email === data.email.toLowerCase())) {
      throw new Error('Este e-mail já está cadastrado.');
    }
    const user: User = {
      id: 'u_' + Date.now() + Math.random().toString(36).slice(2, 6),
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      passwordHash: btoa(data.password),
      city: data.city || 'Ibiapaba',
      ecoPoints: 50,
      level: 0,
      reports: [],
      activity: [{ ico: 'welcome', text: 'Conta criada! Bônus de boas-vindas', pts: 50, ts: Date.now() }],
      redeemedRewards: [],
      joinedAt: Date.now(),
      lastLogin: Date.now(),
      loginStreak: 1,
    };
    users.push(user);
    this.saveUsers(users);
    return user;
  },

  findUser(email: string, password: string): User {
    const users = this.getUsers();
    const user = users.find(u => u.email === email.toLowerCase().trim());
    if (!user) throw new Error('E-mail não encontrado.');
    if (user.passwordHash !== btoa(password)) throw new Error('Senha incorreta.');
    return user;
  },

  updateUser(userId: string, patch: Partial<User>): User | null {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) return null;
    users[idx] = { ...users[idx], ...patch };
    this.saveUsers(users);
    const session = this.getSession();
    if (session && session.id === userId) this.setSession(users[idx]);
    return users[idx];
  },

  addPoints(userId: string, amount: number, actText: string, actIco = 'points'): User | null {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) return null;
    users[idx].ecoPoints = (users[idx].ecoPoints || 0) + amount;
    users[idx].activity = [
      { ico: actIco, text: actText, pts: amount, ts: Date.now() },
      ...(users[idx].activity || []).slice(0, 19),
    ];
    this.saveUsers(users);
    this.setSession(users[idx]);
    return users[idx];
  },

  getUserById(id: string): User | null {
    return this.getUsers().find(u => u.id === id) || null;
  },

  getAllUsersPublic() {
    return this.getUsers()
      .map(u => ({ id: u.id, name: u.name, city: u.city, ecoPoints: u.ecoPoints, reports: (u.reports || []).length }))
      .sort((a, b) => b.ecoPoints - a.ecoPoints);
  },
};

// Seed demo users
export function seedDemo() {
  if (DB.getUsers().length > 0) return;
  const demos = [
    { name: 'Ana Lima', email: 'ana@demo.com', password: 'demo123', city: 'Tianguá', ecoPoints: 3420 },
    { name: 'Carlos Melo', email: 'carlos@demo.com', password: 'demo123', city: 'Ubajara', ecoPoints: 2810 },
    { name: 'Fernanda Costa', email: 'fe@demo.com', password: 'demo123', city: 'São Benedito', ecoPoints: 2100 },
    { name: 'João Pedro', email: 'joao@demo.com', password: 'demo123', city: 'Ibiapina', ecoPoints: 1650 },
    { name: 'Maria Silva', email: 'maria@demo.com', password: 'demo123', city: 'Viçosa do Ceará', ecoPoints: 980 },
  ];
  const users: User[] = demos.map(d => ({
    id: 'u_' + Math.random().toString(36).slice(2, 10),
    name: d.name,
    email: d.email,
    passwordHash: btoa(d.password),
    city: d.city,
    ecoPoints: d.ecoPoints,
    level: 0,
    reports: [],
    activity: [{ ico: 'welcome', text: 'Conta criada', pts: 50, ts: Date.now() - Math.random() * 30 * 86400000 }],
    redeemedRewards: [],
    joinedAt: Date.now() - Math.random() * 30 * 86400000,
    lastLogin: Date.now() - Math.random() * 2 * 86400000,
    loginStreak: Math.floor(Math.random() * 15) + 1,
  }));
  localStorage.setItem('gm_users', JSON.stringify(users));
}
