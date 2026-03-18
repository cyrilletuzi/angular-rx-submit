import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { User } from './data-model';

export interface ApiResponse {
  readonly success: boolean;
  readonly error?: {
    readonly message: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class HttpApi {
  private readonly httpClient = inject(HttpClient);

  postData(body: User): Observable<ApiResponse> {
    return this.httpClient.post<ApiResponse>('/api/save', body);
  }
}
