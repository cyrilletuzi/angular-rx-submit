import { assertInInjectionContext, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { FormSubmitOptions } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import type { RxFormSubmitOptions } from './rx-form-submit-options';

/**
 * Observable-based version of the Angular form `submission` `action` configuration (which is Promise-based).
 *
 * **Important: this function requires an injection context (which should be the case, if used like in the example below). Using it outside an injection context requires to pass a `DestroyRef` in the options; otherwise it will throw the `NG0203` runtime error: https://angular.dev/errors/NG0203**
 *
 * @param options Options for the submission, see `RxFormSubmitOptions`
 * @returns The same action, but Promised-based
 *
 * @example
 * Component({
 *   imports: [FormRoot],
 *   template: `<form [formRoot]="form"></form>`,
 * })
 * export class EditPage {
 *   private readonly destroyRef = inject(DestroyRef);
 *   private readonly formModel = signal({ userName: '' });
 *   protected readonly form = form(this.formModel, {
 *     submission: {
 *       action: rxAction((submittedForm) => someObservableOfTreeValidationResult(submittedForm().value()).pipe(
 *         tap({
 *           complete: () => {
 *             if (submittedForm().valid()) {
 *               // Manage success here (for example: redirecting to another page)
 *             }
 *           },
 *           error: (error: unknown) => {
 *             // Manage error here (for example: displaying service is unavailable)
 *             return of(undefined);
 *           },
 *         }),
 *       )),
 *     },
 *   });
 * }
 *
 * @version 21.2.0
 * @experimental
 */
export function rxAction<TModel>(
  action: RxFormSubmitOptions<TModel, unknown>['action'],
  options: Pick<RxFormSubmitOptions<TModel, unknown>, 'destroyRef'> = {},
): FormSubmitOptions<TModel, unknown>['action'] {
  if (!options.destroyRef) {
    assertInInjectionContext(rxAction);
  }

  /* It is important to do `inject()` here, as the injection context is then lost in the below callbacks */
  const destroyRef = options.destroyRef ?? inject(DestroyRef);

  return (form, detail) =>
    /* Transform the action Observable into a Promise */
    firstValueFrom(
      /* Pass the form to the user-provided and Observable-based action callback */
      action(form, detail).pipe(takeUntilDestroyed(destroyRef)),
      {
        /* If `takeUntilDestroyed()` happens, returns `undefined` instead of throwing an `EmptyError` */
        defaultValue: undefined,
      },
    );
}
