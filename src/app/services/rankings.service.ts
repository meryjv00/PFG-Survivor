import { Injectable } from '@angular/core';
import firebase from 'firebase/app';
import { environment } from 'src/environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class RankingsService {
  getRankings: boolean = true;
  rankingCoins = [];
  lvlRankings = [];
  logedUserRankings = [];
  unsubscribeListeners = [];
  userAuth: any | null;
  logedUserRankingCoins = [];
  top = 7;

  constructor(private http: HttpClient) { }

  /**
   * Obtiene el usuario almacenado en localStorage, el cual se almacena al iniciar sesión
   */
  getUser() {
    this.userAuth = localStorage.getItem(environment.SESSION_KEY_USER_AUTH);
    this.userAuth = JSON.parse(this.userAuth);
  }
  /**
   * Establecer false variable para obtener rankings
   */
  setGetRankingsFalse() {
    this.getRankings = false;
  }
  /**
   * Establecer a true variable para obtener rankings
   */
  setGetRankingsTrue() {
    this.getRankings = true;
  }

  //------------------------------------------------------------------------------------------------------
  //------------------------------------------------------------------------------------------------------
  //------------------------------------------------------------------------------------------------------

  /**
   * Obtener rankings de monedas
   */
  getRankingCoins() {
    console.log('Cargar ranking coins...');
    this.rankingCoins = [];
    this.getUser();

    var query = firebase.firestore().collection('users')
      .orderBy('coins', 'desc')
      .limit(this.top)

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
        else if (change.type == 'added') {
          // Hay cambios en el podium monedas
          if (this.rankingCoins.length == this.top) {
            this.podiumCoinsChanges();
          }
          // Cargar usuario
          else {
            const user = {
              'uid': change.doc.id,
              'displayName': change.doc.data().displayName,
              'email': change.doc.data().email,
              'photoURL': change.doc.data().photoURL,
              'coins': change.doc.data().coins,
              'me': false
            }
            this.rankingCoins.push(user);
            if (this.userAuth != undefined) {
              if (change.doc.id == this.userAuth.uid) {
                user.me = true;
              }
            }

          }
        }

      });
    });
    this.unsubscribeListeners.push(unsubscribe);
  }

  /**
   * Cambios en el podium de monedas -> reordenar usuarios
   */
  podiumCoinsChanges() {
    this.getUser();
    var uid;

    if (this.userAuth == undefined || this.userAuth == null) {
      uid = null;
    } else {
      uid = this.userAuth.uid;
    }

    const url = `${environment.dirBack}getPodiumCoins/${uid}`;
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    this.http.get(url, { headers: headers })
      .subscribe(
        (response) => {
          this.rankingCoins = response['message'];
        });
  }

  /**
 * Obtener posicion del usuario logeado en ranking monedas
 */
  getPositionRankingCoins() {
    this.getUser();
    this.logedUserRankingCoins = [];
    var query = firebase.firestore().collection('users').orderBy('coins', 'desc')

    query.onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        // Obtener pos del usuario logeado
        if (change.doc.id === this.userAuth.uid) {
          var cont = 1;
          query.get()
            .then(doc => {
              doc.forEach(docU => {
                if (docU.id == change.doc.id) {
                  this.logedUserRankingCoins[0] = cont;
                  this.logedUserRankingCoins[1] = docU.data().coins;
                }
                cont++;
              });
            });
        }

      });
    });
  }

  //------------------------------------------------------------------------------------------------------
  //------------------------------------------------------------------------------------------------------
  //------------------------------------------------------------------------------------------------------

  /**
   * Obtener rankings de todos los niveles
   */
  getRankingsLevels() {
    this.lvlRankings = [];
    this.getUser();

    const url = `${environment.dirBack}getLevelRankings`;
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    this.http.get(url, { headers: headers })
      .subscribe(
        (response) => {
          this.lvlRankings = response['message'];

          // Ponemos en escucha los rankings de los niveles disponibles
          this.lvlRankings.forEach(level => {
            // QUERY
            var query = firebase.firestore().collection('rankings').doc(level.id).collection('users')
              .limit(this.top)

            // PUNTUACION
            this.listenPunctuationRanking(query, level);
            // ENEMIGOS
            this.listenEnemiesRanking(query, level);
            // TIEMPO
            this.listenTimeRanking(query, level);

            console.log(this.lvlRankings);

          });
        });
  }

  /**
   * Escucha del ranking (top) de los stats de puntuacion de un nivel
   * @param query 
   * @param level 
   */
  listenPunctuationRanking(query, level) {
    var unsubscribe = query.orderBy('punctuation', 'desc')
      .onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {

          // Datos modificados del usuario
          if (change.type === 'modified') {
            // Update puntuacion
            this.lvlRankings[level.Nivel - 1].RankingPuntuacion.forEach(user => {
              if (user.uid == change.doc.id) {
                user.punctuation = change.doc.data().punctuation;
              }
            });
          }
          // Cargar ususario puntuacion
          else if (change.type == 'added') {
            // Cambios podium puntuacion
            if (this.lvlRankings[level.Nivel - 1].RankingPuntuacion.length == this.top) {
              this.podiumLevelsChanges(level, 1);
            }
            // Cargar usuario
            else {
              this.searchInfoUser(change.doc, level, 1);
            }
          }
          // Re-Ordenar ranking puntuacion
          this.lvlRankings[level.Nivel - 1].RankingPuntuacion.sort(function (o1, o2) {
            if (o1.punctuation < o2.punctuation) {
              return 1;
            } else if (o1.punctuation > o2.punctuation) {
              return -1;
            }
            return 0;
          });
        });
      });
    this.unsubscribeListeners.push(unsubscribe);
  }

  /**
 * Escucha del ranking (top) de los stats de enemigos matados de un nivel
 * @param query 
 * @param level 
 */
  listenEnemiesRanking(query, level) {
    var unsubscribe = query.orderBy('enemiesKilled', 'desc')
      .onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {

          if (change.type === 'modified') {
            // Update Enemigos matados
            this.lvlRankings[level.Nivel - 1].RankingEnemigos.forEach(user => {
              if (user.uid == change.doc.id) {
                user.enemiesKilled = change.doc.data().enemiesKilled;
              }
            });
          }
          // Cargar ususario enemigos
          else if (change.type == 'added') {
            // Cambios podium enemigos
            if (this.lvlRankings[level.Nivel - 1].RankingEnemigos.length == this.top) {
              this.podiumLevelsChanges(level, 2);
            }
            // Cargar usuario
            else {
              this.searchInfoUser(change.doc, level, 2);
            }

          }
          // Re-Ordenar ranking enemigos  
          this.lvlRankings[level.Nivel - 1].RankingEnemigos.sort(function (o1, o2) {
            if (o1.enemiesKilled < o2.enemiesKilled) {
              return 1;
            } else if (o1.enemiesKilled > o2.enemiesKilled) {
              return -1;
            }
            return 0;
          });
        });
      });
    this.unsubscribeListeners.push(unsubscribe);
  }

  /**
 * Escucha del ranking (top) de los stats de tiempo sobrevivido de un nivel
 * @param query 
 * @param level 
 */
  listenTimeRanking(query, level) {
    var unsubscribe = query.orderBy('time', 'desc')
      .onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {

          if (change.type === 'modified') {
            // Update Tiempo aguantado
            this.lvlRankings[level.Nivel - 1].RankingTiempo.forEach(user => {
              if (user.uid == change.doc.id) {
                user.time = change.doc.data().time;
              }
            });
          }
          // Cargar ususario tiempo
          else if (change.type == 'added') {
            // Cambios podium tiempo
            if (this.lvlRankings[level.Nivel - 1].RankingTiempo.length == this.top) {
              this.podiumLevelsChanges(level, 3);
            }
            // Cargar usuario
            else {
              this.searchInfoUser(change.doc, level, 3);
            }
          }
          // Re-Ordenar ranking tiempo
          this.lvlRankings[level.Nivel - 1].RankingTiempo.sort(function (o1, o2) {
            if (o1.time < o2.time) {
              return 1;
            } else if (o1.time > o2.time) {
              return -1;
            }
            return 0;
          });

        });
      });
    this.unsubscribeListeners.push(unsubscribe);
  }

  /**
   * Crea usuario con todos sus datos
   * @param userD infor usuario
   * @param doc pos array niveles
   * @param type 1: puntuacion / 2: enemigos / 3: tiempo
   */
  searchInfoUser(userD: any, level: any, type: number) {
    var uid = userD.id.trim();
    const user = {
      'uid': uid,
      'enemiesKilled': userD.data().enemiesKilled,
      'punctuation': userD.data().punctuation,
      'time': userD.data().time,
      'photoURL': '',
      'displayName': '',
      'coins': '',
      'email': '',
      'me': false
    }

    if (type == 1) {
      this.lvlRankings[level.Nivel - 1].RankingPuntuacion.push(user);
    } else if (type == 2) {
      this.lvlRankings[level.Nivel - 1].RankingEnemigos.push(user);
    } else if (type == 3) {
      this.lvlRankings[level.Nivel - 1].RankingTiempo.push(user);
    }

    // Buscar información del usuario para buscar su nombre, foto de perfil...
    const url = `${environment.dirBack}getUser/${userD.id}`;
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    this.http.get(url, { headers: headers })
      .subscribe(
        (response) => {
          user.photoURL = response['message'].photoURL;
          user.displayName = response['message'].displayName;
          user.coins = response['message'].coins;
          user.email = response['message'].email;

          if (this.userAuth != undefined) {
            if (userD.id == this.userAuth.uid) {
              user.me = true;
            }
          }
        });
  }

  /**
   * El podium de algun nivel ha cambiado, se reobtienen las posiciones
   * @param doc pos array niveles
   * @param type 1: puntuacion / 2: enemigos / 3: tiempo
   */
  podiumLevelsChanges(level: any, type: number) {
    // QUERY
    var query = firebase.firestore().collection('rankings').doc(level.id).collection('users')
      .limit(this.top)
    var orderBy = '';

    if (type == 1) {
      this.lvlRankings[level.Nivel - 1].RankingPuntuacion = [];
      orderBy = 'punctuation';
    }
    else if (type == 2) {
      this.lvlRankings[level.Nivel - 1].RankingEnemigos = [];
      orderBy = 'enemiesKilled';
    }
    else if (type == 3) {
      this.lvlRankings[level.Nivel - 1].RankingTiempo = [];
      orderBy = 'time';
    }

    query.orderBy(orderBy, 'desc').get()
      .then(docUser => {
        docUser.forEach(docU => {
          this.searchInfoUser(docU, level, type);
        });
      });

  }

  /**
   * Obtener posicion del usuario logeado en todos los rankings
   */
  getPositionRankings() {
    this.logedUserRankings = [];
    this.getUser();

    const url = `${environment.dirBack}getLevelRankings`;
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    this.http.get(url, { headers: headers })
      .subscribe(
        (response) => {
          this.logedUserRankings = response['message'];

          this.logedUserRankings.forEach(level => {
            // QUERY
            var query = firebase.firestore().collection('rankings').doc(level.id).collection('users');

            this.listenPunctuationGlobal(query, level);

            this.listenEnemiesGlobal(query, level);

            this.listenTimeGlobal(query, level);

            console.log(this.logedUserRankings);

          });
        });
  }

  /**
   * Escucha de todos los usuarios de los stats de puntuacion de un nivel
   * @param query 
   * @param level 
   */
  listenPunctuationGlobal(query, level) {
    query.orderBy('punctuation', 'desc')
      .onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          // Obtener pos del usuario logeado
          if (change.doc.id == this.userAuth.uid) {
            var cont = 1;
            query.orderBy('punctuation', 'desc').get()
              .then(docUser => {
                docUser.forEach(docU => {
                  if (docU.id == change.doc.id) {
                    this.logedUserRankings[level.Nivel - 1].RankingPuntuacion[0] = cont;
                  }
                  cont++;
                });
              });
            this.logedUserRankings[level.Nivel - 1].RankingPuntuacion[1] = change.doc.data().punctuation;
          }
        });
      });
  }

  
  /**
   * Escucha de todos los usuarios de los stats de enemigos matados de un nivel
   * @param query 
   * @param level 
   */
  listenEnemiesGlobal(query, level) {
    query.orderBy('enemiesKilled', 'desc')
      .onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          // Obtener pos del usuario logeado
          if (change.doc.id == this.userAuth.uid) {
            var cont = 1;
            query.orderBy('enemiesKilled', 'desc').get()
              .then(docUser => {
                docUser.forEach(docU => {
                  if (docU.id == change.doc.id) {
                    this.logedUserRankings[level.Nivel - 1].RankingEnemigos[0] = cont;
                  }
                  cont++;
                });
              });
            this.logedUserRankings[level.Nivel - 1].RankingEnemigos[1] = change.doc.data().enemiesKilled;
          }
        });
      });
  }

  
  /**
   * Escucha de todos los usuarios de los stats de tiempo sobrevivido de un nivel
   * @param query 
   * @param level 
   */
  listenTimeGlobal(query, level) {
    query.orderBy('time', 'desc')
      .onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          // Obtener pos del usuario logeado
          if (change.doc.id == this.userAuth.uid) {
            var cont = 1;
            query.orderBy('time', 'desc').get()
              .then(docUser => {
                docUser.forEach(docU => {
                  if (docU.id == change.doc.id) {
                    this.logedUserRankings[level.Nivel - 1].RankingTiempo[0] = cont;
                  }
                  cont++;
                });
              });
            this.logedUserRankings[level.Nivel - 1].RankingTiempo[1] = change.doc.data().time;
          }
        });
      });
  }

  /**
   * Dejar de escuchar los listeners para que no haya duplicidad de escucha
   */
  stopListeningRankingsItems() {
    this.unsubscribeListeners.forEach(unsubscribe => {
      unsubscribe();
    });
  }

}
