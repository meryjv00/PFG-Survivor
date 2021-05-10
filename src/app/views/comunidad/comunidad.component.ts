import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'src/app/services/auth.service';
import { ChatService } from 'src/app/services/chat.service';
import { FriendsService } from 'src/app/services/friends.service';
import { RankingsService } from 'src/app/services/rankings.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-comunidad',
  templateUrl: './comunidad.component.html',
  styleUrls: ['./comunidad.component.scss']
})
export class ComunidadComponent implements OnInit {
  palabraBuscar: string = '';

  constructor(public friendService: FriendsService,
    public chat: ChatService,
    public auth: AuthService,
    public toastr: ToastrService,
    public rankings: RankingsService) {
      
    // Has recargado... cargar de nuevo amigos y mensajes asociados, peticiones de amistad
    if (this.auth.loginRecharge) {
      this.auth.setRechargeFalse();
      this.rankings.getPositionRankings();
      this.rankings.getPositionRankingCoins();
      this.auth.listenDataLogedUser();
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
    this.palabraBuscar = e.target.value;
    this.friendService.searchFriends(e.target.value);
  }

}
