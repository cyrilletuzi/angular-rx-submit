# angular-rx-submit

RxJS interoperability for Angular signal forms, with the `rxSubmit()` function, an Observable-based equivalent of the Promise-based `submit()`. Why?

- cancellation
- consistency
- simplicity

More details about the advantages of `rxSubmit()` are available in the "Problems solved" section below.

## Getting started

### Status

> [!CAUTION]
> Angular signal forms are still marked as expertimental, which means breaking changes can happen at any time; which could break this library too. So this library is marked as experimental too for now.

### Requirements

- Angular version >= 21.2.0
- RxJS version >= 7.4.0

> [!NOTE]
> Angular versions 21.0 and 21.1 are _not_ supported, as this library requires a new `submit()` feature introduced in version 21.2.

> [!NOTE]
> While Angular still allows RxJS version 6, it is _not_ supported by this library.

### Installation

- `npm install angular-rx-submit`

### Usage

```ts
import { rxSubmit } from 'angular-rx-submit';

@Component({
  imports: [FormRoot],
  template: `<form [formRoot]="form" (submit)="save()"></form>`,
})
export class EditPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly formModel = signal({ userName: '' });
  protected readonly form = form(this.formModel);

  protected save(): void {
    rxSubmit(this.form, {
      action: (submittedForm) => someObservableOfTreeValidationResult(submittedForm().value()),
      destroyRef: this.destroyRef,
    }).subscribe({
      next: (success) => {
        if (success) {
          // Manage success here (like redirecting to another page)
        }
      },
      error: (error: unknown) => {
        // Manage error here
      },
    });
  }
}
```

A more complete example is available in the "Full example" section below, and a real-word example is available in the [demo app](./app-demo/src/app/app.ts).

## Common issues

### Injection context

One advantage of `rxSubmit()` is automatic cancellation (if the user leaves the page).

But for that to work, like many other Angular functions (`takeUntilDestroyed()`, `toSignal()`...), **it requires an injection context**. `rxSubmit()` follows the same pattern as those other similar Angular functions, with 2 options:

- **provide a `DestroyRef`**

```ts
@Component({
  imports: [FormRoot],
  template: ` <form [formRoot]="form" (submit)="save()"></form> `,
})
export class EditPage {
  private readonly destroyRef = inject(DestroyRef); // ⬅️
  private readonly formModel = signal({ username: '' });
  protected readonly form = form(this.formModel);

  protected save(): void {
    rxSubmit(this.form, {
      action: (submittedForm) => someObservableOfTreeValidationResult(submittedForm().value()),
      destroyRef: this.destroyRef, // ⬅️
    }).subscribe();
  }
}
```

