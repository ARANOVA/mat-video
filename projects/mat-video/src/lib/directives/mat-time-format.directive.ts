//mat-input-commified.directive.ts
import { Directive, ElementRef, forwardRef, HostListener, Input, OnDestroy } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MAT_INPUT_VALUE_ACCESSOR } from '@angular/material/input';

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

  locale = 'en';
  decimalMarker: string;

  constructor(
    private elementRef: ElementRef<HTMLInputElement>,
  ) {
    console.log('created directive');
  }
  ngOnDestroy(): void {
  }


  get value(): string | null {
    return this._value;
  }

  @Input('value')
  set value(value: string | null) {
    this._value = value;
    this.formatValue(value);
  }

  private formatValue(value: string | null | any) {
    console.log("value", value)
    if (value !== null) {
      var remainder = parseFloat(value) - Math.floor(Math.round(parseFloat(value)*100)/100);
      remainder = Math.round(remainder*100) / 100;
      this.elementRef.nativeElement.value = Math.floor(parseFloat(value)) + ":" + remainder * 25;
    } else {
      this.elementRef.nativeElement.value = '';
    }
  }

  private unFormatValue() {
    const value = this.elementRef.nativeElement.value;
    const aux = value.split(':');
    this._value = (parseInt(aux[0]) + parseInt(aux[1])/25).toString();
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
    //Find all numerics, decimal marker(, or .) and -
    //It will delete thousandSeparator cos it's always opposite to decimal marker
    const regExp = new RegExp(`[^\\d${this.decimalMarker}-]`, 'g');
    //Separate value on before and after decimal marker
    const [integer, decimal] = value.replace(regExp, '').split(this.decimalMarker);

    //Send non localized value, with dot as decimalMarker to API
    this._value = decimal ? integer.concat('.', decimal) : integer;

    // If decimal separator is last character don't update
    // because it will delete . || ,
    if (this.isLastCharacterDecimalSeparator(value)) {
      this._value = value;
    }

    // here to notify Angular Validators
    this._onChange(this._value);
  }

  _onChange(value: any): void {}

  @HostListener('blur')
  _onBlur() {
    this.formatValue(this._value); // add commas
  }

  @HostListener('focus')
  onFocus() {
    this.unFormatValue(); // remove commas for editing purpose
  }


}