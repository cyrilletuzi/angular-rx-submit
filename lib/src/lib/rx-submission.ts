import { assertInInjectionContext, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { FormSubmitOptions } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import type { RxFormSubmitOptions } from './rx-form-submit-options';

/**
 * Observable-based version of the Angular form `submission` configuration (which is Promise-based).
 *
 * This function is provided only for very simple cases.
 * If some actions (like redirecting to another page) must be done after the submission succeeds,
 * or if errors can happen and should be managed (which is probably the case), `rxSubmit()` should be preferred.
 * @see {@link rxSubmit}
 *
 * **Important: this function requires an injection context (which should be the case, if used like in the example below).
 * Using it outside an injection context requires to pass a `DestroyRef` in the options;
 * otherwise it will throw the `NG0203` runtime error: https://angular.dev/errors/NG0203**
 *
 * @param options Options for the submission, see `RxFormSubmitOptions`
 * @returns The same submission configuration, but Promised-based
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
 *     submission: rxSubmission({
 *       action: (submittedForm) => someObservableOfTreeValidationResult(submittedForm().value()),
 *     }),
 *   });
 * }
 *
 * @version 21.2.0
 * @experimental
 */
export function rxSubmission<TModel>(
  options: RxFormSubmitOptions<TModel, unknown>,
): FormSubmitOptions<TModel, unknown> {
  if (!options.destroyRef) {
    assertInInjectionContext(rxSubmission);
  }

  /* It is important to do `inject()` here, as the injection context is then lost in the below callbacks */
  const { action, destroyRef = inject(DestroyRef), ...otherOptions } = options;

  return {
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Angular internal, cannot change readonly here
    action: (form, detail) =>
      /* Transform the action Observable into a Promise */
      firstValueFrom(
        /* Pass the form to the user-provided and Observable-based action callback */
        action(form, detail).pipe(takeUntilDestroyed(destroyRef)),
        {
          /* If `takeUntilDestroyed()` happens, returns `undefined` instead of throwing an `EmptyError` */
          defaultValue: undefined,
        },
      ),
    ...otherOptions,
  };
}
