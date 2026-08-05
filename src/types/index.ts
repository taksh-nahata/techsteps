// Main types export file
export * from './core';
export * from './services';
export * from './learning'; // Legacy types for backward compatibility

// core.ts and services.ts each independently define these three names with
// different shapes; services.ts's versions are the ones actually used by the
// app, so they take precedence when resolved through this barrel.
export type { AIMessage, ErrorContext, TimeFrame } from './services';