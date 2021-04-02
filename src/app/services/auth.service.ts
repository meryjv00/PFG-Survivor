import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { map } from 'rxjs/operators';
import firebase from 'firebase/app';
import { Router } from '@angular/router';
import { AngularFireDatabase } from '@angular/fire/database';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Variables
  emailLogin = '';
  passLogin = '';
  emailRegistro = '';
  passRegistro = '';
  authUser = null;
  user = null;

  constructor(public auth: AngularFireAuth,
    private router: Router,
    private db: AngularFireDatabase) { }

  limpiarFormularios() {
    this.emailLogin = '';
    this.passLogin = '';
    this.emailRegistro = '';
    this.passRegistro = '';
  }

  /**
   * Información usuario logeado
   */
  userState = this.auth.authState.pipe(map(authState => {
    if (authState) {
      this.authUser = authState;
      console.log('authUser: ', this.authUser);
      return authState;
    } else {
      return null;
    }
  }))

  getUser() {
    setTimeout(() => {
      if (this.authUser.uid) {
        var userbd = firebase.database().ref('users/' + this.authUser.uid);
        userbd.on('value', (snapshot) => {
          this.user = snapshot.val();
          // console.log('Usuario logeado: ', this.user);
        });
      }
    }, 1000);
  }

  /**
  * Registro con email y contraseña
  * @returns 
  */
  registro() {
    return this.auth.createUserWithEmailAndPassword(this.emailRegistro, this.passRegistro)
      .then(user => {
        console.log('Usuario registrado con email: ', user);

        //this.limpiarFormularios();
        this.updateUserData(user.user);
        this.router.navigate(['perfil']);

      })
  }

  /**
   * Login con email y contraseña
   * @returns 
   */
  login() {
    return this.auth.signInWithEmailAndPassword(this.emailLogin, this.passLogin)
      .then(user => {
        console.log("Usuario logeado con email: ", user);

        //this.limpiarFormularios();
        this.router.navigate(['perfil']);
      })
  }

  /**
   * Login con cuenta de Google
   */
  loginGoogle() {
    return this.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider())
      .then(user => {
        console.log("Usuario logeado con Google: ", user);

        //this.limpiarFormularios();
        this.updateUserData(user.user);
        this.router.navigate(['perfil']);
      })   
  }

  /**
   * Login con cuenta de Facebook
   */
  loginFacebook() {
    return this.auth.signInWithPopup(new firebase.auth.FacebookAuthProvider())
      .then(user => {
        console.log("Usuario logeado con Facebook: ", user);

        //this.limpiarFormularios();
        // En el caso de tener la foto de facebook por defecto se le establece la que tenga el usuario en fb
        if (user.user.photoURL.startsWith('https://graph.facebook.com/')) {
          user.user.updateProfile({
            photoURL: user.additionalUserInfo.profile['picture']['data']['url']
          }).then(ok => {
            this.updateUserData(user.user);
            this.router.navigate(['perfil']);

          }).catch(function (error) {
            console.log(error);
          });
        } else {
          this.updateUserData(user.user);
          this.router.navigate(['perfil']);
        }
      })
  }

  /**
   * Cerrar sesión cuenta
   */
  logout() {
    this.auth.signOut();
    this.limpiarFormularios();
    this.router.navigate(['home']);
  }

  /**
   * Guardar usuario en base de datos
   * @param user 
   */
  updateUserData(user: any) {
    const path = 'users/' + user.uid;
    const u = {
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL
    }
    this.db.object(path).update(u)
      .catch(error => console.log(error));
  }

}
