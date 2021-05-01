import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { ChatService } from 'src/app/services/chat.service';
import { FriendsService } from 'src/app/services/friends.service';
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
    public chat: ChatService) {

    this.getUser();
    if (this.auth.loginRecharge && this.userAuth != null) {
      this.auth.setRechargeFalse();
      this.chat.getFriends(false);
      this.chat.closeChat();
      this.friendService.listenFriendsRequests();
      this.friendService.listenSentFriendsRequests();
    }
  }

  ngOnInit(): void {
  }

  getUser() {
    this.userAuth = localStorage.getItem(environment.SESSION_KEY_USER_AUTH);
    this.userAuth = JSON.parse(this.userAuth);
  }

}
