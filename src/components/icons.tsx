import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M16.7 12.9a6.1 6.1 0 0 0-3.3 3.3" />
      <path d="M16.7 12.9a6.1 6.1 0 0 1-3.3 3.3" />
      <path d="m7.3 12.9 2.9 2.9" />
      <path d="m2 15.8 5.3-5.3a1 1 0 0 1 1.4 0l2.9 2.9a1 1 0 0 0 1.4 0l5.3-5.3" />
      <path d="M22 15.8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v7.8z" />
    </svg>
  );
}
