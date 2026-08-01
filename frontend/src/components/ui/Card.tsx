import { HTMLAttributes } from 'react';

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-card border border-gray-200 bg-white p-4 shadow-card ${className}`}
      {...props}
    />
  );
}
