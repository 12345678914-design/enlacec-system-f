import React from 'react';
import { motion } from 'motion/react';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Base animated pulse / shimmer Skeleton block
 */
export const Skeleton: React.FC<SkeletonProps> = ({ className = '', style }) => {
  return (
    <div
      style={style}
      className={`animate-pulse bg-gradient-to-r from-zinc-200 via-zinc-300 to-zinc-200 dark:from-zinc-800/90 dark:via-zinc-700/80 dark:to-zinc-800/90 rounded-xl relative overflow-hidden ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent" />
    </div>
  );
};

/**
 * Skeleton lines for text blocks
 */
export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({ lines = 3, className = '' }) => {
  return (
    <div className={`space-y-2 w-full ${className}`}>
      {Array.from({ length: lines }).map((_, idx) => (
        <Skeleton
          key={idx}
          className={`h-3.5 ${
            idx === lines - 1 && lines > 1 ? 'w-3/4' : idx === 0 ? 'w-full' : 'w-11/12'
          }`}
        />
      ))}
    </div>
  );
};

/**
 * Avatar Skeleton placeholder
 */
export const SkeletonAvatar: React.FC<{ size?: string; className?: string }> = ({
  size = 'w-10 h-10',
  className = '',
}) => {
  return <Skeleton className={`${size} rounded-full shrink-0 ${className}`} />;
};

/**
 * Generic Card Skeleton placeholder
 */
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`p-4 rounded-2xl border border-gray-200/60 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md shadow-sm space-y-3 ${className}`}>
      <div className="flex items-center gap-3">
        <SkeletonAvatar size="w-9 h-9" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/5" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  );
};

/**
 * Chat Message Skeleton for AI responses (Tesla Bot)
 */
export const SkeletonChatMessage: React.FC<{ isUser?: boolean; className?: string }> = ({
  isUser = false,
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-3 my-2 ${isUser ? 'flex-row-reverse' : ''} ${className}`}
    >
      <SkeletonAvatar size="w-8 h-8 sm:w-9 sm:h-9" className="mt-0.5" />
      <div
        className={`p-4 rounded-2xl max-w-[85%] sm:max-w-[75%] space-y-2 border ${
          isUser
            ? 'bg-indigo-600/20 border-indigo-500/30 rounded-tr-none'
            : 'bg-zinc-900/80 border-zinc-800 rounded-tl-none'
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-2.5 w-12" />
        </div>
        <SkeletonText lines={2} />
      </div>
    </motion.div>
  );
};

/**
 * AI Summary Card Skeleton (Admin Dashboard AI summary)
 */
export const SkeletonSummaryCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`p-5 rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/40 via-zinc-900/80 to-zinc-950 shadow-lg space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SkeletonAvatar size="w-10 h-10 rounded-2xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-7 w-20 rounded-full" />
      </div>
      <div className="space-y-2 pt-1">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-[92%]" />
        <Skeleton className="h-3.5 w-[85%]" />
        <Skeleton className="h-3.5 w-[65%]" />
      </div>
    </div>
  );
};

/**
 * User Profile Skeleton for Perfil.tsx during Supabase data fetch
 */
export const SkeletonProfile: React.FC = () => {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Cover & Hero Header Skeleton */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-zinc-900 via-indigo-950/60 to-zinc-900 border border-zinc-800/80 p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <SkeletonAvatar size="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl ring-4 ring-indigo-500/20" />
          <div className="flex-1 space-y-3 text-center sm:text-left w-full">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
              <Skeleton className="h-8 w-56 sm:w-64" />
              <Skeleton className="h-6 w-24 rounded-xl" />
            </div>
            <Skeleton className="h-4 w-40 mx-auto sm:mx-0" />
            <div className="flex flex-wrap gap-3 pt-1 justify-center sm:justify-start">
              <Skeleton className="h-6 w-48 rounded-xl" />
              <Skeleton className="h-6 w-32 rounded-xl" />
            </div>
          </div>
          <div className="flex flex-col gap-2.5 w-full sm:w-auto">
            <Skeleton className="h-11 w-full sm:w-36 rounded-2xl" />
            <Skeleton className="h-11 w-full sm:w-40 rounded-2xl" />
          </div>
        </div>
      </div>

      {/* Database Mapped Fields Grid Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <Skeleton className="h-5 w-64" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 9 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-gray-200/70 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-2.5"
            >
              <Skeleton className="h-3 w-28" />
              <div className="flex items-center gap-2.5">
                <SkeletonAvatar size="w-4 h-4 rounded-md" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
