import { useState } from 'react';
import { achievementIcon } from '../../data/achievementIcons';

export function ProductArt({ url, icon, className = '' }: { url?: string; icon?: string; className?: string }) {
  const [failed, setFailed] = useState<string>();
  const Icon = achievementIcon(icon);
  const imageUrl = url && /^(https?:\/\/|\/[^/])/i.test(url) ? url : undefined;
  return <span className={'relative grid h-full w-full place-items-center overflow-hidden ' + className}>
    {imageUrl && imageUrl !== failed
      ? <img src={imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" onError={() => setFailed(imageUrl)} />
      : <Icon aria-hidden="true" className="h-1/2 w-1/2" />}
  </span>;
}
