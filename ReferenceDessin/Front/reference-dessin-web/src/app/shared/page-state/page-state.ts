import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

export type PageStateType = 'loading' | 'error' | 'empty' | 'info';

@Component({
  selector: 'app-page-state',
  templateUrl: './page-state.html',
  styleUrl: './page-state.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageState {
  readonly type = input.required<PageStateType>();

  readonly title = input<string>('');

  readonly message = input.required<string>();

  readonly actionLabel = input<string>('');

  readonly actionRequested = output<void>();

  protected readonly role = computed(() => {
    switch (this.type()) {
      case 'error':
        return 'alert';

      case 'loading':
        return 'status';

      default:
        return null;
    }
  });

  protected readonly ariaLive = computed(() => (this.type() === 'error' ? 'assertive' : 'polite'));
}