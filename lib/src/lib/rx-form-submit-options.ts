import type { DestroyRef } from '@angular/core';
import type { FieldTree, FormSubmitOptions, TreeValidationResult } from '@angular/forms/signals';
import type { Observable } from 'rxjs';

/**
 * Observabled-based version of the Angular `FormSubmitOptions` (which is Promise-based).
 * It can be used:
 * 1. when submitting a form with `rxSubmit()`
 * 2. when using the form `submission` configuration with `mapRxFormSubmitOptions()`
 *
 * See the documentation of each property for more details.
 *
 * @see {@link rxSubmit}
 * @see {@link mapRxFormSubmitOptions}
 *
 * @version 21.2.0
 * @experimental
 */
export interface RxFormSubmitOptions<TRootModel, TSubmittedModel> extends Omit<
  FormSubmitOptions<TRootModel, TSubmittedModel>,
  'action'
> {
  /**
   * Required function to run when submitting the form (when form is valid).
   *
   * @param field The submitted field (in most cases: the form)
   * @param detail Only useful if An object containing the root field of the submitted form as well as the submitted field itself
   * @returns The function must return an Observable of a `TreeValidationResult`, meaning:
   * - `null`, `undefined` or `void` if there is no validation error
   * - a `ValidationError.WithOptionalFieldTree` or an array of this
   */
  action: (
    field: FieldTree<TRootModel & TSubmittedModel>,
    detail: {
      root: FieldTree<TRootModel>;
      submitted: FieldTree<TSubmittedModel>;
    },
  ) => Observable<TreeValidationResult>;
  /**
   * The `DestroyRef` representing the current context.
   * **It is required when using `rxSubmit()` or `mapRxFormSubmitOptions()` outside of an injection context.**
   * Otherwise, the current `DestroyRef` is injected.
   * Using `rxSubmit()` or `mapRxFormSubmitOptions()` outside an injection context and without providing a `DestroyRef` will throw the `NG0203` runtime error: https://angular.dev/errors/NG0203
   */
  destroyRef?: DestroyRef;
}
