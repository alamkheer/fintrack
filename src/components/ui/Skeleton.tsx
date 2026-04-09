import { type HTMLAttributes } from 'react';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className = '', ...props }: SkeletonProps) {
  return (
    <div 
      className={`animate-pulse bg-surface-container-highest rounded-xl ${className}`} 
      {...props} 
    />
  );
}
