import type { DestroyRef } from '@angular/core';
import type { FieldTree, FormSubmitOptions, TreeValidationResult } from '@angular/forms/signals';
import type { Observable } from 'rxjs';

/**
 * Observabled-based version of the Angular `FormSubmitOptions` (which is Promise-based).
 * It can be used when submitting a form with `rxSubmit()`.
 *
 * @see {@link rxSubmit}
 *
 * @version 22.0.0
 */
export interface RxFormSubmitOptions<TRootModel, TSubmittedModel> extends Omit<
  FormSubmitOptions<TRootModel, TSubmittedModel>,
  'action'
> {
  /**
   * Required function to run when submitting the form (when form is valid).
   *
   * @param field The submitted field (in most cases: the form)
   * @param detail Only useful if a particular field was submitted instead of the root
   * @returns The function must return an Observable of a `TreeValidationResult`, meaning:
   * - `null`, `undefined` or `void` if there is no validation error
   * - a `ValidationError.WithOptionalFieldTree` or an array of this
   */
  readonly action: (
    field: FieldTree<TRootModel & TSubmittedModel>,
    detail: {
      readonly root: FieldTree<TRootModel>;
      readonly submitted: FieldTree<TSubmittedModel>;
    },
  ) => Observable<TreeValidationResult>;

  /**
   * The `DestroyRef` representing the current context.
   * **It is required when using `rxSubmit()` outside of an injection context.**
   * Otherwise, the current `DestroyRef` is injected.
   * Using `rxSubmit()` outside an injection context and without providing a `DestroyRef` will throw the `NG0203` runtime error: https://angular.dev/errors/NG0203
   */
  readonly destroyRef?: Readonly<DestroyRef> | undefined;
}
