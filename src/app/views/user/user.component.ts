import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from 'src/app/services/auth.service';
import { ChatService } from 'src/app/services/chat.service';
import { FriendsService } from 'src/app/services/friends.service';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss']
})
export class UserComponent implements OnInit {
  @Input() public user: any;
  @Input() public addUser: string;
  @Input() public msgs: string;
  profile: boolean = true;

  constructor(
    public ngmodal: NgbModal,
    public activeModal: NgbActiveModal,
    public friendService: FriendsService,
    public chat: ChatService,
    public auth: AuthService) {
  }

  ngOnInit(): void { }

  /**
   * Eliminar amigo
   * @param uid 
   */
  deleteFriend(uid: string) {
    this.friendService.deleteFriend(uid);
    this.activeModal.close();
  }

  /**
   * Gestión peticiones de amistad
   * @param uid 
   * @param type 
   * 1: aceptar solicitud de amistad, 
   * 2: denegar solicitud de amistad,
   * 3: enviar solicitud de amistad,
   * 4: cancelar envio solicitud de amistad
   */
  friendRequest(uid: string, type: number) {
    if (type == 1) {
      this.friendService.acceptFriendRequest(uid);
    } else if (type == 2) {
      this.friendService.deleteFriendRequest(uid);
    } else if (type == 3) {
      this.friendService.sendFriendRequest(uid);
    } else if (type == 4) {
      this.friendService.cancelFriendRequest(uid);
    }
    this.activeModal.close();
  }

  seePhotos() {
    this.profile = false;
  }

  seeProfile() {
    this.profile = true;
  }

}
