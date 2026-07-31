'use client';

import { notFound, useParams } from 'next/navigation';
import ConveyancersBrowsePage from '@/components/conveyancer-connect/ConveyancersBrowsePage';
import { PROVINCE_LABELS, type ProvinceSlug } from '@/lib/conveyancer-connect';

export default function ProvinceConveyancersPage() {
    const params = useParams();
    const province = String(params.province || '') as ProvinceSlug;
    if (!PROVINCE_LABELS[province]) notFound();
    return <ConveyancersBrowsePage initialProvince={province} showHero />;
}
