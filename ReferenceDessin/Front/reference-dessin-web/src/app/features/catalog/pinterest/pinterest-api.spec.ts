import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ReferenceImage } from '../../../shared/models/reference-image';
import { PinterestApi } from './pinterest-api';
import { PinterestBoard } from './pinterest-board';
import { PinterestBoardSection } from './pinterest-board-section';

describe('PinterestApi', () => {
  let api: PinterestApi;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PinterestApi, provideHttpClient(), provideHttpClientTesting()],
    });

    api = TestBed.inject(PinterestApi);

    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  it('récupère les tableaux Pinterest', () => {
    const expectedBoards: PinterestBoard[] = [
      {
        id: '123',
        name: 'Portraits',
        description: 'Références de portraits',
      },
    ];

    let receivedBoards: PinterestBoard[] | undefined;

    api.getBoards().subscribe((boards) => {
      receivedBoards = boards;
    });

    const request = httpController.expectOne('/api/pinterest/boards');

    expect(request.request.method).toBe('GET');

    request.flush(expectedBoards);

    expect(receivedBoards).toEqual(expectedBoards);
  });

  it('récupère les sections d’un tableau', () => {
    const expectedSections: PinterestBoardSection[] = [
      {
        id: '456',
        name: 'Visages',
      },
    ];

    let receivedSections: PinterestBoardSection[] | undefined;

    api.getBoardSections('board 123').subscribe((sections) => {
      receivedSections = sections;
    });

    const request = httpController.expectOne('/api/pinterest/boards/' + 'board%20123/sections');

    expect(request.request.method).toBe('GET');

    request.flush(expectedSections);

    expect(receivedSections).toEqual(expectedSections);
  });

  it('récupère les références d’un tableau', () => {
    const expectedImages = [createImage('1')];

    let receivedImages: ReferenceImage[] | undefined;

    api.getBoardImages('123').subscribe((images) => {
      receivedImages = images;
    });

    const request = httpController.expectOne('/api/pinterest/boards/123/images');

    expect(request.request.method).toBe('GET');

    request.flush(expectedImages);

    expect(receivedImages).toEqual(expectedImages);
  });

  it('récupère les références d’une section', () => {
    const expectedImages = [createImage('1')];

    let receivedImages: ReferenceImage[] | undefined;

    api.getSectionImages('board 123', 'section 456').subscribe((images) => {
      receivedImages = images;
    });

    const request = httpController.expectOne(
      '/api/pinterest/boards/' + 'board%20123/sections/' + 'section%20456/images',
    );

    expect(request.request.method).toBe('GET');

    request.flush(expectedImages);

    expect(receivedImages).toEqual(expectedImages);
  });
});

function createImage(externalId: string): ReferenceImage {
  return {
    externalId,
    imageUrl: `https://i.pinimg.com/${externalId}.jpg`,
    sourceName: 'Pinterest',
    originalUrl: `https://www.pinterest.com/pin/${externalId}/`,
    authorName: null,
    authorUrl: null,
    description: '',
    averageColor: null,
  };
}