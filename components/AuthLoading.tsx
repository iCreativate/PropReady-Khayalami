export default function AuthLoading({ message = 'Loading...' }: { message?: string }) {
    return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-charcoal/70">{message}</p>
            </div>
        </div>
    );
}
