import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/services/auth.service';
import { ChatService } from 'src/app/services/chat.service';

@Component({
  selector: 'app-amigos',
  templateUrl: './amigos.component.html',
  styleUrls: ['./amigos.component.scss']
})
export class AmigosComponent implements OnInit {
  chatFriends: FormGroup;

  constructor(public chat: ChatService,
    private formBuilder: FormBuilder,
    public auth: AuthService) {

    // this.chat.getFriends();
    // this.chat.loadMessages();
    this.chat.listenFriendMessages();

    this.chatFriends = this.formBuilder.group({
      text: ['', [Validators.required]],
    });
  }

  get formChat() { return this.chatFriends.controls; }

  ngOnInit(): void {
    
  }

  onSubmit() {
    if (this.chatFriends.invalid) {
      return;
    }

    // this.chat.sendMessage();
    this.chat.sendMessageFriend();
  }

}
