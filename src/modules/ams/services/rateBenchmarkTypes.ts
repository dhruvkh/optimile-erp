// ============================================================
// Rate Benchmarking Types — Backward-Compatibility Shim
// ============================================================
// Types have moved to the domain-split architecture:
//
//   Authoritative source: services/ptl/ptlRateBenchmarkTypes.ts
//   FTL-specific types:   services/ftl/ftlRateBenchmarkTypes.ts
//
// This shim re-exports all types so existing component imports
// (e.g. from '../../services/rateBenchmarkTypes') continue to
// resolve without any changes to component files.
// ============================================================

export * from './ptl/ptlRateBenchmarkTypes';
