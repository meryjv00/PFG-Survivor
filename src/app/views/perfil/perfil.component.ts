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
    public chat: ChatService,
    public friends: FriendsService) {
      
    this.friends.resetSearchFriends();
    // Has recargado... cargar de nuevo amigos y mensajes asociados, peticiones de amistad
    if (this.chat.friends.length == 0) {
      console.log('RECARGO PAGINAAAAAAAAAAAAAAAA');
      this.friends.listenFriendsRequests();
      this.friends.listenSentFriendsRequests();
      this.chat.getFriends(false);
    }
  }

  ngOnInit(): void { }

  ngAfterViewInit() {
    document.getElementById('buscarAmigoAgregar')
      .addEventListener('change', this.updateValue.bind(this));
  }

  saveImg(url: any) {
    this.perfilService.uploadImgBD(url)
      .then(success => {
        this.toastr.success('Foto actualizada con éxito', 'Foto')
      })
  }

  updateValue(e) {
    this.friendService.searchFriends(e.target.value);
  }


}
