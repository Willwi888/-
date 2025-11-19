import React from 'react';

const FanIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75c1.496 0 2.864.57 3.886 1.558a5.25 5.25 0 010 7.428 5.215 5.215 0 01-7.772 0 5.25 5.25 0 010-7.428A5.215 5.215 0 0112 6.75z" clipRule="evenodd"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75v-4.5m0 19.5v-4.5m-8.625-4.125h4.5m12.75 0h-4.5m-4.125-8.625l3.182 3.182m-6.364 6.364l3.182-3.182m-3.182-3.182l-3.182 3.182m6.364-6.364l-3.182-3.182" />
  </svg>
);

export default FanIcon;
