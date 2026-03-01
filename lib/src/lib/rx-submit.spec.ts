/* eslint-disable @typescript-eslint/prefer-promise-reject-errors */
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { form, type TreeValidationResult } from '@angular/forms/signals';
import { asyncScheduler, delay, Observable, of, scheduled, throwError } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { rxSubmit } from './rx-submit';

describe('rxSubmit ', () => {
  describe('with explicit DestroyRef', () => {
    @Component({
      template: '',
    })
    class TestComponent {
      readonly destroyRef = inject(DestroyRef);
      private readonly formModel = signal({
        test: '',
      });
      readonly form = form(this.formModel);
    }

    let componentFixture: ComponentFixture<TestComponent>;
    let componentInstance: TestComponent;
    let destroyRef: DestroyRef;

    beforeEach(() => {
      componentFixture = TestBed.createComponent(TestComponent);
      componentInstance = componentFixture.componentInstance;
      destroyRef = componentInstance.destroyRef;
    });

    it('should succeed when returning undefined', () =>
      new Promise((resolve, reject) => {
        let success: boolean;

        const observable: Observable<TreeValidationResult> = scheduled(
          of(undefined),
          asyncScheduler,
        );

        rxSubmit(componentInstance.form, {
          action: () => observable,
          destroyRef,
        }).subscribe({
          next: (result) => {
            success = result;
          },
          error: () => {
            reject();
          },
          complete: () => {
            expect(success).toBe(true);
            expect(componentInstance.form().valid()).toBe(true);
            expect(componentInstance.form().invalid()).toBe(false);

            resolve(undefined);
          },
        });
      }));

    it('should succeed when returning null', () =>
      new Promise((resolve, reject) => {
        let success: boolean;

        const observable: Observable<TreeValidationResult> = scheduled(of(null), asyncScheduler);

        rxSubmit(componentInstance.form, { action: () => observable, destroyRef }).subscribe({
          next: (result) => {
            success = result;
          },
          error: () => {
            reject();
          },
          complete: () => {
            expect(success).toBe(true);
            expect(componentInstance.form().valid()).toBe(true);
            expect(componentInstance.form().invalid()).toBe(false);

            resolve(undefined);
          },
        });
      }));

    it('should be invalid when returning one validation error', () =>
      new Promise((resolve, reject) => {
        let success: boolean;

        const treeValidationResult: TreeValidationResult = {
          kind: 'apiError',
        };
        const observable: Observable<TreeValidationResult> = scheduled(
          of(treeValidationResult),
          asyncScheduler,
        );

        rxSubmit(componentInstance.form, { action: () => observable, destroyRef }).subscribe({
          next: (result) => {
            success = result;
          },
          error: () => {
            reject();
          },
          complete: () => {
            expect(success).toBe(false);
            expect(componentInstance.form().valid()).toBe(false);
            expect(componentInstance.form().invalid()).toBe(true);
            expect(componentInstance.form().errors()[0]).toEqual(treeValidationResult);

            resolve(undefined);
          },
        });
      }));

    it('should be invalid when returning multiple validation errors', () =>
      new Promise((resolve, reject) => {
        let success: boolean;

        const error1: TreeValidationResult = {
          kind: 'apiError1',
        };
        const error2: TreeValidationResult = {
          kind: 'apiError2',
        };
        const treeValidationResult: TreeValidationResult = [error1, error2];
        const observable: Observable<TreeValidationResult> = scheduled(
          of(treeValidationResult),
          asyncScheduler,
        );

        rxSubmit(componentInstance.form, { action: () => observable, destroyRef }).subscribe({
          next: (result) => {
            success = result;
          },
          error: () => {
            reject();
          },
          complete: () => {
            expect(success).toBe(false);
            expect(componentInstance.form().valid()).toBe(false);
            expect(componentInstance.form().invalid()).toBe(true);
            expect(componentInstance.form().errors()[0]).toEqual(error1);
            expect(componentInstance.form().errors()[1]).toEqual(error2);

            resolve(undefined);
          },
        });
      }));

    it('should throw when the observable fails', () =>
      new Promise((resolve, reject) => {
        const errorMessage = 'Obserable error';
        const observable: Observable<TreeValidationResult> = scheduled(
          throwError(() => new Error(errorMessage)),
          asyncScheduler,
        );

        rxSubmit(componentInstance.form, { action: () => observable, destroyRef }).subscribe({
          next: () => {
            reject();
          },
          error: (error: unknown) => {
            expect(error).toBeInstanceOf(Error);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            expect((error as Error).message).toBe(errorMessage);

            resolve(undefined);
          },
          complete: () => {
            reject();
          },
        });
      }));

    it('should complete when cancelled', () =>
      new Promise((resolve, reject) => {
        const observable: Observable<TreeValidationResult> = of(undefined).pipe(delay(2000));

        rxSubmit(componentInstance.form, { action: () => observable, destroyRef }).subscribe({
          next: () => {
            reject();
          },
          error: () => {
            reject();
          },
          complete: () => {
            expect(destroyRef.destroyed).toBe(true);

            resolve(undefined);
          },
        });

        componentFixture.destroy();
      }));
  });

  describe('inside injection context', () => {
    it('should succeed', () =>
      new Promise((resolve, reject) => {
        let success: boolean;

        @Component({
          template: '',
        })
        class TestComponent {
          private readonly formModel = signal({
            test: '',
          });
          readonly form = form(this.formModel);
          private readonly submitObservable: Observable<boolean>;

          constructor() {
            const observable: Observable<TreeValidationResult> = scheduled(
              of(undefined),
              asyncScheduler,
            );
            this.submitObservable = rxSubmit(this.form, { action: () => observable });
          }

          save(): void {
            this.submitObservable.subscribe({
              next: (result) => {
                success = result;
              },
              error: () => {
                reject();
              },
              complete: () => {
                expect(success).toBe(true);
                expect(this.form().valid()).toBe(true);
                expect(this.form().invalid()).toBe(false);

                resolve(undefined);
              },
            });
          }
        }

        const componentFixture = TestBed.createComponent(TestComponent);
        componentFixture.componentInstance.save();
      }));

    it('should complete when cancelled', () =>
      new Promise((resolve, reject) => {
        @Component({
          template: '',
        })
        class TestComponent {
          private readonly destroyRef = inject(DestroyRef);
          private readonly formModel = signal({
            test: '',
          });
          readonly form = form(this.formModel);
          private readonly submitObservable: Observable<boolean>;

          constructor() {
            const observable: Observable<TreeValidationResult> = of(undefined).pipe(delay(2000));
            this.submitObservable = rxSubmit(this.form, { action: () => observable });
          }

          save(): void {
            this.submitObservable.subscribe({
              next: () => {
                reject();
              },
              error: () => {
                reject();
              },
              complete: () => {
                const destroyed = this.destroyRef.destroyed;
                expect(destroyed).toBe(true);

                resolve(undefined);
              },
            });
          }
        }

        const componentFixture = TestBed.createComponent(TestComponent);
        componentFixture.componentInstance.save();
        componentFixture.destroy();
      }));
  });

  describe('outside injection context', () => {
    it('should throw if outside injection context and no DestroyRef is provided', () => {
      @Component({
        template: '',
      })
      class TestComponent {
        private readonly formModel = signal({
          test: '',
        });
        private readonly form = form(this.formModel);

        save(): void {
          const observable: Observable<TreeValidationResult> = scheduled(
            of(undefined),
            asyncScheduler,
          );
          expect(() => {
            rxSubmit(this.form, { action: () => observable }).subscribe();
          }).toThrowError(/NG0203/);
        }
      }

      const componentFixture = TestBed.createComponent(TestComponent);
      componentFixture.componentInstance.save();
    });
  });
});
