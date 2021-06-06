import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { ChatService } from 'src/app/services/chat.service';
import { FriendsService } from 'src/app/services/friends.service';
import { PerfilService } from 'src/app/services/perfil.service';
import { RankingsService } from 'src/app/services/rankings.service';
import { environment } from 'src/environments/environment';
@Component({
  selector: 'app-rankings',
  templateUrl: './rankings.component.html',
  styleUrls: ['./rankings.component.scss']
})
export class RankingsComponent implements OnInit {
  userAuth: any | null;
  rankingMonedas: boolean = true;
  stats: number = 0;
  ranking: any;

  constructor(public auth: AuthService,
    public perfilService: PerfilService,
    public friendService: FriendsService,
    public chat: ChatService,
    public rankings: RankingsService) {

    this.getUser();

    if (this.rankings.getRankings == true) {
      this.rankings.setGetRankingsFalse();
      this.rankings.getRankingCoins();
      this.rankings.getRankingsLevels();
    }

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

  ngOnInit(): void { }

  getUser() {
    this.userAuth = localStorage.getItem(environment.SESSION_KEY_USER_AUTH);
    this.userAuth = JSON.parse(this.userAuth);
  }



  onChange(value: any) {
    if (value == 0) {
      this.rankingMonedas = true;
    } else {
      this.rankingMonedas = false;
    }

    this.rankings.lvlRankings.forEach(ranking => {
      if (value == ranking.Nivel) {
        this.ranking = ranking;
      }
    });
  }

  onChangeStats(value: any) {
    if (value == 0) {
      this.stats = 0;
    } else if (value == 1) {
      this.stats = 1;
    } else {
      this.stats = 2;
    }
  }

}