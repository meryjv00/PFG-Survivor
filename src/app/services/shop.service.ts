import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ShopService {
  items = [];

  constructor(private auth: AuthService,
    private http: HttpClient) {}

  /**
   * Recupera los items disponibles en la tienda
   */
  getItems() {
    const url = environment.dirBack + "getItems";
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get(url, { headers: headers })
      .subscribe(
        (response) => {
          this.items = response['message'];
          // Si el usuario está logeado obtenemos si tiene el arma comprada o no
          if (this.auth.user) {
            console.log('Items user', this.auth.itemsLogedUser);
            this.items.forEach(itemShop => {
              this.auth.itemsLogedUser.forEach(myitem => {
                if (itemShop.id == myitem.id) {
                  itemShop.owned = true;
                  itemShop.obtainedDate = myitem.obtainedDate;
                }
              });
            });
          }
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
    const url = environment.dirBack + "buyItem";
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put(url, { 'user': this.auth.user, 'item': item }, { headers: headers })
      .subscribe(
        (response) => {
          console.log(response['message']);

          // Actualizar estado del item en la tienda
          this.items.forEach(itemShop => {
            if (itemShop.id == item.id) {
              itemShop.owned = true;
              itemShop.obtainedDate = 'Ahora mismo';
            }
          });

          // Añadir item & restar monedas
          this.auth.addItem(item);
          var coinsRestantes = this.auth.user.coins - item.price;
          this.auth.setCoins(coinsRestantes);

        });
  }

}
