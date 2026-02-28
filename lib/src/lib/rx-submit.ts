import { assertInInjectionContext, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { submit, type FieldTree } from '@angular/forms/signals';
import { defer, firstValueFrom, type Observable } from 'rxjs';
import type { RxFormSubmitOptions } from './rx-form-submit-options';

/**
 * Observable-based version of the Angular `submit()` (which is Promise-based).
 *
 * **Important: this function requires an injection context. Using it outside an injection context requires to pass a `DestroyRef` in the options, like in the example below; otherwise it will throw the `NG0203` runtime error: https://angular.dev/errors/NG0203**
 *
 * @param form The form to submit.
 * @param options Options for the submission, see `RxFormSubmitOptions`
 * @returns An Observable of boolean, indicating if the submission was successful.
 *
 * @example
 * Component({
 *   imports: [FormRoot],
 *   template: `<form [formRoot]="form" (submit)="save()"></form>`,
 * })
 * export class EditPage {
 *   private readonly destroyRef = inject(DestroyRef);
 *   private readonly formModel = signal({ userName: '' });
 *   protected readonly form = form(this.formModel);
 *
 *   protected save(): void {
 *     rxSubmit(this.form, {
 *       action: (submittedForm) => someObservableOfTreeValidationResult(submittedForm().value()),
 *       destroyRef: this.destroyRef,
 *     }).subscribe({
 *       next: (success) => {
 *         if (success) {
 *           // Manage success here
 *         }
 *       },
 *       error: (error: unknown) => {
 *         // Manage error here
 *       },
 *     });
 *   }
 * }
 *
 * @version 21.2.0
 * @experimental
 */
export function rxSubmit<TModel>(
  form: FieldTree<TModel>,
  options: RxFormSubmitOptions<unknown, TModel>,
): Observable<boolean> {
  if (!options.destroyRef) {
    assertInInjectionContext(rxSubmit);
  }

  /* It is important to do `inject()` here, as the injection context is then lost in the below callbacks */
  const { action, destroyRef = inject(DestroyRef), ...otherOptions } = options;

  /* `submit()` the form and transform the Promise return into a lazy Observable.
   * It is important to use `defer()` so that the submission happens only when the Observable is subscribed to;
   * otherwise with `from()`, `submit()` would be called immediately. */
  return defer(() =>
    submit(form, {
      action: (submittedForm, detail) =>
        /* Transform the action Observable into a Promise */
        firstValueFrom(
          /* Pass the form to the user-provided and Observable-based action callback */
          action(submittedForm, detail).pipe(takeUntilDestroyed(destroyRef)),
          {
            /* If `takeUntilDestroyed()` happens, returns `undefined` instead of throwing an `EmptyError` */
            defaultValue: undefined,
          },
        ),
      ...otherOptions,
    }),
  ).pipe(takeUntilDestroyed(destroyRef));
}
