import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-confirm-modal',
  templateUrl: './confirm-modal.component.html',
  styleUrls: ['./confirm-modal.component.scss']
})
export class ConfirmModalComponent implements OnInit {
  @Input() public msg: any;
  @Output() confirm: EventEmitter<any> = new EventEmitter();

  constructor(public ngmodal: NgbModal,
    public activeModal: NgbActiveModal) {
  }

  ngOnInit(): void {

  }

  accept() {
    const del = document.getElementById("deleteAll") as HTMLInputElement;
    this.confirm.emit(del.checked);
    this.activeModal.close();
  }


  cancel() {
    this.activeModal.close();
  }

}
