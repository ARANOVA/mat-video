import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-test-form',
  templateUrl: './test-form.component.html',
  styleUrls: ['./test-form.component.scss']
})
export class TestFormComponent implements OnInit {

  @Input() editing = null;
  typeOptions: any[];
  playTypeOptions: any[];
  shotTypeOptions: any[];
  catchTypeOptions: any[];
  dribbleTypeOptions: any[];
  shotEndingOptions: any[];


  /**
   * The form
   */
  @Input() form!: FormGroup;
  /**
   * Form group name
   */
  @Input() formName!: string;
  /**
   * True if the fields are read only (not editables)
   */
  @Input() disabled = false;

  /**
   * If the focus is in any input field
   */
  @Input() inputFocus = false;

  /**
   * Emitted when a fcus event
   */
  @Output() focused = new EventEmitter<boolean>();

  /**
   * Emitted when the form is submitted
   */
  @Output() submited = new EventEmitter<boolean>();

  /**
   * Emitted when the current form is changed
   */
  @Output() changedForm = new EventEmitter<string>();

  public errors = [];

  constructor() {
    console.log(this.form)
  }

  ngOnInit(): void {
    // do something interesting
  }


  selectTypeByKey($event: any): void {
    // do something interesting
  }

  updatePlayerList(): void {
    // do something interesting
  }

  /**
   * Update enable/disable control programatically
   */
  updateControlsStatus() {
    // do something interesting
  }


  public changeForm(value: string): void {
    this.changedForm.emit(value);
  }

  public focus(value: boolean): void {
    this.focused.emit(value);
  }

  public submit(): void {
    this.submited.emit();
  }
}
