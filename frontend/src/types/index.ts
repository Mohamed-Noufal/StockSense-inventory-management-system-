export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  environment: string;
  database: {
    status: string;
    engine: string;
    journal_mode: string;
    foreign_keys: boolean;
  };
  timestamp: string;
}

export interface ReadyResponse {
  status: 'ready' | 'not_ready';
  tables_initialized: boolean;
  table_counts: Record<string, number>;
  default_warehouse: string | null;
}

export interface Milestone {
  id: string;
  title: string;
  sprint: string;
  status: 'completed' | 'in_progress' | 'queued';
  description: string;
  deliverables: string[];
}
