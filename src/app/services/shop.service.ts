import { Injectable } from '@angular/core';
import firebase from 'firebase/app';

@Injectable({
  providedIn: 'root'
})
export class ShopService {
  items= [];
  constructor() { }

  getItems() {
    this.items = [];
    var db = firebase.firestore();
    db.collection('shop').get().then((doc) => {
      doc.forEach(docu => {
        const item = {
          'id': docu.id,
          'name': docu.data().name,
          'description': docu.data().description,
          'img': docu.data().img,
          'price': docu.data().price,
          'rarity': docu.data().rarity,
        }
        this.items.push(item);
      });
    });    
  }

}
