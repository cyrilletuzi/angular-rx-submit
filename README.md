# angular-rx-submit

## What is this library and why?

This library provides the function `rxSubmit()`, on Observable-based equivalent of the official Angular Promise-based `submit()`. Why?

- cancellation
- consistency
- simple function

## Requirements

- Angular version >= 21.2.0 [^1]
- RxJS version >= 7.4.0 [^2]

> [!NOTE]
> Angular versions 21.0 and 21.1 are _not_ supported, as this library requires a new `submit()` feature introduced in version 21.2.

> [!NOTE]
> RxJS version 6 is _not_ supported.

## Getting started

- `npm install angular-rx-submit`

## Injection context

One advantage of `rxSubmit()` is automatic cancellation (if the user leaves the page).

But for that to work, like many other Angular functions (`takeUntilDestroyed()`, `toSignal()`...), **it requires an injection context**. `rxSubmit()` follows the same pattern as those other similar Angular functions, with 2 options:

- **provide an `Injector`**

```ts
@Component({
  template: ` <form (submit)="save()"></form> `,
})
export class EditPage {
  private readonly injector = inject(Injector); // ⬅️

  private readonly formModel = signal({ username: '' });
  protected readonly form = form(this.formModel);

  protected save(): void {
    rxSubmit(this.form, {
      action: (submittedForm) => someObservable(submittedForm().value()),
      injector: this.injector, // ⬅️
    }).subscribe();
  }
}
```

- or use `rxSubmit()` inside an [injection context](https://angular.dev/guide/di/dependency-injection-context) (field initializer, constructor...)

```ts
@Component({
  template: ` <form (submit)="save()"></form> `,
})
export class EditPage {
  private readonly formModel = signal({ username: '' });
  protected readonly form = form(this.formModel);

  private readonly submitObservable = rxSubmit(this.form, {
    action: (submittedForm) => someObservable(submittedForm().value()),
  });

  protected save(): void {
    submitObservable.subscribe();
  }
}
```

**Using `rxSubmit()` outside an injection context and without providing an injector will throw the [`NG0203` error](https://angular.dev/errors/NG0203).**

## Subscription

You do _not_ need to unsubscribe, `rxSubmit()` does it for you via the injection context (see above).

But **you _DO_ need to subscribe**, even if you do not have something specific to do after submission (because it is how all `Observable`s work).

```ts
// ❌ Nothing happens
rxSubmit(this.form, () => {
  action: (submittedForm) => someObservable(submittedForm().value()),
  injector: this.injector,
});

// ✅ Triggers submission
rxSubmit(this.form, {
  action: (submittedForm) => someObservable(submittedForm().value()),
  injector: this.injector,
}).subscribe();
```

## Errors

As for any Observable, handling errors is recommended. If the Observable you provide throws, the error will be propagated by `rxSubmit()`. The most common case is the HTTP request failing.

```ts
rxSubmit(this.form, {
  action: () => (submittedForm) => someObservable(submittedForm().value()),
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
        message: response.error?.message,
      };
}
```

## Actions after validation

Let us imagine a classic scenario: if the form passes validation, we want to redirect to another page. The question is: where to do the redirection?

It is not specific to `rxSubmit()`, but the official Angular `submit()` can be confusing because there is 2 places where we could do that redirection:

- directly inside the Observable / Promise we provide
- after the `rxSubmit()` / `submit()`, in the `next` / `then()` callback

The `rxSubmit()` / `submit()` purpose is only to manage the form submission progress and validation. So the Observable / Promise we provide should be limited to just that, returning a `TreeValidationResult` as explained above.

Subsequent actions should be done in the `next` / `then()` callback:

```ts
rxSubmit(this.form, {
  action: () => (submittedForm) => someObservable(submittedForm().value()),
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

### Multiple submissions

As the official `submit()`, do not trigger `rxSubmit()` in parallel, to avoid race issues. So be sure to block submission when one is already in progress:

```ts
@Component({
  template: `<form (submit)="save()">
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
  template: `<form (submit)="save()"></form>`,
})
export class EditPage {
  private readonly router = inject(Router);

  private readonly formModel = signal({ username: '' });
  protected readonly form = form(this.formModel);

  protected save(): void {
    submit(this.form, {
      action: async (submittedForm) => await somePromise(submittedForm().value()),
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

Where `somePromise()` implies a HTTP request to the server. Let us say the request takes 10 seconds. Now the scenario:

- the user submits the form
- as it is taking too long, the user leaves the page by going to another one
- the user starts interacting with this other page
- after a few seconds, when the HTTP request succeed and without notice, the user will be redirected to `/some/other/page`

In addition to a bad user experience (UX), it can also provokes technical issues, like keeping useless things in memory or accessing to component-related things that have been destroyed in the meantime.

With `rxSubmit()`, all the process will be automatically cancelled if the user leaves the page.

### Consistency

Nearly everytime, submitting a form implies a HTTP request. `HttpClient`, the official way to do HTTP requests in Angular, is still Observable-based (and for good reasons, like cancellation explained above).

A given project should be consistent, and having similar actions sometimes Observable-based, and some other times Promise-based, is not consistent.

### Simple function

Even if you are OK to sacrifice consistency, you can transform your Observable to a Promise, but doing so in the `submit()` scenario is not as trivial as it seems:

```ts
@Component({
  template: `<form (submit)="save()"></form>`,
})
export class EditPage {
  private readonly destroyRef = inject(DestroyRef);

  private readonly formModel = signal({ username: '' });
  protected readonly form = form(this.formModel);

  protected save(): void {
    from(
      submit(
        this.form, {
          action: async (submittedForm) =>
          await firstValueFrom(
            someObservable(submittedForm().value()).pipe(takeUntilDestroyed(this.destroyRef)),
            {
              defaultValue: undefined,
            },
          ),
      }),
    ).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (success) => {
        if (success) {
          this.router.navigate(['/some/other/page']).catch(() => {});
        }
      },
      error: (error: unknown) {
        console.log('Display an error snack bar/toast');
      },
    });
  }
}
```

As you can see:

- there is not just 1 but 2 Promise to transform
- there is thus 2 cancellation to manage
- if the first `takeUntilDestroyed()` happens, the Observable will be empty, and it makes `firstValueFrom()` throws an error, which would trigger the last error callcack and thus display the snack bar/toast; this is why `defaultValue` must be set

It complexifies things a lot, and should be repeated in each form. `rxSubmit()` is a simple function which does it for you.

## Why not in Angular directly?

I personnally think `rxSubmit()` should be part of `@angular/rxjs-interop`.

For now, the Angular team has discarded [this request](https://github.com/angular/angular/issues/65199) (from someone else), without even allowing proper discussion about it.

Feel free to advocate for it if you want.

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
    rxSubmit(this.form, {
      action: (submittedForm) =>
        this.httpApi.save(submittedForm().value()).pipe(map(mapApiResponseToTreeValidationResult)),
      injector: this.injector,
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
