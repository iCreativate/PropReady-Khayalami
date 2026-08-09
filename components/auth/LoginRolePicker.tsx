'use client';

import {
    ArrowRight,
    Briefcase,
    BookOpen,
    Home,
    KeyRound,
    Landmark,
    Scale,
    type LucideIcon,
} from 'lucide-react';
import {
    CONSUMER_LOGIN_ROLES,
    PROFESSIONAL_LOGIN_ROLES,
    type LoginAudience,
    type LoginRole,
    type LoginRoleOption,
} from '@/lib/auth-login-roles';

const CONSUMER_ICONS: Record<'buyer' | 'seller' | 'learner', LucideIcon> = {
    buyer: KeyRound,
    seller: Home,
    learner: BookOpen,
};

const PROFESSIONAL_ICONS: Record<'agent' | 'originator' | 'conveyancer', LucideIcon> = {
    agent: Briefcase,
    originator: Landmark,
    conveyancer: Scale,
};

interface LoginRolePickerProps {
    audience?: LoginAudience;
    selected?: LoginRole | null;
    onSelect: (role: LoginRoleOption) => void;
}

export default function LoginRolePicker({
    audience = 'consumer',
    selected = null,
    onSelect,
}: LoginRolePickerProps) {
    if (audience === 'professionals') {
        return (
            <div className="auth-role-picker">
                <div className="auth-role-group">
                    <div className="auth-role-group-head">
                        <p className="auth-role-kicker">Sign in as</p>
                    </div>
                    <div
                        className="auth-role-pro-list"
                        role="listbox"
                        aria-label="Choose professional account type"
                    >
                        {PROFESSIONAL_LOGIN_ROLES.map((role) => {
                            const Icon = PROFESSIONAL_ICONS[role.id];
                            const isActive = selected === role.id;
                            return (
                                <button
                                    key={role.id}
                                    type="button"
                                    role="option"
                                    aria-selected={isActive}
                                    onClick={() => onSelect(role)}
                                    className={`auth-role-pro ${isActive ? 'auth-role-pro--active' : ''}`}
                                >
                                    <span className="auth-role-pro-icon">
                                        <Icon className="w-4 h-4" strokeWidth={1.75} />
                                    </span>
                                    <span className="auth-role-pro-copy">
                                        <span className="auth-role-pro-label">{role.label}</span>
                                        <span className="auth-role-pro-desc">{role.description}</span>
                                    </span>
                                    <ArrowRight className="auth-role-pro-arrow w-4 h-4" aria-hidden />
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-role-picker">
            <div className="auth-role-group">
                <div className="auth-role-group-head">
                    <p className="auth-role-kicker">Sign in as</p>
                </div>
                <div
                    className="auth-role-featured auth-role-featured--three"
                    role="listbox"
                    aria-label="Choose buyer, seller, or learning"
                >
                    {CONSUMER_LOGIN_ROLES.map((role) => {
                        const Icon = CONSUMER_ICONS[role.id];
                        const isActive = selected === role.id;
                        return (
                            <button
                                key={role.id}
                                type="button"
                                role="option"
                                aria-selected={isActive}
                                onClick={() => onSelect(role)}
                                className={`auth-role-hero ${
                                    role.id === 'seller'
                                        ? 'auth-role-hero--seller'
                                        : role.id === 'learner'
                                          ? 'auth-role-hero--learner'
                                          : ''
                                } ${isActive ? 'auth-role-hero--active' : ''}`}
                            >
                                <span className="auth-role-hero-glow" aria-hidden />
                                <span className="auth-role-hero-icon">
                                    <Icon className="w-5 h-5" strokeWidth={1.75} />
                                </span>
                                <span className="auth-role-hero-copy">
                                    <span className="auth-role-hero-label">{role.label}</span>
                                    <span className="auth-role-hero-desc">{role.description}</span>
                                </span>
                                <span className="auth-role-hero-go" aria-hidden>
                                    <ArrowRight className="w-4 h-4" />
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
