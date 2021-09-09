import { Directive, Input, forwardRef } from '@angular/core'
import { NG_VALIDATORS, Validator, AbstractControl, Validators } from '@angular/forms'

@Directive({
  selector: 'input[max]',
  providers: [{ provide: NG_VALIDATORS, useExisting: MaxDirective, multi: true }]
})
export class MaxDirective implements Validator {

  @Input() max: number;

  validate(control: AbstractControl): { [key: string]: any } {

    return Validators.max(this.max)(control)

    // or you can write your own validation e.g.
    // return control.value < this.min ? { min:{ invalid: true, actual: control.value }} : null



  }

}