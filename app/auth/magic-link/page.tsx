import { Suspense } from 'react';
import MagicLinkClient from './MagicLinkClient';
export default function Page() { return <Suspense fallback={<div className="min-h-screen" />}><MagicLinkClient /></Suspense>; }
