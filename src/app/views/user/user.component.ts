import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
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

  constructor(
    public ngmodal: NgbModal,
    public activeModal: NgbActiveModal,
    public friendService: FriendsService,
    public chat: ChatService) {
  }

  ngOnInit(): void {}


  deleteFriend(uid: string) {
    this.friendService.deleteFriend(uid);
    this.activeModal.close();
  }

  friendRequest(uid: string, type: number) {
    if (type == 1) {
      this.friendService.acceptFriendRequest(uid);
    } else {
      this.friendService.deleteFriendRequest(uid);
    }
    this.activeModal.close();
  }

  friendRequestSearch(uid: string, type: number) {
    if (type == 1) {
      this.friendService.sendFriendRequest(uid);
    } else {
      this.friendService.cancelFriendRequest(uid);
    }
    this.activeModal.close();
  }
}
