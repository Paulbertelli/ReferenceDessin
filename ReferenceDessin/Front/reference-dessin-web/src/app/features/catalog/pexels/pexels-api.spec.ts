import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ReferenceImage } from '../../../shared/models/reference-image';
import { PexelsApi } from './pexels-api';

describe('PexelsApi', () => {
  let api: PexelsApi;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PexelsApi, provideHttpClient(), provideHttpClientTesting()],
    });

    api = TestBed.inject(PexelsApi);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  it('requests 30 images by default', () => {
    api.searchReferenceImages().subscribe();

    const request = httpController.expectOne((request) => request.url === '/api/photos');

    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('count')).toBe('30');
    expect(request.request.params.has('query')).toBe(false);

    request.flush([]);
  });

  it('normalizes and sends the search term', () => {
    api.searchReferenceImages('  chat noir  ', 12).subscribe();

    const request = httpController.expectOne(
      (request) =>
        request.url === '/api/photos' &&
        request.params.get('count') === '12' &&
        request.params.get('query') === 'chat noir',
    );

    expect(request.request.method).toBe('GET');

    request.flush([]);
  });

  it('returns the received images', () => {
    const expectedImages: ReferenceImage[] = [
      {
        externalId: '123',
        imageUrl: 'https://images.example/photo.jpeg',
        sourceName: 'Pexels',
        originalUrl: 'https://www.pexels.com/photo/123',
        authorName: 'Jane Doe',
        authorUrl: 'https://www.pexels.com/@jane',
        description: 'Un portrait',
        averageColor: '#AABBCC',
      },
    ];

    let receivedImages: ReferenceImage[] | undefined;

    api.searchReferenceImages('portrait', 1).subscribe((images) => {
      receivedImages = images;
    });

    const request = httpController.expectOne(
      (request) =>
        request.url === '/api/photos' &&
        request.params.get('count') === '1' &&
        request.params.get('query') === 'portrait',
    );

    request.flush(expectedImages);

    expect(receivedImages).toEqual(expectedImages);
  });

  it('propagates HTTP errors', () => {
    let receivedError: HttpErrorResponse | undefined;

    api.searchReferenceImages().subscribe({
      error: (error) => {
        receivedError = error;
      },
    });

    const request = httpController.expectOne(
      (request) => request.url === '/api/photos' && request.params.get('count') === '30',
    );

    request.flush(
      {
        detail: 'Le service d’images est indisponible.',
      },
      {
        status: 502,
        statusText: 'Bad Gateway',
      },
    );

    expect(receivedError?.status).toBe(502);
    expect(receivedError?.error.detail).toBe('Le service d’images est indisponible.');
  });
});
