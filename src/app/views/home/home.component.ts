import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { ChatService } from 'src/app/services/chat.service';
import { FriendsService } from 'src/app/services/friends.service';
import { environment } from 'src/environments/environment';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  userAuth: any | null;
  cargar: boolean = false;

  constructor(public auth: AuthService,
    public friendService: FriendsService,
    public chat: ChatService,
    private _sanitizer: DomSanitizer) {

    this.getUser();
    console.log('CONSTRUCTOR HOME');
    if (this.auth.loginRecharge && this.userAuth != null) {
      this.chat.closeChat();
      this.auth.listenDataLogedUser();
    }

  }

  ngOnInit(): void { }
  ngAfterViewChecked() { }
  ngOnDestroy() { }

  getUser() {
    this.userAuth = localStorage.getItem(environment.SESSION_KEY_USER_AUTH);
    this.userAuth = JSON.parse(this.userAuth);
  }

  getVideoIframe(url) {
    var video, results;

    if (url === null) {
      return '';
    }
    results = url.match('[\\?&]v=([^&#]*)');
    video = (results === null) ? url : results[1];
    
    return this._sanitizer.bypassSecurityTrustResourceUrl('https://www.youtube.com/embed/' + video);

  }


}
