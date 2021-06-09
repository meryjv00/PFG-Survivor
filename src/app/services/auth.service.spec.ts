import { TestBed } from '@angular/core/testing';
import { AngularFireModule } from '@angular/fire';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { RouterTestingModule } from '@angular/router/testing';
import { environment } from 'src/environments/environment';
import { HomeComponent } from '../views/home/home.component';
import { AuthService } from './auth.service';
import { HttpClientModule } from '@angular/common/http';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(environment.firebaseConfig),
        AngularFireAuthModule,
        RouterTestingModule,
        HttpClientModule,
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
      service.login().subscribe(
        (response) => {
          var user = response['message'];
          var code = response['status'];
          expect(user).not.toBeNull();
          expect(code).toBe(200);
          expect(service.emailLogin).toBe(user.email);
          done();
        });
    });

    it('Login email incorrecto', (done: DoneFn) => {
      service.emailLogin = 'kkkkkkkkk@gmail.com';
      service.passLogin = 'Chubaca2020';
      service.login().subscribe(
        () => { },
        (error) => {
          var code = error['error']['message'].code;
          expect(code).toBe('auth/user-not-found');
          done();
        });
    });

    it('Login pass incorrecta', (done: DoneFn) => {
      service.emailLogin = 'pepe@gmail.com';
      service.passLogin = 'Chubaca';
      service.login().subscribe(
        () => { },
        (error) => {
          var code = error['error']['message'].code;
          expect(code).toBe('auth/wrong-password');
          done();
        });
    });


  });

  describe('Casos Registro', () => {

     it('Registro correcto', (done: DoneFn) => {
      service.emailRegistro = 'karmajasmine_user@gmail.com';
      service.passRegistro = 'Chubaca2020';
      service.registro().subscribe(
        (response) => {
          var user = response['message'];
          var code = response['status'];
          expect(user).not.toBeNull();
          expect(code).toBe(200);
          expect(service.emailRegistro).toBe(user.email);
          done();
        });
    }); 

    it('Correo electrónico ya registrado', (done: DoneFn) => {
      service.emailRegistro = 'pepe@gmail.com';
      service.passRegistro = 'Chubaca2020';
      service.registro().subscribe(
        () => { },
        (error) => {
          var code = error['error']['message'].code;
          expect(code).toBe('auth/email-already-in-use');
          done();
        });
    });

  });


});
