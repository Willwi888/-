import React from 'react';

const VerticalLinesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 4.5v15m4-15v15m4-15v15m4-15v15" />
  </svg>
);

export default VerticalLinesIcon;
