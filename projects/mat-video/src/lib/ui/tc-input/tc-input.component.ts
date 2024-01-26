import { FocusMonitor } from '@angular/cdk/a11y';
import { BooleanInput, coerceBooleanProperty } from '@angular/cdk/coercion';
import {
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  OnDestroy,
  Optional,
  Output,
  Self,
  ViewChild,
  forwardRef,
  HostBinding
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormBuilder,
  FormGroup,
  NgControl,
  Validators,
  NG_VALUE_ACCESSOR
} from '@angular/forms';

import { MAT_FORM_FIELD, MatFormField, MatFormFieldControl } from '@angular/material/form-field';
import { Subject } from 'rxjs';

/** Data structure for holding telephone number. */
export class TcInterface {
  constructor(
    public mm: string,
    public ss: string
  ) { }
}

const pad = (n: number, width = 2, z = '0'): string => {
  z = z || '0';
  const n1 = n + '';
  return n1.length >= width ? n1 : new Array(width - n1.length + 1).join(z) + n1;
}

type OnChange = (a: number) => void;
type OnTouched = () => void;

/** Custom `MatFormFieldControl` for telephone number input. */
@Component({
  selector: 'app-tc-input',
  templateUrl: 'tc-input.component.html',
  styleUrls: ['tc-input.component.scss'],
  providers: [
    { provide: MatFormFieldControl, useExisting: TcInputComponent },
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TcInputComponent),
      multi: true
    }
  ]
})
export class TcInputComponent
  implements ControlValueAccessor, MatFormFieldControl<number>, OnDestroy {
  
  focused = false;
  
  static nextId = 0;

  @HostBinding('id') id = `tc-input-${TcInputComponent.nextId++}`;
  @HostBinding('class.input-floating') shouldLabelFloat = this.focused || !this.empty;

  @ViewChild('mm') mmInput: HTMLInputElement;
  @ViewChild('ss') ssInput: HTMLInputElement;

  parts: FormGroup;
  stateChanges = new Subject<void>();
  touched = false;
  controlType = 'tc-input';
  onChange: OnChange;
  onTouched: OnTouched;

  get empty() {
    if (!this.parts) return true;
    const {
      value: { mm, ss }
    } = this.parts;

    return !mm && !ss;
  }

  @Input('aria-describedby') userAriaDescribedBy: string;

  @Output() focus = new EventEmitter<boolean>();

  @Output() blur = new EventEmitter<boolean>();

  @Input()
  get placeholder(): string {
    return this._placeholder;
  }
  set placeholder(value: string) {
    this._placeholder = value;
    this.stateChanges.next();
  }
  private _placeholder: string;

  @Input()
  get required(): boolean {
    return this._required;
  }
  set required(value: boolean) {
    this._required = coerceBooleanProperty(value);
    this.stateChanges.next();
  }
  private _required = false;

  @Input()
  get disabled(): boolean {
    return this._disabled;
  }
  set disabled(value: boolean) {
    this._disabled = coerceBooleanProperty(value);
    this._disabled ? this.parts.disable() : this.parts.enable();
    this.stateChanges.next();
  }
  private _disabled = false;

  @Input()
  get value(): null | number {
    if (this.parts.valid) {
      const {
        value: { mm, ss }
      } = this.parts;
      return parseInt(mm) * 60 + parseInt(ss);
    }
    return null;
  }

  set value(tc: null | number) {
    let aux = new TcInterface('', '');
    if (typeof tc === 'number') {
      const secs = Math.round(<number>tc);
      aux = new TcInterface(
        pad(Math.floor(secs / 60), 2, '0'),
        pad(secs % 60)
      );
    }
    const { mm, ss } = aux;
    this.parts.setValue({ mm, ss });
    this.stateChanges.next();
  }

  get errorState(): boolean {
    return this.parts.invalid && this.touched;
  }

  constructor(
    formBuilder: FormBuilder,
    private _focusMonitor: FocusMonitor,
    private _elementRef: ElementRef<HTMLElement>,
    @Optional() @Inject(MAT_FORM_FIELD) public _formField: MatFormField,
    @Optional() @Self() public ngControl: NgControl) {

    this.parts = formBuilder.group({
      mm: [
        null,
        [Validators.required, Validators.minLength(1), Validators.maxLength(4)]
      ],
      ss: [
        null,
        [Validators.required, Validators.minLength(2), Validators.maxLength(2)]
      ]
    });

    if (this.ngControl != null) {
      this.ngControl.valueAccessor = this;
    }
  }

  ngOnDestroy() {
    this.stateChanges.complete();
    this._focusMonitor.stopMonitoring(this._elementRef);
  }

  onFocusIn(event: FocusEvent) {
    if (!this.focused) {
      this.focused = true;
      this.stateChanges.next();

      this.focus.emit(true);
    }
  }

  onFocusOut(event: FocusEvent) {
    if (!this._elementRef.nativeElement.contains(event.relatedTarget as Element)) {
      this.touched = true;
      this.focused = false;
      if (this.onTouched) {
        this.onTouched();
      }
      this.stateChanges.next();
      this.blur.emit(true);
    }
  }

  autoFocusNext(control: AbstractControl, nextElement?: HTMLInputElement): void {
    if (!control.errors && nextElement) {
      this._focusMonitor.focusVia(nextElement, 'program');
      nextElement.select();
    }
  }

  autoFocusPrev(control: AbstractControl, prevElement: HTMLInputElement): void {
    if (control.value.length < 1) {
      this._focusMonitor.focusVia(prevElement, 'program');
      prevElement.select();
    }
  }

  setDescribedByIds(ids: string[]) {
    const controlElement = this._elementRef.nativeElement
      .querySelector('.tc-input-container')!;
    controlElement.setAttribute('aria-describedby', ids.join(' '));
  }

  onContainerClick($event) {
    if ($event?.target && $event.target.select) {
      $event.target.select();
    }
    /*
    if (this.parts.controls.mm.valid) {
      this._focusMonitor.focusVia(this.ssInput, 'program');
    } else {
      this._focusMonitor.focusVia(this.mmInput, 'program');
    }*/
  }

  writeValue(tc: TcInterface | null | any): void {
    this.value = tc;
  }

  registerOnChange(fn: OnChange): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: OnTouched): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  _handleInput(control: AbstractControl, nextElement?: HTMLInputElement): void {
    // this.autoFocusNext(control, nextElement);
    console.log(control, nextElement);
    if (this.onChange) {
      this.onChange(this.value);
    }
  }

  static ngAcceptInputType_disabled: BooleanInput;
  static ngAcceptInputType_required: BooleanInput;
}