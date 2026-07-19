import { redirect } from 'next/navigation';

/** Legacy login URL — keep for old links, send users to the enterprise auth UI. */
export default function LoginRedirectPage() {
    redirect('/auth/login');
}
