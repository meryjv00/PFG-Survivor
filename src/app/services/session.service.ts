import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import firebase from 'firebase/app';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  public static readonly SESSION_STORAGE_KEY_USER: string = "user";
  public static readonly SESSION_STORAGE_KEY_UID: string = "UID";

  constructor(private router: Router) { }

  saveUID(uid: any){    
    sessionStorage.setItem(SessionService.SESSION_STORAGE_KEY_UID, JSON.stringify(uid));
  }
  getUID(){
    var uid = null;
    uid = sessionStorage.getItem(SessionService.SESSION_STORAGE_KEY_UID);
    uid = JSON.parse(uid);
    return uid;
  }
  removeUID() {
    sessionStorage.removeItem(SessionService.SESSION_STORAGE_KEY_UID);
  }

  
  /**
   * Guarda en session storage el usuario logeado
   * @param userUID 
   */
  saveUser(userUID: any) {
    var userbd = firebase.database().ref('users/' + userUID);
    userbd.on('value', (snapshot) => {
      var user = snapshot.val();
      sessionStorage.setItem(SessionService.SESSION_STORAGE_KEY_USER, JSON.stringify(user));
      this.router.navigate(['perfil']);
    });
  }

  /**
   * Obtiene de session storage el usuario logeado
   * @returns 
   */
  getUser() {
    var user = null;
    user = sessionStorage.getItem(SessionService.SESSION_STORAGE_KEY_USER);
    user = JSON.parse(user);
    return user;
  }

  /**
   * Elimina de session storage el usuario logeado
   */
  removeUser() {
    sessionStorage.removeItem(SessionService.SESSION_STORAGE_KEY_USER);
  }

}
