import React from 'react';

const PerspectiveIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l1.5-5h15L21 8m-18 0l2 10h14l2-10m-18 0h18" />
  </svg>
);

export default PerspectiveIcon;
