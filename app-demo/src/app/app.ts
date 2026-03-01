import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { rxSubmit } from 'angular-rx-submit';
import { map } from 'rxjs';
import { mapApiResponseToValidationTreeResult } from './api-adapters';
import type { User } from './data-model';
import { HttpApi } from './http-api';

@Component({
  selector: 'app-root',
  imports: [FormField],
  template: `
    <form novalidate (submit)="save($event)">
      <label>
        Name:
        <input type="text" [formField]="form.name" />
      </label>
      <button type="submit">Save</button>
      @if (form().errors().length > 0) {
        <ul>
          @for (error of form().errors(); track error.kind) {
            <li>{{ error.message ?? error.kind }}</li>
          }
        </ul>
      }
      @if (globalError() !== undefined) {
        <p>{{ globalError() }}</p>
      }
    </form>
  `,
})
export class App {
  private readonly destroyRef = inject(DestroyRef);
  private readonly httpApi = inject(HttpApi);

  private readonly formModel = signal<User>({
    name: '',
  });
  protected readonly form = form(this.formModel);

  protected readonly globalError = signal<string | undefined>(undefined);

  protected save(event: Event): void {
    event.preventDefault();

    this.globalError.set(undefined);

    rxSubmit(this.form, {
      action: (submittedForm) =>
        this.httpApi
          .postData(submittedForm().value())
          .pipe(map(mapApiResponseToValidationTreeResult)),
      destroyRef: this.destroyRef,
    }).subscribe({
      next: (success) => {
        if (success) {
          // Manage success here (for example: redirecting to another page)
          this.globalError.set(`Success!`);
        }
      },
      error: (error: unknown) => {
        // Manage error here (for example: displaying service is unavailable)
        if (error instanceof HttpErrorResponse && error.status === 500) {
          this.globalError.set(`Service unavailable`);
        } else {
          this.globalError.set(`Unexpected network error`);
        }
      },
    });
  }
}
