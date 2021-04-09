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

  }

  onSubmit() {
    if (this.chatFriends.invalid) {
      return;
    }

    // this.chat.sendMessage();
    this.chat.sendMessageFriend();
  }


}
