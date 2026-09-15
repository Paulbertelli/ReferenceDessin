import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PhotoReference } from '../models/photo-reference.model';

@Injectable({
    providedIn: 'root'
})
export class PhotoService {
    private readonly httpClient = inject(HttpClient);
    private readonly apiUrl = '/api/photos';

    getPhotos(
        query: string = '',
        count: number = 30
    ): Observable<PhotoReference[]> {
        let params = new HttpParams()
            .set('count', count);

        const normalizedQuery = query.trim();

        if (normalizedQuery) {
            params = params.set('query', normalizedQuery);
        }

        return this.httpClient.get<PhotoReference[]>(
            this.apiUrl,
            { params }
        );
    }
}