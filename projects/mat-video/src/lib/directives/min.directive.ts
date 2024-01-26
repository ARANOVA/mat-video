import { Directive, Input } from '@angular/core'
import { NG_VALIDATORS, Validator, AbstractControl, Validators, ValidationErrors } from '@angular/forms'

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: 'input[min]',
  providers: [{ provide: NG_VALIDATORS, useExisting: MinDirective, multi: true }]
})
export class MinDirective implements Validator {

  @Input() min: number;

  validate(control: AbstractControl): ValidationErrors | null {
    return Validators.min(this.min)(control)
  }

}