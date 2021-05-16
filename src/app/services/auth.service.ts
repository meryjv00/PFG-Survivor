import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { map } from 'rxjs/operators';
import firebase from 'firebase/app';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { ChatService } from './chat.service';
import { FriendsService } from './friends.service';
import { RankingsService } from './rankings.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Variables
  // Login
  emailLogin = '';
  passLogin = '';
  // Registro
  emailRegistro = '';
  nombreRegistro = '';
  passRegistro = '';
  // Pass olvidada
  emailPass = '';
  // User
  authUser = null;
  user = null;
  loginRecharge: boolean = true;
  userAuth: any | null;
  providerId: string = null;
  listeningUser = [];

  constructor(public auth: AngularFireAuth,
    private router: Router,
    private chat: ChatService,
    private friends: FriendsService,
    private rankings: RankingsService) { }


  /**
   * Información usuario logeado
   */
  userState = this.auth.authState.pipe(map(authState => {
    if (authState) {
      this.authUser = authState;
      this.providerId = this.authUser.providerData[0].providerId;
      
      return authState;
    } else {
      return null;
    }
  }))

  /**
   * Método que se llama desde los constructores de los componentes para en el caso de haber
   * recargado volver a establecer esta variable a false
   */
  setRechargeFalse() {
    this.loginRecharge = false;
  }

  /**
   * Método que llama a todos los métodos necesarios para obtener todos los datos para iniciar sesión
   * Amigos, escuchar mensajes de amigos, peticiones de amistad...
   * @param user 
   */
  prepareLogin(user: any) {
    localStorage.setItem(environment.SESSION_KEY_USER_AUTH, JSON.stringify(user));
    this.updateUserData(user);
    this.loginRecharge = false;
    this.friends.listenFriendsRequests();
    this.friends.listenSentFriendsRequests();
    this.chat.getFriends();
    this.rankings.stopListeningRankingsItems();
    this.rankings.setGetRankingsTrue();
    this.rankings.getPositionRankings();
    this.rankings.getPositionRankingCoins();
    this.router.navigate(['home']);
  }

  /**
  * Registro con email y contraseña
  * @returns 
  */
  registro() {
    return this.auth.createUserWithEmailAndPassword(this.emailRegistro, this.passRegistro)
      .then(user => {
        // console.log('Usuario registrado con email: ', user);
        this.authUser = user.user;
      })
  }

  /**
   * Establece el nombre que ha introducido y una foto por defecto a un usuario que acaba de realizar el registro
   * @returns 
   */
  updateProfile() {
    return this.authUser.updateProfile({
      displayName: this.nombreRegistro,
      photoURL: 'https://www.softzone.es/app/uploads/2018/04/guest.png'
    }).then(ok => {
      this.prepareLogin(this.authUser);
    });
  }

  /**
   * Login con email y contraseña
   * @returns 
   */
  login() {
    return this.auth.signInWithEmailAndPassword(this.emailLogin, this.passLogin)
      .then(user => {
        // console.log("Usuario logeado con email: ", user);
        this.authUser = user.user;
        this.prepareLogin(user.user);
      });
  }

  /**
   * Login con cuenta de Google
   */
  loginGoogle() {
    return this.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider())
      .then(user => {
        // console.log("Usuario logeado con Google: ", user);
        this.authUser = user.user;
        this.prepareLogin(user.user);
      })
  }

  /**
   * Login con cuenta de Facebook
   */
  loginFacebook() {
    return this.auth.signInWithPopup(new firebase.auth.FacebookAuthProvider())
      .then(user => {
        //console.log("Usuario logeado con Facebook: ", user);
        this.authUser = user.user;

        // En el caso de tener la foto de facebook por defecto se le establece la que tenga el usuario en fb
        if (user.user.photoURL.startsWith('https://graph.facebook.com/')) {
          user.user.updateProfile({
            photoURL: user.additionalUserInfo.profile['picture']['data']['url']
          }).then(ok => {
            this.prepareLogin(user.user);
          });
        } else {
          this.prepareLogin(user.user);
        }
      })
  }

  /**
   * Cerrar sesión cuenta
   */
  logout() {
    this.user = null;
    this.auth.signOut();
    this.setRechargeFalse();
    this.rankings.stopListeningRankingsItems();
    this.chat.setStatusOnOff(2);
    this.stopListeningUser();
    this.chat.stopListeningFriendMessages(false, 1);
    this.chat.stopListeningFriends();
    this.friends.stopListeningFriendsRequests();
    this.friends.stopListeningSentFriendsRequests();
    this.chat.closeChat();
    this.friends.resetSearchFriends();
    this.rankings.setGetRankingsTrue();
    this.limpiarFormularios();

    setTimeout(() => {
      localStorage.removeItem(environment.SESSION_KEY_USER_AUTH)
    }, 500);
    this.router.navigate(['home']);
  }

  /**
   * Guardar usuario en base de datos
   * @param user 
   */
  updateUserData(user: any) {
    var db = firebase.firestore();

    db.collection("users").doc(user.uid).get()
      .then((doc) => {
        // No está registrado
        if (doc.data() == undefined) {
          db.collection("users").doc(user.uid).set({
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            chatOpen: "",
            status: 'online',
            coins: 10,
          }).then(() => {
            // Poner en escucha al usuario
            this.listenDataLogedUser();
          });
        }
        // Si está registrado
        else {
          db.collection("users").doc(user.uid).update({
            status: 'online'
          }).then(() => {
            // Poner en escucha al usuario
            this.listenDataLogedUser();
          });
        }

      });

  }

  /**
   * Pone en escucha los datos del usuario, se llama al iniciar sesión y recargar página
   */
  listenDataLogedUser() {
    var db = firebase.firestore();
    this.userAuth = localStorage.getItem(environment.SESSION_KEY_USER_AUTH);
    this.userAuth = JSON.parse(this.userAuth);
    
    var unsubscribe = db.collection("users").doc(this.userAuth.uid)
      .onSnapshot({
        includeMetadataChanges: true
      }, (doc) => {
        this.user = {
          'uid': doc.id,
          'status': doc.data().status,
          'displayName': doc.data().displayName,
          'photoURL': doc.data().photoURL,
          'email': doc.data().email,
          'coins': doc.data().coins,
        }
      });

      this.listeningUser.push(unsubscribe);
  }

  /**
   * Se para la escucha de los metadatos del usuario logeado
   */
  stopListeningUser() {
    this.listeningUser.forEach(unsubscribe => {
      // console.log('Desactivando USER...');
      unsubscribe();
    });
  }

  /**
   * Envía correo al email introducido donde se le permite cambiar la contraseña de la cuenta.
   */
  sendPasswordResetEmail() {
    return this.auth.sendPasswordResetEmail(this.emailPass)
      .then(ok => {
        console.log('Correo enviado');
        this.emailPass = '';
      });
  }

  /**
   * Método que limpia los inputs de los formularios login y registro
   */
  limpiarFormularios() {
    this.emailLogin = '';
    this.nombreRegistro = '';
    this.passLogin = '';
    this.emailRegistro = '';
    this.passRegistro = '';
  }

}
