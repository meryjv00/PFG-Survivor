import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { LoginComponent } from '../views/login/login.component';
import { RegistroComponent } from '../views/registro/registro.component';
import { ChatService } from '../services/chat.service';
import { FriendsService } from '../services/friends.service';
import { UserComponent } from '../views/user/user.component';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {
  pathLogo: string = '../../../assets/imgs/logo.png';

  constructor(public auth: AuthService,
    public ngmodal: NgbModal,
    public friendService: FriendsService,
    public chat: ChatService) {

  }

  ngOnInit(): void {
  }

  openLogin() {
    this.ngmodal.open(LoginComponent, { size: 'md' });
  }

  openRegistro() {
    this.ngmodal.open(RegistroComponent, { size: 'md' });
  }

  openProfileUser(user: any) {
    this.auth.getItemsUser(2, user.uid);
    const modalRef = this.ngmodal.open(UserComponent, { size: 'lg' });
    modalRef.componentInstance.user = user;
    modalRef.componentInstance.addUser = 'add';
  }
}
