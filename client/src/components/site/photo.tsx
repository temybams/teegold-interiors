'use client';

import Image from 'next/image';
import { useState } from 'react';

type PhotoProps = {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  /** `hero` slowly settles after the curtain opens; `zoom` lifts on hover. */
  motion?: 'zoom' | 'hero';
};

export const Photo = ({
  src,
  alt,
  className,
  priority,
  sizes = '(min-width: 1024px) 50vw, 100vw',
  motion = 'zoom',
}: PhotoProps) => {
  const [failed, setFailed] = useState(false);

  return (
    <div className={`site-photo relative overflow-hidden bg-stone ${className ?? ''}`}>
      {failed ? (
        <div className="absolute inset-0 flex items-center justify-center px-4 text-center text-xs text-page-ink/40">
          {alt}
        </div>
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes}
          className={`object-cover ${motion === 'hero' ? 'site-photo-hero' : 'site-photo-zoom'}`}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
};
