import {
    Component,
    EventEmitter,
    Input,
    Output
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
    LucidePause,
    LucidePlay,
    LucideRotateCcw
} from '@lucide/angular';

@Component({
    selector: 'app-minuteur',
    standalone: true,
    imports: [
        FormsModule,
        LucidePause,
        LucidePlay,
        LucideRotateCcw
    ],
    templateUrl: './minuteur.html',
    styleUrl: './minuteur.scss'
})
export class MinuteurComponent {
    @Input({ required: true })
    enCours = false;

    @Input({ required: true })
    desactive = false;

    @Input({ required: true })
    tempsFormate = '02:00';

    @Input({ required: true })
    progression = 100;

    @Input({ required: true })
    dureeMinutes = 2;

    @Output()
    readonly dureeMinutesChange = new EventEmitter<number>();

    @Output()
    readonly demandeLecturePause = new EventEmitter<void>();

    @Output()
    readonly demandeReinitialisation = new EventEmitter<void>();

    protected modifierDuree(valeur: number): void {
        this.dureeMinutesChange.emit(Number(valeur));
    }
}