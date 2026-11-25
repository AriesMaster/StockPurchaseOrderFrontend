import { Component, inject, signal, computed } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthStore } from '../../core/auth/services/auth.store';

@Component({
  selector: 'app-workspace-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './workspace-layout.html',
  styleUrl: './workspace-layout.scss',
})
export class WorkspaceLayout {
  readonly auth = inject(AuthStore);
  readonly open = signal(false);
  readonly roleLabel = computed(() => this.auth.role()?.replaceAll('_', ' ') ?? '');
}
