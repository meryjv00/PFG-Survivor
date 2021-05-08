import { Injectable } from '@angular/core';
import firebase from 'firebase/app';

@Injectable({
  providedIn: 'root'
})
export class RankingsService {
  rankingCoins = [];
  lvl1RankingEnemies = [];
  lvl1RankingPunctuation = [];
  lvl1RankingTime = [];

  constructor() { }

  /**
   * Obtener rankings de monedas
   */
  getRankingCoins() {
    this.rankingCoins = [];
    var query = firebase.firestore().collection('users')
      .orderBy('coins', 'desc')
      .limit(15)

    var unsubscribe = query.onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        // Monedas han cambiado
        if (change.type === 'modified') {
          // Modificar en el array el valor
          this.rankingCoins.forEach(user => {
            if (user.uid == change.doc.id) {
              user.coins = change.doc.data().coins;
            }
          });
          // Re ordenar array por nº de monedas
          this.rankingCoins.sort(function (o1, o2) {
            if (o1.coins < o2.coins) {
              return 1;
            } else if (o1.coins > o2.coins) {
              return -1;
            }
            return 0;
          });

        }
        // Cargar ususario
        else {
          const user = {
            'uid': change.doc.id,
            'displayName': change.doc.data().displayName,
            'email': change.doc.data().email,
            'photoURL': change.doc.data().photoURL,
            'coins': change.doc.data().coins
          }
          this.rankingCoins.push(user);
        }

      });
    });
  }

  /**
   * Obtener rankings nivel 1
   */
  getRankingsLevels() { 
    this.lvl1RankingEnemies = [];
    this.lvl1RankingPunctuation = [];
    this.lvl1RankingTime = [];

    // Puntuacion
    var query = firebase.firestore().collection('rankings').doc('iE4mrKP3gPm180WkLPX9').collection('users')
      .limit(15)

    var unsubscribe = query.onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {

        if (change.type === 'modified') {
          // Update puntuacion
          this.lvl1RankingPunctuation.forEach(user => {
            if (user.uid == change.doc.id) {
              user.punctuation = change.doc.data().punctuation;
            }
          });
          // Update Enemigos matados
          this.lvl1RankingEnemies.forEach(user => {
            if (user.uid == change.doc.id) {
              user.enemiesKilled = change.doc.data().enemiesKilled;
            }
          });
          // Update Tiempo aguantado
          this.lvl1RankingTime.forEach(user => {
            if (user.uid == change.doc.id) {
              user.time = change.doc.data().time;
            }
          });
        }
        // Cargar ususario
        else {
          // Buscar información del usuario para buscar su nombre, foto de perfil...
          const user = {
            'uid': change.doc.id,
            'enemiesKilled': change.doc.data().enemiesKilled,
            'punctuation': change.doc.data().punctuation,
            'time': change.doc.data().time
          }
          this.lvl1RankingEnemies.push(user);
          this.lvl1RankingPunctuation.push(user);
          this.lvl1RankingTime.push(user);
        }

      });     

      console.log('Ordenar...');
       // Ordenar ranking enemigos
       this.lvl1RankingEnemies.sort(function (o1, o2) {
        if (o1.enemiesKilled < o2.enemiesKilled) {
          return 1;
        } else if (o1.enemiesKilled > o2.enemiesKilled) {
          return -1;
        }
        return 0;
      });
      // Ordenar ranking puntuacion
      this.lvl1RankingPunctuation.sort(function (o1, o2) {
        if (o1.punctuation < o2.punctuation) {
          return 1;
        } else if (o1.punctuation > o2.punctuation) {
          return -1;
        }
        return 0;
      });
      // Ordenar ranking tiempo
      this.lvl1RankingTime.sort(function (o1, o2) {
        if (o1.time < o2.time) {
          return 1;
        } else if (o1.time > o2.time) {
          return -1;
        }
        return 0;
      });

    });



  }

}