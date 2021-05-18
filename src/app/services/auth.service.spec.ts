import { TestBed } from '@angular/core/testing';
import { AngularFireModule } from '@angular/fire';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { RouterTestingModule } from '@angular/router/testing';
import { environment } from 'src/environments/environment';
import { HomeComponent } from '../views/home/home.component';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(environment.firebaseConfig),
        AngularFireAuthModule,
        RouterTestingModule,
        RouterTestingModule.withRoutes([
          { path: 'home', component: HomeComponent }
        ])
      ],
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });


  describe('Casos login', () => {

    it('Login correcto', (done: DoneFn) => {
      service.emailLogin = 'pepe@gmail.com';
      service.passLogin = 'Chubaca2020';
      // Act
      service.login().then(() => {
        // Ass
        expect(service.authUser).not.toBeNull();
        expect(service.authUser.email).toBe(service.emailLogin);
        done();
      });
    });

    it('Login incorrecto', (done: DoneFn) => {
      service.emailLogin = 'pepi@gmail.com';
      service.passLogin = 'Chubaca2020';
      // Act
      service.login().catch(error => {
        // Ass
        expect(error.code).toBe('auth/user-not-found');
        done();
      });
    });

  });

  describe('Casos Registro', () => {

    /* it('Registro correcto', (done: DoneFn) => {
      service.emailRegistro = 'pepe2@gmail.com';
      service.passRegistro = 'Chubaca2020';
      // Act
      service.registro().then(() => {
        // Ass
        expect(service.authUser).not.toBeNull();
        expect(service.authUser.email).toBe(service.emailRegistro);
        done();
      });
    }); */

    it('Correo electrónico ya registrado', (done: DoneFn) => {
      service.emailRegistro = 'pepe@gmail.com';
      service.passRegistro = 'Chubaca2020';
      // Act
      service.registro().catch(errorR => {
        // Ass
        expect(errorR.code).toBe('auth/email-already-in-use');
        done();
      });
    });

  });


});
