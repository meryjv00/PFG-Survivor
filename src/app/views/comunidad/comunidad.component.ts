import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'src/app/services/auth.service';
import { ChatService } from 'src/app/services/chat.service';
import { FriendsService } from 'src/app/services/friends.service';

@Component({
  selector: 'app-comunidad',
  templateUrl: './comunidad.component.html',
  styleUrls: ['./comunidad.component.scss']
})
export class ComunidadComponent implements OnInit {

  constructor(public friendService: FriendsService,
    public chat: ChatService,
    public auth: AuthService,
    public toastr: ToastrService) {

    this.friendService.resetSearchFriends();
    // Has recargado... cargar de nuevo amigos y mensajes asociados, peticiones de amistad
    if (this.auth.loginRecharge) {
      this.auth.setRechargeFalse();
      this.chat.getFriends(false);
      this.chat.closeChat();
      this.friendService.listenFriendsRequests();
      this.friendService.listenSentFriendsRequests();
    }
  }

  ngOnInit(): void {}

  ngAfterViewInit() {
    document.getElementById('buscarAmigoAgregar')
      .addEventListener('change', this.updateValue.bind(this));
  }


  updateValue(e) {
    this.friendService.searchFriends(e.target.value);
  }

}
