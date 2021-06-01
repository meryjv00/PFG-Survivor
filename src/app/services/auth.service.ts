import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import firebase from 'firebase/app';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { ChatService } from './chat.service';
import { FriendsService } from './friends.service';
import { RankingsService } from './rankings.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';

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
  user = null;
  loginRecharge: boolean = true;
  userAuth: any | null;
  providerId: string = null;
  itemsLogedUser = [];
  itemsUser = [];

  constructor(public auth: AngularFireAuth,
    private router: Router,
    private chat: ChatService,
    private friends: FriendsService,
    private rankings: RankingsService,
    private http: HttpClient) { }


  /**
   * Método que se llama desde los constructores de los componentes para en el caso de haber
   * recargado volver a establecer esta variable a false
   */
  setRechargeFalse() {
    this.loginRecharge = false;
  }

  addItem(item) {
    this.itemsLogedUser.push(item);
  }
  setCoins(coins) {
    this.user.coins = coins;
  }
  setPhoto(photoURL) {
    this.user.photoURL = photoURL;
  }
  setName(name) {
    this.user.displayName = name;
  }
  setEmail(email) {
    this.user.email = email;
  }

  getProviderID() {
    this.providerId = null;
    this.userAuth = localStorage.getItem(environment.SESSION_KEY_USER_AUTH);
    this.userAuth = JSON.parse(this.userAuth);
    this.providerId = this.userAuth.providerData[0].providerId;
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
    this.getItemsUser(1);
    this.friends.listenFriendsRequests();
    this.friends.listenSentFriendsRequests();
    this.chat.getFriends();
    this.rankings.stopListeningRankingsItems();
    this.rankings.setGetRankingsTrue();
    this.rankings.getPositionRankings();
    this.rankings.getPositionRankingCoins();
    this.router.navigate(['home']);
  }

  getItemsUser(type: number, uid?: string) {
    var token = this.userAuth['stsTokenManager']['accessToken'];

    if (type == 1) {
      this.itemsLogedUser = [];
      this.userAuth = localStorage.getItem(environment.SESSION_KEY_USER_AUTH);
      this.userAuth = JSON.parse(this.userAuth);
      uid = this.userAuth.uid;
    } else {
      this.itemsUser = [];
    }

    const url = environment.dirBack + "getItemsUser";
    let headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    this.http.post(url, { 'uid': uid }, { headers: headers })
      .subscribe(
        (response) => {
          var items = response['message'];

          if (type == 1) {
            this.itemsLogedUser = items;
          } else {
            this.itemsUser = items;
          }
        });
  }

  /**
  * Registro con email y contraseña
  * @returns 
  */
  registro() {
    const url = environment.dirBack + "registro";
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(url, { 'email': this.emailRegistro, 'pass': this.passRegistro, 'name': this.nombreRegistro }, { headers: headers });
  }


  /**
   * Login con email y contraseña
   * @returns 
   */
  login() {
    const url = environment.dirBack + "login";
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(url, { 'email': this.emailLogin, 'pass': this.passLogin }, { headers: headers });
  }

  /**
   * Login con cuenta de Google
   */
  loginGoogle() {
    return this.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
  }

  /**
   * Login con cuenta de Facebook
   */
  loginFacebook() {
    return this.auth.signInWithPopup(new firebase.auth.FacebookAuthProvider());
  }

  /**
   * Añadir foto de Facebook al usuario cuando se logea por 1º vez
   * @param user 
   */
  updateProfileFB(user) {
    if (user.user.photoURL.startsWith('https://graph.facebook.com/')) {
      user.user.updateProfile({
        photoURL: user.additionalUserInfo.profile['picture']['data']['url']
      }).then(() => {
        this.prepareLogin(user.user);
      });
    } else {
      this.prepareLogin(user.user);
    }
  }

  /**
   * Guardar usuario en base de datos
   * @param user 
   */
  updateUserData(user: any) {
    const url = environment.dirBack + "updateUserLogin";
    var token = user['stsTokenManager']['accessToken'];
    let headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    this.http.post(url, { 'user': user }, { headers: headers })
      .subscribe(
        (response) => {
          console.log('USER:', response);
          this.getUser();
        });
  }

  /**
   * Obtener los datos del usuario logeado
   */
  getUser() {
    this.userAuth = localStorage.getItem(environment.SESSION_KEY_USER_AUTH);
    this.userAuth = JSON.parse(this.userAuth);
    var token = this.userAuth['stsTokenManager']['accessToken'];
    
    const url = `${environment.dirBack}getUser/${this.userAuth.uid}`;
    let headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    this.http.get(url, { headers: headers })
      .subscribe(
        (response) => {
          this.user = {
            'uid': response['message'].uid,
            'status': response['message'].status,
            'displayName': response['message'].displayName,
            'photoURL': response['message'].photoURL,
            'email': response['message'].email,
            'coins': response['message'].coins,
          }
        });
  }


  /**
   * Envía correo al email introducido donde se le permite cambiar la contraseña de la cuenta.
   */
  sendPasswordResetEmail() {
    const url = environment.dirBack + "sendPasswordResetEmail";
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(url, { 'email': this.emailPass }, { headers: headers });
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
    this.chat.stopListeningFriendMessages();
    this.chat.stopListeningFriends();
    this.friends.stopListeningRequests();
    this.chat.closeChat();
    this.friends.resetSearchFriends();
    this.rankings.setGetRankingsTrue();
    this.chat.cleanMessages();
    this.limpiarFormularios();

    setTimeout(() => {
      localStorage.removeItem(environment.SESSION_KEY_USER_AUTH)
    }, 500);
    this.router.navigate(['home']);
  }

  /**
   * Método que limpia los inputs de los formularios login/registro/pass
   */
  limpiarFormularios() {
    this.emailLogin = '';
    this.nombreRegistro = '';
    this.passLogin = '';
    this.emailRegistro = '';
    this.passRegistro = '';
  }

}
