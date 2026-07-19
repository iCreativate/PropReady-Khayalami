import PortalLoading from '@/components/PortalLoading';

export default function AuthLoading({ message = 'Loading…' }: { message?: string }) {
    return <PortalLoading message={message} variant="page" className="!bg-white" />;
}
