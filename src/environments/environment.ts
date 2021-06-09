// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  firebaseConfig: {
    apiKey: "AIzaSyCl00CgxMvwEBQz5vdZ-lzRCYY-_0TNUnY",
    authDomain: "pfg-survivor-cd919.firebaseapp.com",
    projectId: "pfg-survivor-cd919",
    storageBucket: "pfg-survivor-cd919.appspot.com",
    messagingSenderId: "530404504797",
    appId: "1:530404504797:web:a2efd13f039584133dd734",
    measurementId: "G-XSHMWHFTZ6"
  },
  SESSION_KEY_USER_AUTH: 'AUTH_USER_123456789',
  dirBack: 'http://localhost:6060/api/'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
