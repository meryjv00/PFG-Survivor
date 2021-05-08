import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import firebase from 'firebase/app';
import 'firebase/firestore';
import { environment } from 'src/environments/environment';
import * as _ from "lodash";
import { AngularFireStorage } from '@angular/fire/storage';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  msgEnviar = ''; // Variable ngmodel de enviar mensaje !!!Cambiar
  userAuth: any | null; // Usuario guardado en session storage para obtener bien los datos al recargar la pagina
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
  // Avisa al componente de que se ha recibido/enviado un nuevo mensaje para que el scroll baje automáticamente
  private countdownEndSource = new Subject<void>();
  public countdownEnd$ = this.countdownEndSource.asObservable();
  suggestedFriends = []; // Sugerencias de amigos "Amigos de mis amigos"
  sentRequested = []; // uid amigos a los que envie solic
  msgsWithoutRead2 = [];

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~CONSTRUCTOR~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  constructor(
    private router: Router,
    public firestorage: AngularFireStorage) {
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
  }

  /**
   * Marca el usuario como conectado
   */
  setStatusOnOff(type: number) {
    var db = firebase.firestore();
    this.getUser();
    if (type == 1) {
      console.log('User ON');
      db.collection("users").doc(this.userAuth.uid).update({
        status: 'online'
      });
    } else {
      console.log('User OFF');
      db.collection("users").doc(this.userAuth.uid).update({
        status: 'offline'
      });
    }
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
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~GET FRIENDS~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  /**
   * Cargar amigos
   * @param login True: viene de login // False: recargar página
   */
  getFriends(login: boolean) {
    var db = firebase.firestore();
    console.log('Obteniendo amigos...');
    var contAmigos = 0;
    this.friends = [];
    this.getUser();

    var query = db.collection('users').doc(this.userAuth.uid).collection('friends')

    // Obtener nº de amigos, si en caso de tener 0, no carga mensajes ni nada
    query.get().then((doc) => {
      doc.forEach(function () {
        contAmigos++;
      });
      // No tienes amigos por lo que la var se establece a true para mostrar la pág
      // No se sigue con la ejecución del método ya que no hay amigos que cargar y por lo tanto mensajes asociados
      if (contAmigos == 0) {
        this.gotAllMessages = true;
        return;
      }
    });

    var unsubscribe = query.onSnapshot(snapshot => {
      snapshot.docChanges().forEach((change, index) => {
        var cont = 0;
        // Obtener nº de amigos, es necesario para que si se añade un nuevo amigo, se vuelva a obtener el nº total
        // por lo que hasta que no acabe de obtenerlos todos, no se pondrán en escucha los mensajes correspondientes a cada chat
        query.get().then((doc) => {
          doc.forEach(function () {
            cont++;
          });
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
            db.collection("users").doc(change.doc.id).get()
              .then((doc) => {
                // Obtener desde cuando son amigos
                db.collection('users').doc(this.userAuth.uid).collection('friends').doc(change.doc.id).get()
                  .then(docuAmig => {
                    var date = '';
                    date += docuAmig.data().friendshipDate.toDate();

                    const friend = {
                      'uid': change.doc.id,
                      'status': doc.data().status,
                      'displayName': doc.data().displayName,
                      'photoURL': doc.data().photoURL,
                      'email': doc.data().email,
                      'coins': doc.data().coins,
                      'friendshipDate': date.substring(4, 15)
                    }
                    this.friends.push(friend);

                    // Pone en escucha los datos de ese usuario
                    var unsubscribe2 = db.collection("users").doc(change.doc.id)
                      .onSnapshot({
                        includeMetadataChanges: true
                      }, (doc) => {
                        // Buscar usuario y actualizar sus datos
                        this.friends.forEach(friend => {
                          if (friend.uid == change.doc.id) {
                            friend.status = doc.data().status;
                          }
                        });
                      });
                    this.listeningFriends.push(unsubscribe2);

                    // Ultima pos del array -> se redirige a poner en escucha todos los mensajes de los amigos obtenidos
                    if (cont == index + 1) {
                      this.stopListeningFriendMessages(false, 2); //login
                      this.getSuggestedFriends();
                    } else {
                      // Se ha añadido un nuevo mensaje
                      if (cont != contAmigos) {
                        this.stopListeningFriendMessages(false, 2);
                        this.getSuggestedFriends();
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
 * Sugerencias de amigos "Amigos de mis amigos"
 */
  getSuggestedFriends() {
    var db = firebase.firestore();
    this.suggestedFriends = [];

    //Buscar en las peticiones de amistad que yo he enviado
    db.collection('users').doc(this.userAuth.uid).collection('sentFriendsRequests').get().then((doc) => {
      doc.forEach(docu => {
        this.sentRequested.push(docu.id);
      });

      // Recorrer mis amigos para buscar los amigos de cada uno
      this.friends.forEach(friend => {
        db.collection('users').doc(friend.uid).collection('friends').get().then((doc) => {
          //console.log('AMIGOOOOOOOOOOOO => ', friend.uid);
          doc.forEach(docu => {
            //Buscar datos del usuario quitando a el usuario conectado
            if (docu.id != this.userAuth.uid) {
              db.collection('users').doc(docu.id).get().then((doc) => {
                //console.log(docu.id);
                var encontrado = false;
                // Recorro la lista de mis amigos
                this.friends.forEach(friend => {
                  if (friend.uid == docu.id) {
                    encontrado = true;
                  }
                });

                // Recorro la lista de sugerencias
                this.suggestedFriends.forEach(suggestedFriend => {
                  if (suggestedFriend.uid == docu.id) {
                    encontrado = true;
                  }
                });

                // Recorro la lista de peticiones de amistad enviadas
                this.sentRequested.forEach(uidRequested => {
                  if (uidRequested == docu.id) {
                    encontrado = true;
                  }
                });

                // En caso de que no se haya encontrado se agrega
                if (!encontrado) {
                  const friend = {
                    'uid': docu.id,
                    'status': doc.data().status,
                    'displayName': doc.data().displayName,
                    'photoURL': doc.data().photoURL,
                    'email': doc.data().email,
                    'coins': doc.data().coins,
                    'relation': 'unknown'
                  }
                  this.suggestedFriends.push(friend);
                }
              });
            }
          });
        });

      });

    });

  }


  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~LISTEN FRIEND MESSAGES~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  /**
   * Pone en escucha los mensajes de todos los amigos
   * para recibir en tiempo real cualquier cambio
   * @param login 
   */
  listenFriendMessages(login: boolean) {
    console.log('Entro a escuchar mensajes...');

    var db = firebase.firestore();
    this.getUser();
    this.messagesFriends = [];
    this.messagesWithoutRead = [];
    this.msgsWithoutRead2 = [];
    var msgs = [];
    var msg: any;
    var readMessage = true;

    if (this.friends.length > 0) {
      this.friends.forEach((friend, index) => {
        // console.log('Recorriendo amigos para recibir sus mensajes...');
        msgs = [];

        var query = db.collection('users').doc(this.userAuth.uid).collection('friends')
          .doc(friend.uid).collection('messages')
          .orderBy('timestamp', 'asc')

        var unsubscribe = query.onSnapshot(snapshot => {
          snapshot.docChanges().forEach(change => {
            // Mensaje eliminado
            if (change.type === 'removed') {
              readMessage = false;
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
              console.log('Actualizando leido');
              readMessage = false;
              this.messagesFriends.forEach(user => {
                if (user.uid == this.uidFriendSelected) { //friend.uid alternativa
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
              readMessage = true;
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
                'photoURL': change.doc.data().photoURL,
                'storageRef': change.doc.data().storageRef,
                'timestamp': h.substring(16, 21),
                'day': h.substring(8, 11) + h.substring(4, 7)
              }
              msgs.push(message);
              msg = message;
            }
          });

          // Sólo realizar cuando se leen los mensajes o se añade nuevo mensaje
          if (readMessage) {
            var encontrado = false;
            if (this.messagesFriends.length > 0) {
              this.messagesFriends.forEach(user => {
                // Cargar un solo mensaje al enviar o recibir
                if (user.uid == friend.uid || user.uid == this.userAuth.uid) {
                  encontrado = true;
                  // console.log(user.messages);
                  user.messages[user.messages.length] = msg;
                  // Recibes nuevo mensaje: evento para bajar scroll
                  this.countdownEndSource.next();

                  // Comprobar el chat que tengo abierto
                  db.collection("users").doc(this.userAuth.uid).get()
                    .then((doc) => {
                      // En caso de no tener el chat abierto añadimos un mensaje más sin leer
                      if (doc.data().chatOpen != friend.uid) {
                        if (msg.uid == friend.uid && msg.isRead == false) { //!!!!
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
              this.messagesFriends.push({
                'uid': friend.uid,
                'displayName': friend.displayName,
                'photoURL': friend.photoURL,
                'messages': msgs
              });
              // Recorro los mensajes en busca de aquellos que tengan mi nombre y que el atributo read sea false
              var cont = 0;
              msgs.forEach(msg => {
                if (msg.uid == friend.uid && msg.isRead == false) { // !!!!!!!!!!!
                  // console.log('mensaje sin leer: ', friend.uid, msg.id);
                  cont++;
                }
              });
              this.messagesWithoutRead.push({
                'uid': friend.uid,
                'displayName': friend.displayName,
                'photoURL': friend.photoURL,
                'messages': cont
              });
            }
            msgs = [];
          }

          //console.log(this.messagesWithoutRead[index].messages);
          // console.log('Lista mensajes amigos', this.messagesFriends);
          setTimeout(() => {
            // console.log('HOLA', this.messagesWithoutRead[index].messages);
            if (this.messagesWithoutRead[index].messages > 0) {
              var enc = false;
              //console.log('Hay mensajes sin leer', this.messagesWithoutRead[index].uid);
              this.msgsWithoutRead2.forEach(msg => {
                if (msg.uid == this.messagesWithoutRead[index].uid) {
                  enc = true;
                  var ms = this.messagesWithoutRead[index].messages;
                  msg.messages = ms++;
                }
              });
              if (!enc) {
                this.msgsWithoutRead2.push({ 'uid': friend.uid, 'messages': this.messagesWithoutRead[index].messages });
              }
            }
            //Buscarlo y borrarlo
            else {
              this.msgsWithoutRead2.forEach((msg, index2) => {
                if (msg.uid == this.messagesWithoutRead[index].uid) {
                  this.msgsWithoutRead2.splice(index2, 1);
                }
              });
            }
          }, 500);

          // console.log(this.msgsWithoutRead2);

          // Ha terminado de obtener los mensajes
          if (this.friends.length - 1 == index && this.gotAllMessages == false) {
            console.log(this.msgsWithoutRead2);
            this.gotAllMessages = true;
            console.log('Termine');
          }

        });

        // Añadir al array para poder dejar de escuchar al cerrar sesión y q al volver a entrar no vuelva a escuchar y x lo tanto haya duplicidad de mensajes
        this.listeningSnapsMessages.push(unsubscribe);

        // En caso de venir de login y no de recargar la página se redirige al perfil
        if (login == true) {
          console.log('Navegando perfil');
          this.router.navigate(['perfil']);
        }
      });
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

    var db = firebase.firestore();
    this.messagesWithFriend = [];
    this.uidFriendSelected = friend.uid;
    this.friendSelected = friend;

    this.messagesFriends.forEach(user => {
      if (user.uid == friend.uid) {
        this.messagesWithFriend = user.messages;
        console.log('Mensajes del chat abierto: ', this.messagesWithFriend);

        // Guardar el chat q esta abierto para desps poder marcar como leído un mensaje si tengo el chat abierto
        db.collection("users").doc(this.userAuth.uid).update({
          chatOpen: user.uid,
        });

        // Poner en leído los mensajes del chat correspondiente
        this.messagesWithFriend.forEach(msg => {
          if (msg.uid != this.userAuth.uid && msg.isRead == false) { // !!!
            // Pongo en leido sus mensajes en su cuenta
            db.collection('users').doc(this.uidFriendSelected).collection('friends')
              .doc(this.userAuth.uid).collection('messages').doc(msg.id).update({
                isRead: true,
              });
            // Pongo en leído sus mensajes en mi cuenta
            db.collection('users').doc(this.userAuth.uid).collection('friends')
              .doc(this.uidFriendSelected).collection('messages').doc(msg.id).update({
                isRead: true,
              });

            msg.isRead = true;
          }
        });
        // Marcar en leído también en el array que te notifica cuantos te faltan x leer
        this.messagesWithoutRead.forEach(msg => {
          if (msg.uid == user.uid) {
            msg.messages = 0;
          }
        });

      }
    });
    this.chatEnabled = true;
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~SEND MESSAGE TO FRIEND~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  /**
   * Enviar mensaje al amigo cuyo chat tienes abierto
   */
  sendMessageFriend() {
    var db = firebase.firestore();
    var msg = this.msgEnviar;

    // Insertar en mis amigos/mensajes
    db.collection('users').doc(this.userAuth.uid).collection('friends')
      .doc(this.uidFriendSelected).collection('messages').add({
        uid: this.userAuth.uid,
        displayName: this.userAuth.displayName,
        text: this.msgEnviar,
        photoURL: this.userAuth.photoURL,
        isRead: false,
        timestamp: firebase.firestore.Timestamp.now(),

      })
      .then(ok => {
        // console.log('Añadido en mis mensajes');
        this.msgEnviar = '';
        // Una vez añadido en mis mensajes, se añadirá en los suyos para poder insertar el mismo uid en ambos sitios, esto nos servirá a la hora de eliminar mensajes en ambos chats

        //Insertar en sus amigos/mensajes
        db.collection('users').doc(this.uidFriendSelected).collection('friends')
          .doc(this.userAuth.uid).collection('messages').doc(ok.id).set({
            uid: this.userAuth.uid,
            displayName: this.userAuth.displayName,
            text: msg,
            photoURL: this.userAuth.photoURL,
            isRead: false,
            timestamp: firebase.firestore.Timestamp.now(),
          })
          .then(okk => {
            // Comprobar si el usuario receptor tiene tu chat abierto, en ese caso actualizar como leído
            db.collection("users").doc(this.uidFriendSelected).get()
              .then((doc) => {
                if (doc.data().chatOpen == this.userAuth.uid) {
                  // Pongo en leido sus mensajes en su cuenta
                  db.collection('users').doc(this.uidFriendSelected).collection('friends')
                    .doc(this.userAuth.uid).collection('messages').doc(ok.id).update({
                      isRead: true,
                    })
                  // Pongo en leído sus mensajes en mi cuenta
                  db.collection('users').doc(this.userAuth.uid).collection('friends')
                    .doc(this.uidFriendSelected).collection('messages').doc(ok.id).update({
                      isRead: true,
                    })
                }
              });
          });
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
    var db = firebase.firestore();
    var file = event.target.files[0];
    var az = Math.floor(Math.random() * 100000000);
    var filePath1 = 'images/' + this.userAuth.uid + '/' + this.uidFriendSelected + '/' + az;
    var filePath2 = 'images/' + this.uidFriendSelected + '/' + this.userAuth.uid + '/' + az;

    this.firestorage.ref(filePath1).put(file).then(fileSnapshot => {
      return fileSnapshot.ref.getDownloadURL()
        .then(url => {
          console.log('Foto subida', url);

          db.collection('users').doc(this.userAuth.uid).collection('friends')
            .doc(this.uidFriendSelected).collection('messages').add({
              uid: this.userAuth.uid,
              displayName: this.userAuth.displayName,
              imageURL: url,
              photoURL: this.userAuth.photoURL,
              isRead: false,
              storageRef: az,
              timestamp: firebase.firestore.Timestamp.now(),
            }).then(messageRef => {

              this.firestorage.ref(filePath2).put(file).then(fileSnapshot => {
                return fileSnapshot.ref.getDownloadURL()
                  .then(url => {
                    db.collection('users').doc(this.uidFriendSelected).collection('friends')
                      .doc(this.userAuth.uid).collection('messages').doc(messageRef.id).set({
                        uid: this.userAuth.uid,
                        displayName: this.userAuth.displayName,
                        imageURL: url,
                        photoURL: this.userAuth.photoURL,
                        isRead: false,
                        storageRef: az,
                        timestamp: firebase.firestore.Timestamp.now(),
                      })
                      .then(okk => {
                        // Comprobar si el usuario receptor tiene tu chat abierto, en ese caso actualizar como leído
                        db.collection("users").doc(this.uidFriendSelected).get()
                          .then((doc) => {
                            if (doc.data().chatOpen == this.userAuth.uid) {
                              // Pongo en leido sus mensajes en su cuenta
                              db.collection('users').doc(this.uidFriendSelected).collection('friends')
                                .doc(this.userAuth.uid).collection('messages').doc(messageRef.id).update({
                                  isRead: true,
                                })
                              // Pongo en leído sus mensajes en mi cuenta
                              db.collection('users').doc(this.userAuth.uid).collection('friends')
                                .doc(this.uidFriendSelected).collection('messages').doc(messageRef.id).update({
                                  isRead: true,
                                })
                            }
                          });
                      });
                  });
              });
            });
        });
    });
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~DELETE MESSAGE~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  /**
   * Elimina un mensaje
   * @param message mensaje seleccionado para borrar
   * @param type 1: eliminar para mi // 2: eliminar para todos
   */
  deleteMsgs(message: any, type: number) {
    this.sonidito(2);

    var db = firebase.firestore();

    db.collection('users').doc(this.userAuth.uid).collection('friends')
      .doc(this.uidFriendSelected).collection('messages').doc(message.id).delete()
      // Comprobar si tiene foto asociada y en ese caso eliminarla
      .then(ok => {
        if (message.storageRef) {
          var path = 'images/' + this.userAuth.uid + '/' + this.uidFriendSelected + '/' + message.storageRef;
          this.firestorage.ref(path).delete();
        }
      });

    // Eliminar para todos
    if (type == 2) {
      db.collection('users').doc(this.uidFriendSelected).collection('friends')
        .doc(this.userAuth.uid).collection('messages').doc(message.id).delete()
        .then(ok => {
          if (message.storageRef) {
            var path = 'images/' + this.uidFriendSelected + '/' + this.userAuth.uid + '/' + message.storageRef;
            this.firestorage.ref(path).delete();
          }
        });
    }
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~CLOSE CHAT~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  /**
   * Cierra el chat abierto
   */
  closeChat() {
    //console.log('CERRANDO CHAT');

    var db = firebase.firestore();
    this.getUser();
    this.uidFriendSelected = '';
    this.chatEnabled = false;

    db.collection("users").doc(this.userAuth.uid).update({
      chatOpen: ''
    });
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~STOP LISTENING ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  /**
  * Parar escucha de los mensajes del amigo. Este método se llama al cerrar sesión y 
  * a la hora de cargar los amigos, así en caso de que se añada una nuevo, se reiniciará la escucha
  */
  stopListeningFriendMessages(login: boolean, type: number) {
    //console.log('Parando escucha mensajes amigos...');
    // Recorrer todos los mensajes en escucha y eliminarlos
    this.listeningSnapsMessages.forEach(unsubscribe => {
      //console.log('Desactivando...MSJ_A');
      unsubscribe();
    });

    if (type == 2) {
      this.listenFriendMessages(login);
    }

  }

  /**
  * Parar escucha los amigos. Este método se llama al cerrar sesión
  */
  stopListeningFriends() {
    //console.log('Parando escucha amigos...');
    this.listeningFriends.forEach(unsubscribe => {
      //console.log('Desactivando...A');
      unsubscribe();
    });
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~DELETE CHAT~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  /**
   * Elimina los mensajes del chat seleccionado
   */
  deleteChat() {
    this.sonidito(3);
    var db = firebase.firestore();
    var query = db.collection("users").doc(this.userAuth.uid).collection('friends').doc(this.uidFriendSelected).collection('messages');
    query.get()
      .then((doc) => {
        doc.forEach(change => {
          query.doc(change.id).delete();
        });
        // Preguntar si quiere borrarlas
        // Eliminar imagenes del chat correspondiente
        var path = 'images/' + this.userAuth.uid + '/' + this.uidFriendSelected;

        const ref = firebase.storage().ref(path);
        ref.listAll()
          .then(dir => {
            dir.items.forEach(fileRef => {
              var path = 'images/' + this.userAuth.uid + '/' + this.uidFriendSelected + '/' + fileRef.name;
              this.firestorage.ref(path).delete();
            });
          });

      });
  }

}
