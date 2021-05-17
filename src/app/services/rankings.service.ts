import { Injectable } from '@angular/core';
import firebase from 'firebase/app';
import { environment } from 'src/environments/environment';

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
  posRankingCoins = 0;
  top = 2;

  constructor() { }

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
            this.getUserRankingCoins(change.doc);
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
    this.rankingCoins = [];
    this.getUser();

    firebase.firestore().collection('users').orderBy('coins', 'desc').limit(this.top)
      .get()
      .then(docUser => {
        docUser.forEach(doc => {
          this.getUserRankingCoins(doc);
        });
      });
  }

  /**
   * Get user del ranking de monedas
   * @param doc 
   */
  getUserRankingCoins(doc: any) {
    const user = {
      'uid': doc.id,
      'displayName': doc.data().displayName,
      'email': doc.data().email,
      'photoURL': doc.data().photoURL,
      'coins': doc.data().coins,
      'me': false
    }
    this.rankingCoins.push(user);
    if (this.userAuth != undefined) {
      if (doc.id == this.userAuth.uid) {
        user.me = true;
      }
    }
  }

  /**
 * Obtener posicion del usuario logeado en ranking monedas
 */
  getPositionRankingCoins() {
    this.getUser();
    this.posRankingCoins = 0;
    var query = firebase.firestore().collection('users').orderBy('coins', 'desc')

    query.onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        // Obtener pos del usuario logeado
        if (change.doc.id === this.userAuth.uid) {
          var cont = 1;
          query.get()
            .then(docUser => {
              docUser.forEach(docU => {
                if (docU.id == change.doc.id) {
                  this.posRankingCoins = cont;
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

    firebase.firestore().collection('rankings').orderBy('lvl', 'asc').get()
      .then((doc) => {
        doc.forEach(doc => {
          this.lvlRankings.push({
            'Nivel': doc.data().lvl,
            'RankingPuntuacion': [],
            'RankingEnemigos': [],
            'RankingTiempo': []
          });

          // QUERY
          var query = firebase.firestore().collection('rankings').doc(doc.id).collection('users')
            .limit(this.top)

          //-----------------------PUNTUACION----------------------------------
          var unsubscribeP = query.orderBy('punctuation', 'desc')
            .onSnapshot(snapshot => {
              snapshot.docChanges().forEach(change => {

                // Datos modificados del usuario
                if (change.type === 'modified') {
                  // Update puntuacion
                  this.lvlRankings[doc.data().lvl - 1].RankingPuntuacion.forEach(user => {
                    if (user.uid == change.doc.id) {
                      user.punctuation = change.doc.data().punctuation;
                    }
                  });
                }
                // Cargar ususario puntuacion
                else if (change.type == 'added') {
                  // Cambios podium puntuacion
                  if (this.lvlRankings[doc.data().lvl - 1].RankingPuntuacion.length == this.top) {
                    this.podiumLevelsChanges(doc, 1);
                  }
                  // Cargar usuario
                  else {
                    this.searchInfoUser(change.doc, doc, 1);
                  }
                }
                // Re-Ordenar ranking puntuacion
                this.lvlRankings[doc.data().lvl - 1].RankingPuntuacion.sort(function (o1, o2) {
                  if (o1.punctuation < o2.punctuation) {
                    return 1;
                  } else if (o1.punctuation > o2.punctuation) {
                    return -1;
                  }
                  return 0;
                });

              });
            });

          //--------------------------ENEMIGOS------------------------------------
          var unsubscribeE = query.orderBy('enemiesKilled', 'desc')
            .onSnapshot(snapshot => {
              snapshot.docChanges().forEach(change => {

                if (change.type === 'modified') {
                  // Update Enemigos matados
                  this.lvlRankings[doc.data().lvl - 1].RankingEnemigos.forEach(user => {
                    if (user.uid == change.doc.id) {
                      user.enemiesKilled = change.doc.data().enemiesKilled;
                    }
                  });
                }
                // Cargar ususario enemigos
                else if (change.type == 'added') {
                  // Cambios podium enemigos
                  if (this.lvlRankings[doc.data().lvl - 1].RankingEnemigos.length == this.top) {
                    this.podiumLevelsChanges(doc, 2);
                  }
                  // Cargar usuario
                  else {
                    this.searchInfoUser(change.doc, doc, 2);
                  }

                }
                // Re-Ordenar ranking enemigos  
                this.lvlRankings[doc.data().lvl - 1].RankingEnemigos.sort(function (o1, o2) {
                  if (o1.enemiesKilled < o2.enemiesKilled) {
                    return 1;
                  } else if (o1.enemiesKilled > o2.enemiesKilled) {
                    return -1;
                  }
                  return 0;
                });

              });
            });

          //----------------------------TIEMPO---------------------------------
          var unsubscribeT = query.orderBy('time', 'desc')
            .onSnapshot(snapshot => {
              snapshot.docChanges().forEach(change => {

                if (change.type === 'modified') {
                  // Update Tiempo aguantado
                  this.lvlRankings[doc.data().lvl - 1].RankingTiempo.forEach(user => {
                    if (user.uid == change.doc.id) {
                      user.time = change.doc.data().time;
                    }
                  });
                }
                // Cargar ususario tiempo
                else if (change.type == 'added') {
                  // Cambios podium tiempo
                  if (this.lvlRankings[doc.data().lvl - 1].RankingTiempo.length == this.top) {
                    this.podiumLevelsChanges(doc, 3);
                  }
                  // Cargar usuario
                  else {
                    this.searchInfoUser(change.doc, doc, 3);
                  }
                }
                // Re-Ordenar ranking tiempo
                this.lvlRankings[doc.data().lvl - 1].RankingTiempo.sort(function (o1, o2) {
                  if (o1.time < o2.time) {
                    return 1;
                  } else if (o1.time > o2.time) {
                    return -1;
                  }
                  return 0;
                });

              });
            });

          // Añadir para unsubscribe al hacer deslogin
          console.log(this.lvlRankings);
          this.unsubscribeListeners.push(unsubscribeE);
          this.unsubscribeListeners.push(unsubscribeP);
          this.unsubscribeListeners.push(unsubscribeT);

        });

      });
  }

  /**
   * Crea usuario con todos sus datos
   * @param userD infor usuario
   * @param doc pos array niveles
   * @param type 1: puntuacion / 2: enemigos / 3: tiempo
   */
  searchInfoUser(userD: any, doc: any, type: number) {
    const user = {
      'uid': userD.id,
      'enemiesKilled': userD.data().enemiesKilled,
      'punctuation': userD.data().punctuation,
      'time': userD.data().time,
      'photoURL': '',
      'displayName': '',
      'coins': '',
      'email': '',
      'me': false
    }
    // console.log(user);
    // console.log(doc.data().lvl - 1);

    if (type == 1) {
      this.lvlRankings[doc.data().lvl - 1].RankingPuntuacion.push(user);
    } else if (type == 2) {
      this.lvlRankings[doc.data().lvl - 1].RankingEnemigos.push(user);
    } else if (type == 3) {
      this.lvlRankings[doc.data().lvl - 1].RankingTiempo.push(user);
    }

    // Buscar información del usuario para buscar su nombre, foto de perfil...
    firebase.firestore().collection("users").doc(userD.id.trim()).get()
      .then((docu) => {
        user.photoURL = docu.data().photoURL;
        user.displayName = docu.data().displayName;
        user.coins = docu.data().coins;
        user.email = docu.data().email;
        if (this.userAuth != undefined) {
          if (docu.id == this.userAuth.uid) {
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
  podiumLevelsChanges(doc: any, type: number) {
    // QUERY
    var query = firebase.firestore().collection('rankings').doc(doc.id).collection('users')
      .limit(this.top)
    var orderBy = '';

    if (type == 1) {
      this.lvlRankings[doc.data().lvl - 1].RankingPuntuacion = [];
      orderBy = 'punctuation';
    }
    else if (type == 2) {
      this.lvlRankings[doc.data().lvl - 1].RankingEnemigos = [];
      orderBy = 'enemiesKilled';
    }
    else if (type == 3) {
      this.lvlRankings[doc.data().lvl - 1].RankingTiempo = [];
      orderBy = 'time';
    }

    query.orderBy(orderBy, 'desc').get()
      .then(docUser => {
        docUser.forEach(docU => {
          this.searchInfoUser(docU, doc, type);
        });
      });

  }

  /**
   * Obtener posicion del usuario logeado en todos los rankings
   */
  getPositionRankings() {
    console.log('MIS RANKINGS...');
    this.logedUserRankings = [];
    this.getUser();

    firebase.firestore().collection('rankings').orderBy('lvl', 'asc').get()
      .then((doc) => {
        doc.forEach(doc => {
          this.logedUserRankings.push({
            'Nivel': doc.data().lvl,
            'RankingPuntuacion': [],
            'RankingEnemigos': [],
            'RankingTiempo': []
          });

          var query = firebase.firestore().collection('rankings').doc(doc.id).collection('users')

          // PUNTUACION
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
                          this.logedUserRankings[doc.data().lvl - 1].RankingPuntuacion[0] = cont;
                        }
                        cont++;
                      });
                    });
                  this.logedUserRankings[doc.data().lvl - 1].RankingPuntuacion[1] = change.doc.data().punctuation;
                }

              });
            });

          // ENEMIGOS
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
                          this.logedUserRankings[doc.data().lvl - 1].RankingEnemigos[0] = cont;
                        }
                        cont++;
                      });
                    });
                  this.logedUserRankings[doc.data().lvl - 1].RankingEnemigos[1] = change.doc.data().enemiesKilled;
                }

              });
            });

          // TIEMPO
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
                          this.logedUserRankings[doc.data().lvl - 1].RankingTiempo[0] = cont;
                        }
                        cont++;
                      });
                    });
                  this.logedUserRankings[doc.data().lvl - 1].RankingTiempo[1] = change.doc.data().time;
                }

              });
            });

          console.log(this.logedUserRankings);

        });
      });
  }

  /**
   * Dejar de escuchar los listeners para que no haya duplicidad de escucha
   */
  stopListeningRankingsItems() {
    this.unsubscribeListeners.forEach(unsubscribe => {
      console.log('Desactivando...');
      unsubscribe();
    });
  }

}
