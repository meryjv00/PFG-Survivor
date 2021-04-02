import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'src/app/services/auth.service';
import { LoginComponent } from '../login/login.component';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.scss']
})
export class RegistroComponent implements OnInit {
  // Variables
  registro: FormGroup;
  submitted = false;
  hide = true;
  constructor(private formBuilder: FormBuilder,
    public toastr: ToastrService,
    public auth: AuthService,
    public ngmodal: NgbModal,
    public activeModal: NgbActiveModal) {

    this.registro = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength]]
    });
  }

  ngOnInit(): void {
  }

  get formRegistro() { return this.registro.controls; }

  /**
   * Registro con email y contraseña
   * @returns 
   */
  onSubmit() {
    this.submitted = true;
    if (this.registro.invalid) {
      return;
    }

    this.auth.registro()
      .then(user => {
        this.activeModal.close();
      })
      .catch(error => {
        console.log("Error al registrar con email y pass: ", error.code);
        if (error.code === 'auth/email-already-in-use') {
          this.toastr.error('El correo introducido ya está registrado', 'Error registro')
        }
      });
  }

  /**
   * Login con cuenta de Google
   */
  loginGoogle() {
    this.auth.loginGoogle()
      .then(user => {
        this.activeModal.close();
      })
      .catch(error => {
        console.log("Error al logear con Google: ", error);
      });
  }

  /**
   * Login con cuenta de Facebook
   */
  loginFacebook() {
    this.auth.loginFacebook()
      .then(user => {
        this.activeModal.close();
      })
      .catch(error => {
        console.log("Error al logear con Facebook: ", error.code);
      })
  }

  /**
   * Cierra modal registro y abre modal login
   */
  openLogin() {
    this.activeModal.close();
    this.ngmodal.open(LoginComponent, { size: 'lg', backdrop: 'static' });
  }

}
