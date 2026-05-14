import { type ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { FormPage } from './form-page';
import { OtherPage } from './other-page';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter([
      { path: 'other', component: OtherPage },
      { path: '', component: FormPage },
    ]),
  ],
};
