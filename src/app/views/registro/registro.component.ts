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
  hide1 = true;
  hide2 = true;
  msg: string = null;

  constructor(private formBuilder: FormBuilder,
    public auth: AuthService,
    public ngmodal: NgbModal,
    public activeModal: NgbActiveModal,
    public toastr: ToastrService) {

    this.registro = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required, Validators.pattern]]
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
    if (this.registro.invalid) {
      return;
    }

    this.auth.registro()
      .then(user => {
        this.auth.updateProfile()
          .then(ok => {
            this.toastr.success(this.auth.authUser.displayName, 'Bienvenido/a!');
            this.activeModal.close();
          })
      })
      .catch(error => {
        console.log("Error al registrar con email y pass: ", error.code);
        if (error.code === 'auth/email-already-in-use') {
          this.msg = 'El correo electrónico introducido ya está registrado.'
        }
      });
  }

  /**
   * Login con cuenta de Google
   */
  loginGoogle() {
    this.auth.loginGoogle()
      .then(user => {
        this.toastr.success(this.auth.authUser.displayName, 'Bienvenido/a!');
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
        this.toastr.success(this.auth.authUser.displayName, 'Bienvenido/a!');
        this.activeModal.close();
      })
      .catch(error => {
        console.log("Error al logear con Facebook: ", error.code);

        if (error.code === 'auth/account-exists-with-different-credential') {
          this.msg = 'Ya existe una cuenta con esta dirección de correo electrónico pero con diferentes credenciales de inicio de sesión. \
          Intenta iniciar sesión mediante correo electrónico o Google.';
        }
      })
  }

  /**
   * Cierra modal registro y abre modal login
   */
  openLogin() {
    this.activeModal.close();
    this.ngmodal.open(LoginComponent, { size: 'lg' });
  }


}

