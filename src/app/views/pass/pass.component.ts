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
    .then(ok => {
      this.activeModal.close();
      const modalRef = this.ngmodal.open(LoginComponent, { size: 'lg' });
      modalRef.componentInstance.msgPassword = 'Se ha enviado un mensaje al correo electrónico para restablecer la contraseña.';
    })
    .catch(error => {
      console.log('Ha ocurrido un error al enviar el correo', error);
      
      if (error.code === 'auth/too-many-requests') {
        this.msg = 'Hemos bloqueado todas las solicitudes de este dispositivo debido a una actividad inusual. Vuelve a intentarlo más tarde.'
      }else if(error.code === 'auth/user-not-found'){
        this.msg = 'No hay ningún usuario registrado con el correo electrónico solicitado.';
      }
    });
  }

  /**
   * Cierra modal contraseña olvidada y abre modal Login
   */
  backLogin(){
    this.activeModal.close();
    this.ngmodal.open(LoginComponent, { size: 'lg' });
  }

}
