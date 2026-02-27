import { assertInInjectionContext, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { FormSubmitOptions } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import type { RxFormSubmitOptions } from './rx-form-submit-options';

/**
 * Map the Observable-based `RxFormSubmitOptions` to the Angular `FormSubmitOptions` (which is Promise-based).
 *
 * **Important: this function requires an injection context (which should be the case, if used like in the example below). Using it outside an injection context requires to pass a `DestroyRef` in the options; otherwise it will throw the `NG0203` runtime error: https://angular.dev/errors/NG0203**
 *
 * @param options Options for the submission, see `RxFormSubmitOptions`
 * @returns The same options, mapped to `FormSubmitOptions`
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
 *     submission: mapRxFormSubmitOptions({
 *       action: (submittedForm) => someObservableOfTreeValidationResult(submittedForm().value()).pipe(
 *         tap((validationResult) => {
 *           if (!validationResult) {
 *             // Manage success here
 *           }
 *         }),
 *         catchError((error: unknown) => {
 *           // Manage error here
 *           return of(undefined);
 *         }),
 *       ),
 *     }),
 *   });
 * }
 *
 * @version 21.2.0
 * @experimental
 */
export function mapRxFormSubmitOptions<TModel>(
  options: RxFormSubmitOptions<TModel, unknown>,
): FormSubmitOptions<TModel, unknown> {
  if (!options.destroyRef) {
    assertInInjectionContext(mapRxFormSubmitOptions);
  }

  const { action, destroyRef = inject(DestroyRef), ...otherOptions } = options;

  return {
    action: async (form, detail) =>
      firstValueFrom(action(form, detail).pipe(takeUntilDestroyed(destroyRef)), {
        defaultValue: undefined,
      }),
    ...otherOptions,
  };
}
