import { Injectable } from '@angular/core';
import firebase from 'firebase/app';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ShopService {
  items = [];

  constructor(private auth: AuthService) { }
  userAuth: any | null;

  /**
   * Obtiene el usuario almacenado en localStorage, el cual se almacena al iniciar sesión
   */
  getUser() {
    this.userAuth = localStorage.getItem(environment.SESSION_KEY_USER_AUTH);
    this.userAuth = JSON.parse(this.userAuth);
  }


  /**
   * Recupera los items disponibles en la tienda
   */
  getItems() {
    this.items = [];
    var db = firebase.firestore();
    this.getUser();

    db.collection('shop').get().then((doc) => {
      doc.forEach(docu => {
        const item = {
          'id': docu.id,
          'name': docu.data().name,
          'description': docu.data().description,
          'img': docu.data().img,
          'price': docu.data().price,
          'rarity': docu.data().rarity,
          'owned': false,
          'obtainedDate': null
        }
        this.items.push(item);

        if (this.userAuth) {
          db.collection('users').doc(this.userAuth.uid).collection('items').get().then((doc) => {
            doc.forEach(item => {
              this.items.forEach(itemFor => {
                if (itemFor.id == item.id) {
                  itemFor.owned = true;
                  itemFor.obtainedDate = String(item.data().obtainedDate.toDate()).substring(4,15);
                }
              });
            });
          });
        }
      });
    });
  }

  /**
   * Comprueba si el usuario puede comprar o no el arma con las monedas que tiene
   * @param item 
   * @returns 
   */
  checkItem(item: any) {
    var canBuy = true;
    if (item.price > this.auth.user.coins) {
      canBuy = false;
    }
    return canBuy;
  }

  /**
   * Comprar item
   * @param item 
   */
  buyItem(item: any) {
    var db = firebase.firestore();
    var query = db.collection('users').doc(this.auth.user.uid);
    var coinsRestantes = this.auth.user.coins - item.price;
    // Obtener item
    query.collection('items').doc(item.id).set({
      obtainedDate: firebase.firestore.Timestamp.now(),
    }).then(() => {
      // Actualizar estado del item
      this.items.forEach(itemFor => {
        if (itemFor.id == item.id) {
          itemFor.owned = true;
          itemFor.obtainedDate = 'Ahora mismo';
        }
      });
      // Quitar monedas
      query.update({
        coins: coinsRestantes
      });
    });

  }

}
