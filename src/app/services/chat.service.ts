import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import firebase from 'firebase/app';
import 'firebase/firestore';
import { environment } from 'src/environments/environment';
import * as _ from "lodash";
import { AngularFireStorage } from '@angular/fire/storage';
import { Subject } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  msgEnviar = ''; // Variable ngmodel de enviar mensaje !!!Cambiar
  userAuth: any | null; // Usuario guardado en session local storage
  friends = []; // Lista de amigos
  messagesFriends = []; // Array de mensajes de tus amigos
  messagesWithFriend = []; // Array de mensajes de amigos ya convertidos: mensajes que se van mostrando en cada chat
  uidFriendSelected = ''; // Amigo seleccionado al cambiar de chat
  chatEnabled = false; // Se activa cuando se pulsa un chat, permite ver los mensajes
  listeningSnapsMessages = []; // Array que contiene los escuchas de los mensajes de los amigos para poder desactivarlos al cerrar sesión
  listeningFriends = []; // Array que contiene las escuchas de los amigos para poder desactivarlos al cerrar sesión
  messagesWithoutRead = []; // Mensajes de cada chat sin leer
  gotAllMessages: boolean = false; // Comprueba si ya se han obtenido todos los mensajes (sin leer) al recargar la página 
  friendSelected: any; // Guarda toda la información el usuario seleccionado
  urlImg: any; // Guarda la url de la imagen del chat para mostrarla en el modal
  suggestedFriends = []; // Sugerencias de amigos "Amigos de mis amigos"
  sentRequested = []; // Array que contiene los uid que el usuario mandó solicitud
  msgsWithoutReadNotif = []; // Mensajes sin leer para las notificaciones del chat
  urlImgsChat = []; // URL de las imágenes que el usuario ha compartido con cada chat
  // Avisa al componente de que se ha recibido/enviado un nuevo mensaje para que el scroll baje automáticamente
  private countdownEndSource = new Subject<void>();
  public countdownEnd$ = this.countdownEndSource.asObservable();
  nFriends: number = 0;
  tokenUser: string = '';

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~CONSTRUCTOR~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  constructor(
    public firestorage: AngularFireStorage,
    private http: HttpClient) {
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  /**
   * Obtiene el usuario almacenado en localStorage, el cual se almacena al iniciar sesión
   */
  getUser() {
    this.userAuth = localStorage.getItem(environment.SESSION_KEY_USER_AUTH);
    this.userAuth = JSON.parse(this.userAuth);
    this.tokenUser = this.userAuth['stsTokenManager']['accessToken'];
  }

  /**
   * Vacía los mensajes al cerrar sesión 
   */
  cleanMessages() {
    this.messagesWithoutRead = [];
    this.msgsWithoutReadNotif = [];
  }

  /**
   * Marcar como conectado/desconectado
   * @param type 1: conectado / 2: desconectado
   */
  setStatusOnOff(type: number) {
    this.getUser();

    var status;
    if (type == 1) {
      status = 'online';
    } else {
      status = 'offline';
    }

    const url = environment.dirBack + "updateStatus/" + this.userAuth.uid;
    let headers = new HttpHeaders({ Authorization: `Bearer ${this.tokenUser}` });
    this.http.put(url, { 'user': this.userAuth, status: status }, { headers: headers })
      .subscribe(() => { });

  }

  /**
   * Suena mensaje dependiendo del tipo
   * @param type 1: mensaje sin leer / 2: borrar mensaje / 3: borrar chat
   */
  sonidito(type: number) {
    if (type == 1) {
      var audio = new Audio('../../assets/tonos/tono-mensaje.mp3');
    } else if (type == 2) {
      var audio = new Audio('../../assets/tonos/tono-delete.mp3');
    } else if (type == 3) {
      var audio = new Audio('../../assets/tonos/tono-delete-chat.mp3');
    }
    audio.play();
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~GET FRIENDS & LISTEN FRIENDS~~~~~~~~~~~~~~~~~~~~~~~~~~~
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  /**
   * Cargar amigos
   */
  getFriends() {
    this.friends = [];
    this.getUser();
    var contAmigos;
    // Obtener nº de amigos -> Si obtiene 0 vuelve a la vista si no pone en escucha los mensajes
    this.getFriendsData(this.userAuth.uid)
      .subscribe(
        (response) => {
          contAmigos = response['message'].length;
          if (contAmigos == 0) {
            this.gotAllMessages = true;
            return;
          }
        });

    this.listenFriends(contAmigos);

  }

  /**
   * Pone en escucha la lista de amigos
   */
  listenFriends(contAmigos) {
    this.getUser();
    var db = firebase.firestore();
    var query = db.collection('users').doc(this.userAuth.uid).collection('friends')

    var unsubscribe = query.onSnapshot(snapshot => {
      snapshot.docChanges().forEach((change, index) => {
        // Obtener nº de amigos si se añade un nuevo amigo, no se pase a poner en esucucha a los mensajes hasta obtenerlos todos
        this.getFriendsData(this.userAuth.uid)
          .subscribe(
            (response) => {
              this.nFriends = response['message'].length;

              // Amigo borrado
              if (change.type === 'removed') {
                this.friends.forEach((user, i) => {
                  if (user.uid == change.doc.id) {
                    this.friends.splice(i, 1);
                  }
                });
                this.closeChat();
              }
              // Cargando todos los amigos o nuevo amigo añadido
              else {

                // Obtener datos generales
                this.getUserData(change.doc.id)
                  .subscribe(
                    (responseUser) => {
                      // Obtener fecha inicio de amistad
                      this.getFriendShipData(change.doc.id)
                        .subscribe(
                          (responseDataFriend) => {

                            const friend = {
                              'uid': responseUser['message'].uid,
                              'status': responseUser['message'].status,
                              'displayName': responseUser['message'].displayName,
                              'photoURL': responseUser['message'].photoURL,
                              'email': responseUser['message'].email,
                              'coins': responseUser['message'].coins,
                              'friendshipDate': responseDataFriend['message']
                            }
                            this.friends.push(friend);

                            // Pone en escucha la información del amigo
                            this.listenDataFriend(change.doc.id);

                            // var pos = this.friends.length - 1;
                            // this.listenFriendMessages(friend, pos);

                            // Ultima pos del array -> obtiene los amigos sugeridos
                            if (this.nFriends == index + 1) {                              
                              this.getSuggestedFriends();
                              this.stopListeningReListenFM(2);
                              //this.listenFriendMessages();
                            }else {
                              // Se ha añadido un nuevo amigo
                              if (contAmigos != this.nFriends) {                                
                                this.getSuggestedFriends();
                                this.stopListeningReListenFM(2);
                              }
                            }

                          });
                    });
              }

            });

      });
    });
    this.listeningFriends.push(unsubscribe);
  }


  /**
   * Obtiene información de amigos del usuario logeado (uids -> nº de amigos)
   * @returns 
   */
  getFriendsData(userUID) {
    const url = `${environment.dirBack}getFriendsUID/${userUID}`;
    let headers = new HttpHeaders({ Authorization: `Bearer ${this.tokenUser}` });
    return this.http.get(url, { headers: headers });
  }

  /**
   * Obtiene la información del amigo
   * @param userUID 
   * @returns 
   */
  getUserData(userUID) {
    const url = `${environment.dirBack}getUser/${userUID}`;
    let headers = new HttpHeaders({ Authorization: `Bearer ${this.tokenUser}` });
    return this.http.get(url, { headers: headers });
  }

  /**
   * Obtiene la información de la relación de amistad (fecha de inicio)
   * @param userUID 
   * @returns 
   */
  getFriendShipData(userUID) {
    const url = `${environment.dirBack}getDataFriendship/${this.userAuth.uid}/${userUID}`;
    let headers = new HttpHeaders({ Authorization: `Bearer ${this.tokenUser}` });
    return this.http.get(url, { headers: headers });
  }

  /**
   * Pone en escucha los datos del usuario
   * Para ver actualizado su estado (online/offline) entre otros
   * @param userUID 
   */
  listenDataFriend(userUID) {
    var db = firebase.firestore();
    var unsubscribe = db.collection("users").doc(userUID)
      .onSnapshot({
        includeMetadataChanges: true
      }, (doc) => {
        // Buscar usuario y actualizar sus datos
        this.friends.forEach(friend => {
          if (friend.uid == userUID) {
            friend.status = doc.data().status;
            friend.email = doc.data().email;
            friend.displayName = doc.data().displayName;
            friend.coins = doc.data().coins;
          }
        });
      });
    this.listeningFriends.push(unsubscribe);
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~  SUGGESTED FRIENDS  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  /**
   * Sugerencias de amigos "Amigos de mis amigos"
   */
  getSuggestedFriends() {
    this.suggestedFriends = [];
    if (this.friends.length == 0) { return };

    // Obtener peticiones de amistad enviadas
    this.getSentFriendsRequests()
      .subscribe(
        (response) => {
          this.sentRequested = response['message'];

          // Recorrer mis amigos para buscar los amigos de cada uno
          this.friends.forEach(friend => {
            // Obtener amigos de mi amigo
            this.getFriendsData(friend.uid)
              .subscribe(
                (response) => {
                  var friendsUID = response['message'];
                  // Buscamos si el usuario está entre los amigos del usuario          
                  friendsUID.forEach(user => {
                    // Excluyendo al usuario logeado
                    if (user.uid != this.userAuth.uid) {
                      var encontrado = this.searchUserArrays(user);

                      if (!encontrado) {
                        // Se crea el amigo sugerido con datos vacíos ya que tarda en obtener los datos y al buscarlo en el array de
                        // sugeridos todavía no lo encuentra y duplica la información
                        const suggestedFriend = {
                          'uid': user.uid,
                          'status': '',
                          'displayName': '',
                          'photoURL': '',
                          'email': '',
                          'coins': '',
                          'relation': 'unknown'
                        }
                        this.suggestedFriends.push(suggestedFriend);
                        var pos = this.suggestedFriends.length - 1;
                        this.getUserData(user.uid)
                          .subscribe(
                            (response) => {
                              this.suggestedFriends[pos].status = response['message'].status;
                              this.suggestedFriends[pos].displayName = response['message'].displayName;
                              this.suggestedFriends[pos].photoURL = response['message'].photoURL;
                              this.suggestedFriends[pos].email = response['message'].email;
                              this.suggestedFriends[pos].coins = response['message'].coins;
                            });
                      }
                    }
                  });
                });
          });
        });
  }

  /**
   * Busca a un usuario en la lista de amigos, sugeridos y peticiones enviadas
   * @param user 
   * @returns true: encontrado / false: no encontrado
   */
  searchUserArrays(user) {
    var encontrado = false;
    // Recorro la lista de mis amigos
    this.friends.forEach(friend => {
      if (friend.uid == user.uid) {
        encontrado = true;
      }
    });
    // Recorro la lista de peticiones de amistad enviadas
    this.sentRequested.forEach(uidRequested => {
      if (uidRequested == user.uid) {
        encontrado = true;
      }
    });
    // Recorro la lista de sugerencias
    this.suggestedFriends.forEach(suggestedFriend => {
      if (suggestedFriend.uid == user.uid) {
        encontrado = true;
      }
    });
    return encontrado;
  }

  /**
   * Obtiene las peticiones de amistad enviadas del usuario logeado
   * Para que estos usuarios no aparezcan en recomendados
   * @returns 
   */
  getSentFriendsRequests() {
    const url = `${environment.dirBack}getSentFriendsRequests/${this.userAuth.uid}`;
    let headers = new HttpHeaders({ Authorization: `Bearer ${this.tokenUser}` });
    return this.http.get(url, { headers: headers });
  }


  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~LISTEN FRIEND MESSAGES~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  /**
   * Pone en escucha los mensajes de todos los amigos
   * para recibir en tiempo real cualquier cambio
   */
  listenFriendMessages() {
    var db = firebase.firestore();
    this.getUser();
    this.messagesFriends = [];
    this.messagesWithoutRead = [];
    this.msgsWithoutReadNotif = [];
    var msgs = [];
    var msg: any;
    var read = true;

    if (this.friends.length > 0) {
      this.friends.forEach((friend, index) => {
        msgs = [];

        var query = db.collection('users').doc(this.userAuth.uid).collection('friends')
          .doc(friend.uid).collection('messages')
          .orderBy('timestamp', 'asc')

        var unsubscribe = query.onSnapshot(snapshot => {
          snapshot.docChanges().forEach(change => {
            // Mensaje eliminado
            if (change.type === 'removed') {
              read = false;
              this.messagesFriends.forEach(user => {
                if (user.uid == friend.uid) {
                  user.messages.forEach((message, index) => {
                    if (message.id == change.doc.id) {
                      console.log('Mensaje borrado: ', message.id);
                      user.messages.splice(index, 1);
                      // Si todavía no está leido -> Descontar uno del contador de mensajes sin leer
                      if (message.isRead == false && message.uid == friend.uid) { // !!!
                        this.messagesWithoutRead.forEach(msg => {
                          if (msg.uid == friend.uid) {
                            var n = msg.messages - 1;
                            msg.messages = n;
                          }
                        });
                      }
                    }
                  });
                }
              });
            }
            // Mensaje actualizado (marcado como leído)
            else if (change.type === 'modified') {
              read = false;
              this.messagesFriends.forEach(user => {
                if (user.uid == this.uidFriendSelected) {
                  user.messages.forEach(message => {
                    if (message.id == change.doc.id) {
                      console.log('Mensaje actualizado: ', message.id);
                      message.isRead = true;
                    }
                  });
                }
              });
            }
            // Mensaje añadido/recibido
            else {
              read = true;
              var h = '';
              h += change.doc.data().timestamp.toDate();
              // var year = h.substring(11, 15);

              const message = {
                'id': change.doc.id,
                'uid': change.doc.data().uid,
                'displayName': change.doc.data().displayName,
                'text': change.doc.data().text,
                'imageURL': change.doc.data().imageURL,
                'isRead': change.doc.data().isRead,
                'storageRef': change.doc.data().storageRef,
                'timestamp': h.substring(16, 21),
                'day': h.substring(8, 11) + h.substring(4, 7)
              }
              msgs.push(message);
              msg = message;
            }
          });

          if (read) {
            this.addMessages(friend, msg, msgs);
            msgs = [];
          }

          // Obtener nº mensajes sin leer panel de notificaciones
          this.countMessagesWithoutRead(friend, index);

          // Ha terminado de obtener los mensajes
          if (this.friends.length - 1 == index && this.gotAllMessages == false) {
            console.log(this.msgsWithoutReadNotif);
            this.gotAllMessages = true;
            console.log('Termine');
          }

        });

        // Añadir al array para poder dejar de escuchar al cerrar sesión y q al volver a entrar no vuelva a escuchar y x lo tanto haya duplicidad de mensajes
        this.listeningSnapsMessages.push(unsubscribe);


      });
    }

  }

  /**
   * Añade un mensaje al array de mensajes totales y pendientes por leer
   * @param friend 
   * @param msg 
   * @param msgs 
   */
  addMessages(friend, msg, msgs) {
    var db = firebase.firestore();
    var encontrado = false;

    // Cargar nuevo mensaje
    if (this.messagesFriends.length > 0) {
      this.messagesFriends.forEach(user => {
        // Cargar un solo mensaje al enviar o recibir
        if (user.uid == friend.uid || user.uid == this.userAuth.uid) {
          encontrado = true;
          user.messages[user.messages.length] = msg;
          // Recibes nuevo mensaje: evento para bajar scroll
          this.countdownEndSource.next();

          // Comprobar el chat que tengo abierto
          db.collection("users").doc(this.userAuth.uid).get()
            .then((doc) => {
              // En caso de no tener el chat abierto añadimos un mensaje más sin leer
              if (doc.data().chatOpen != friend.uid) {
                if (msg.uid == friend.uid && msg.isRead == false) {
                  this.messagesWithoutRead.forEach(msg => {
                    if (msg.uid == friend.uid) {
                      var n = msg.messages + 1;
                      msg.messages = n;
                    }
                  });
                  console.log('Mensajes sin leer:', this.messagesWithoutRead);
                  this.sonidito(1);
                }
              }
            });
        }
      });
    }
    // Cargar mensajes inicialmente
    if (!encontrado) {
      //console.log('CARGAR MENSAJES INICIALES', friend.uid);
      //console.log(friend.uid, msgs);

      this.messagesFriends.push({
        'uid': friend.uid,
        'displayName': friend.displayName,
        'photoURL': friend.photoURL,
        'messages': msgs
      });
      console.log(this.messagesFriends);

      // Se suman aquellos mensajes sin leer y cuyo uid sea del amig
      var cont = 0;
      msgs.forEach(msg => {
        if (msg.uid == friend.uid && msg.isRead == false) {
          cont++;
        }
      });
      this.messagesWithoutRead.push({
        'uid': friend.uid,
        'displayName': friend.displayName,
        'photoURL': friend.photoURL,
        'messages': cont
      });

      // console.log('MENSAJES SIN LEER', this.messagesWithoutRead.length);

    }
  }

  /**
   * Array de mensajes lista de notificación
   * @param friend 
   * @param index 
   */
  countMessagesWithoutRead(friend, index) {
    //console.log('Hay mensajes sin leer', this.messagesWithoutRead);
    if (this.messagesWithoutRead[index]) {
      setTimeout(() => {
        if (this.messagesWithoutRead[index].messages > 0) {
          var enc = false;
          //console.log('Hay mensajes sin leer', this.messagesWithoutRead[index].uid);
          this.msgsWithoutReadNotif.forEach(msg => {
            if (msg.uid == this.messagesWithoutRead[index].uid) {
              enc = true;
              var ms = this.messagesWithoutRead[index].messages;
              msg.messages = ms++;
            }
          });
          if (!enc) {
            this.msgsWithoutReadNotif.push({ 'uid': friend.uid, 'messages': this.messagesWithoutRead[index].messages });
          }
        }
        //Buscarlo y borrarlo
        else {
          this.msgsWithoutReadNotif.forEach((msg, index2) => {
            if (msg.uid == this.messagesWithoutRead[index].uid) {
              this.msgsWithoutReadNotif.splice(index2, 1);
            }
          });
        }
      }, 500);
    }

  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~CHAT WITH FRIEND~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  /**
   * Abrir mensajes de un chat con amigo
   * En caso de que los mensajes no estén leídos los marca como leidos
   * @param friend amigo seleccionado
   */
  chatWith(friend: any) {
    /*     if (friend.uid == this.uidFriendSelected) {
          return;
        } */
    this.messagesWithFriend = [];
    this.uidFriendSelected = friend.uid;
    this.friendSelected = friend;
    console.log('MENSAJES AMIGOS', this.messagesFriends);

    this.messagesFriends.forEach(user => {
      if (user.uid == friend.uid) {
        this.messagesWithFriend = user.messages;
        console.log('Mensajes del chat abierto: ', this.messagesWithFriend);

        // Marcar chat abierto
        this.setChatOpen(user.uid);

        // Poner en leído los mensajes del chat correspondiente
        this.messagesWithFriend.forEach(msg => {
          if (msg.uid != this.userAuth.uid && msg.isRead == false) {
            this.setMessagesRead(user.uid, msg.id);
            msg.isRead = true;
          }
        });

        // Marcar en leído en el array que notifica cuantos mensajes te faltan x leer
        this.messagesWithoutRead.forEach(msg => {
          if (msg.uid == user.uid) {
            msg.messages = 0;
          }
        });

      }
    });
    this.chatEnabled = true;
  }

  /**
   * Guardar el chat que tiene el usuario abierto
   * @param uidFriend 
   */
  setChatOpen(uidFriend) {
    const url = `${environment.dirBack}setChatOpen/${this.userAuth.uid}/${uidFriend}`;
    let headers = new HttpHeaders({ Authorization: `Bearer ${this.tokenUser}` });
    this.http.put(url, { headers: headers })
      .subscribe(() => { });
  }

  /**
   * Marca en leído el mensaje en ambos usuarios
   * @param uidFriend 
   * @param idMsg 
   */
  setMessagesRead(uidFriend, idMsg) {
    const url = `${environment.dirBack}setMessagesRead/${this.userAuth.uid}/${uidFriend}/${idMsg}`;
    let headers = new HttpHeaders({ Authorization: `Bearer ${this.tokenUser}` });
    this.http.put(url, { headers: headers })
      .subscribe(() => { });
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~SEND MESSAGE TO FRIEND~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  /**
  * Enviar mensaje al amigo cuyo chat tienes abierto
  */
  sendMessageFriend() {
    var msg = this.msgEnviar;
    this.msgEnviar = '';

    const url = `${environment.dirBack}sendMessage/${this.userAuth.uid}/${this.uidFriendSelected}`;
    let headers = new HttpHeaders({ Authorization: `Bearer ${this.tokenUser}` });
    this.http.put(url, { 'user': this.userAuth, 'message': msg }, { headers: headers })
      .subscribe(
        (response) => {
          var msgid = response['message'];
          this.checkUserChat(msgid);
        });
  }


  /**
   * Comprueba si el usuario tiene el chat abierto, en caso de tenerlo
   * marca los mensajes como leídos
   * @param msgid 
   */
  checkUserChat(msgid: any) {
    const url = `${environment.dirBack}checkUserChat/${this.userAuth.uid}/${this.uidFriendSelected}`;
    let headers = new HttpHeaders({ Authorization: `Bearer ${this.tokenUser}` });
    this.http.get(url, { headers: headers })
      .subscribe(
        (response) => {
          var open = response['message'];
          if (open) {
            this.setMessagesRead(this.uidFriendSelected, msgid);
          }
        });
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~SEND IMAGE~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  /**
  * Enviar imágen en un chat
  * @param event 
  */
  sendImg(event) {
    var file = event.target.files[0];
    var imgName = Math.floor(Math.random() * 100000000);
    var filePathUser = `images/${this.userAuth.uid}/${this.uidFriendSelected}/${imgName}`;
    var filePathFriend = `images/${this.uidFriendSelected}/${this.userAuth.uid}/${imgName}`;

    // Subir imagen storage loged user
    this.firestorage.ref(filePathUser).put(file).then(fileSnapshot => {
      fileSnapshot.ref.getDownloadURL()
        .then(url => {
          // Añadir firestore loged user
          this.sendImgFriend(this.userAuth, this.uidFriendSelected, url, imgName)
            .subscribe(
              (response) => {
                var msgid = response['message'];

                // Subir imagen storage friend
                this.firestorage.ref(filePathFriend).put(file).then(fileSnapshot => {
                  fileSnapshot.ref.getDownloadURL()
                    .then(url => {
                      // Añadir firestore friend
                      this.sendImgWithId(msgid, this.userAuth, this.uidFriendSelected, url, imgName)
                        .subscribe(() => {
                          // Comprobar chat abierto marcar leídos
                          this.checkUserChat(msgid);
                        });
                    });
                });
              });
        });
    });
  }

  /**
   * Enviar imagen a amigo
   * @param emisor 
   * @param receptorUID 
   * @param url 
   * @param nombreImg 
   * @returns 
   */
  sendImgFriend(emisor: any, receptorUID: any, urlPhoto: string, namePhoto: any) {
    const url = `${environment.dirBack}sendImgFriend/${emisor.uid}/${receptorUID}`;
    let headers = new HttpHeaders({ Authorization: `Bearer ${this.tokenUser}` });
    return this.http.put(url, { 'user': emisor, 'urlPhoto': urlPhoto, 'namePhoto': namePhoto }, { headers: headers });
  }

  /**
   * Enviar imagen a amigo estableciendole el id al mensaje para que sea el mismo en ambos mensajes
   * @param id 
   * @param emisor 
   * @param receptorUID 
   * @param url 
   * @param nombreImg 
   * @returns 
   */
  sendImgWithId(id: string, emisor: any, receptorUID: any, urlPhoto: string, namePhoto: any) {
    const url = `${environment.dirBack}sendImgFriendId/${emisor.uid}/${receptorUID}/${id}`;
    let headers = new HttpHeaders({ Authorization: `Bearer ${this.tokenUser}` });
    return this.http.put(url, { 'user': emisor, 'urlPhoto': urlPhoto, 'namePhoto': namePhoto }, { headers: headers });
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ DELETE MESSAGES ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  /**
   * Elimina un mensaje
   * @param message mensaje seleccionado para borrar
   * @param type 1: eliminar para mi // 2: eliminar para todos
   */
  deleteMsgs(message: any, type: number) {
    this.sonidito(2);

    // Eliminar para mi
    this.deleteMessages(this.userAuth.uid, this.uidFriendSelected, message);

    // Eliminar para todos
    if (type == 2) {
      this.deleteMessages(this.uidFriendSelected, this.userAuth.uid, message);
    }
  }

  /**
   * Elimina un mensaje del chat, en el caso que tenga foto asociada la
   * elimina también del storage
   * @param uidEmisor 
   * @param uidReceptor 
   * @param message 
   */
  deleteMessages(uidEmisor: string, uidReceptor: string, message: any) {
    var photoName = null;
    if (message.storageRef) {
      photoName = message.storageRef;
    }

    const url = `${environment.dirBack}deleteMessage/${uidEmisor}/${uidReceptor}/${message.id}/${photoName}`;
    let headers = new HttpHeaders({ Authorization: `Bearer ${this.tokenUser}` });
    this.http.delete(url, { headers: headers })
      .subscribe(() => { });
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~CLOSE CHAT~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  /**
   * Cierra el chat abierto
   */
  closeChat() {
    this.getUser();
    this.uidFriendSelected = '';
    this.chatEnabled = false;
    var uidFriend = 'none';

    const url = `${environment.dirBack}setChatOpen/${this.userAuth.uid}/${uidFriend}`;
    let headers = new HttpHeaders({ Authorization: `Bearer ${this.tokenUser}` });
    this.http.put(url, { headers: headers })
      .subscribe(
        (response) => {
          console.log('RESPONSE: ', response);
        });
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~STOP LISTENING ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  /**
  * Parar escucha de los mensajes del amigo. Este método se llama al cerrar sesión y 
  * a la hora de cargar los amigos, así en caso de que se añada una nuevo, se reiniciará la escucha
  */
  stopListeningReListenFM(type: number) {
    this.listeningSnapsMessages.forEach(unsubscribe => {
      unsubscribe();
    });

    if(type == 2) {
      this.listenFriendMessages();
    }
  }

  /**
  * Parar escucha los amigos. Este método se llama al cerrar sesión
  */
  stopListeningFriends() {
    this.listeningFriends.forEach(unsubscribe => {
      unsubscribe();
    });
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~DELETE CHAT~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  /**
   * Vacia el chat del usuario logeado
   * @param deleteImg boolean: borrar imagenes tmb o no
   */
  deleteChat(deleteImg: boolean) {
    const url = `${environment.dirBack}deleteChat/${this.userAuth.uid}/${this.uidFriendSelected}/${deleteImg}`;
    let headers = new HttpHeaders({ Authorization: `Bearer ${this.tokenUser}` });
    this.http.delete(url, { headers: headers })
      .subscribe(
        (response) => {
          this.sonidito(3);
          console.log(response);
        });
  }


  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ GET IMAGES WITH USER ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  /**
   * Cargar imágenes de un chat
   */
  getImagenesChat() {
    this.urlImgsChat = [];

    const url = environment.dirBack + "getImgsChat";
    let headers = new HttpHeaders({ Authorization: `Bearer ${this.tokenUser}` });
    return this.http.post(url, { 'uid': this.userAuth.uid, uidFriend: this.uidFriendSelected }, { headers: headers });

  }


}
