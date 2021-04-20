import { Injectable } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/storage';
import firebase from 'firebase/app';
import 'firebase/firestore';
import { environment } from 'src/environments/environment';
import { ChatService } from './chat.service';

@Injectable({
  providedIn: 'root'
})
export class FriendsService {
  userAuth: any | null;
  users = [];
  friendsRequests = [];
  sentFriendsRequests = [];

  constructor(public firestorage: AngularFireStorage,
    public chat: ChatService) { }

  getUser() {
    this.userAuth = localStorage.getItem(environment.SESSION_KEY_USER_AUTH);
    this.userAuth = JSON.parse(this.userAuth);
  }

  resetSearchFriends() {
    this.users = [];
  }

  searchFriends(value: any) {
    var db = firebase.firestore();
    this.users = [];
    var aniadido = false;
    var query = db.collection("users");

    query.get().then((doc) => {
      doc.forEach(change => {
        query.doc(change.id).get().then(doc => {
          //-
          aniadido = false;
          if (doc.data().displayName == value) {
            // Comprobar si ya está entre mis amigos
            this.chat.friends.forEach(friend => {
              if (change.id == friend.uid) {
                console.log('El amigo buscado está entre mis amigos');
                aniadido = true;
                var user = {
                  'uid': doc.id,
                  'displayName': doc.data().displayName,
                  'photoURL': doc.data().photoURL,
                  'email': doc.data().email,
                  'status': 'friends'
                }
                this.users.push(user);
              }
            });
            // Comprobar si ya le he enviado solicitud
            this.sentFriendsRequests.forEach(friend => {
              if (change.id == friend.uid) {
                console.log('El amigo buscado ya ha sido enviada solic');
                aniadido = true;
                var user = {
                  'uid': doc.id,
                  'displayName': doc.data().displayName,
                  'photoURL': doc.data().photoURL,
                  'email': doc.data().email,
                  'status': 'sentRequest'
                }
                this.users.push(user);
              }
            });

            // En caso de que no se haya añadido se le pone el estado unknow de esta manera podrá enviarle solic. amistad
            if (!aniadido) {
              var user = {
                'uid': doc.id,
                'displayName': doc.data().displayName,
                'photoURL': doc.data().photoURL,
                'email': doc.data().email,
                'status': 'unknown'
              }
              this.users.push(user);
            }

          }
        });
      });
    });
  }

  sendFriendRequest(uid: string) {
    var db = firebase.firestore();
    this.getUser();
    this.users.forEach(friend => {
      if(friend.uid == uid) {
        friend.status = 'sentRequest';
      }
    });

    db.collection('users').doc(uid).collection('friendsRequests').doc(this.userAuth.uid).set({});
    db.collection('users').doc(this.userAuth.uid).collection('sentFriendsRequests').doc(uid).set({});
  }


  acceptFriendRequest(uid: string) {
    var db = firebase.firestore();
    db.collection('users').doc(this.userAuth.uid).collection('friends').doc(uid).set({});
    db.collection('users').doc(uid).collection('friends').doc(this.userAuth.uid).set({});

    this.deleteFriendRequest(uid);
  }

  deleteFriendRequest(uid: string) {
    this.friendsRequests.forEach((friend, index) => {
      if (friend.uid == uid) {
        this.friendsRequests.splice(index, 1);
      }
    });

    var db = firebase.firestore();
    db.collection('users').doc(this.userAuth.uid).collection('friendsRequests').doc(uid).delete();
    db.collection('users').doc(uid).collection('sentFriendsRequests').doc(this.userAuth.uid).delete();
  }

  deleteFriend(uid: string) {
    var db = firebase.firestore();
    this.getUser();

    db.collection('users').doc(this.userAuth.uid).collection('friends').doc(uid).delete();
    db.collection('users').doc(uid).collection('friends').doc(this.userAuth.uid).delete();
  }

  cancelFriendRequest(uid: string) {
    this.sentFriendsRequests.forEach((friend, index) => {
      if (friend.uid == uid) {
        this.sentFriendsRequests.splice(index, 1);
      }
    });
    this.users.forEach(friend => {
      if(friend.uid == uid) {
        friend.status = 'unknown';
      }
    });
    var db = firebase.firestore();
    db.collection('users').doc(this.userAuth.uid).collection('sentFriendsRequests').doc(uid).delete();
    db.collection('users').doc(uid).collection('friendsRequests').doc(this.userAuth.uid).delete();
  }

  listenFriendsRequests() {
    var db = firebase.firestore();
    this.friendsRequests = [];
    this.getUser();

    var query = db.collection('users').doc(this.userAuth.uid).collection('friendsRequests')
    query.onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        console.log('Entro a la escucha');

        if (change.type === 'removed') {
          console.log('Solicitud de amistad borrada');
          this.friendsRequests.forEach((friend, index) => {
            if (friend.uid == change.doc.id) {
              this.friendsRequests.splice(index, 1);
            }
          });
          this.users.forEach(friend => {
            if(friend.uid == change.doc.id) {
              friend.status = 'unknown';
            }
          });
        } else {
          if (change.doc.id != this.userAuth.uid) {
            db.collection("users").doc(change.doc.id).get()
              .then((doc) => {
                const friend = {
                  'uid': change.doc.id,
                  'displayName': doc.data().displayName,
                  'photoURL': doc.data().photoURL,
                  'email': doc.data().email,
                }
                this.friendsRequests.push(friend);

              });
          }
        }
      });
    });
    console.log('Solicitudes de amistad', this.friendsRequests);
  }

  listenSentFriendsRequests() {
    var db = firebase.firestore();
    this.sentFriendsRequests = [];
    this.getUser();

    var query = db.collection('users').doc(this.userAuth.uid).collection('sentFriendsRequests')
    query.onSnapshot(snapshot => {

      snapshot.docChanges().forEach(change => {
        if (change.type === 'removed') {
          console.log('Solicitud de amistad envi borrada');
          this.sentFriendsRequests.forEach((friend, index) => {
            if (friend.uid == change.doc.id) {
              this.sentFriendsRequests.splice(index, 1);
            }
          });
          this.users.forEach(friend => {
            if(friend.uid == change.doc.id) {
              friend.status = 'unknown';
            }
          });
        } else {
          if (change.doc.id != this.userAuth.uid) {
            db.collection("users").doc(change.doc.id).get()
              .then((doc) => {
                const friend = {
                  'uid': change.doc.id,
                  'displayName': doc.data().displayName,
                  'photoURL': doc.data().photoURL,
                  'email': doc.data().email,
                }
                this.sentFriendsRequests.push(friend);
              });
          }
        }
      });
    });
    console.log('Solicitudes de amistad enviadas', this.sentFriendsRequests);
  }

}
