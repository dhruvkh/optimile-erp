// ============================================================
// Rate Benchmark Service — Backward-Compatibility Shim
// ============================================================
// Computation has moved to the domain-split architecture:
//
//   PTL domain: services/ptl/ptlRateBenchmarkService.ts
//   FTL domain: services/ftl/ftlRateBenchmarkService.ts
//   Orchestrator: services/integrator/unifiedBenchmarkOrchestrator.ts
//
// This shim keeps all existing component imports working without
// any changes to component files.
// ============================================================

export { computeRateBenchmarks } from './integrator/unifiedBenchmarkOrchestrator';
