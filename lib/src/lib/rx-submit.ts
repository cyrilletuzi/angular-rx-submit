import { assertInInjectionContext, DestroyRef, inject, type Injector } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  submit,
  type FieldTree,
  type FormSubmitOptions,
  type TreeValidationResult,
} from '@angular/forms/signals';
import { firstValueFrom, from, type Observable } from 'rxjs';

/**
 * Options that can be specified when submitting a form with `rxSubmit()`.
 *
 * @experimental 21.2.0
 */
interface RxSubmitOptions<TModel> extends Pick<
  FormSubmitOptions<unknown, TModel>,
  'onInvalid' | 'ignoreValidators'
> {
  /**
   * Function to run when submitting the form data (when form is valid).
   *
   * @param field The submitted field
   * @param detail An object containing the root field of the submitted form as well as the submitted field itself
   */
  action: (
    field: FieldTree<TModel>,
    detail: {
      root: FieldTree<unknown>;
      submitted: FieldTree<TModel>;
    },
  ) => Observable<TreeValidationResult>;
  /**
   * `Injector` which will provide the `DestroyRef` used to clean up the Observable subscription.
   *
   * If this is not provided, a `DestroyRef` will be retrieved from the current injection context.
   */
  injector?: Injector;
}

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
  if (!options.injector) {
    assertInInjectionContext(rxSubmit);
  }

  const destroyRef: DestroyRef = options.injector?.get(DestroyRef) ?? inject(DestroyRef);

  /* Prepare the Promise-based action callback */
  const actionCallback = async (
    field: FieldTree<TModel>,
    detail: {
      root: FieldTree<unknown>;
      submitted: FieldTree<TModel>;
    },
  ): Promise<TreeValidationResult> => {
    /* Pass the form to the user-provided and Observable-based action callback */
    const actionObservable: Observable<TreeValidationResult> = options
      .action(field, detail)
      .pipe(takeUntilDestroyed(destroyRef));

    /* Transform the action Observable into a Promise */
    const treeValidationResult: TreeValidationResult = await firstValueFrom(actionObservable, {
      /* If `takeUntilDestroyed()` happens, returns `undefined` instead of throwing an `EmptyError` */
      defaultValue: undefined,
    });

    return treeValidationResult;
  };

  /* `submit()` the form and transform the Promise return into an Observable */
  const submitObservable: Observable<boolean> = from(
    submit(form, {
      action: actionCallback,
      ...(options.onInvalid ? { onInvalid: options.onInvalid } : {}),
      ...(options.ignoreValidators !== undefined
        ? { ignoreValidators: options.ignoreValidators }
        : {}),
    }),
  ).pipe(takeUntilDestroyed(destroyRef));

  return submitObservable;
}