- or use `rxSubmit()` inside an [injection context](https://angular.dev/guide/di/dependency-injection-context) (field initializer, constructor...)

```ts
@Component({
  imports: [FormRoot],
  template: `<form [formRoot]="form" (submit)="save()"></form>`,
})
export class EditPage {
  private readonly formModel = signal({ username: '' });
  protected readonly form = form(this.formModel);

  private readonly submitObservable = rxSubmit(this.form, {
    action: (submittedForm) => someObservableOfTreeValidationResult(submittedForm().value()),
  });

  protected save(): void {
    submitObservable.subscribe();
  }
}
```

**Using `rxSubmit()` outside an injection context and without providing a `DestroyRef` will throw the [`NG0203` error](https://angular.dev/errors/NG0203).**

### Subscription

Unsubscribing is _not_ needed, `rxSubmit()` already does a `takeUntilDestroyed()` internally via the injection context (see above).

But **subscribing is required**, even if there is nothing something specific to do after submission (because it is how `Observable`s work).

```ts
// ❌ Nothing happens
rxSubmit(this.form, () => {
  action: (submittedForm) => someObservableOfTreeValidationResult(submittedForm().value()),
  destroyRef: this.destroyRef,
});

// ✅ Triggers submission
rxSubmit(this.form, {
  action: (submittedForm) => someObservableOfTreeValidationResult(submittedForm().value()),
  destroyRef: this.destroyRef,
}).subscribe();
```

### Errors

As for any Observable, handling errors is recommended. If the provided Observable throws, the error will be propagated by `rxSubmit()`. The most common case is the HTTP request failing.

```ts
rxSubmit(this.form, {
  action: () => (submittedForm) => someObservableOfTreeValidationResult(submittedForm().value()),
  destroyRef: this.destroyRef,
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

### Validation result

As for the official Angular `submit()`, the Observable provided to `rxSubmit()` should return an official `TreeValidationResult`. It is similar to Validators in previous reactive forms, meaning returning either:

- `null`, `undefined` or `void` if there is no validation error
- a `ValidationError.WithOptionalFieldTree` if there is a validation error
- an array of `ValidationError.WithOptionalFieldTree` if there are multiple validation errors

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
        message: response.error?.message ?? '',
      };
}
```

### Multiple submissions

As with the official `submit()`, do _not_ trigger `rxSubmit()` multiple times in parallel, to avoid race issues. So be sure to block submission when one is already in progress:

```ts
@Component({
  imports: [FormRoot],
  template: `<form [formRoot]="form" (submit)="save()">
    <button type="submit" [disabled]="form().submitting()">Save</button>
  </form>`,
})
export class EditPage {
  private readonly formModel = signal({ username: '' });
  protected readonly form = form(this.formModel);
}
```

## Problems solved

### Cancellation

Let us take a common and basic example with the Promise-based `submit()`:

```ts
@Component({
  imports: [FormRoot],
  template: `<form [formRoot]="form" (submit)="save()"></form>`,
})
export class EditPage {
  private readonly router = inject(Router);

  private readonly formModel = signal({ username: '' });
  protected readonly form = form(this.formModel);

  protected save(): void {
    submit(this.form, {
      action: async (submittedForm) => somePromise(submittedForm().value()),
    })
      .then((success) => {
        if (success) {
          this.router.navigate(['/some/other/page']).catch(() => {});
        }
      })
      .catch(() => {});
  }
}
```

where `somePromise()` implies a HTTP request to the server. Let us say the request takes 10 seconds. Now the scenario:

- the user submits the form
- as it is taking too long, the user leaves the page by going to another one
- the user starts interacting with this other page
- after a few seconds, when the HTTP request succeed and without notice, the user will be redirected to `/some/other/page`

In addition to a bad user experience (UX), it can also provokes technical issues, like keeping useless things in memory or accessing to component-related things that have been destroyed in the meantime.

With `rxSubmit()`, all the process will be automatically cancelled if the user leaves the page.

### Consistency

Nearly everytime, submitting a form implies a HTTP request. `HttpClient`, the official way to do HTTP requests in Angular, is still Observable-based (and for good reasons, like cancellation explained above).

A given project should be consistent, and having similar actions sometimes Observable-based, and some other times Promise-based, is not consistent.

### Simplicity

One could transform an Observable to a Promise, but doing so in the `submit()` scenario is not as trivial as it seems, as it can be seen in the [source code](./lib/src/lib/rx-submit.ts), which shows multiple pitfalls:

- there is not just 1 but 2 Observable <=> Promise transformations
- there is thus 2 cancellation to manage
- if the first `takeUntilDestroyed()` happens, the Observable will be empty, and it makes `firstValueFrom()` throws an error, which would trigger the last error callcack (where things like displaying a snack bar / toast could happen); this is managed by the `defaultValue`

It complexifies things a lot, and should be repeated in each form. `rxSubmit()` is a simple function ready to use.

## Why not in Angular directly?

I personnally think `rxSubmit()` should be part of `@angular/rxjs-interop`.

For now, the Angular team has discarded [this request](https://github.com/angular/angular/issues/65199) (from someone else), without even allowing proper discussion about it.

One can feel free to advocate for it if one want.

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

/**
 * Transforms the API response into a `TreeValidationResult`, which is what is expected by the Angular `submit()`
 */
export function mapApiResponseToTreeValidationResult(response: ApiResponse): TreeValidationResult {
  return response.success
    ? null // `null`, `undefined` or `void` if no error
    : {
        kind: 'apiError',
        message: response.error?.message ?? '',
      }; // a `ValidationError.WithOptionalFieldTree`, or an array of that
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
  imports: [FormRoot],
  template: `
    <form [formRoot]="form" (submit)="save()">
      <label>
        Username
        <input type="text" [formField]="form.username" />
      </label>
      <button type="submit">Save</button>
    </form>
  `,
})
export class EditPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly httpApi = inject(HttpApi);
  private readonly router = inject(Router);

  private readonly formModel = signal<EditModel>({
    username: '',
  });
  protected readonly form = form(formModel);

  protected save(): void {
    rxSubmit(this.form, {
      action: (submittedForm) =>
        // Like the `submit()` action Promise, the Observable must return a `TreeValidationResult`
        this.httpApi.save(submittedForm().value()).pipe(map(mapApiResponseToTreeValidationResult)),
      destroyRef: this.destroyRef,
    }).subscribe({
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

A real-word example is also available in the [demo app](./app-demo/src/app/app.ts).

## mapRxFormSubmitOptions

While not the recommended approach, this library also provides the `mapRxFormSubmitOptions()` function, to achieve the same goal but directly inside the form `submission` configuration.

```ts
@Component({
  imports: [FormRoot],
  template: `<form [formRoot]="form"></form>`,
})
export class EditPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly formModel = signal({ userName: '' });
  protected readonly form = form(this.formModel, {
    submission: mapRxFormSubmitOptions({
      action: (submittedForm) =>
        someObservableOfTreeValidationResult(submittedForm().value()).pipe(
          tap((validationResult) => {
            if (!validationResult) {
              // Manage success here (like redirecting to another page)
            }
          }),
          catchError((error: unknown) => {
            // Manage error here
            return of(undefined);
          }),
        ),
    }),
  });
}
```

One reason I do not recommended this approach is because it is very easy to forget to manage the errors; so do not forget the `catchError()` if going this way.
