'use client';

import { notFound, useParams } from 'next/navigation';
import ConveyancersBrowsePage from '@/components/conveyancer-connect/ConveyancersBrowsePage';
import {
    findCityBySlug,
    PROVINCE_LABELS,
    type ProvinceSlug,
} from '@/lib/conveyancer-connect';

export default function CityConveyancersPage() {
    const params = useParams();
    const province = String(params.province || '') as ProvinceSlug;
    const citySlug = String(params.city || '');
    if (!PROVINCE_LABELS[province]) notFound();
    const city = findCityBySlug(province, citySlug);
    if (!city) notFound();
    return (
        <ConveyancersBrowsePage
            initialProvince={province}
            initialCity={city}
            showHero
        />
    );
}
