# angular-rx-submit

## What is this library and why?

This library provides the function `rxSubmit()`, on Observable-based equivalent of the official Angular Promise-based `submit()`. Why?

- cancellation
- simple function
- consistency

## Requirements

- Angular version >= 21.2.0 [^1]
- RxJS version >= 7.4.0 [^2]

> [!NOTE]
> Angular versions 21.0 and 21.1 are not supported, as this library requires a new `submit()` feature introduced in version 21.2.

> [!NOTE]
> RxJS version 6 is not supported.

## Getting started

- `npm install angular-rx-submit`

## Injection context

One advantage of `rxSubmit()` is automatic cancellation (if the user leaves the page). But for that to work, like many other Angular functions (`takeUntilDestroyed()`, `toSignal()`...), it requires an injection context. `rxSubmit()` follows the same pattern as those other similar Angular functions, with 2 options:

- provide an `Injector`

```ts
@Component({
  template: ` <form (submit)="save()"></form> `,
})
export class EditPage {
  private readonly injector = inject(Injector); // here

  private readonly formModel = signal({ username: '' });
  protected readonly form = form(this.formModel);

  protected save(): void {
    rxSubmit(this.form, (submittedForm) => someObservable(submittedForm().value()), {
      injector: this.injector, // here
    }).subscribe();
  }
}
```

- use `rxSubmit()` inside an injection context (field initializer, constructor...)

```ts
@Component({
  template: ` <form (submit)="save()"></form> `,
})
export class EditPage {
  private readonly formModel = signal({ username: '' });
  protected readonly form = form(this.formModel);

  private readonly submitObservable = rxSubmit(this.form, (submittedForm) =>
    someObservable(submittedForm().value()),
  );

  protected save(): void {
    submitObservable.subscribe();
  }
}
```

## Subscription

This is not specific to `rxSubmit()`, but as for any Observable, subscribing is mandatory:

```ts
// Nothing happens
rxSubmit(this.form, () => (submittedForm) => someObservable(submittedForm().value()), {
  injector: this.injector,
});

// Triggers submission
rxSubmit(this.form, () => (submittedForm) => someObservable(submittedForm().value()), {
  injector: this.injector,
}).subscribe();
```

## Errors

As for any Observable, handling errors is recommended. If the Observable you provide throws, the error will be propagated by `rxSubmit()`. The most common case is the HTTP request failing.

```ts
rxSubmit(this.form, () => (submittedForm) => someObservable(submittedForm().value()), {
  injector: this.injector,
}).subscribe({
  next: (success) => {
    if (success) {
      // Manage success
    }
  },
  error: (error: unknown) => {
    // Manage error
    if (error instanceof HttpErrorResponse && error.status === 500) {
      console.log(`Display service unavailable`);
    } else {
      console.log(`Display unexpected error`);
    }
  },
});
```

## Validation result

As for the official Angular `submit()`, the Observable you provide to `rxSubmit()` should return an official `TreeValidationResult`. It is similar to Validators in previous reactive forms, meaning returning either:

- `null`, `undefined` or `void` if there is no validation error
- a `ValidationError.WithOptionalFieldTree` if there is a validation error
- one array of `ValidationError.WithOptionalFieldTree` if there are multiple validations errors

```ts
interface ApiResponse {
  readonly success: boolean;
  readonly error?: { message: string };
}

export function mapApiResponseToTreeValidationResult(response: ApiResponse): TreeValidationResult {
  return response.success
    ? null
    : {
        kind: 'apiError',
        message: response.error?.message,
      };
}
```

## Actions after validation

Let us imagine a classic scenario: if the form passes validation, we want to redirect to another page. The question is: where to do the redirection?

It is not specific to `rxSubmit()`, but the official Angular `submit()` can be confusing because there is 2 places where we can do that redirection:

- directly inside the Observable / Promise we provide
- after the `rxSubmit()` / `submit()`, in the `next` / `then()` callback

The `rxSubmit()` / `submit()` purpose is only to manage the form submission progress and validation. So the Observable / Promise we provide should be limited to just that, returning a `TreeValidationResult` as explained above.

Subsequent actions should be done in the `next` / `then()` callback:

```ts
rxSubmit(this.form, () => (submittedForm) => someObservable(submittedForm().value()), {
  injector: this.injector,
}).subscribe({
  next: (success) => {
    if (success) {
      this.router.navigate(['/some/other/page']).catch(() => {});
    }
  },
  error: (error: unknown) => {},
});
```

## Full example

```ts
import { rxSubmit } from 'angular-rx-submit';

interface EditModel {
  username: string;
}

interface ApiResponse {
  readonly success: boolean;
  readonly error?: { message: string };
}

export function mapApiResponseToTreeValidationResult(response: ApiResponse): TreeValidationResult {
  return response.success
    ? null
    : {
        kind: 'apiError',
        message: response.error?.message,
      };
}

@Injectable({
  providedIn: 'root',
})
export class Api {
  private readonly httpClient = inject(HttpClient);

  save(body: EditModel): Observable<ApiResponse> {
    return this.httpClient.post<ApiResponse>('/api/save', body);
  }
}

@Component({
  template: `
    <form (submit)="save()">
      <label>
        Username
        <input type="text" [formField]="form.username" />
      </label>
      <button type="submit">Save</button>
    </form>
  `,
})
export class EditPage {
  private readonly injector = inject(Injector);
  private readonly httpApi = inject(HttpApi);
  private readonly router = inject(router);

  private readonly formModel = signal<EditModel>({
    username: '',
  });
  protected readonly form = form(formModel);

  protected save(): void {
    rxSubmit(
      this.form,
      (submittedForm) =>
        this.httpApi.save(submittedForm().value()).pipe(map(mapApiResponseToTreeValidationResult)),
      {
        injector: this.injector,
      },
    ).subscribe({
      next: (success) => {
        if (success) {
          this.router.navigate(['/some/page']).catch(() => {});
        }
      },
      error: (error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 500) {
          console.log(`Display service unavailable`);
        } else {
          console.log(`Display unexpected error`);
        }
      },
    });
  }
}
```
