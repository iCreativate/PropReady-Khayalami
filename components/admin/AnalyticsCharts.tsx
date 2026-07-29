'use client';

import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

const CHART_COLORS = ['#E52323', '#111827', '#F59E0B', '#16A34A', '#2563EB', '#6B7280'];

function tooltipStyle() {
    return {
        borderRadius: 12,
        border: '1px solid #E5E7EB',
        boxShadow: '0 8px 24px rgba(17,24,39,0.08)',
        fontSize: 12,
    };
}

export function Sparkline({ data, color = '#E52323' }: { data: Array<{ count: number }>; color?: string }) {
    if (!data.length) {
        return <div className="h-10 w-full rounded bg-slate-50" />;
    }
    const gid = `spark-${color.replace('#', '')}`;
    return (
        <div className="h-10 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                            <stop offset="100%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <Area
                        type="monotone"
                        dataKey="count"
                        stroke={color}
                        fill={`url(#${gid})`}
                        strokeWidth={1.5}
                        isAnimationActive
                        animationDuration={600}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

export function GrowthLineChart({
    data,
}: {
    data: Array<{ date: string; users: number; agents: number; leads: number }>;
}) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
                <CartesianGrid stroke="#F3F4F6" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                <Tooltip contentStyle={tooltipStyle()} />
                <Line type="monotone" dataKey="users" name="Users" stroke="#E52323" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="agents" name="Agents" stroke="#111827" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="leads" name="Leads" stroke="#F59E0B" strokeWidth={2} dot={false} />
            </LineChart>
        </ResponsiveContainer>
    );
}

export function RegistrationsBarChart({
    data,
}: {
    data: Array<{ date: string; registrations: number }>;
}) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
                <CartesianGrid stroke="#F3F4F6" strokeDasharray="3 3" />
                <XAxis dataKey="date" hide />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                <Tooltip contentStyle={tooltipStyle()} />
                <Bar dataKey="registrations" name="Registrations" fill="#E52323" radius={[6, 6, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}

export function MessagesAreaChart({
    data,
}: {
    data: Array<{ date: string; conversations: number }>;
}) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
                <defs>
                    <linearGradient id="msgFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#E52323" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#E52323" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid stroke="#F3F4F6" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                <Tooltip contentStyle={tooltipStyle()} />
                <Area
                    type="monotone"
                    dataKey="conversations"
                    name="Conversations"
                    stroke="#E52323"
                    fill="url(#msgFill)"
                    strokeWidth={2}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}

export function ViewingsBarChart({
    data,
}: {
    data: Array<{ date: string; viewings: number }>;
}) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
                <CartesianGrid stroke="#F3F4F6" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                <Tooltip contentStyle={tooltipStyle()} />
                <Bar dataKey="viewings" name="Viewings" fill="#111827" radius={[6, 6, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}

export function SubscriptionDonut({
    data,
}: {
    data: Array<{ name: string; value: number }>;
}) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                >
                    {data.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle()} />
            </PieChart>
        </ResponsiveContainer>
    );
}

export { CHART_COLORS };
