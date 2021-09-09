//mat-input-commified.directive.ts
import { Directive, ElementRef, forwardRef, HostListener, Input, OnDestroy } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MAT_INPUT_VALUE_ACCESSOR } from '@angular/material/input';


/**
 * Left pad a string
 *
 * @param {string} n string or number to pad
 * @param {number} width length to pad
 * @param {string} z fill character
 * @returns string
 */
const pad = (n: any, width: number = 2, z: string = '0'): string => {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

const countDecimals = (value) => {
  if (Math.floor(value) === value) {
    return 0;
  }
  return value.toString().split('.')[1].length || 0;
}

const roundFn = (number, increment, offset) => {
  const dec = 10 ** countDecimals(increment);
  return (Math.round(Math.round((number - offset) / increment) * increment * dec) / dec) + offset;
}


@Directive({
  selector: 'input[matInputTimeFormat]',
  providers: [
    {provide: MAT_INPUT_VALUE_ACCESSOR, useExisting: MatInputTimeFormatDirective},
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MatInputTimeFormatDirective),
      multi: true
    }
  ]
})
export class MatInputTimeFormatDirective implements ControlValueAccessor, OnDestroy {

  private _value: string | null;

  locale = 'es';
  decimalMarker: string = ',';

  constructor(
    private elementRef: ElementRef<HTMLInputElement>,
  ) {
    // console.log('created directive');
  }

  ngOnDestroy(): void {
  }

  get value(): string | null {
    return this._value;
  }

  private formatValue(value: string | null | any) {
    // console.log("FORMAT value", value)
    if (value !== null) {
      const time = Math.floor(parseFloat(value));
      value = value.toString().replace(/,/g, '.');
      const aux = value.split('.');
      let remainder = Math.floor(Math.round(parseFloat(aux.length > 1 ? pad(aux[1]) : '0') * 100) / 100);
      // console.log("remainder", parseFloat(value), parseFloat(aux.length > 1 ? pad(aux[1]) : '0') * 100, remainder);
      // Round remainder
      const minutes = Math.floor(time / 60);
      const seconds = time - minutes * 60;
      let first = `${minutes}:${pad(seconds)}`;
      this.elementRef.nativeElement.value = first + "." + pad(remainder * 25 / 100);
    } else {
      this.elementRef.nativeElement.value = '0.00';
    }
  }

  private unFormatValue() {
    const value = this.elementRef.nativeElement.value;
    // console.log("value0", value)
    const aux = value.split(':');
    const aux2 = aux[1].split('.');
    const value2 = parseInt(aux[0]) * 60 + parseInt(aux2[0]) + parseInt(aux2[1])/25;
    this._value = (roundFn(value2, 1 / 25, 0)).toString().replace(/\./g, ',');

    // console.log("value1", this._value)
    if (value) {
      this.elementRef.nativeElement.value = this._value;
    } else {
      this.elementRef.nativeElement.value = '';
    }
  }

  /**
   * @param value
   * apply formatting on value assignment
   */
  writeValue(value: any) {
    this._value = value;
    // console.log("SET VALUE", this._value)
    this.formatValue(this._value);
  }

  registerOnChange(fn: (value: any) => void) {
    this._onChange = fn;
  }

  registerOnTouched() {}

  isLastCharacterDecimalSeparator(value: any) {
    return isNaN(value[value.length - 1]);
  }


  @HostListener('input', ['$event.target.value'])
  onInput(value) {
    // console.log("INPUT", value);
    //return;
    //Find all numerics, decimal marker(, or .) and -
    //It will delete thousandSeparator cos it's always opposite to decimal marker
    const regExp = new RegExp(`[^\\d[\.|.]-]`, 'g');
    //Separate value on before and after decimal marker
    let decimalMarker = ',';
    if (value.indexOf('.') > -1) {
      decimalMarker = '.'
    }
    const [integer, decimal] = value.replace(regExp, '').split(decimalMarker);

    //Send non localized value, with dot as decimalMarker to API
    this._value = decimal ? integer.concat(',', decimal) : integer;

    // If decimal separator is last character don't update
    // because it will delete . || ,
    if (this.isLastCharacterDecimalSeparator(value)) {
      this._value = value;
    }

    // console.log("this._value", this._value)


    // here to notify Angular Validators
    this._onChange(this._value);
  }

  _onChange(value: any): void {
  }

  @HostListener('blur')
  _onBlur() {
    this.formatValue(this._value); // add commas
  }

  @HostListener('focus')
  onFocus() {
    this.unFormatValue(); // remove commas for editing purpose
  }


}