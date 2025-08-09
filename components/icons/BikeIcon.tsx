
import React from 'react';

const BikeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-8 w-8"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10 3.75a.75.75 0 01.75-.75h2.5a.75.75 0 010 1.5h-2.5a.75.75 0 01-.75-.75zM12 6.75a.75.75 0 00-.75.75v3.75a.75.75 0 001.5 0V7.5a.75.75 0 00-.75-.75zM10 19.5a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5zM19.5 19.5a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5zM16.09 12.75l-4.5-4.5-4.5 4.5"
    />
     <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="M14.25 9.75L12 12m0 0l-2.25-2.25M12 12v7.5m0-7.5l-2.25 2.25M12 12l2.25 2.25" />

  </svg>
);

export default BikeIcon;
