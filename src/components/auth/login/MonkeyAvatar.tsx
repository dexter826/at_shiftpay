import React from 'react';
import styled, { css, keyframes } from 'styled-components';

interface MonkeyAvatarProps {
  isBlind: boolean;
  isFocusing: boolean;
}

const blink = keyframes`
  0%, 2%, 4%, 26%, 28%, 71%, 73%, 100% {
    ry: 4.5;
    cy: 31.7;
  }
  1%, 3%, 27%, 72% {
    ry: 0.5;
    cy: 30;
  }
`;

const slick = keyframes`
  0%, 100% {
    transform: var(--center);
  }
  25% {
    transform: var(--left);
  }
  75% {
    transform: var(--right);
  }
`;

const StyledMonkey = styled.div<{ $isBlind: boolean; $isFocusing: boolean }>`
  --sz-avatar: 120px;
  width: var(--sz-avatar);
  height: var(--sz-avatar);
  border: 2px solid #e2e8f0;
  border-radius: 9999px;
  overflow: hidden;
  perspective: 80px;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto 1.5rem;
  background: white;
  transition: all 0.3s ease;
  --sz-svg: calc(var(--sz-avatar) - 10px);

  .dark & {
    background: #1e293b;
    border-color: #334155;
  }

  svg {
    position: absolute;
    transition: transform 0.2s ease-in, opacity 0.1s;
    transform-origin: 50% 100%;
    height: var(--sz-svg);
    width: var(--sz-svg);
    pointer-events: none;
  }

  svg#monkey {
    z-index: 1;
    ${({ $isFocusing, $isBlind }) => $isFocusing && !$isBlind && css`
      animation: ${slick} 3s ease infinite 1s;
      --center: rotateY(0deg);
      --left: rotateY(-4deg);
      --right: rotateY(4deg);
    `}
  }

  svg#monkey-hands {
    z-index: 2;
    transform-style: preserve-3d;
    transform: translateY(calc(var(--sz-avatar) / 1.25)) rotateX(-21deg);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    ${({ $isBlind }) => $isBlind && css`
      transform: translate3d(0, 0, 0) rotateX(0deg);
    `}
  }

  &::before {
    content: "";
    border-radius: 45%;
    width: calc(var(--sz-svg) / 3.889);
    height: calc(var(--sz-svg) / 5.833);
    border: 0;
    border-bottom: calc(var(--sz-svg) * (4 / 100)) solid #3c302a;
    bottom: 20%;
    position: absolute;
    transition: all 0.2s ease;
    z-index: 3;

    ${({ $isBlind }) => $isBlind && css`
      width: calc(var(--sz-svg) * (9 / 100));
      height: 0;
      border-radius: 50%;
      border-bottom: calc(var(--sz-svg) * (10 / 100)) solid #3c302a;
    `}

    ${({ $isFocusing, $isBlind }) => $isFocusing && !$isBlind && css`
      animation: ${slick} 3s ease infinite 1s;
      --center: translateX(0);
      --left: translateX(-0.5px);
      --right: translateX(0.5px);
    `}
  }

  .monkey-eye-r, .monkey-eye-l {
    animation: ${blink} 10s 1s infinite;
    transition: all 0.2s ease;

    ${({ $isBlind }) => $isBlind && css`
      ry: 0.5;
      cy: 30;
      animation: none;
    `}

    ${({ $isFocusing, $isBlind }) => $isFocusing && !$isBlind && css`
      ry: 3;
      cy: 35;
      animation: ${slick} 3s ease infinite 1s;
      --center: translateX(0);
      --left: translateX(-0.5px);
      --right: translateX(0.5px);
    `}
  }

  .monkey-eye-nose {
    transition: all 0.2s ease;
    ${({ $isFocusing, $isBlind }) => $isFocusing && !$isBlind && css`
      animation: ${slick} 3s ease infinite 1s;
      --center: translateX(0);
      --left: translateX(-0.5px);
      --right: translateX(0.5px);
    `}
  }
`;

