import { assertInInjectionContext, DestroyRef, inject, type Injector } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { submit, type FieldTree, type TreeValidationResult } from '@angular/forms/signals';
import { firstValueFrom, from, type Observable } from 'rxjs';

interface RxSubmitOptions {
  /**
   * `Injector` which will provide the `DestroyRef` used to clean up the Observable subscription.
   *
   * If this is not provided, a `DestroyRef` will be retrieved from the current injection context.
   */
  injector?: Injector;
}

export function rxSubmit<TModel>(
  form: FieldTree<TModel>,
  action: (form: FieldTree<TModel>) => Observable<TreeValidationResult>,
  options: RxSubmitOptions = {},
): Observable<boolean> {
  if (!options.injector) {
    assertInInjectionContext(rxSubmit);
  }

  const destroyRef: DestroyRef = options.injector?.get(DestroyRef) ?? inject(DestroyRef);

  /* Prepare the Promise-based action callback */
  const actionCallback = async (
    submittedForm: FieldTree<TModel>,
  ): Promise<TreeValidationResult> => {
    /* Pass the form to the user-provided and Observable-based action callback */
    const actionObservable: Observable<TreeValidationResult> = action(submittedForm).pipe(
      takeUntilDestroyed(destroyRef),
    );

    /* Transform the action Observable into a Promise */
    const treeValidationResult: TreeValidationResult = await firstValueFrom(actionObservable, {
      /* If `takeUntilDestroyed()` happens, returns `undefined` instead of throwing an `EmptyError` */
      defaultValue: undefined,
    });

    return treeValidationResult;
  };

  /* `submit()` the form and transform the Promise return into an Observable */
  const submitObservable: Observable<boolean> = from(submit(form, actionCallback)).pipe(
    takeUntilDestroyed(destroyRef),
  );

  return submitObservable;
}
