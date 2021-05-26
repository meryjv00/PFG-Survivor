import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { ChatService } from 'src/app/services/chat.service';
import { FriendsService } from 'src/app/services/friends.service';
import { RankingsService } from 'src/app/services/rankings.service';
import { ShopService } from 'src/app/services/shop.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-tienda',
  templateUrl: './tienda.component.html',
  styleUrls: ['./tienda.component.scss']
})
export class TiendaComponent implements OnInit {
  userAuth: any | null;

  constructor(public auth: AuthService,
    public friendService: FriendsService,
    public chat: ChatService,
    public shop: ShopService,
    public rankings: RankingsService) {

    this.getUser();
    this.shop.getItems();

    if (this.auth.loginRecharge && this.userAuth != null) {
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

  ngOnInit(): void {}

  getUser() {
    this.userAuth = localStorage.getItem(environment.SESSION_KEY_USER_AUTH);
    this.userAuth = JSON.parse(this.userAuth);
  }

  /**
   * Comprar item
   * @param item 
   */
  buyItem(item: any) {
    var canBuy;
    canBuy = this.shop.checkItem(item);
    if (canBuy) {
      // Confirmación comprar
      this.shop.buyItem(item);
    } else {
      alert('No tienes suficientes monedas para comprar este arma');
    }
  }
}
