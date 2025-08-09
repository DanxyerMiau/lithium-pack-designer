
import React from 'react';

const BatteryIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    {...props}>
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="M21 10.5h.375c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125H21M3.75 18h13.5a2.25 2.25 0 0 0 2.25-2.25V8.25A2.25 2.25 0 0 0 17.25 6H3.75A2.25 2.25 0 0 0 1.5 8.25v7.5A2.25 2.25 0 0 0 3.75 18Z" 
    />
  </svg>
);

export default BatteryIcon;
