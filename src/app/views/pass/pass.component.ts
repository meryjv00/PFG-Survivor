import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from 'src/app/services/auth.service';
import { LoginComponent } from '../login/login.component';

@Component({
  selector: 'app-pass',
  templateUrl: './pass.component.html',
  styleUrls: ['./pass.component.scss']
})
export class PassComponent implements OnInit {
  passOlvidada: FormGroup;
  msg: string = null;
  
  constructor(public ngmodal: NgbModal,
    public activeModal: NgbActiveModal,
    private formBuilder: FormBuilder,
    public auth: AuthService) {

    this.passOlvidada = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
  }

  get formPassOlvidada() { return this.passOlvidada.controls; }

  onSubmit() {
    if (this.passOlvidada.invalid) {
      return;
    }

    this.auth.sendPasswordResetEmail()
    .subscribe(
      (response) => {
        console.log('Correo enviado:', response['message']);
        this.auth.emailPass = '';
        this.activeModal.close();
        const modalRef = this.ngmodal.open(LoginComponent, { size: 'md' });
        modalRef.componentInstance.msgPassword = 'Se ha enviado un mensaje al correo electrónico para restablecer la contraseña.';
      },
      (error) => {
        var code = error['error']['message'].code;
        if (code === 'auth/too-many-requests') {
          this.msg = 'Hemos bloqueado todas las solicitudes de este dispositivo debido a una actividad inusual. Vuelve a intentarlo más tarde.'
        }else if(code === 'auth/user-not-found'){
          this.msg = 'No hay ningún usuario registrado con el correo electrónico solicitado.';
        }
      });
  }

  /**
   * Cierra modal contraseña olvidada y abre modal Login
   */
  backLogin(){
    this.activeModal.close();
    this.ngmodal.open(LoginComponent, { size: 'md' });
  }

}
