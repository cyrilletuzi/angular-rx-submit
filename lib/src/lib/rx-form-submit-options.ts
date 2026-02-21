import { assertInInjectionContext } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { FormSubmitOptions } from '@angular/forms/signals';
import { catchError, firstValueFrom, of, tap } from 'rxjs';
import type { RxCommonFormSubmitOptions } from './rx-common-form-submit-options';

export interface RxFormSubmitOptions<TModel> extends RxCommonFormSubmitOptions<TModel, unknown> {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

export function rxFormSubmitOptions<TModel>(
  options: RxFormSubmitOptions<TModel>,
): FormSubmitOptions<TModel, unknown> {
  if (!options.destroyRef) {
    assertInInjectionContext(rxFormSubmitOptions);
  }

  const { action, destroyRef, onSuccess, onError, ...otherOptions } = options;

  return {
    action: (form, detail) =>
      firstValueFrom(
        action(form, detail).pipe(
          takeUntilDestroyed(destroyRef),
          tap(() => {
            if (onSuccess && form().valid()) {
              onSuccess();
            }
          }),
          catchError((error: unknown) => {
            if (onError) {
              onError(error);
              return of(undefined);
            }
            throw error;
          }),
        ),
        {
          defaultValue: undefined,
        },
      ),
    ...otherOptions,
  };
}
