import React, { type SVGProps, useEffect } from "react";

import { CSSRules } from "./styles";

const GlowSmall = ({ style, ...props }: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={80}
      height={40}
      fill="none"
      style={{
        opacity: 1,
        animation: "top-announcement-glow 1s ease-in-out infinite alternate",
        ...style,
      }}
    >
      <circle cx={40} r={40} fill={`url(#${props.id}-a)`} fillOpacity={0.5} />
      <defs>
        <radialGradient
          id={`${props.id}-a`}
          cx={0}
          cy={0}
          r={1}
          gradientTransform="matrix(0 40 -40 0 40 0)"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#47EBEB" />
          <stop offset={1} stopColor="#47EBEB" stopOpacity={0} />
        </radialGradient>
      </defs>
    </svg>
  );
};

const GlowBig = ({ style, ...props }: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={120}
    height={48}
    fill="none"
    {...props}
    style={{
      opacity: 1,
      animation: "top-announcement-glow 1s ease-in-out infinite alternate",
      ...style,
    }}
  >
    <circle
      cx={60}
      cy={24}
      r={60}
      fill={`url(#${props.id}-a)`}
      fillOpacity={0.5}
    />
    <defs>
      <radialGradient
        id={`${props.id}-a`}
        cx={0}
        cy={0}
        r={1}
        gradientTransform="matrix(0 60 -60 0 60 24)"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#47EBEB" />
        <stop offset={1} stopColor="#47EBEB" stopOpacity={0} />
      </radialGradient>
    </defs>
  </svg>
);
