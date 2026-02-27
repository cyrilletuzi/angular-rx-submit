import { assertInInjectionContext, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { FormSubmitOptions } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import type { RxFormSubmitOptions } from './rx-form-submit-options';

export function mapRxFormSubmitOptions<TModel>(
  options: RxFormSubmitOptions<TModel, unknown>,
): FormSubmitOptions<TModel, unknown> {
  if (!options.destroyRef) {
    assertInInjectionContext(mapRxFormSubmitOptions);
  }

  const { action, destroyRef = inject(DestroyRef), ...otherOptions } = options;

  return {
    action: (form, detail) =>
      firstValueFrom(action(form, detail).pipe(takeUntilDestroyed(destroyRef)), {
        defaultValue: undefined,
      }),
    ...otherOptions,
  };
}
