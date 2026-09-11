import {
    HttpErrorResponse,
    provideHttpClient
} from '@angular/common/http';
import {
    HttpTestingController,
    provideHttpClientTesting
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it
} from 'vitest';
import { PhotoReference } from '../models/photo-reference.model';
import { PhotoService } from './photo.service';

describe('PhotoService', () => {
    let service: PhotoService;
    let controleurHttp: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                PhotoService,
                provideHttpClient(),
                provideHttpClientTesting()
            ]
        });

        service = TestBed.inject(PhotoService);
        controleurHttp = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        controleurHttp.verify();
    });

    it('doit demander 30 photos par défaut', () => {
        service.getPhotos().subscribe();

        const requete = controleurHttp.expectOne(request =>
            request.url === '/api/photos'
        );

        expect(requete.request.method).toBe('GET');
        expect(requete.request.params.get('count')).toBe('30');
        expect(requete.request.params.has('query')).toBe(false);

        requete.flush([]);
    });

    it('doit normaliser et transmettre le mot-clé', () => {
        service.getPhotos('  chat noir  ', 12).subscribe();

        const requete = controleurHttp.expectOne(
            '/api/photos?count=12&query=chat%20noir'
        );

        expect(requete.request.method).toBe('GET');

        requete.flush([]);
    });

    it('doit retourner les photos reçues', () => {
        const photosAttendues: PhotoReference[] = [
            {
                id: 123,
                imageUrl: 'https://images.pexels.com/photo.jpeg',
                pexelsUrl: 'https://www.pexels.com/photo/123',
                photographer: 'Jane Doe',
                photographerUrl: 'https://www.pexels.com/@jane',
                description: 'Un portrait',
                averageColor: '#AABBCC'
            }
        ];

        let photosRecues: PhotoReference[] | undefined;

        service.getPhotos('portrait', 1).subscribe(photos => {
            photosRecues = photos;
        });

        const requete = controleurHttp.expectOne(
            '/api/photos?count=1&query=portrait'
        );

        requete.flush(photosAttendues);

        expect(photosRecues).toEqual(photosAttendues);
    });

    it('doit propager une erreur HTTP', () => {
        let erreurRecue: HttpErrorResponse | undefined;

        service.getPhotos().subscribe({
            error: erreur => {
                erreurRecue = erreur;
            }
        });

        const requete = controleurHttp.expectOne(
            '/api/photos?count=30'
        );

        requete.flush(
            {
                detail: 'Le service d’images est indisponible.'
            },
            {
                status: 502,
                statusText: 'Bad Gateway'
            }
        );

        expect(erreurRecue?.status).toBe(502);
        expect(erreurRecue?.error.detail).toBe(
            'Le service d’images est indisponible.'
        );
    });
});