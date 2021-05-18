import { TestBed } from '@angular/core/testing';
import { AngularFireModule } from '@angular/fire';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { RouterTestingModule } from '@angular/router/testing';
import { environment } from 'src/environments/environment';
import { HomeComponent } from '../views/home/home.component';

import { ChatService } from './chat.service';

describe('ChatService', () => {
  let service: ChatService;

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
    service = TestBed.inject(ChatService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Casos Chat', () => {

    it('Enviar mensaje de texto', (done: DoneFn) => {
      const emisor = {
        'uid': '7erG1Uf7wDXC4pLfISe0Ze3cc7n1',
        'displayName': 'Pepe',
      }
      var uidReceptor = 'nfQkcE7IBZSaUIhGC6zVHBOh4YN2';
      var msg = 'Hola!!! Desde Karma && Jasmine';
      // Act
      service.sendMessage(emisor,uidReceptor,msg).then(msg => {
        // Ass        
        expect(msg).not.toBeNull();
        done();
      });
    });
  });



});
