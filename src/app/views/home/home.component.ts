import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { ChatService } from 'src/app/services/chat.service';
import { FriendsService } from 'src/app/services/friends.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  userAuth: any | null;

  constructor(public auth: AuthService,
    public friendService: FriendsService,
    public chat: ChatService) {
      
    this.getUser();
    console.log('CONSTRUCTOR HOME');
     if (this.auth.loginRecharge && this.userAuth != null) {
      this.chat.closeChat();
    } 

  }

  ngOnInit(): void { }
  ngAfterViewChecked() { }
  ngOnDestroy() { }

  getUser() {
    this.userAuth = localStorage.getItem(environment.SESSION_KEY_USER_AUTH);
    this.userAuth = JSON.parse(this.userAuth);
  }
  
}
