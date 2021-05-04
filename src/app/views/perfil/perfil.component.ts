import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'src/app/services/auth.service';
import { ChatService } from 'src/app/services/chat.service';
import { FriendsService } from 'src/app/services/friends.service';
import { PerfilService } from 'src/app/services/perfil.service';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss']
})
export class PerfilComponent implements OnInit {

  constructor(public auth: AuthService,
    public perfilService: PerfilService,
    public toastr: ToastrService,
    public friendService: FriendsService,
    public chat: ChatService) {
      
    // Has recargado... cargar de nuevo amigos y mensajes asociados, peticiones de amistad
    if (this.auth.loginRecharge) {
      this.auth.setRechargeFalse();
      this.chat.getFriends(false);
      this.chat.closeChat();
      this.friendService.listenFriendsRequests();
      this.friendService.listenSentFriendsRequests();
    }
  }

  ngOnInit(): void { }

 
}
