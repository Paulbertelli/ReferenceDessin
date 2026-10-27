import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ReferenceImage } from '../../../shared/models/reference-image';
import { PinterestBoard } from './pinterest-board';
import { PinterestBoardSection } from './pinterest-board-section';

@Injectable({
  providedIn: 'root',
})
export class PinterestApi {
  private readonly httpClient = inject(HttpClient);
  private readonly endpoint = '/api/pinterest';

  getBoards(): Observable<PinterestBoard[]> {
    return this.httpClient.get<PinterestBoard[]>(`${this.endpoint}/boards`);
  }

  getBoardSections(boardId: string): Observable<PinterestBoardSection[]> {
    const encodedBoardId = encodeURIComponent(boardId);

    return this.httpClient.get<PinterestBoardSection[]>(
      `${this.endpoint}/boards/` + `${encodedBoardId}/sections`,
    );
  }

  getBoardImages(boardId: string): Observable<ReferenceImage[]> {
    const encodedBoardId = encodeURIComponent(boardId);

    return this.httpClient.get<ReferenceImage[]>(
      `${this.endpoint}/boards/` + `${encodedBoardId}/images`,
    );
  }

  getSectionImages(boardId: string, sectionId: string): Observable<ReferenceImage[]> {
    const encodedBoardId = encodeURIComponent(boardId);

    const encodedSectionId = encodeURIComponent(sectionId);

    return this.httpClient.get<ReferenceImage[]>(
      `${this.endpoint}/boards/` + `${encodedBoardId}/sections/` + `${encodedSectionId}/images`,
    );
  }
}