import type { TreeValidationResult } from '@angular/forms/signals';
import type { ApiResponse } from './http-api';

export function mapApiResponseToValidationTreeResult(response: ApiResponse): TreeValidationResult {
  if (response.success) {
    return null;
  }

  return {
    kind: 'apiError',
    message: response.error?.message ?? 'Unexpected API error',
  };
}
