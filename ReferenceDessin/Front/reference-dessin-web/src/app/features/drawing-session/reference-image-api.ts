import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ReferenceImage } from './reference-image';

@Injectable({
  providedIn: 'root',
})
export class ReferenceImageApi {
  private readonly httpClient = inject(HttpClient);
  private readonly endpoint = '/api/photos';

  searchImages(searchTerm: string = '', count: number = 30): Observable<ReferenceImage[]> {
    let parameters = new HttpParams().set('count', count);

    const normalizedSearchTerm = searchTerm.trim();

    if (normalizedSearchTerm) {
      parameters = parameters.set('query', normalizedSearchTerm);
    }

    return this.httpClient.get<ReferenceImage[]>(this.endpoint, { params: parameters });
  }
}
