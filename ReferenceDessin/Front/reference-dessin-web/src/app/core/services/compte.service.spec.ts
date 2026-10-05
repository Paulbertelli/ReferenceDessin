import { provideHttpClient } from '@angular/common/http';
import {
    HttpTestingController,
    provideHttpClientTesting
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CompteService } from './compte.service';

describe('CompteService', () => {
    let service: CompteService;
    let controleurHttp: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                CompteService,
                provideHttpClient(),
                provideHttpClientTesting()
            ]
        });

        service = TestBed.inject(CompteService);
        controleurHttp =
            TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        controleurHttp.verify();
    });

    it(
        'doit obtenir un jeton avant de supprimer le compte',
        () => {
            let suppressionTerminee = false;

            service.supprimerCompte().subscribe(() => {
                suppressionTerminee = true;
            });

            const requeteJeton =
                controleurHttp.expectOne(
                    '/api/securite/jeton-antifalsification'
                );

            expect(requeteJeton.request.method)
                .toBe('GET');

            controleurHttp.expectNone('/api/compte');

            requeteJeton.flush(null);

            const requeteSuppression =
                controleurHttp.expectOne('/api/compte');

            expect(requeteSuppression.request.method)
                .toBe('DELETE');

            expect(suppressionTerminee).toBe(false);

            requeteSuppression.flush(null);

            expect(suppressionTerminee).toBe(true);
        }
    );
});