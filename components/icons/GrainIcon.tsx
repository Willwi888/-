import React from 'react';

const GrainIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <circle cx="8" cy="8" r="1" />
    <circle cx="12" cy="6" r=".8" />
    <circle cx="16" cy="8" r="1" />
    <circle cx="7" cy="12" r="1" />
    <circle cx="17" cy="12" r=".8" />
    <circle cx="8" cy="16" r=".8" />
    <circle cx="12" cy="18" r="1" />
    <circle cx="16" cy="16" r="1" />
    <circle cx="12" cy="12" r="1" />
    <circle cx="10" cy="14" r=".8" />
    <circle cx="14" cy="10" r="1" />
    <circle cx="10" cy="10" r=".8" />
    <circle cx="14" cy="14" r="1" />
  </svg>
);

export default GrainIcon;
