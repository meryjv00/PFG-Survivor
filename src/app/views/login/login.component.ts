import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'src/app/services/auth.service';
import { RegistroComponent } from '../registro/registro.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  // Variables
  login: FormGroup;
  submitted = false;
  hide = true;

  constructor(private formBuilder: FormBuilder,
    public auth: AuthService,
    public toastr: ToastrService,
    public ngmodal: NgbModal,
    public activeModal: NgbActiveModal) {

    this.login = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
  }

  get formLogin() { return this.login.controls; }

  /**
   * Login con email y contraseña
   * @returns 
   */
  onSubmit() {
    this.submitted = true;
    if (this.login.invalid) {
      return;
    }

    this.auth.login()
      .then(user => {
        this.activeModal.close();
      })
      .catch(error => {
        console.log("Error al logear con email: ", error.code);
        if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
          this.toastr.error('Email o contraseña incorrectos', 'Error login')
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
   * Cierra modal login y abre modal registro
   */
  openRegistro() {
    this.activeModal.close();
    this.ngmodal.open(RegistroComponent, { size: 'lg', backdrop: 'static' });
  }

}
