import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'src/app/services/auth.service';

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
    public toastr: ToastrService) {

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
      .catch(error => {
        // console.log("Error al logear con email: ", error.code);
        if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
          this.toastr.error('Email o contraseña incorrectos', 'Error login')
        }
      });
  }

}
