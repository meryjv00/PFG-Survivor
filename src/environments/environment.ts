// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  firebaseConfig: {
    apiKey: "AIzaSyBk3lAsk9X_Xo4A0tTVRdqHjrpopoIYVjc",
    authDomain: "pfg-survivor-40d0e.firebaseapp.com",
    projectId: "pfg-survivor-40d0e",
    storageBucket: "pfg-survivor-40d0e.appspot.com",
    messagingSenderId: "873225520432",
    appId: "1:873225520432:web:c2ad4a57d316654a4a34f5",
    measurementId: "G-914PZ017QM"
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
