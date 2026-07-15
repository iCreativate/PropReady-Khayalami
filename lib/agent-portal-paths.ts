/** Routes that use AgentPortalLayout (fixed sidebar on desktop). */
export const AGENT_PORTAL_ROUTES = new Set([
    '/agents/dashboard',
    '/agents/my-leads',
    '/agents/properties',
    '/agents/viewings',
    '/agents/plan',
    '/agents/learn',
    '/agents/settings',
]);

export function isAgentPortalRoute(pathname: string | null | undefined): boolean {
    if (!pathname) return false;
    if (AGENT_PORTAL_ROUTES.has(pathname)) return true;
    return pathname.startsWith('/agents/learn/');
}
