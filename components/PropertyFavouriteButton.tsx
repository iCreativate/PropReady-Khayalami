'use client';

import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { isFavouriteProperty, toggleFavouriteProperty } from '@/lib/property-favourites';
import { PROPERTY_CARD_FAV, PROPERTY_CARD_FAV_INLINE } from '@/lib/property-card-ui';

type Props = {
    propertyId: string;
    className?: string;
    variant?: 'overlay' | 'inline';
};

export default function PropertyFavouriteButton({
    propertyId,
    className = '',
    variant = 'overlay',
}: Props) {
    const [active, setActive] = useState(false);

    useEffect(() => {
        setActive(isFavouriteProperty(propertyId));
    }, [propertyId]);

    return (
        <button
            type="button"
            className={`${variant === 'inline' ? PROPERTY_CARD_FAV_INLINE : PROPERTY_CARD_FAV}${active ? ' is-active' : ''} ${className}`.trim()}
            aria-label={active ? 'Remove from favourites' : 'Add to favourites'}
            aria-pressed={active}
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActive(toggleFavouriteProperty(propertyId));
            }}
        >
            <Heart className="w-4 h-4" fill={active ? 'currentColor' : 'none'} />
        </button>
    );
}
