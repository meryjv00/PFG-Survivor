import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { map } from 'rxjs/operators';
import firebase from 'firebase/app';
import 'firebase/auth';
import { Router } from '@angular/router';
import { AngularFireDatabase } from '@angular/fire/database';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Variables
  email = '';
  pass = '';
  authUser = null;
  userLog = null;

  constructor(public auth: AngularFireAuth,
    private router: Router,
    private db: AngularFireDatabase) { }

  /**
   * Información usuario logeado
   */
  user = this.auth.authState.pipe(map(authState => {
    if (authState) {
      this.authUser = authState;
      return authState;
    } else {
      return null;
    }
  }))

  getU() {
    setTimeout(() => {
      if (this.authUser.uid) {
        var userbd = firebase.database().ref('users/' + this.authUser.uid);
        userbd.on('value', (snapshot) => {
          this.userLog = snapshot.val();
        });
      }
    }, 800);
  }

  /**
   * Login con email y contraseña
   * @returns 
   */
  login() {
    return this.auth.signInWithEmailAndPassword(this.email, this.pass)
      .then(user => {
        // console.log("Usuario logeado con email: ", user);
        this.email = '';
        this.pass = '';
        this.authUser = user;

        this.getU();
        this.router.navigate(['home']);

        // this.updateUserData(user.user,'');
      })
  }

  /**
   * Login con cuenta de Google
   */
  loginGoogle() {
    this.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider())
      .then(user => {
        // console.log("Usuario logeado con Google: ", user.user.photoURL);
        this.email = '';
        this.pass = '';
        this.authUser = user;

        this.getU();
        this.router.navigate(['home']);


        // var url_img = user.user.photoURL;
        // this.updateUserData(user.user, url_img);
      })
      .catch(error => {
        console.log("Error al logear con Google: ", error);
      })
  }

  /**
   * Login con cuenta de Facebook
   */
  loginFacebook() {
    this.auth.signInWithPopup(new firebase.auth.FacebookAuthProvider())
      .then(user => {
        // console.log("Usuario logeado con Facebook: ", user);
        this.email = '';
        this.pass = '';
        this.authUser = user;

        this.getU();
        this.router.navigate(['home']);


        // var url_img = user.additionalUserInfo.profile['picture']['data']['url'];
        // this.updateUserData(user.user, url_img);
      })
      .catch(error => {
        console.log("Error al logear con Facebook: ", error.code);
      })
  }

  /**
   * Cerrar sesión cuenta
   */
  logout() {
    this.auth.signOut();
    this.email = '';
    this.pass = '';
    this.router.navigate(['login']);
  }

  /**
   * Guardar usuario en base de datos
   * @param user 
   * @param url_img 
   */
  updateUserData(user: any, url_img: any) {
    console.log('user: ', user);
    const path = 'users/' + user.uid;
    const u = {
      email: user.email,
      nombre: user.displayName,
      foto: url_img
    }
    this.db.object(path).update(u)
      .catch(error => console.log(error));
  }

}
