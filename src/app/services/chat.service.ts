import { Injectable } from '@angular/core';
import firebase from 'firebase/app';
import 'firebase/firestore';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  messages = [];
  msgEnviar = '';
  constructor(public auth: AuthService) { }

  sendMessage() {
    var db = firebase.firestore();

    db.collection("messages").add({
      name: this.auth.authUser.displayName,
      text: this.msgEnviar,
      photoURL: this.auth.authUser.photoURL,
      timestamp: firebase.firestore.Timestamp.now(),
      // firebase.firestore.FieldValue.serverTimestamp()
    })
      .then(ok => {
        this.msgEnviar = '';
      })
      .catch(function (error) {
        console.error('Error writing new message to database', error);
      });
  }

  loadMessages() {
    this.messages = [];
    var query = firebase.firestore()
      .collection('messages')
      .orderBy('timestamp', 'asc')
    // .limit(12);

    query.onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'removed') {
          // deleteMessage(change.doc.id);
        } else {
          // Crear hora
          var hora = '';
          hora += change.doc.data().timestamp.toDate().getHours() + ':' + 
          change.doc.data().timestamp.toDate().getMinutes() + ':' + 
          change.doc.data().timestamp.toDate().getSeconds();

          const message = {
            'name': change.doc.data().name,
            'text': change.doc.data().text,
            'photoURL': change.doc.data().photoURL,
            'timestamp': hora,
          }

          if (message.timestamp != null) {
            this.messages.push(message);
          } 
          
        }
      });
      console.log(this.messages);

    });
  }

}
