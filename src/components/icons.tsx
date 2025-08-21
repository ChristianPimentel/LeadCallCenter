import type { SVGProps } from 'react';
import { Phone } from 'lucide-react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <Phone {...props} />
  );
}
