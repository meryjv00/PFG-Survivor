//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

// Componentes
import { MenuComponent } from './menu/menu.component';
import { AmigosComponent } from './views/amigos/amigos.component';
import { HomeComponent } from './views/home/home.component';
import { LoginComponent } from './views/login/login.component';
import { PassComponent } from './views/pass/pass.component';
import { PerfilComponent } from './views/perfil/perfil.component';
import { RankingsComponent } from './views/rankings/rankings.component';
import { RegistroComponent } from './views/registro/registro.component';
import { TiendaComponent } from './views/tienda/tienda.component';
import { ComunidadComponent } from './views/comunidad/comunidad.component';

// Environment
import { environment } from 'src/environments/environment';

// Formularios
import{ FormsModule, ReactiveFormsModule} from '@angular/forms';

// Firebase
import { AngularFireModule } from '@angular/fire';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFireDatabaseModule } from '@angular/fire/database';
import { AngularFireStorageModule } from '@angular/fire/storage';

// Alertas
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule} from '@angular/platform-browser/animations';
import { ToastrModule} from 'ngx-toastr';

// Material 
import {DemoMaterialModule} from './material-module';
import { FiltroAmigosPipe } from './pipes/filtro-amigos.pipe';
import { UserComponent } from './views/user/user.component';
import { ConfirmModalComponent } from './views/confirm-modal/confirm-modal.component';

@NgModule({
  declarations: [
    AppComponent,
    MenuComponent,
    HomeComponent,
    PerfilComponent,
    LoginComponent,
    RegistroComponent,
    PassComponent,
    AmigosComponent,
    RankingsComponent,
    TiendaComponent,
    FiltroAmigosPipe,
    ComunidadComponent,
    UserComponent,
    ConfirmModalComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    // Firebase
    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFireModule,
    AngularFireAuthModule,
    AngularFireDatabaseModule,
    AngularFireStorageModule,
    // Alertas
    CommonModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot({
      timeOut: 3000,
    }),
    // Material 
    DemoMaterialModule

  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
