import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SubmissionService {
  // Assumption: no API endpoint was provided. Using a placeholder URL.
  // Replace this with the real endpoint when available.
  private readonly apiUrl = '/api/userInquiry';

  constructor(private http: HttpClient) {}

  submit(payload: any): Observable<HttpResponse<any>> {
    // Return the full HttpResponse so the caller can check status code
    return this.http.post<any>(this.apiUrl, payload);
  }
}
