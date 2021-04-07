import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from 'src/app/services/auth.service';
import { RegistroComponent } from '../registro/registro.component';
import { ToastrService } from 'ngx-toastr';
import { PassComponent } from '../pass/pass.component';
import { ChatService } from 'src/app/services/chat.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  // Variables
  login: FormGroup;
  hide = true;
  msg: string = null;
  @Input() public msgPassword: any;

  constructor(private formBuilder: FormBuilder,
    public auth: AuthService,
    public ngmodal: NgbModal,
    public activeModal: NgbActiveModal,
    public toastr: ToastrService,
    public chat: ChatService) {

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
    if (this.login.invalid) {
      return;
    }

    this.auth.login()
      .then(user => {        
        console.log('Entro componente login');
        this.toastr.success(this.auth.authUser.displayName, 'Bienvenido/a!');
        this.activeModal.close();
        // this.chat.listenFriendMessages();
      })
      .catch(error => {
        console.log("Error al logear con email: ", error.code);
        if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
          this.msg = 'No se ha podido iniciar sesión. Revise sus credenciales.';
        }else if (error.code === 'auth/too-many-requests'){
          this.msg = 'El acceso a esta cuenta se ha desactivado temporalmente debido a muchos intentos fallidos de inicio de sesión. \
          Intentalo más tarde o restaura tu contraseña.';
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
   * Cierra modal login y abre modal registro
   */
  openRegistro() {
    this.activeModal.close();
    this.ngmodal.open(RegistroComponent, { size: 'lg' });
  }

  /**
   * Cierra modal login y abre modal contraseña olvidada
   */
  openPassOlvidada() {
    this.activeModal.close();
    this.ngmodal.open(PassComponent, { size: 'lg' });
  }

}
