/** Epoch zero preload API (set by preloadEpochZero.mjs) */
interface EpochZeroPreload {
  exitModuleInitPhase(): void
  restoreOriginalDate(): void
  isModuleInitPhase(): boolean
}

declare var __epochZeroPreload: EpochZeroPreload | undefined
declare var IS_REACT_ACT_ENVIRONMENT: boolean
