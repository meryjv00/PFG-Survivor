import { Injectable } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/storage';
import { AuthService } from './auth.service';
import firebase from 'firebase/app';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class PerfilService {
  // Variables

  constructor(public firestorage: AngularFireStorage,
    public auth: AuthService,
    public router: Router) {
  }

  updatePerfil() {
    var user = firebase.auth().currentUser;
    user.updateProfile({
      displayName: "Nombre actualizado",
      photoURL: "https://blog.hotmart.com/blog/2017/01/post_url_940x606-670x432.png"
    }).then(function () {
      // Actualizar en la base de datos
      // Update successful.
    });
  }

  updatePass() {
    // Cambiar contraseña por input
    var user = firebase.auth().currentUser;
    user.updatePassword('Chubaca2020').then(function () {
    }).catch(function (error) {
    });
  }


}
