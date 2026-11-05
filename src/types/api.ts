export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export type ApiCategory =
  | 'getting-started'
  | 'analytics'
  | 'downloaders'
  | 'utilities';

export interface HeaderParam {
  key: string;
  value: string;
  required: boolean;
  description: string;
}

export interface QueryParam {
  name: string;
  type: string;
  required: boolean;
  default?: string;
  description: string;
}

export interface BodyParam {
  name: string;
  type: string;
  required: boolean;
  example: string | number | boolean | object;
  description: string;
}

export interface ApiResponseExample {
  statusCode: number;
  statusText: string;
  description: string;
  body: Record<string, any>;
}

export interface ApiEndpoint {
  id: string;
  name: string;
  category: ApiCategory;
  method: HttpMethod;
  path: string;
  summary: string;
  description: string;
  rateLimit: string;
  headers: HeaderParam[];
  queryParams?: QueryParam[];
  bodyParams?: BodyParam[];
  defaultBody?: Record<string, any>;
  responses: ApiResponseExample[];
}

export interface LiveExecutionResult {
  statusCode: number;
  statusText: string;
  timeMs: number;
  sizeBytes: number;
  headers: Record<string, string>;
  data: any;
  error?: string;
}

/** Media hasil proxy downloader untuk pratinjau & tombol unduh */
export interface MediaResult {
  video?: string | null;
  audio?: string | null;
  thumbnails?: string[];
  images?: string[];
  downloads?: { url: string; quality?: string; ext?: string }[];
  title?: string;
  author?: string;
  thumbnail?: string;
  source?: string;
}
