# angular-rx-submit

RxJS interoperability for Angular signal forms, with the `rxSubmit()` function, an Observable-based equivalent of the Promise-based `submit()`. Why?

- cancellation
- consistency
- simplicity

More details about the advantages of `rxSubmit()` are available in the "Problems solved" section below.

> [!NOTE]
> Find this library useful? I’m open to freelance & full-time opportunities.
> Feel free to reach out on [LinkedIn](https://www.linkedin.com/in/cyrilletuzi/) or [Bluesky](https://bsky.app/profile/cyrilletuzi.com).

## Status

Signal forms are now stable in Angular 22, but this library is still an experiment, in the sense that the feature is stable, but the actual value of publishing it as long-term library is still evaluated.

## Getting started

### Requirements

- Angular version >= 22
- RxJS version >= 7.6.0

> [!NOTE]
> While Angular still allows lower RxJS versions, versions <7.6 are _not_ supported by this library.

### Installation

- `npm install angular-rx-submit`

### Usage

```typescript
import { rxSubmit } from 'angular-rx-submit';

@Component({
  template: `<form [formRoot]="form" (submit)="save()"></form>`,
})
export class EditPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly formModel = signal<User>({ name: '' });
  protected readonly form = form(this.formModel);

  protected save(): void {
    rxSubmit(this.form, {
      action: (submittedForm) => someObservableOfTreeValidationResult(submittedForm().value()),
      destroyRef: this.destroyRef,
    }).subscribe({
      next: (success) => {
        if (success) {
          // Manage success here (for example: redirecting to another page)
        }
      },
      error: (error: unknown) => {
        // Manage error here (for example: displaying service is unavailable)
      },
    });
  }
}
```

A more complete example is available in the "Full example" section below, and a real-word example is available in the [demo app](./app-demo/src/app/app.ts).

## Common issues

### Injection context

One advantage of `rxSubmit()` is automatic cancellation of the post-submit flow (if the user leaves the page).

But for that to work, like many other Angular functions (`takeUntilDestroyed()`, `toSignal()`...), **it requires an injection context**. `rxSubmit()` follows the same pattern as those other similar Angular functions, with 2 options:

- **provide a `DestroyRef`**

```typescript
@Component({
  template: `<form [formRoot]="form" (submit)="save()"></form>`,
})
export class EditPage {
  private readonly destroyRef = inject(DestroyRef); // ⬅️
  private readonly formModel = signal<User>({ name: '' });
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

```typescript
@Component({
  template: `<form [formRoot]="form" (submit)="save()"></form>`,
})
export class EditPage {
  private readonly formModel = signal<User>({ name: '' });
  protected readonly form = form(this.formModel);

  private readonly submitObservable = rxSubmit(this.form, {
    action: (submittedForm) => someObservableOfTreeValidationResult(submittedForm().value()),
  });

  protected save(): void {
    this.submitObservable.subscribe();
  }
}
```

**Using `rxSubmit()` outside an injection context and without providing a `DestroyRef` will throw the [`NG0203` error](https://angular.dev/errors/NG0203).**

> [!TIP]
> You can use [angular-eslint-injection-context](https://github.com/cyrilletuzi/angular-eslint-injection-context) to enforce that with the following configuration:

```json
{
  "rules": {
    "angular-eslint-injection-context/custom-function-in-injection-context": ["error", {
      "functions": [{
        "name": "rxSubmit",
        "argumentPosition": 1,
        "argumentPropertyName": "destroyRef"
      }]
    }]
  }
}
```

### Subscription

Unsubscribing is _not_ needed, `rxSubmit()` already does a `takeUntilDestroyed()` internally via the injection context (see above).

But **subscribing is required**, even if there is nothing something specific to do after submission (because it is how `Observable`s work).

```typescript
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

```typescript
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

```typescript
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

```typescript
@Component({
  template: `<form novalidate (submit)="save($event)">
    <button type="submit" [disabled]="form().submitting()">Save</button>
  </form>`,
})
export class EditPage {
  private readonly formModel = signal<User>({ name: '' });
  protected readonly form = form(this.formModel);
}
```

## Problems solved

### Cancellation

Let us take a common and basic example with the Promise-based `submit()`:

```typescript
@Component({
  template: `<form [formRoot]="form" (submit)="save()"></form>`,
})
export class EditPage {
  private readonly router = inject(Router);

  private readonly formModel = signal<User>({ name: '' });
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

With `rxSubmit()`, the process post-submit will be automatically cancelled if the user leaves the page.

> [!IMPORTANT]
> The `rxSubmit()` observable is automatically cancelled, but _not_ the `action` observable. Indeed, nearly all the times, the `action` when submitting a form is a POST HTTP request (or more generally a mutation operation), and it is not a good practice to automatically cancel such operations. So be sure to respect where things belong:
> - in the `action`: only the mutation operation and its transformation to a `TreeValidationResult`
> - in `rxSubmit().subscribe()`: the UI changes that should happen only if the user is still on the page

### Consistency

Nearly everytime, submitting a form implies a HTTP request. `HttpClient`, the official way to do HTTP requests in Angular, is still Observable-based (and for good reasons, like cancellation explained above).

A given project should be consistent, and having similar actions sometimes Observable-based, and some other times Promise-based, is not consistent.

### Simplicity

One could transform an Observable to a Promise, but doing so in the `submit()` scenario is not as trivial as it seems, as it can be seen in the [source code](./lib/src/lib/rx-submit.ts), which shows multiple pitfalls:

- there is not just 1 but 2 Observable <=> Promise transformations
- there is a cancellation to manage, but only where it is relevant

It complexifies things, and should be repeated in each form. `rxSubmit()` is a simple function ready to use.

## Why not in Angular directly?

I personnally think `rxSubmit()` should be part of `@angular/core/rxjs-interop`.

It is discueed in [this request](https://github.com/angular/angular/issues/67827).

## Full example

```typescript
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

@Service()
export class Api {
  private readonly httpClient = inject(HttpClient);

  save(body: EditModel): Observable<ApiResponse> {
    return this.httpClient.post<ApiResponse>('/api/save', body);
  }
}

@Component({
  template: `
    <form [formRoot]="form" (submit)="save()">
      <label>
        Username
        <input type="text" [formField]="form.name" />
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
          // Manage success here (for example: redirecting to another page)
          this.router.navigate(['/some/other/page']).catch(() => {});
        }
      },
      error: (error: unknown) => {
        // Manage error here (for example: displaying service is unavailable)
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
