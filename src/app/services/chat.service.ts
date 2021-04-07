import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import firebase from 'firebase/app';
import 'firebase/firestore';
import { environment } from 'src/environments/environment';
import * as _ from "lodash";

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  messages = [];
  msgEnviar = '';

  friends = [];
  messagesWithFriend = [];
  chatEnabled = false;
  uidFriendSelected = '';

  userAuth: any | null;
  messagesFriends = [];

  constructor(
    private router: Router) {
    this.userAuth = sessionStorage.getItem(environment.SESSION_KEY_USER_AUTH);
    this.userAuth = JSON.parse(this.userAuth);
  }

  getUser(){
    this.userAuth = sessionStorage.getItem(environment.SESSION_KEY_USER_AUTH);
    this.userAuth = JSON.parse(this.userAuth);
  }

  sendMessage() {
    var db = firebase.firestore();

    db.collection("messages").add({
      name: this.userAuth.displayName,
      text: this.msgEnviar,
      photoURL: this.userAuth.photoURL,
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
      // console.log(this.messages);

    });
  }

  //--------------------------------------------------------------
  //userUID?: any
  getFriends() {
    console.log('OBTENIENDO AMIGOS...');

    this.friends = [];

    /* console.log(userUID);
    
    var authUID;
    if(userUID) {
      authUID = userUID;
    }else{
      authUID = this.userAuth.uid;
    } */
    this.getUser();
    console.log('USER UID', this.userAuth.uid);

    var query = firebase.firestore()
      .collection('users').doc(this.userAuth.uid).collection('friends')

    query.onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'removed') {
        } else {
          const friend = {
            'uid': change.doc.id,
            'displayName': change.doc.data().displayName,
            'photoURL': change.doc.data().photoURL,
            'email': change.doc.data().email,
          }
          this.friends.push(friend);
        }
      });
      console.log('AMIGOS');
      console.log(this.friends);
    });

    this.router.navigate(['perfil']);
  }

  chatWith(uid: any) {
    this.messagesWithFriend = [];
    this.uidFriendSelected = uid;

    console.log(this.messagesFriends);

    this.messagesFriends.forEach(user => {
      if (user.uid == uid) {
        this.messagesWithFriend = user.messages;
      }
    });
    this.chatEnabled = true;
  }

  listenFriendMessages() {
    this.messagesFriends = [];
    var msgs = [];
    var msg: any;

    console.log('HOLA');

    console.log('AMIGOS DESDE OBTENIENDO MENSAJES', this.friends);

    this.friends.forEach(friend => {
      console.log('RECORRIENDO AMIGOS...');
      msgs = [];
      this.getUser();
      console.log(this.userAuth);
      
      var query = firebase.firestore()
        .collection('users').doc(this.userAuth.uid).collection('friends')
        .doc(friend.uid).collection('messages')
        .orderBy('timestamp', 'asc')

      query.onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'removed') {
          } else {
            var hora = '';
            hora += change.doc.data().timestamp.toDate().getHours() + ':' +
              change.doc.data().timestamp.toDate().getMinutes() + ':' +
              change.doc.data().timestamp.toDate().getSeconds();

            const message = {
              'displayName': change.doc.data().displayName,
              'text': change.doc.data().text,
              'photoURL': change.doc.data().photoURL,
              'timestamp': hora,
            }
            // console.log('FRIEND: ', friend.uid, 'MENSAJE: ', message);

            msgs.push(message);
            msg = message;
          }
        });
        var encontrado = false;
        if (this.messagesFriends.length > 0){
          this.messagesFriends.forEach(user => {
            if (user.uid == friend.uid || user.uid == this.userAuth.uid) {
              console.log('ENCONTRADO');
              encontrado = true;
              console.log(user.messages);
              console.log(user.messages.length);
              
              user.messages[user.messages.length] = msg;
            }
          });
        }
        if(!encontrado){
          console.log('NO ENCONTRADO');
          this.messagesFriends.push({ 'uid': friend.uid, 'messages': msgs });
        }

        msgs = [];
        console.log(this.messagesFriends);

      });
    });

    // Lista mensajes amigos
    // console.log('MENSAJES AMIGOS');
    // console.log(this.messagesFriends);
  }

  sendMessageFriend() {
    var db = firebase.firestore();

    // Insertar en mis amigos/mensajes
    db.collection('users').doc(this.userAuth.uid).collection('friends')
      .doc(this.uidFriendSelected).collection('messages').add({
        displayName: this.userAuth.displayName,
        text: this.msgEnviar,
        photoURL: this.userAuth.photoURL,
        timestamp: firebase.firestore.Timestamp.now(),
      })
      .then(ok => {
        // console.log('Añadido en mis mensajes');
        this.msgEnviar = '';
      })
      .catch(function (error) {
        console.error('Error writing new message to database', error);
      });

    //Insertar en sus amigos/mensajes
    db.collection('users').doc(this.uidFriendSelected).collection('friends')
      .doc(this.userAuth.uid).collection('messages').add({
        displayName: this.userAuth.displayName,
        text: this.msgEnviar,
        photoURL: this.userAuth.photoURL,
        timestamp: firebase.firestore.Timestamp.now(),
      }).then(ok => {
        // console.log('Añadido en sus mensajes');
      })
      .catch(function (error) {
        console.error('Error writing new message to database', error);
      });

  }

}
