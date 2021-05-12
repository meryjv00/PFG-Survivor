import { Injectable } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/storage';
import firebase from 'firebase/app';
import 'firebase/firestore';
import { Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ChatService } from './chat.service';

@Injectable({
  providedIn: 'root'
})
export class FriendsService {
  userAuth: any | null;
  users = []; // Recoge los usuarios
  friendsRequests = [];
  sentFriendsRequests = [];
  listeningFriendsRequests = [];
  listeningSentFriendsRequests = [];
  newFriendInfo: any = 'hola';
  private newFriend = new Subject<void>();
  public newFriend$ = this.newFriend.asObservable();

  constructor(public firestorage: AngularFireStorage,
    public chat: ChatService) { }

  /**
   * Obtiene el usuario almacenado en localStorage, el cual se almacena al iniciar sesión
   */
  getUser() {
    this.userAuth = localStorage.getItem(environment.SESSION_KEY_USER_AUTH);
    this.userAuth = JSON.parse(this.userAuth);
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
  searchFriends(value: any) {
    var db = firebase.firestore();
    this.users = [];
    var query = db.collection("users");
    if (value.length >= 1) {
      query.get().then((doc) => {
        doc.forEach(change => {
          query.doc(change.id).get().then(doc => {
            // Quitando el usuario conectado
            if (doc.id != this.userAuth.uid) {
              // Convertir a minusculas y quitar tildes para así hacer una búsqueda más generica
              var name = doc.data().displayName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
              var busqueda = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
              if (name.indexOf(busqueda) > -1) {
                var user = {
                  'uid': doc.id,
                  'displayName': doc.data().displayName,
                  'photoURL': doc.data().photoURL,
                  'email': doc.data().email,
                  'status': doc.data().status,
                  'coins': doc.data().coins,
                  'relation': 'unknown'
                }
                this.users.push(user);
                // Comprobar si ya está entre mis amigos
                this.chat.friends.forEach(friend => {
                  if (change.id == friend.uid) {
                    console.log('El amigo buscado está entre mis amigos');
                    user.relation = 'friends';
                  }
                });
                // Comprobar si ya le he enviado solicitud
                this.sentFriendsRequests.forEach(friend => {
                  if (change.id == friend.uid) {
                    console.log('El amigo buscado ya ha sido enviada solic');
                    user.relation = 'sentRequest';
                  }
                });
              }
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
    var db = firebase.firestore();
    this.getUser();
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

    db.collection('users').doc(uid).collection('friendsRequests').doc(this.userAuth.uid).set({});
    db.collection('users').doc(this.userAuth.uid).collection('sentFriendsRequests').doc(uid).set({});
  }

  /**
   * Eliminar amigo, es decir, dejar de ser amigos
   * @param uid 
   */
  deleteFriend(uid: string) {
    var db = firebase.firestore();
    this.getUser();

    db.collection('users').doc(this.userAuth.uid).collection('friends').doc(uid).delete();
    db.collection('users').doc(uid).collection('friends').doc(this.userAuth.uid).delete();
  }

  /**
   * Aceptar solicitud de amistad -> os convertis en amigos
   * @param uid 
   */
  acceptFriendRequest(uid: string) {
    var db = firebase.firestore();
    // Eliminar de amigos sugeridos
    this.chat.suggestedFriends.forEach((friendSuggested, index) => {
      if (friendSuggested.uid == uid) {
        this.chat.suggestedFriends.splice(index, 1);
      }
    });

    db.collection('users').doc(this.userAuth.uid).collection('friends').doc(uid).set({
      'friendshipDate': firebase.firestore.Timestamp.now(),
    });
    db.collection('users').doc(uid).collection('friends').doc(this.userAuth.uid).set({
      'friendshipDate': firebase.firestore.Timestamp.now(),
    });
    this.deleteFriendRequest(uid);
  }

  /**
   * Rechazar solicitud de amistad
   * @param uid 
   */
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

  /**
   * Cancelar envío de la solicitud de amistad
   * @param uid 
   */
  cancelFriendRequest(uid: string) {
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
    var db = firebase.firestore();
    db.collection('users').doc(this.userAuth.uid).collection('sentFriendsRequests').doc(uid).delete();
    db.collection('users').doc(uid).collection('friendsRequests').doc(this.userAuth.uid).delete();
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
            this.loadFriendRequest(change,1);
          }
        }
      });
      //console.log('Solicitudes de amistad', this.friendsRequests);
    });
    this.listeningFriendsRequests.push(unsubscribe);
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
            this.loadFriendRequest(change,2);
          }
        }
      });
      //console.log('Solicitudes de amistad enviadas', this.sentFriendsRequests);
    });
    this.listeningSentFriendsRequests.push(unsubscribe);
  }

  /**
 * Solicitud de amistad borrada, puede haberla rechazado o denegado.
 * Comprobaremos si ahora somos amigos
 * @param change 
 */
  friendRequestDeleted(change: any) {
    var encontrado = false;
    var db = firebase.firestore();
    
    db.collection('users').doc(this.userAuth.uid).collection('friends').get().then(doc => {
      doc.forEach(docc => {
        if (docc.id == change.doc.id) {          
          encontrado = true;
          this.newFriendInfo = docc.id;
        }
      });
      if (encontrado) {
        db.collection('users').doc(this.newFriendInfo).get().then(doc => {
          this.newFriendInfo = doc.data().displayName;
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
    var db = firebase.firestore();

    db.collection("users").doc(change.doc.id).get()
      .then((doc) => {
        const friend = {
          'uid': change.doc.id,
          'displayName': doc.data().displayName,
          'photoURL': doc.data().photoURL,
          'email': doc.data().email,
          'status': doc.data().status,
          'coins': doc.data().coins,
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
   * Para de escuchar las peticiones de amistad que recibes. Este método se llama al cerrar sesión
   */
  stopListeningFriendsRequests() {
    this.listeningFriendsRequests.forEach(unsubscribe => {
      //console.log('Desactivando...PA');
      unsubscribe();
    });
  }

  /**
   * Para de escuchar la peticiones de amistad que envias. Este método se llama al cerrar sesión.
   */
  stopListeningSentFriendsRequests() {
    this.listeningSentFriendsRequests.forEach(unsubscribe => {
      //console.log('Desactivando...PAE');
      unsubscribe();
    });
  }

}
