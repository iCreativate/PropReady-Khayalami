import { STORAGE_KEYS } from './storage-keys';

export interface UserSession {
    id: string;
    fullName: string;
    email: string;
}

export interface AgentSession {
    id: string;
    fullName: string;
    email: string;
    company?: string;
}

function readJson<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : null;
    } catch {
        return null;
    }
}

function writeJson(key: string, value: unknown) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
}

export function getCurrentUser(): UserSession | null {
    return readJson<UserSession>(STORAGE_KEYS.currentUser);
}

export function getCurrentAgent(): AgentSession | null {
    return readJson<AgentSession>(STORAGE_KEYS.currentAgent);
}

export function setCurrentUser(user: UserSession) {
    writeJson(STORAGE_KEYS.currentUser, user);
}

export function setCurrentAgent(agent: AgentSession) {
    writeJson(STORAGE_KEYS.currentAgent, agent);
}

export function logoutUser() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.currentUser);
}

export function logoutAgent() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.currentAgent);
}

export function loginUser(email: string, password: string): UserSession | null {
    const users = readJson<Array<UserSession & { password: string }>>(STORAGE_KEYS.users) || [];
    const user = users.find((u) => u.email === email && (u as { password?: string }).password === password);
    if (!user) return null;
    const session: UserSession = { id: user.id, fullName: user.fullName, email: user.email };
    setCurrentUser(session);
    return session;
}

export function loginAgent(email: string, password: string): AgentSession | null {
    const agents =
        readJson<Array<AgentSession & { password: string; company?: string }>>(STORAGE_KEYS.agents) || [];
    const agent = agents.find((a) => a.email === email && a.password === password);
    if (!agent) return null;
    const session: AgentSession = {
        id: agent.id,
        fullName: agent.fullName,
        email: agent.email,
        company: agent.company,
    };
    setCurrentAgent(session);
    return session;
}

export function getRememberedUserEmail(): string {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(STORAGE_KEYS.rememberUserEmail) || '';
}

export function setRememberedUserEmail(email: string, remember: boolean) {
    if (typeof window === 'undefined') return;
    if (remember && email) {
        localStorage.setItem(STORAGE_KEYS.rememberUserEmail, email);
    } else {
        localStorage.removeItem(STORAGE_KEYS.rememberUserEmail);
    }
}

export function getRememberedAgentEmail(): string {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(STORAGE_KEYS.rememberAgentEmail) || '';
}

export function setRememberedAgentEmail(email: string, remember: boolean) {
    if (typeof window === 'undefined') return;
    if (remember && email) {
        localStorage.setItem(STORAGE_KEYS.rememberAgentEmail, email);
    } else {
        localStorage.removeItem(STORAGE_KEYS.rememberAgentEmail);
    }
}
