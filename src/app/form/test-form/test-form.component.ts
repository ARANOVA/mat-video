import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatInputTimeFormatDirective } from 'projects/mat-video/src/lib/directives/mat-time-format.directive';

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
  @Input() disabled: boolean = false;

  /**
   * If the focus is in any input field
   */
  @Input() inputFocus: boolean = false;

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
  }


  selectTypeByKey($event: any): void {

  }

  updatePlayerList(): void {

  }

  /**
   * Update enable/disable control programatically
   */
  updateControlsStatus() {
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
