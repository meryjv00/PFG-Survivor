import { Injectable } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/storage';
import firebase from 'firebase/app';
import 'firebase/firestore';
import { Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ChatService } from './chat.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class FriendsService {
  userAuth: any | null;
  users = []; // Recoge los usuarios
  friendsRequests = [];
  sentFriendsRequests = [];
  listeningItems = [];
  newFriendInfo: any = '';
  tokenUser: string = '';
  private newFriend = new Subject<void>();
  public newFriend$ = this.newFriend.asObservable();

  constructor(public firestorage: AngularFireStorage,
    public chat: ChatService,
    private http: HttpClient) { }

  /**
   * Obtiene el usuario almacenado en localStorage, el cual se almacena al iniciar sesión
   */
  getUser() {
    this.userAuth = localStorage.getItem(environment.SESSION_KEY_USER_AUTH);
    this.userAuth = JSON.parse(this.userAuth);
    this.tokenUser = this.userAuth['stsTokenManager']['accessToken'];
  }

  /**
   * Vacía el array users (usuarios obtenidos del buscador de amigos)
   */
  resetSearchFriends() {
    this.users = [];
  }

  /**
   * Búsqueda de nuevos amigos
   * @param value 
   */
  searchFriends(value: string) {
    this.getUser();
    this.resetSearchFriends();

    if (value.length >= 1) {
      const url = environment.dirBack + "getUsers/" + value + "/" + this.userAuth.uid;
      let headers = new HttpHeaders({ Authorization: `Bearer ${this.tokenUser}` });
      this.http.get(url, { headers: headers })
        .subscribe(
          (response) => {
            this.users = response['message'];

            this.users.forEach(user => {
              // Comprobar si ya está entre mis amigos
              this.chat.friends.forEach(friend => {
                if (user.uid == friend.uid) {
                  // Usuario encontrado ya está en mi lista de amigos
                  user.relation = 'friends';
                }
              });
              // Comprobar si ya le he enviado solicitud
              this.sentFriendsRequests.forEach(friend => {
                if (user.uid == friend.uid) {
                  // Usuario encontrado ya ha sido enviada una solicitud
                  user.relation = 'sentRequest';
                }
              });
            });
          });
    }
  }

  /**
   * Envía solicitud de amistad al usuario seleccionado
   * @param uid 
   */
  sendFriendRequest(uid: string) {
    this.getUser();

    const url = `${environment.dirBack}sendFriendRequest/${this.userAuth.uid}/${uid}`;
    let headers = new HttpHeaders({ Authorization: `Bearer ${this.tokenUser}` });
    this.http.put(url, { headers: headers })
      .subscribe(
        (response) => {
          console.log('Response:', response);
          // Actualizar relación: solicitud enviada
          this.users.forEach(friend => {
            if (friend.uid == uid) {
              friend.relation = 'sentRequest';
            }
          });
          // Eliminar de amigos sugeridos
          this.chat.suggestedFriends.forEach((friendSuggested, index) => {
            if (friendSuggested.uid == uid) {
              this.chat.suggestedFriends.splice(index, 1);
            }
          });

        });
  }

  /**
   * Eliminar amigo, es decir, dejar de ser amigos
   * @param uid 
   */
  deleteFriend(uid: string) {
    this.getUser();

    const url = `${environment.dirBack}deleteFriend/${this.userAuth.uid}/${uid}`;
    let headers = new HttpHeaders({ Authorization: `Bearer ${this.tokenUser}` });
    this.http.delete(url, { headers: headers })
      .subscribe(
        (response) => {
          console.log('Response:', response);
        });
  }

  /**
   * Aceptar solicitud de amistad -> os convertis en amigos
   * @param uid 
   */
  acceptFriendRequest(uid: string) {
    this.getUser();

    const url = `${environment.dirBack}acceptFriendRequest/${this.userAuth.uid}/${uid}`;
    let headers = new HttpHeaders({ Authorization: `Bearer ${this.tokenUser}` });
    this.http.put(url, { headers: headers })
      .subscribe(
        (response) => {
          console.log('Response:', response);
          // Eliminar de amigos sugeridos
          this.chat.suggestedFriends.forEach((friendSuggested, index) => {
            if (friendSuggested.uid == uid) {
              this.chat.suggestedFriends.splice(index, 1);
            }
          });
          this.deleteFriendRequest(uid);
        });
  }

  /**
   * Rechazar solicitud de amistad
   * @param uid 
   */
  deleteFriendRequest(uid: string) {
    this.getUser();

    const url = `${environment.dirBack}deleteFriendRequest/${this.userAuth.uid}/${uid}`;
    let headers = new HttpHeaders({ Authorization: `Bearer ${this.tokenUser}` });
    this.http.delete(url, { headers: headers })
      .subscribe(
        (response) => {
          console.log('Response:', response);
          this.friendsRequests.forEach((friend, index) => {
            if (friend.uid == uid) {
              this.friendsRequests.splice(index, 1);
            }
          });
        });
  }

  /**
   * Cancelar envío de la solicitud de amistad
   * @param uid 
   */
  cancelFriendRequest(uid: string) {
    const url = `${environment.dirBack}deleteFriendRequest/${uid}/${this.userAuth.uid}`;
    let headers = new HttpHeaders({ Authorization: `Bearer ${this.tokenUser}` });
    this.http.delete(url, { headers: headers })
      .subscribe(
        (response) => {
          console.log('Response:', response);
          this.sentFriendsRequests.forEach((friend, index) => {
            if (friend.uid == uid) {
              this.sentFriendsRequests.splice(index, 1);
            }
          });
          this.users.forEach(friend => {
            if (friend.uid == uid) {
              friend.relation = 'unknown';
            }
          });
        });
  }

  /**
   * Pone en escucha las peticiones de amistad que te envian
   */
  listenFriendsRequests() {
    var db = firebase.firestore();
    this.friendsRequests = [];
    this.getUser();

    var query = db.collection('users').doc(this.userAuth.uid).collection('friendsRequests')
    var unsubscribe = query.onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        // Peticion de amistad borrada
        if (change.type === 'removed') {
          this.friendsRequests.forEach((friend, index) => {
            if (friend.uid == change.doc.id) {
              this.friendsRequests.splice(index, 1);
            }
          });
          this.friendRequestDeleted(change);
        }
        // Peticion de amistad recogida
        else {
          if (change.doc.id != this.userAuth.uid) {
            this.loadFriendRequest(change, 1);
          }
        }
      });
      //console.log('Solicitudes de amistad', this.friendsRequests);
    });
    this.listeningItems.push(unsubscribe);
  }


  /**
   * Pone en escucha las peticiones de amistad que he enviado
   */
  listenSentFriendsRequests() {
    var db = firebase.firestore();
    this.sentFriendsRequests = [];
    this.getUser();

    var query = db.collection('users').doc(this.userAuth.uid).collection('sentFriendsRequests')
    var unsubscribe = query.onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        // Peticion de amistad enviada borrada
        if (change.type === 'removed') {
          this.sentFriendsRequests.forEach((friend, index) => {
            if (friend.uid == change.doc.id) {
              this.sentFriendsRequests.splice(index, 1);
            }
          });
          this.friendRequestDeleted(change);
        }
        // Peticion de amistad enviada recogida
        else {
          if (change.doc.id != this.userAuth.uid) {
            this.loadFriendRequest(change, 2);
          }
        }
      });
      //console.log('Solicitudes de amistad enviadas', this.sentFriendsRequests);
    });
    this.listeningItems.push(unsubscribe);
  }

  /**
 * Solicitud de amistad borrada, puede haberla rechazado o denegado.
 * Comprobaremos si ahora somos amigos
 * @param change 
 */
  friendRequestDeleted(change: any) {
    var encontrado = false;

    const url = `${environment.dirBack}getFriendsUID/${this.userAuth.uid}`;
    let headers = new HttpHeaders({ Authorization: `Bearer ${this.tokenUser}` });
    this.http.get(url, { headers: headers })
      .subscribe(
        (response) => {
          var friendsUID = response['message'];
          // Buscamos si el usuario está entre los amigos del usuario          
          friendsUID.forEach(user => {
            if (user.uid == change.doc.id) {
              encontrado = true;
              this.newFriendInfo = user.uid;
            }
          });

          // Evento de nuevo amigo
          if (encontrado) {
            const url = `${environment.dirBack}getUser/${this.newFriendInfo}`;
            let headers = new HttpHeaders({ Authorization: `Bearer ${this.tokenUser}` });
            this.http.get(url, { headers: headers })
              .subscribe(
                (response) => {
                  this.newFriendInfo = response['message'].displayName;
                  console.log('He aceptado solicitud');
                  this.newFriend.next();
                });
          }

          this.users.forEach(friend => {
            friend.relation = 'unknown';
            if (friend.uid == change.doc.id) {
              if (encontrado) {
                friend.relation = 'friends';
              }
            }
          });

        });
  }

  /**
   * Añadir petición de amistad 
   * @param change doc usuario a buscar
   * @param type 1: peticion de amistad recibida / 2: peticion de amistad enviada
   */
  loadFriendRequest(change: any, type: number) {
    const url = `${environment.dirBack}getUser/${change.doc.id}`;
    let headers = new HttpHeaders({ Authorization: `Bearer ${this.tokenUser}` });
    this.http.get(url, { headers: headers })
      .subscribe(
        (response) => {
          const friend = {
            'uid': response['message'].uid,
            'status': response['message'].status,
            'displayName': response['message'].displayName,
            'photoURL': response['message'].photoURL,
            'email': response['message'].email,
            'coins': response['message'].coins,
          }
          if (type == 1) {
            this.friendsRequests.push(friend);
            this.chat.sonidito(1);
          } else if (type == 2) {
            this.sentFriendsRequests.push(friend);
          }
        });
  }

  /**
   * Para de escuchar las peticiones de amistad tantoo las que se envian como las que se reciben.
   * Este método se llama al cerrar sesión
   */
  stopListeningRequests() {
    this.listeningItems.forEach(unsubscribe => {
      unsubscribe();
    });
  }

}
