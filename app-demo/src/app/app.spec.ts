import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from './app';
import type { ApiResponse } from './http-api';

describe('App', () => {
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClientTesting()],
    }).compileComponents();

    httpTesting = TestBed.inject(HttpTestingController);
  });

  it('should display success', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const nativeElement = fixture.nativeElement as HTMLElement;
    nativeElement.querySelector('button')?.click();

    const req = httpTesting.expectOne({
      method: 'POST',
      url: '/api/save',
    });
    const response: ApiResponse = {
      success: true,
    };
    req.flush(response);
    await fixture.whenStable();

    const message = nativeElement.querySelector('p')?.textContent;
    expect(message).toBe(`Success!`);
  });

  it('should display validation error', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const nativeElement = fixture.nativeElement as HTMLElement;
    nativeElement.querySelector('button')?.click();

    const req = httpTesting.expectOne({
      method: 'POST',
      url: '/api/save',
    });
    const response: ApiResponse = {
      success: false,
      error: {
        message: 'User name already taken',
      },
    };
    req.flush(response);
    await fixture.whenStable();

    const message = nativeElement.querySelector('li')?.textContent;
    expect(message).toBe(`User name already taken`);
  });

  it('should display global error', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const nativeElement = fixture.nativeElement as HTMLElement;
    nativeElement.querySelector('button')?.click();

    const req = httpTesting.expectOne({
      method: 'POST',
      url: '/api/save',
    });

    req.error(new ProgressEvent('error'));
    await fixture.whenStable();

    const message = nativeElement.querySelector('p')?.textContent;
    expect(message).toBe(`Unexpected network error`);
  });
});
