import { Directive, Input } from '@angular/core'
import { NG_VALIDATORS, Validator, AbstractControl, Validators, ValidationErrors } from '@angular/forms'

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: 'input[max]',
  providers: [{ provide: NG_VALIDATORS, useExisting: MaxDirective, multi: true }]
})
export class MaxDirective implements Validator {

  @Input() max: number;

  validate(control: AbstractControl): ValidationErrors | null {
    return Validators.max(this.max)(control)
  }

}