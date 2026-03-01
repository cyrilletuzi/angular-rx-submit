import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { form, submit, type TreeValidationResult } from '@angular/forms/signals';
import { asyncScheduler, Observable, of, scheduled } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { rxAction } from './rx-action';

describe('rxFormSubmitOptions', () => {
  @Component({
    template: '',
  })
  class TestComponent {
    observable!: Observable<TreeValidationResult>;
    form = form(
      signal({
        test: '',
      }),
      {
        submission: {
          action: rxAction(() => this.observable),
        },
      },
    );
  }
  let componentInstance: TestComponent;

  beforeEach(() => {
    const componentFixture = TestBed.createComponent(TestComponent);
    componentInstance = componentFixture.componentInstance;
  });

  it('should succeed when returning undefined', async () => {
    componentInstance.observable = scheduled(of(undefined), asyncScheduler);
    await submit(componentInstance.form);

    expect(componentInstance.form().valid()).toBe(true);
    expect(componentInstance.form().invalid()).toBe(false);
  });

  it('should succeed when returning null', async () => {
    componentInstance.observable = scheduled(of(null), asyncScheduler);
    await submit(componentInstance.form);

    expect(componentInstance.form().valid()).toBe(true);
    expect(componentInstance.form().invalid()).toBe(false);
  });

  it('should be invalid when returning one validation error', async () => {
    const treeValidationResult: TreeValidationResult = {
      kind: 'apiError',
    };
    componentInstance.observable = scheduled(of(treeValidationResult), asyncScheduler);
    await submit(componentInstance.form);

    expect(componentInstance.form().valid()).toBe(false);
    expect(componentInstance.form().invalid()).toBe(true);
    expect(componentInstance.form().errors()[0]).toEqual(treeValidationResult);
  });

  it('should be invalid when returning multiple validation errors', async () => {
    const error1: TreeValidationResult = {
      kind: 'apiError1',
    };
    const error2: TreeValidationResult = {
      kind: 'apiError2',
    };
    const treeValidationResult: TreeValidationResult = [error1, error2];
    componentInstance.observable = scheduled(of(treeValidationResult), asyncScheduler);
    await submit(componentInstance.form);

    expect(componentInstance.form().valid()).toBe(false);
    expect(componentInstance.form().invalid()).toBe(true);
    expect(componentInstance.form().errors()[0]).toEqual(error1);
    expect(componentInstance.form().errors()[1]).toEqual(error2);
  });
});