const MonkeyAvatar: React.FC<MonkeyAvatarProps> = ({ isBlind, isFocusing }) => {
  return (
    <StyledMonkey $isBlind={isBlind} $isFocusing={isFocusing}>
      <svg xmlns="http://www.w3.org/2000/svg" width={35} height={35} viewBox="0 0 64 64" id="monkey">
        <ellipse cx="53.7" cy={33} rx="8.3" ry="8.2" fill="#89664c" />
        <ellipse cx="53.7" cy={33} rx="5.4" ry="5.4" fill="#ffc5d3" />
        <ellipse cx="10.2" cy={33} rx="8.2" ry="8.2" fill="#89664c" />
        <ellipse cx="10.2" cy={33} rx="5.4" ry="5.4" fill="#ffc5d3" />
        <g fill="#89664c">
          <path d="m43.4 10.8c1.1-.6 1.9-.9 1.9-.9-3.2-1.1-6-1.8-8.5-2.1 1.3-1 2.1-1.3 2.1-1.3-20.4-2.9-30.1 9-30.1 19.5h46.4c-.7-7.4-4.8-12.4-11.8-15.2" />
          <path d="m55.3 27.6c0-9.7-10.4-17.6-23.3-17.6s-23.3 7.9-23.3 17.6c0 2.3.6 4.4 1.6 6.4-1 2-1.6 4.2-1.6 6.4 0 9.7 10.4 17.6 23.3 17.6s23.3-7.9 23.3-17.6c0-2.3-.6-4.4-1.6-6.4 1-2 1.6-4.2 1.6-6.4" />
        </g>
        <path d="m52 28.2c0-16.9-20-6.1-20-6.1s-20-10.8-20 6.1c0 4.7 2.9 9 7.5 11.7-1.3 1.7-2.1 3.6-2.1 5.7 0 6.1 6.6 11 14.7 11s14.7-4.9 14.7-11c0-2.1-.8-4-2.1-5.7 4.4-2.7 7.3-7 7.3-11.7" fill="#e0ac7e" />
        <g fill="#3b302a" className="monkey-eye-nose">
          <path d="m35.1 38.7c0 1.1-.4 2.1-1 2.1-.6 0-1-.9-1-2.1 0-1.1.4-2.1 1-2.1.6.1 1 1 1 2.1" />
          <path d="m30.9 38.7c0 1.1-.4 2.1-1 2.1-.6 0-1-.9-1-2.1 0-1.1.4-2.1 1-2.1.5.1 1 1 1 2.1" />
          <ellipse cx="40.7" cy="31.7" rx="3.5" ry="4.5" className="monkey-eye-r" />
          <ellipse cx="23.3" cy="31.7" rx="3.5" ry="4.5" className="monkey-eye-l" />
        </g>
      </svg>
      <svg xmlns="http://www.w3.org/2000/svg" width={35} height={35} viewBox="0 0 64 64" id="monkey-hands">
        <path fill="#89664C" d="M9.4,32.5L2.1,61.9H14c-1.6-7.7,4-21,4-21L9.4,32.5z" />
        <path fill="#FFD6BB" d="M15.8,24.8c0,0,4.9-4.5,9.5-3.9c2.3,0.3-7.1,7.6-7.1,7.6s9.7-8.2,11.7-5.6c1.8,2.3-8.9,9.8-8.9,9.8
      s10-8.1,9.6-4.6c-0.3,3.8-7.9,12.8-12.5,13.8C11.5,43.2,6.3,39,9.8,24.4C11.6,17,13.3,25.2,15.8,24.8" />
        <path fill="#89664C" d="M54.8,32.5l7.3,29.4H50.2c1.6-7.7-4-21-4-21L54.8,32.5z" />
        <path fill="#FFD6BB" d="M48.4,24.8c0,0-4.9-4.5-9.5-3.9c-2.3,0.3,7.1,7.6,7.1,7.6s-9.7-8.2-11.7-5.6c-1.8,2.3,8.9,9.8,8.9,9.8
      s-10-8.1-9.7-4.6c0.4,3.8,8,12.8,12.6,13.8c6.6,1.3,11.8-2.9,8.3-17.5C52.6,17,50.9,25.2,48.4,24.8" />
      </svg>
    </StyledMonkey>
  );
};

export default MonkeyAvatar;
