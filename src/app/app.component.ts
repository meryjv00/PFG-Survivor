import { Component, EventEmitter, Output } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from './services/auth.service';
import { ChatService } from './services/chat.service';
import { FriendsService } from './services/friends.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'PFG-Survivor';
  userAuth: any | null;

  @Output() onCompleteFriends = new EventEmitter();
  newFriend: Subscription = null;

  constructor(public friendService: FriendsService,
    public chat: ChatService,
    public auth: AuthService,
    public toastr: ToastrService) {
  }

  ngOnInit(): void {
    this.userAuth = localStorage.getItem(environment.SESSION_KEY_USER_AUTH);
    this.userAuth = JSON.parse(this.userAuth);
    // Usuario logeado
    if (this.userAuth != null) {
      console.log('INIT APP');
      
      // Marcar como conectado
      this.chat.setStatusOnOff(1);
      // Subscribe New Friend -> Alert
      this.newFriend = this.friendService.newFriend$.subscribe(() => {
        this.onCompleteFriends.emit();
        this.toastr.success('Ahora ' + this.friendService.newFriendInfo + ' y tú soys amigos');
      });
      // Cierre navegador
      window.addEventListener("unload", event => {
        console.log('CIERRE NAVEGADOR');
        this.chat.setStatusOnOff(2);
        this.chat.closeChat();
      });

    }
  }

}
