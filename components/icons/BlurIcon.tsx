import React from 'react';

const BlurIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <circle cx="6" cy="12" r="1.5" opacity="0.4" />
    <circle cx="10" cy="12" r="2" opacity="0.6" />
    <circle cx="14" cy="12" r="2.5" opacity="0.8" />
    <circle cx="18" cy="12" r="2" opacity="0.6" />
  </svg>
);

export default BlurIcon;
