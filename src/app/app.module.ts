//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Componentes
import { MenuComponent } from './menu/menu.component';
import { HomeComponent } from './views/home/home.component';
import { PerfilComponent } from './views/perfil/perfil.component';
import { LoginComponent } from './views/login/login.component';
import { RegistroComponent } from './views/registro/registro.component';
import { PassComponent } from './views/pass/pass.component';

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

@NgModule({
  declarations: [
    AppComponent,
    MenuComponent,
    HomeComponent,
    PerfilComponent,
    LoginComponent,
    RegistroComponent,
    PassComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
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
