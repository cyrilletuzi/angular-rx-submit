import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { form, FormField, FormRoot } from '@angular/forms/signals';
import { rxSubmit } from 'angular-rx-submit';
import { map } from 'rxjs';
import { mapApiResponseToValidationTreeResult } from './api-adapters';
import type { User } from './data-model';
import { HttpApi } from './http-api';

@Component({
  selector: 'app-root',
  imports: [FormRoot, FormField],
  template: `
    <form [formRoot]="form" (submit)="save()">
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
  protected readonly form = form(this.formModel, {
    submission: {
      action: async () => {},
    },
  });

  protected readonly globalError = signal<string | undefined>(undefined);

  protected save(): void {
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
          // Manage success here like displaying success or redirecting to another page
          this.globalError.set(`Success!`);
        }
      },
      error: (error: unknown) => {
        // Manage error here
        if (error instanceof HttpErrorResponse && error.status === 500) {
          this.globalError.set(`Service unavailable`);
        } else {
          this.globalError.set(`Unexpected network error`);
        }
      },
    });
  }
}
