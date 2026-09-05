import Image from 'next/image';

type PhotoProps = {
  src: string;
  alt: string;
  className?: string;
};

export const Photo = ({ src, alt, className }: PhotoProps) => (
  <div className={`relative overflow-hidden bg-stone ${className ?? ''}`}>
    <Image src={src} alt={alt} fill className="object-cover" sizes="(min-width: 1024px) 50vw, 100vw" />
  </div>
);
