import { Injectable } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/storage';
import { AuthService } from './auth.service';
import firebase from 'firebase/app';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class PerfilService {

  constructor(public firestorage: AngularFireStorage,
    public auth: AuthService,
    public router: Router) {
  }

  /**
   * Cambiar nombre
   * @param name 
   */
  updateDisplayName(name: string) {
    firebase.firestore()
      .collection("users").doc(firebase.auth().currentUser.uid).update({
        displayName: name,
      });
  }

  /**
   * Cambiar foto de perfil
   * @param event 
   */
  updateProfileImage(event) {
    if (event.target.files[0]) {
      var user = firebase.auth().currentUser;
      // Subir imágen a storage
      this.firestorage.ref('profileImages/' + user.uid).put(event.target.files[0]).then(fileSnapshot => {
        return fileSnapshot.ref.getDownloadURL()
          .then(url => {
            // Actualizar imágen a el usuario
            firebase.firestore()
              .collection("users").doc(user.uid).update({
                photoURL: url,
              });
          });
      });
    }

  }

  /**
   * Cambiar email de inicio de sesión
   * @param email 
   * @returns 
   */
  updateEmail(email: string) {
    var user = firebase.auth().currentUser;
    // Comprobar que el email introducido no existe
    return user.updateEmail(email).then(function () {
      firebase.firestore()
        .collection("users").doc(user.uid).update({
          email: email,
        });

    });
  }

  /**
   * Cambiar contraseña de inicio de sesión
   * @param pass 
   * @returns 
   */
  updatePass(pass: string) {
    var user = firebase.auth().currentUser;
    return user.updatePassword(pass).then(function () {
    });
  }


}
