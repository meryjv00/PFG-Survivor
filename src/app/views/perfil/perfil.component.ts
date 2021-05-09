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

    // Has recargado... cargar de nuevo amigos y mensajes asociados, peticiones de amistad
    if (this.auth.loginRecharge) {
      this.rankings.getPositionRankings();
      this.rankings.getPositionRankingCoins();
      this.auth.setRechargeFalse();
      this.auth.listenDataLogedUser();
      this.chat.getFriends(false);
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
      .then(ok => {
        alert('Email modificado')
        this.enableDisableUpdateEmail(2);
        this.email.reset();
      })
      .catch(error => {        
        if (error.code === 'auth/requires-recent-login') {
          this.msg = 'Debes relogearte para poder cambiar el email.';
        }else if(error.code === 'auth/email-already-in-use') {
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
      .then(ok => {
        alert('Contraseña modificada');
        this.enableDisableUpdatePass(2);
        this.pass.reset();
      })
      .catch(error => {
        console.log(error);

      });
  }


  /**
   * Activar o desactivar cambiar nombre
   * @param type 1: Activar | 2: Desactivar
   */
  enableDisableUpdateName(type: number) {
    if (type == 1) {
      this.enabledName = true;
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
    } else {
      this.enabledPass = false;
      this.msg = '';
    }
  }

}
