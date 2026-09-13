export type ScreenId = 'war-room' | 'drop-receipts' | 'fumble-radar' | 'sparring-sandbox';

export interface ChatNode {
  id: string;
  sender: 'you' | 'them';
  text: string;
  timestamp: string;
  latency: string;
  badge?: string;
  errorCallout?: string;
  subtextBadge?: string;
  readReceipt?: boolean;
}

export interface SparringMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  time: string;
  fallacy?: string;
  frameImpact?: number;
}

export interface PlaybookRule {
  id: number;
  title: string;
  description: string;
  tacticalTip: string;
}

export interface OcrBubble {
  sender: 'you' | 'them';
  text: string;
  timestamp?: string;
  status?: string;
  confidence?: number;
  subtext?: string;
}

export interface ApiEndpointItem {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  category: string;
  description: string;
  requestBody?: Record<string, any>;
  responseSample: Record<string, any>;
}
