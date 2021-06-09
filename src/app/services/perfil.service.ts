import { Injectable } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/storage';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PerfilService {
  userAuth: any | null; // Usuario guardado en session storage para obtener bien los datos al recargar la pagina
  tokenUser:string = '';

  constructor(public firestorage: AngularFireStorage,
    public auth: AuthService,
    public router: Router,
    private http: HttpClient) {
  }


  /**
 * Obtiene el usuario almacenado en localStorage, el cual se almacena al iniciar sesión
 */
  getUser() {
    this.userAuth = localStorage.getItem(environment.SESSION_KEY_USER_AUTH);
    this.userAuth = JSON.parse(this.userAuth);
    this.tokenUser = this.userAuth['stsTokenManager']['accessToken'];
  }

  /**
   * Cambiar nombre
   * @param name 
   */
  updateDisplayName(name: string) {
    this.getUser();
    
    const url = environment.dirBack + "updateName/" + this.userAuth.uid;
    let headers = new HttpHeaders({ Authorization: `Bearer ${this.tokenUser}` });
    this.http.put(url, { 'name': name }, { headers: headers })
      .subscribe(
        (response) => {
          console.log('RESPONSE', response);
          this.auth.setName(name);
        });

  }

  /**
   * Cambiar foto de perfil
   * @param event 
   */
  updateProfileImage(event) {
    this.getUser();

    if (event.target.files[0]) {
      var file = event.target.files[0];

      // Subir imágen a storage
      this.firestorage.ref('profileImages/' + this.userAuth.uid).put(file).then(fileSnapshot => {
        return fileSnapshot.ref.getDownloadURL()
          .then(photoURL => {            
            // Actualizar imágen a el usuario
            const url = environment.dirBack + "updateProfilePhoto/" + this.userAuth.uid;
            let headers = new HttpHeaders({ Authorization: `Bearer ${this.tokenUser}` });
            this.http.post(url, { 'user': this.userAuth, 'photoURL': photoURL }, { headers: headers }).subscribe(()=>{
              this.auth.setPhoto(photoURL);
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
    this.getUser();

    const url = environment.dirBack + "updateEmail/" + this.userAuth.uid;
    let headers = new HttpHeaders({ Authorization: `Bearer ${this.tokenUser}` });
    return this.http.put(url, { 'email': email }, { headers: headers });
  }

  /**
   * Cambiar contraseña de inicio de sesión
   * @param pass 
   * @returns 
   */
  updatePass(pass: string) {
    this.getUser();

    const url = environment.dirBack + "updatePass/" + this.userAuth.uid;
    let headers = new HttpHeaders({ Authorization: `Bearer ${this.tokenUser}` });
    return this.http.put(url, { 'pass': pass }, { headers: headers });
  }


}
