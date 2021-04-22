import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { map } from 'rxjs/operators';
import firebase from 'firebase/app';
import { Router } from '@angular/router';
import { AngularFireDatabase } from '@angular/fire/database';
import { environment } from 'src/environments/environment';
import { ChatService } from './chat.service';
import { FriendsService } from './friends.service';

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

  constructor(public auth: AngularFireAuth,
    private router: Router,
    private db: AngularFireDatabase,
    private chat: ChatService,
    private friends: FriendsService) { }


  /**
   * Información usuario logeado
   */
  userState = this.auth.authState.pipe(map(authState => {
    if (authState) {
      this.authUser = authState;
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
    this.updateUserData(user);
    this.loginRecharge = false;
    localStorage.setItem(environment.SESSION_KEY_USER_AUTH, JSON.stringify(user));
    this.friends.listenFriendsRequests();
    this.friends.listenSentFriendsRequests();
    this.chat.getFriends(true);
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
      photoURL: 'https://image.freepik.com/vector-gratis/vector-alfabeto-mayuscula-floral-l_53876-87377.jpg'
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
    this.auth.signOut();
    this.limpiarFormularios();
    this.chat.stopListeningFriendMessages(false, 1);
    this.chat.stopListeningFriends();
    this.friends.stopListeningFriendsRequests();
    this.friends.stopListeningSentFriendsRequests();
    this.chat.closeChat();
    localStorage.removeItem(environment.SESSION_KEY_USER_AUTH);
    this.router.navigate(['home']);
  }

  /**
   * Guardar usuario en base de datos
   * @param user 
   */
  updateUserData(user: any) {
    var db = firebase.firestore();

    db.collection("users").doc(user.uid).set({
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL
    })
      .then(() => {
        // console.log("Document successfully written!");
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
