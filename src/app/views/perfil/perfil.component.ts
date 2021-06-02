import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'src/app/services/auth.service';
import { ChatService } from 'src/app/services/chat.service';
import { FriendsService } from 'src/app/services/friends.service';
import { PerfilService } from 'src/app/services/perfil.service';
import { RankingsService } from 'src/app/services/rankings.service';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss']
})
export class PerfilComponent implements OnInit {
  msg: string = null;
  name: FormGroup;
  email: FormGroup;
  pass: FormGroup;
  enabledName: boolean = false;
  enabledEmail: boolean = false;
  enabledPass: boolean = false;
  hide1 = true;
  hide2 = true;

  constructor(public auth: AuthService,
    public perfilService: PerfilService,
    public toastr: ToastrService,
    public chat: ChatService,
    public friendService: FriendsService,
    private formBuilder: FormBuilder,
    private rankings: RankingsService) {

    this.name = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(3)]]
    });

    this.email = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.pass = this.formBuilder.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required, Validators.pattern]]
    });

    this.auth.getProviderID();

    // Has recargado... cargar de nuevo amigos y mensajes asociados, peticiones de amistad
    if (this.auth.loginRecharge) {
      this.rankings.getPositionRankings();
      this.rankings.getPositionRankingCoins();
      this.auth.setRechargeFalse();
      this.auth.getUser();
      this.auth.getItemsUser(1);
      this.chat.getFriends();
      this.chat.closeChat();
      this.friendService.listenFriendsRequests();
      this.friendService.listenSentFriendsRequests();
    }
  }

  ngOnInit(): void {
  }

  get formName() { return this.name.controls; }
  get formEmail() { return this.email.controls; }
  get formPass() { return this.pass.controls; }

  /**
   * Submit formulario cambiar nombre
   * @returns 
   */
  updateName() {
    if (this.name.invalid) {
      return;
    }
    this.enableDisableUpdateName(2);
    this.perfilService.updateDisplayName(this.name.value.name);
    this.name.reset();
  }

  /**
   * Submit formulario cambiar email
   * @returns 
   */
  updateEmail() {
    if (this.email.invalid) {
      return;
    }
    this.perfilService.updateEmail(this.email.value.email)
    .subscribe(
      (response) => {
        console.log('RESPONSE', response);
        this.toastr.success(`Correo electrónico actualizado`);
        this.auth.setEmail(this.email.value.email);
        this.enableDisableUpdateEmail(2);
        this.email.reset();
      },
      (error) => {
        var code = error['error']['message'].code;
        if (code === 'auth/requires-recent-login') {
          this.msg = 'Debes relogearte para poder cambiar el email.';
        } else if (code === 'auth/email-already-in-use') {
          this.msg = 'El email introducido ya está registrado';
        }
      });
  }

  /**
   * Submit formulario cambiar contraseña
   * @returns 
   */
  updatePass() {
    if (this.pass.invalid) {
      return;
    }

    this.perfilService.updatePass(this.pass.value.password)
    .subscribe(
      (response) => {
        console.log('RESPONSE', response);
        this.toastr.success(`Contraseña actualizada`);
        this.enableDisableUpdatePass(2);
        this.pass.reset();
      },
      (error) => {
        console.log('Ha ocurrido un error actualizando la contraseña', error);      
      });
  }


  /**
   * Activar o desactivar cambiar nombre
   * @param type 1: Activar | 2: Desactivar
   */
  enableDisableUpdateName(type: number) {
    if (type == 1) {
      this.enabledName = true;
      this.enabledPass = false;
      this.enabledEmail = false;
    } else {
      this.enabledName = false;
    }
  }

  /**
   * Activar o desactivar cambiar email
   * @param type 1: Activar | 2: Desactivar
   */
  enableDisableUpdateEmail(type: number) {
    if (type == 1) {
      this.enabledEmail = true;
      this.enabledPass = false;
      this.enabledName = false;
    } else {
      this.enabledEmail = false;
      this.msg = '';
    }
  }

  /**
   * Activar o desactivar cambiar contraseña
   * @param type 1: Activar | 2: Desactivar
   */
  enableDisableUpdatePass(type: number) {
    if (type == 1) {
      this.enabledPass = true;
      this.enabledEmail = false;
      this.enabledName = false;
    } else {
      this.enabledPass = false;
      this.msg = '';
    }
  }

  openFileSelection() {
    document.getElementById('file').click();
  }
}
