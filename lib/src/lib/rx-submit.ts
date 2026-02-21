import { assertInInjectionContext, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { submit, type FieldTree } from '@angular/forms/signals';
import { defer, firstValueFrom, type Observable } from 'rxjs';
import type { RxCommonFormSubmitOptions } from './rx-common-form-submit-options';

/**
 * Options that can be specified when submitting a form with `rxSubmit()`.
 *
 * @experimental 21.2.0
 */
export interface RxSubmitOptions<TModel> extends RxCommonFormSubmitOptions<unknown, TModel> {}

/**
 * Submits a given `FieldTree` using the given action function and applies any submission errors
 * resulting from the action to the field. Submission errors returned by the `action` will be integrated
 * into the field as a `ValidationError` on the sub-field indicated by the `fieldTree` property of the
 * submission error.
 *
 * @example
 * ```ts
 * function registerNewUser(registrationForm: FieldTree<{username: string, password: string}>): Observable<TreeValidationResult> {
 *   return myClient.registerNewUser(registrationForm().value()).pipe(
 *     map((result) => {
 *       if (result.errorCode === myClient.ErrorCode.USERNAME_TAKEN) {
 *         return [{
 *           fieldTree: registrationForm.username,
 *           kind: 'server',
 *           message: 'Username already taken',
 *         }];
 *       }
 *       return undefined;
 *     }),
 *   );
 * }
 *
 * const registrationForm = form(signal({ username: 'elmo', password: '' }));
 *
 * rxSubmit(registrationForm, {
 *   action: async (f) => registerNewUser(f),
 * }).subscribe();
 *
 * registrationForm.username().errors(); // [{kind: 'server', message: 'Username already taken'}]
 * ```
 *
 * @param form The field to submit.
 * @param options Options for the submission.
 * @returns Whether the submission was successful.
 * @template TModel The data type of the field being submitted.
 *
 * @category submission
 * @experimental 21.2.0
 */
export function rxSubmit<TModel>(
  form: FieldTree<TModel>,
  options: RxSubmitOptions<TModel>,
): Observable<boolean> {
  if (!options.destroyRef) {
    assertInInjectionContext(rxSubmit);
  }

  const { action, destroyRef = inject(DestroyRef), ...otherOptions } = options;

  /* `submit()` the form and transform the Promise return into a lazy Observable.
   * It is important to use `defer()` so that the submission happens only when the Observable is subscribed to;
   * otherwise with `from()`, `submit()` would be called immediately. */
  return defer(() =>
    submit(form, {
      action: async (submittedForm, detail) =>
        /* Transform the action Observable into a Promise */
        await firstValueFrom(
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
