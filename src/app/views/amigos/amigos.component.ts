import { Component, OnInit, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { ChatService } from 'src/app/services/chat.service';

@Component({
  selector: 'app-amigos',
  templateUrl: './amigos.component.html',
  styleUrls: ['./amigos.component.scss']
})
export class AmigosComponent implements OnInit {
  chatFriends: FormGroup;
  @ViewChild('scrollMe') private myScrollContainer: ElementRef;
  disableScrollDown = false
  urlImg = '';
  filtroAmigo = '';

  @Output() onComplete = new EventEmitter();
  countdownEndRef: Subscription = null;

  constructor(public chat: ChatService,
    private formBuilder: FormBuilder,
    public auth: AuthService) {

    this.chatFriends = this.formBuilder.group({
      text: ['', [Validators.required]],
    });

    // Has recargado... cargar de nuevo amigos y mensajes asociados
    if (this.chat.friends.length == 0) {
      this.chat.getFriends(false);
    }
  }

  get formChat() { return this.chatFriends.controls; }

  ngOnInit(): void {
    this.countdownEndRef = this.chat.countdownEnd$.subscribe(()=>{
      this.onComplete.emit();
      this.disableScrollDown = false;
    })
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

  saveImgModal (urlImg: string){
    this.urlImg = urlImg;
  }
}
