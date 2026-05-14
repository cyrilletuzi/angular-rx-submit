import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-other-page',
  imports: [],
  template: `<p>other-page works!</p>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OtherPage {}
