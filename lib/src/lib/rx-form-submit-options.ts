import type { DestroyRef } from '@angular/core';
import type { FieldTree, FormSubmitOptions, TreeValidationResult } from '@angular/forms/signals';
import type { Observable } from 'rxjs';

/**
 * Options that can be specified when submitting a form with `rxSubmit()`.
 *
 * @experimental 21.2.0
 */
export interface CommonRxFormSubmitOptions<TRootModel, TSubmittedModel> extends Omit<
  FormSubmitOptions<TRootModel, TSubmittedModel>,
  'action'
> {
  /**
   * Function to run when submitting the form data (when form is valid).
   *
   * @param field The submitted field
   * @param detail An object containing the root field of the submitted form as well as the submitted field itself
   */
  action: (
    field: FieldTree<TRootModel & TSubmittedModel>,
    detail: {
      root: FieldTree<TRootModel>;
      submitted: FieldTree<TSubmittedModel>;
    },
  ) => Observable<TreeValidationResult>;
  /**
   * The `DestroyRef` representing the current context. This can be passed explicitly to use `rxSubmit()`
   * outside of an injection context. Otherwise, the current `DestroyRef` is injected.
   */
  destroyRef?: DestroyRef;
}
