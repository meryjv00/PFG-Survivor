import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/database';
import { AngularFireStorage, AngularFireUploadTask } from '@angular/fire/storage';
import { Observable, of } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class PerfilService {
  // Variables
  path = 'images/';
  task: AngularFireUploadTask = null;
  downloadURL = of('');

  constructor(public firestorage: AngularFireStorage,
    public auth: AuthService,
    public db: AngularFireDatabase) { }
    
  upload(event) {
    console.log('event: ', event);

    // Pulsamos cancelar al subir foto
    if (event.target.files.length == 0){
      return
    } 
    // Extensión imagen
    let ext = '.jpg';
    if (event.target.files[0].type === 'image/png') {
      ext = '.png';
    }

    // Subir imagen obteniendo task -> url download y progreso subida
    const path = this.path + this.auth.authUser.uid + ext;
    const ref = this.firestorage.ref(path);

    this.task = this.firestorage.upload(path, event.target.files[0]);

    this.task.snapshotChanges().pipe(finalize(() => {
      this.downloadURL = ref.getDownloadURL();
      console.log('Download URL: ', this.downloadURL);
    })).subscribe();
  }

  uploadImgBD(url_img: any) {
    const path2 = 'users/' + this.auth.authUser.uid;
    const u = {
      foto: url_img
    }
    this.downloadURL = of('');

    return this.db.object(path2).update(u)
      .catch(error => console.log(error))
  }

}
