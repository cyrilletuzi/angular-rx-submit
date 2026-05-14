import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterOutlet],
  template: `
    <nav>
      <ul>
        <li><a routerLink="/">Form</a></li>
        <li><a routerLink="/other">Other</a></li>
      </ul>
    </nav>
    <router-outlet />
  `,
})
export class App {}
