// ─── Metrics ─────────────────────────────────────────────────────────────────

export interface CpuMetrics {
  percent: number
  count_logical: number
  count_physical: number | null
  frequency_mhz: number | null
}

export interface MemoryMetrics {
  total_gb: number
  available_gb: number
  used_gb: number
  percent: number
}

export interface DiskMetrics {
  total_gb: number
  used_gb: number
  free_gb: number
  percent: number
  mountpoint: string
}

export interface NetworkMetrics {
  bytes_sent_mb: number
  bytes_recv_mb: number
  packets_sent: number
  packets_recv: number
}

export interface ProcessMetrics {
  total: number
  running: number
  sleeping: number
}

export interface SystemMetricsSnapshot {
  timestamp: string
  cpu: CpuMetrics
  memory: MemoryMetrics
  disk: DiskMetrics
  network: NetworkMetrics
  processes: ProcessMetrics
}

export interface MetricsHistoryResponse {
  count: number
  snapshots: SystemMetricsSnapshot[]
}

// ─── Alerts ──────────────────────────────────────────────────────────────────

export type AlertSeverity = 'warning' | 'critical' | 'anomaly'
export type AlertStatus = 'active' | 'acknowledged' | 'resolved'
export type AlertCategory = 'cpu' | 'memory' | 'disk' | 'network' | 'anomaly' | 'manual'

export interface Alert {
  id: string
  title: string
  message: string
  severity: AlertSeverity
  category: AlertCategory
  status: AlertStatus
  metric_value: number | null
  threshold: number | null
  created_at: string
  resolved_at: string | null
}

export interface AlertListResponse {
  total: number
  active: number
  alerts: Alert[]
}

export interface AlertCreateRequest {
  title: string
  message: string
  severity: AlertSeverity
  category: AlertCategory
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export type AnomalyType = 'cpu_spike' | 'memory_leak' | 'disk_surge' | 'network_anomaly' | 'multivariate'

export interface AnomalyPoint {
  timestamp: string
  anomaly_score: number
  is_anomaly: boolean
  anomaly_type: AnomalyType | null
  cpu_percent: number
  memory_percent: number
  disk_percent: number
}

export interface AnomalyDetectionResult {
  is_model_trained: boolean
  samples_used: number
  anomalies_detected: number
  anomaly_rate: number
  points: AnomalyPoint[]
  generated_at: string
}

export interface SystemHealthScore {
  score: number
  grade: string
  summary: string
  generated_at: string
}

// ─── API ─────────────────────────────────────────────────────────────────────

export interface HealthResponse {
  status: string
  app_name: string
  version: string
  environment: string
  timestamp: string
}

export interface FlatMetricsResponse {
  cpu: number
  ram: number
  disk: number
  network_sent: number
  network_received: number
  uptime: string
}

export interface SystemInfoResponse {
  os_name: string
  os_release: string
  os_version: string
  architecture: string
  hostname: string
  python_version: string
  cpu_model: string
  cpu_cores_logical: number
  cpu_cores_physical: number
  total_memory_gb: number
  total_disk_gb: number
  boot_time: string
  uptime: string
}

export interface AiAnalysisResponse {
  system_state: string
  possible_issues: string[]
  suspicious_behavior: string[]
  recommendations: string[]
  concise_insight: string
}

// ─── Predictions ──────────────────────────────────────────────────────────────

export type TrendDirection = 'rising' | 'stable' | 'falling'
export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical'

export interface MetricForecast {
  metric: string
  current_value: number
  predicted_values: number[]
  predicted_peak: number
  predicted_avg: number
  confidence_lower: number
  confidence_upper: number
  trend_direction: TrendDirection
  trend_slope: number
  will_exceed_threshold: boolean
  threshold: number
}

export interface StabilityReport {
  score: number
  grade: string
  risk_level: RiskLevel
  overload_probability: number
  contributing_factors: string[]
  summary: string
}

export interface PredictionResponse {
  is_model_ready: boolean
  samples_used: number
  forecast_steps: number
  forecast_interval_seconds: number
  cpu_forecast: MetricForecast | null
  memory_forecast: MetricForecast | null
  disk_forecast: MetricForecast | null
  stability: StabilityReport | null
  history_cpu: number[]
  history_memory: number[]
  generated_at: string
}
