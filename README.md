# angular-rx-submit

## Examples

```ts
import { rxSubmit } from 'angular-rx-submit';

interface EditModel {
  username: string;
}

interface ApiResponse {
  success: boolean;
  error?: { message: string };
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
