import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { LucideSearch } from '@lucide/angular';
import { filter, startWith } from 'rxjs';
import { AccountMenu } from '../../features/account/account-menu/account-menu';
import { AuthenticationStore } from '../../features/account/authentication-store';

@Component({
  selector: 'app-main-navigation',
  imports: [FormsModule, RouterLink, LucideSearch, AccountMenu],
  templateUrl: './main-navigation.html',
  styleUrl: './main-navigation.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainNavigation {
  protected readonly authenticationStore = inject(AuthenticationStore);

  protected readonly searchQuery = signal('');

  private readonly router = inject(Router);

  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        startWith(null),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.restoreSearchQuery();
      });
  }

  protected search(): void {
    const query = this.searchQuery().trim();

    void this.router.navigate(['/search'], {
      queryParams: query ? { q: query } : {},
    });
  }

  private restoreSearchQuery(): void {
    const url = this.router.parseUrl(this.router.url);

    const query = url.queryParams['q'];

    this.searchQuery.set(typeof query === 'string' ? query : '');
  }
}