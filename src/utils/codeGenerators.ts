import { ApiEndpoint } from '../types/api';
import { buildQueryUrl } from './apiExecutor';
import { BASE_URL } from '../data/apiEndpoints';

/**
 * Membangun cuplikan kode multi-bahasa untuk setiap endpoint REAL LIRENXIN REST API.
 * customQuery = nilai parameter playground saat ini agar snippet selalu sinkron.
 */
export function generateSnippet(
  language: 'curl' | 'javascript' | 'nodejs' | 'python' | 'php' | 'go',
  endpoint: ApiEndpoint,
  customQuery?: Record<string, string>,
  customBody?: Record<string, any>
): string {
  const queryParams: Record<string, string> = {};
  endpoint.queryParams?.forEach((q) => {
    const value = customQuery?.[q.name] ?? q.default ?? '';
    if (value) queryParams[q.name] = value;
  });

  const fullUrl = `${BASE_URL}${buildQueryUrl(endpoint.path, queryParams)}`;
  const body = customBody || endpoint.defaultBody;
  const hasBody = endpoint.method !== 'GET' && body && Object.keys(body).length > 0;
  const jsonBodyString = hasBody ? JSON.stringify(body, null, 2) : '';

  switch (language) {
    case 'curl': {
      let cmd = `# ${endpoint.name} — LIRENXIN REST API (tanpa API key)\ncurl -X ${endpoint.method} "${fullUrl}"`;
      if (hasBody) {
        cmd += ` \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(body)}'`;
      }
      return cmd;
    }

    case 'javascript': {
      return `// JavaScript (Fetch API) — ${endpoint.name}
const response = await fetch("${fullUrl}", {
  method: "${endpoint.method}",
  headers: { "Accept": "application/json" }${hasBody ? `,\n  body: JSON.stringify(${jsonBodyString.split('\n').join('\n  ')})` : ''}
});

const data = await response.json();
console.log("Status:", response.status);
console.log({ status: data.status, title: data.title, video: data.video, images: data.images });`;
    }

    case 'nodejs': {
      return `// Node.js dengan Axios — ${endpoint.name}
import axios from 'axios';

try {
  const { data } = await axios({
    method: '${endpoint.method.toLowerCase()}',
    url: '${fullUrl}',
    ${hasBody ? `data: ${jsonBodyString.split('\n').join('\n    ')}` : "timeout: 120000"}
  });

  console.log(data.status, data.title, data.video || data.images);
} catch (error) {
  console.error('API Error:', error.response?.data || error.message);
}`;
    }

    case 'python': {
      return `# Python (requests) — ${endpoint.name}
import requests

url = "${fullUrl}"
response = requests.${endpoint.method.toLowerCase()}(url${hasBody ? ', json=' + JSON.stringify(body) : ''}, timeout=120)

print("Status:", response.status_code)
result = response.json()
print("Judul:", result.get("title"))
print("Video:", result.get("video"))
print("Gambar:", result.get("images"))`;
    }

    case 'php': {
      return `<?php
// PHP cURL — ${endpoint.name}
$curl = curl_init();

${hasBody ? `$payload = json_encode(${jsonBodyString});\n` : ''}curl_setopt_array($curl, [
  CURLOPT_URL => "${fullUrl}",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_CUSTOMREQUEST => "${endpoint.method}",
  ${hasBody ? 'CURLOPT_POSTFIELDS => $payload,\n  ' : ''}CURLOPT_FOLLOWLOCATION => true,
]);

$response = curl_exec($curl);
curl_close($curl);

echo $response;`;
    }

    case 'go': {
      return `// Go net/http — ${endpoint.name}
package main

import (
	"fmt"
	"net/http"
	"io"
	"encoding/json"
)

func main() {
	req, _ := http.NewRequest("${endpoint.method}", "${fullUrl}", nil)

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer res.Body.Close()

	raw, _ := io.ReadAll(res.Body)
	var result map[string]any
	json.Unmarshal(raw, &result)
	fmt.Println(result["status"], result["title"])
}`;
    }

    default:
      return '';
  }
}
