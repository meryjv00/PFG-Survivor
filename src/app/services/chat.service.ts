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

  msgEnviar = ''; // Variable ngmodel de enviar mensaje !!!Cambiar

  userAuth: any | null; // Usuario guardado en session storage para obtener bien los datos al recargar la pagina
  friends = []; // Lista de amigos
  messagesFriends = []; // Array de mensajes de tus amigos
  messagesWithFriend = []; // Array de mensajes de amigos ya convertidos: mensajes que se van mostrando en cada chat
  uidFriendSelected = ''; // Amigo seleccionado al cambiar de chat
  chatEnabled = false; // Se activa cuando se pulsa un chat, permite ver los mensajes
  listeningSnapsMessages = []; // Array que contiene los escuchas de los amigos para poder desactivarlos al cerrar

  constructor(
    private router: Router) {
  }

  getUser() {
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
  getFriends(login: boolean) {
    console.log('OBTENIENDO AMIGOS...');

    this.friends = [];

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
      console.log('IR A PONER EN ESCUCHA MENSAJES AMIGOS');
      this.listenFriendMessages(login);

    });

  }

  chatWith(uid: any) {
    var db = firebase.firestore();

    this.messagesWithFriend = [];
    this.uidFriendSelected = uid;

    this.messagesFriends.forEach(user => {
      if (user.uid == uid) {
        this.messagesWithFriend = user.messages;

        console.log('HACIENDOOOOOO', this.messagesWithFriend);
        // Poner en leído los mensajes del chat correspondiente
        this.messagesWithFriend.forEach(msg => {
          if (msg.displayName != this.userAuth.displayName && msg.isRead == false) {
            // Pongo en leido sus mensajes en su cuenta
            db.collection('users').doc(this.uidFriendSelected).collection('friends')
              .doc(this.userAuth.uid).collection('messages').doc(msg.id).update({
                isRead: true,
              }).then(ok => {
                console.log('Marcado como leído en su cuenta', msg.id);
              })
              .catch(function (error) {
                console.error('Error writing new message to database', error);
              });
            // Pongo en leído sus mensajes en mi cuenta
            db.collection('users').doc(this.userAuth.uid).collection('friends')
              .doc(this.uidFriendSelected).collection('messages').doc(msg.id).update({
                isRead: true,
              }).then(ok => {
                console.log('Marcado como leído en mi cuenta', msg.id);
              })
              .catch(function (error) {
                console.error('Error writing new message to database', error);
              });

            msg.isRead = true;
          }

        });
      }
    });
    this.chatEnabled = true;
  }

  listenFriendMessages(login: boolean) {
    this.messagesFriends = [];
    var msgs = [];
    var msg: any;
    var readMessage = true;

    if (this.friends.length > 0) {
      this.friends.forEach(friend => {
        console.log('Recorriendo amigos para recibir sus mensajes...');
        msgs = [];
        this.getUser();
        console.log(this.userAuth);

        var query = firebase.firestore()
          .collection('users').doc(this.userAuth.uid).collection('friends')
          .doc(friend.uid).collection('messages')
          .orderBy('timestamp', 'asc')

        var unsubscribe = query.onSnapshot(snapshot => {
          snapshot.docChanges().forEach(change => {
            readMessage = true;
            // Mensaje eliminado
            if (change.type === 'removed') {
              console.log(change.doc.id);
              readMessage = false;
              this.messagesFriends.forEach(user => {
                if (user.uid == this.uidFriendSelected) {
                  user.messages.forEach((message, index) => {
                    if (message.id == change.doc.id) {
                      console.log('Mensaje borrado: ', message.id);
                      user.messages.splice(index, 1);
                    }
                  });
                }
              });
              console.log('Lista de mensajes', this.messagesFriends);
            }
            // Mensaje actualizado (marcado como leído)
            else if (change.type === 'modified') {
              console.log(change.doc.id);
              readMessage = false;
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
            //Mensaje recibido
            else {
              var hora = '';
              hora += change.doc.data().timestamp.toDate().getHours() + ':' +
                change.doc.data().timestamp.toDate().getMinutes() + ':' +
                change.doc.data().timestamp.toDate().getSeconds();

              const message = {
                'id': change.doc.id,
                'displayName': change.doc.data().displayName,
                'text': change.doc.data().text,
                'isRead': change.doc.data().isRead,
                'photoURL': change.doc.data().photoURL,
                'timestamp': hora,
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
                if (user.uid == friend.uid || user.uid == this.userAuth.uid) {
                  // console.log('Estado: encontrado');
                  encontrado = true;
                  console.log(user.messages);

                  user.messages[user.messages.length] = msg;
                }
              });
            }
            if (!encontrado) {
              // console.log('Estado: no encontrado');
              this.messagesFriends.push({ 'uid': friend.uid, 'messages': msgs });
            }

            msgs = [];
          }

          // console.log('Lista mensajes amigos convertida');
          // console.log(this.messagesFriends);

        });

        // Añadir al array para poder dejar de escuchar al cerrar sesión y q al volver a entrar no vuelva 
        // a escuchar y x lo tanto haya duplicidad de mensajes
        this.listeningSnapsMessages.push(unsubscribe);

        if (login == true) {
          console.log('Redirigiendo perfil...');
          this.router.navigate(['perfil']);
        }

      });
    } else {
      if (login == true) {
        console.log('Redirigiendo perfil... No tienes amigos');
        this.router.navigate(['perfil']);
      }
    }

  }

  sendMessageFriend() {
    var db = firebase.firestore();
    var msg = this.msgEnviar;

    // Insertar en mis amigos/mensajes
    db.collection('users').doc(this.userAuth.uid).collection('friends')
      .doc(this.uidFriendSelected).collection('messages').add({
        displayName: this.userAuth.displayName,
        text: this.msgEnviar,
        photoURL: this.userAuth.photoURL,
        isRead: false,
        timestamp: firebase.firestore.Timestamp.now(),
      })
      .then(ok => {
        // console.log('Añadido en mis mensajes');
        this.msgEnviar = '';

        // Una vez añadido en mis mensajes, se añadirá en los suyos
        // para poder insertar el mismo uid en ambos sitios, esto 
        // nos servirá a la hora de eliminar mensajes en ambos chats

        //Insertar en sus amigos/mensajes
        db.collection('users').doc(this.uidFriendSelected).collection('friends')
          .doc(this.userAuth.uid).collection('messages').doc(ok.id).set({
            displayName: this.userAuth.displayName,
            text: msg,
            photoURL: this.userAuth.photoURL,
            isRead: false,
            timestamp: firebase.firestore.Timestamp.now(),
          }).then(ok => {
            // console.log('Añadido en sus mensajes');
          })
          .catch(function (error) {
            console.error('Error writing new message to database', error);
          });

      })
      .catch(function (error) {
        console.error('Error writing new message to database', error);
      });


  }


  stopListenFriendMessages() {
    console.log('Parando escucha mensajes amigos...');
    // Recorrer todos los mensajes en escucha y eliminarlos
    this.listeningSnapsMessages.forEach(unsubscribe => {
      console.log('Desactivando...');
      unsubscribe();
    });
  }


  deleteMsgs(message: any, type: number) {
    var db = firebase.firestore();

    console.log(message);
    db.collection('users').doc(this.userAuth.uid).collection('friends')
      .doc(this.uidFriendSelected).collection('messages').doc(message.id).delete().then(() => {
        console.log("Document successfully deleted!");
      }).catch((error) => {
        console.error("Error removing document: ", error);
      });

    if (type == 2) {
      console.log('Eliminar para todos');
      db.collection('users').doc(this.uidFriendSelected).collection('friends')
        .doc(this.userAuth.uid).collection('messages').doc(message.id).delete().then(() => {
          console.log("Document successfully deleted!");
        }).catch((error) => {
          console.error("Error removing document: ", error);
        });

    }

  }

}
