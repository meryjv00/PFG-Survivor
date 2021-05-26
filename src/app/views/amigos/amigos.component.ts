import { Component, OnInit, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { ChatService } from 'src/app/services/chat.service';
import { FriendsService } from 'src/app/services/friends.service';
import { RankingsService } from 'src/app/services/rankings.service';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal.component';
import { UserComponent } from '../user/user.component';

@Component({
  selector: 'app-amigos',
  templateUrl: './amigos.component.html',
  styleUrls: ['./amigos.component.scss']
})
export class AmigosComponent implements OnInit {
  chatFriends: FormGroup;
  @ViewChild('scrollMe') private myScrollContainer: ElementRef;
  disableScrollDown = false;
  urlImg = '';
  filtroAmigo = '';
  // En esucha si se envian nuevos mensajes para que el scroll baje automáticamente
  @Output() onComplete = new EventEmitter();
  countdownEndRef: Subscription = null;

  constructor(public chat: ChatService,
    private formBuilder: FormBuilder,
    public auth: AuthService,
    public friends: FriendsService,
    public rankings: RankingsService,
    public ngmodal: NgbModal) {

    this.chatFriends = this.formBuilder.group({
      text: ['', [Validators.required]],
    });

    // Has recargado... cargar de nuevo amigos y mensajes asociados, peticiones de amistad
    if (this.auth.loginRecharge) {
      this.auth.getUser();
      this.rankings.getPositionRankings();
      this.rankings.getPositionRankingCoins();
      this.auth.setRechargeFalse();
      this.auth.getItemsUser(1);
      this.chat.getFriends();
      this.chat.closeChat();
      this.friends.listenFriendsRequests();
      this.friends.listenSentFriendsRequests();
    }

  }

  get formChat() { return this.chatFriends.controls; }

  ngOnInit(): void {
    this.countdownEndRef = this.chat.countdownEnd$.subscribe(() => {
      this.onComplete.emit();
      this.disableScrollDown = false;
    });
  }

  ngOnDestroy() {
    this.chat.urlImgsChat = [];
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  onScroll() {
    let element = this.myScrollContainer.nativeElement
    let atBottom = element.scrollHeight - element.scrollTop === element.clientHeight
    if (this.disableScrollDown && atBottom) {
      this.disableScrollDown = false
    } else {
      this.disableScrollDown = true
    }
  }

  scrollToBottom(): void {
    if (this.disableScrollDown) {
      return
    }
    try {
      this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
    } catch (err) { }
  }

  onSubmit() {
    if (this.chatFriends.invalid) {
      return;
    }
    this.chat.sendMessageFriend();
  }

  openFileSelection() {
    document.getElementById('file').click();
  }

  chatWith(friend) {
    this.disableScrollDown = false;
    this.chat.chatWith(friend);
  }

  enableScollDown() {
    this.disableScrollDown = false;
  }

  saveImgModal(urlImg: string) {
    this.urlImg = urlImg;
  }

  openProfileUser(user: any) {
    this.chat.getImagenesChat();
/*     this.chat.getImagenesChat().then(() => {
      const modalRef = this.ngmodal.open(UserComponent, { size: 'lg' });
      modalRef.componentInstance.user = user;
      modalRef.componentInstance.addUser = 'see';
      modalRef.componentInstance.msgs = this.chat.messagesWithFriend.length;
    }); */
   
  }

  openConfirmModal() {
    const modalRef = this.ngmodal.open(ConfirmModalComponent, { size: 'xs' });
    modalRef.componentInstance.msg = `¿Quieres borrar también el contenido multimedia compartido con ${this.chat.friendSelected.displayName} ?`;
    modalRef.componentInstance["confirm"].subscribe((event: any) => {
      this.chat.deleteChat(event);
    });
  }


}
